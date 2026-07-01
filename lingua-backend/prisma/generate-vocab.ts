import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

/**
 * 🌐 LINGUA-ENG — Vocabulary Generator Script
 * 
 * Script này tải danh sách 3000 từ vựng tiếng Anh thô từ Gist trên Github.
 * Sau đó gọi Gemini API theo từng nhóm (batch 50 từ) để sinh đầy đủ thông tin:
 * - Phiên âm IPA
 * - Nghĩa tiếng Việt
 * - Câu ví dụ tiếng Anh + dịch câu ví dụ
 * - Phân loại cấp độ CEFR (A1-C2) và Chủ đề (Topic)
 * 
 * Dữ liệu được lưu trữ cục bộ vào file `prisma/words.json` nhằm hỗ trợ Resume (chạy tiếp tục nếu bị gián đoạn).
 */

const LIMIT_WORDS = 1500; // Số lượng từ muốn sinh (có thể cấu hình từ 100 đến 3000)
const BATCH_SIZE = 50;    // Số từ trong mỗi batch gọi Gemini
const DELAY_MS = 5000;    // Thời gian nghỉ giữa các batch để tránh Rate Limit (5 giây)
const RAW_WORDS_URL = 'https://gist.githubusercontent.com/dlants/d3b25b0f6c0bf8d023f65e86498bf9e6/raw/3000-words.txt';

const OUTPUT_FILE = path.join(__dirname, 'words.json');

// Khởi tạo Gemini AI Client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ Lỗi: Không tìm thấy GEMINI_API_KEY trong file .env!');
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey });

// Helper trì hoãn tiến trình (delay)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface WordEntry {
  word: string;
  ipa: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
  level: string;
  topic: string;
}

// Hàm tải và xử lý danh sách từ thô
async function fetchRawWords(): Promise<string[]> {
  console.log(`📡 Đang tải danh sách từ vựng thô từ: ${RAW_WORDS_URL}...`);
  try {
    const response = await fetch(RAW_WORDS_URL);
    if (!response.ok) {
      throw new Error(`Không thể tải file, mã trạng thái: ${response.status}`);
    }
    const text = await response.text();
    const lines = text.split('\n');
    
    const words: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      // Bỏ qua các dòng metadata và dòng trống
      if (
        !trimmed ||
        trimmed.startsWith('title:') ||
        trimmed.startsWith('description:') ||
        trimmed.startsWith('source:') ||
        trimmed.includes('---') ||
        trimmed.match(/[^a-z-]/) // Chỉ nhận chữ cái và dấu gạch ngang
      ) {
        continue;
      }
      words.push(trimmed);
    }
    // Loại bỏ các từ trùng lặp
    const uniqueWords = Array.from(new Set(words));
    console.log(`✅ Tải thành công! Tìm thấy tổng cộng ${uniqueWords.length} từ vựng tiếng Anh thô hợp lệ.`);
    return uniqueWords;
  } catch (error) {
    console.error('❌ Lỗi khi tải danh sách từ vựng thô:', error);
    throw error;
  }
}

// Đọc dữ liệu từ file words.json hiện tại nếu có
function loadExistingWords(): WordEntry[] {
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const content = fs.readFileSync(OUTPUT_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        console.log(`💾 Tìm thấy file words.json cũ có chứa ${data.length} từ vựng đã xử lý.`);
        return data as WordEntry[];
      }
    } catch (e) {
      console.warn('⚠️ File words.json cũ bị lỗi định dạng, sẽ tạo mới.');
    }
  }
  return [];
}

// Lưu dữ liệu vào file JSON
function saveWords(data: WordEntry[]) {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Gọi Gemini API để xử lý một batch từ vựng
async function processBatch(words: string[], retryCount = 0): Promise<WordEntry[]> {
  const prompt = `Bạn là một chuyên gia ngôn ngữ học tiếng Anh. 
Hãy biên dịch nghĩa tiếng Việt, tìm phiên âm IPA, tạo câu ví dụ tiếng Anh kèm dịch câu ví dụ, phân loại level và topic cho danh sách ${words.length} từ vựng sau:
[${words.join(', ')}]

Yêu cầu chi tiết cho mỗi từ:
1. "word": Từ tiếng Anh đó (giữ nguyên chữ thường).
2. "ipa": Phiên âm quốc tế IPA chuẩn Anh-Mỹ (ví dụ: "/əˈbændən/").
3. "meaning": Nghĩa tiếng Việt phổ biến nhất (ngắn gọn, ví dụ: "từ bỏ, ruồng bỏ").
4. "example": Một câu ví dụ tiếng Anh ngắn gọn, thực tế, dễ hiểu, sử dụng từ này.
5. "exampleMeaning": Nghĩa dịch tiếng Việt tương ứng của câu ví dụ đó.
6. "level": Trình độ CEFR phù hợp của từ này (A1, A2, B1, B2, C1, hoặc C2).
7. "topic": Chủ đề phù hợp nhất của từ này (chọn một trong các chủ đề: Travel, Business, Food, Technology, Daily Life, Health, Sports, Family, Education, Shopping, Entertainment, Nature, Socializing, Art).

Đầu ra bắt buộc phải khớp chính xác với JSON Schema được cấu hình. Không bao gồm markdown wrapper hay chữ giải thích dư thừa.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              word: { type: 'STRING' },
              ipa: { type: 'STRING' },
              meaning: { type: 'STRING' },
              example: { type: 'STRING' },
              exampleMeaning: { type: 'STRING' },
              level: { type: 'STRING' },
              topic: { type: 'STRING' },
            },
            required: ['word', 'ipa', 'meaning', 'example', 'exampleMeaning', 'level', 'topic'],
          },
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini phản hồi rỗng!');
    }

    const data = JSON.parse(text) as WordEntry[];
    return data;
  } catch (error: any) {
    console.error(`\n❌ Lỗi khi xử lý batch:`, error.message || error);
    
    // Nếu gặp lỗi rate limit hoặc lỗi kết nối, thử lại với delay lâu hơn
    if (retryCount < 3) {
      const waitTime = (retryCount + 1) * 10000;
      console.log(`🔄 Thử lại sau ${waitTime / 1000} giây (Lần thử ${retryCount + 1}/3)...`);
      await sleep(waitTime);
      return processBatch(words, retryCount + 1);
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 === BẮT ĐẦU CÔNG CỤ SINH TỪ VỰNG HÀNG LOẠT LINGUA-ENG ===');
  
  // 1. Tải danh sách từ vựng thô
  const allRawWords = await fetchRawWords();
  
  // Giới hạn số lượng từ cần xử lý
  const targetWords = allRawWords.slice(0, LIMIT_WORDS);
  console.log(`🎯 Mục tiêu: Sinh dữ liệu cho ${targetWords.length} từ vựng đầu tiên.`);

  // 2. Load các từ đã xử lý trước đó
  const existingList = loadExistingWords();
  const existingSet = new Set(existingList.map((w) => w.word));
  
  // Lọc bỏ những từ đã có
  const wordsToProcess = targetWords.filter((w) => !existingSet.has(w));
  console.log(`🆕 Số lượng từ cần sinh mới: ${wordsToProcess.length} từ.`);

  if (wordsToProcess.length === 0) {
    console.log('🎉 Toàn bộ từ vựng mục tiêu đã có trong words.json! Không cần sinh thêm.');
    return;
  }

  const resultList = [...existingList];
  
  // 3. Tiến hành gọi Gemini theo từng batch
  const totalBatches = Math.ceil(wordsToProcess.length / BATCH_SIZE);
  console.log(`📦 Sẽ chia thành ${totalBatches} batch (Mỗi batch ${BATCH_SIZE} từ).`);

  for (let i = 0; i < totalBatches; i++) {
    const startIdx = i * BATCH_SIZE;
    const batchWords = wordsToProcess.slice(startIdx, startIdx + BATCH_SIZE);
    
    console.log(`\n👉 [Batch ${i + 1}/${totalBatches}] Đang gửi ${batchWords.length} từ lên Gemini...`);
    console.log(`Từ đầu tiên: "${batchWords[0]}", từ cuối cùng: "${batchWords[batchWords.length - 1]}"`);

    try {
      const startTime = Date.now();
      const batchResult = await processBatch(batchWords);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      // Merge kết quả mới nhận được
      resultList.push(...batchResult);
      
      // Lưu ngay vào file để tránh mất dữ liệu nếu gặp sự cố
      saveWords(resultList);
      
      console.log(`✅ Thành công! Sinh thêm ${batchResult.length} từ trong ${duration}s. Tổng cộng hiện tại: ${resultList.length}/${targetWords.length} từ.`);
      
      // Nếu chưa phải batch cuối cùng, chờ DELAY_MS giây để tránh Rate Limit
      if (i < totalBatches - 1) {
        console.log(`⏳ Nghỉ ${DELAY_MS / 1000} giây trước batch tiếp theo...`);
        await sleep(DELAY_MS);
      }
    } catch (e) {
      console.error(`💥 Hủy bỏ tiến trình do gặp lỗi nghiêm trọng tại Batch ${i + 1}. Bạn có thể chạy lại script để tiếp tục!`);
      process.exit(1);
    }
  }

  console.log(`\n🎉 HOÀN THÀNH! Toàn bộ dữ liệu từ vựng đã được lưu trữ an toàn tại: ${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error('❌ Lỗi hệ thống:', e);
  process.exit(1);
});
