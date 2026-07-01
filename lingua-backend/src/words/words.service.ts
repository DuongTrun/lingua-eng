import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenAI } from '@google/genai';

/**
 * 🌐 LINGUA-ENG — Words Service
 * 
 * File này: Xử lý nghiệp vụ tra cứu từ vựng, bao gồm phân trang (pagination),
 * lọc theo cấp độ (level), chủ đề (topic), tìm kiếm thông minh theo từ khóa,
 * và tra cứu chi tiết chuyên sâu bằng Gemini AI (có cache).
 * 
 * 💡 So sánh với Spring Boot (Javi):
 *    - Hoạt động giống như lớp WordServiceImpl.java của Javi.
 *    - NestJS sử dụng decorator `@Injectable()` để khai báo đây là một Service Class
 *      có thể được Dependency Injection vào Controller, tương đương với `@Service` của Spring.
 *    - Dependency Injection được thực hiện thông qua constructor (`private readonly prisma: PrismaService`),
 *      tương tự Constructor Injection trong Spring Boot.
 */

/** Interface cho dữ liệu chi tiết từ Gemini AI */
export interface GeminiWordDetails {
  partOfSpeech: string;
  definitionEn: string;
  origin: string;
  synonyms: string[];
  nuance: string;
}

/** Entry trong cache, kèm timestamp để kiểm tra TTL */
interface CacheEntry {
  data: GeminiWordDetails;
  timestamp: number;
}

@Injectable()
export class WordsService {
  private readonly ai: GoogleGenAI;
  private readonly logger = new Logger(WordsService.name);

  /** In-memory cache cho kết quả Gemini, key = wordId, TTL = 1 giờ */
  private readonly detailsCache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 giờ

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        '❌ Biến môi trường GEMINI_API_KEY chưa được cấu hình! ' +
        'Hãy thêm GEMINI_API_KEY vào file .env trước khi khởi động server.',
      );
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * 📖 Lấy danh sách từ vựng có phân trang, tìm kiếm và bộ lọc
   */
  async getWords(query: {
    page?: number;
    limit?: number;
    level?: string;
    topic?: string;
    search?: string;
  }) {
    // Clamp giá trị page và limit để đảm bảo an toàn
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const { level, topic, search } = query;

    // Thiết lập điều kiện tìm kiếm/lọc (tương đương Specification trong Spring Data JPA)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (level && level !== 'All') {
      where.level = level;
    }

    if (topic && topic !== 'All') {
      where.topic = topic;
    }

    if (search && search.trim() !== '') {
      where.OR = [
        {
          word: {
            contains: search,
            mode: 'insensitive', // Không phân biệt chữ hoa, chữ thường
          },
        },
        {
          meaning: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Thực hiện đếm tổng số bản ghi và lấy dữ liệu phân trang cùng lúc
    const [totalItems, items] = await Promise.all([
      this.prisma.word.count({ where }),
      this.prisma.word.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          word: 'asc', // Sắp xếp từ vựng theo bảng chữ cái A-Z
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      meta: {
        page,
        pageSize: limit,
        totalPages,
        totalItems,
      },
      items,
    };
  }

  /**
   * 🏷️ Lấy danh sách tất cả chủ đề từ vựng (distinct) trong database
   * Trả về mảng string sắp xếp A-Z, client dùng để render bộ lọc động
   */
  async getDistinctTopics(): Promise<string[]> {
    const result = await this.prisma.word.findMany({
      select: { topic: true },
      distinct: ['topic'],
      orderBy: { topic: 'asc' },
    });
    return result.map((r) => r.topic);
  }

  /**
   * 🎮 Lấy danh sách từ vựng ngẫu nhiên phục vụ cho Mini-game phân loại từ loại.
   *
   * Chiến lược: Stratified sampling — bốc đều từ 4 nhóm từ loại (Noun, Verb,
   * Adjective, Adverb) để tránh mất cân bằng (tiếng Anh có ~60% Noun).
   * Sử dụng PostgreSQL native `ORDER BY RANDOM()` trong 1 raw query duy nhất
   * thay vì tải toàn bộ IDs về Node.js rồi shuffle (tiết kiệm round-trip).
   *
   * @param limit - Tổng số từ cần bốc (mặc định 50, tối đa 100)
   */
  async getWordsForGame(limit = 50) {
    // Validate & clamp limit
    const safeLim = Math.min(100, Math.max(10, Math.floor(limit)));
    const perGroup = Math.floor(safeLim / 4);
    const remainder = safeLim - perGroup * 4; // phần dư chia cho nhóm đầu

    // Stratified sampling: bốc đều mỗi nhóm, nhóm Noun nhận thêm phần dư
    const posGroups: { pos: string; take: number }[] = [
      { pos: 'Noun', take: perGroup + remainder },
      { pos: 'Verb', take: perGroup },
      { pos: 'Adjective', take: perGroup },
      { pos: 'Adverb', take: perGroup },
    ];

    // Chạy song song 4 query, mỗi query bốc ngẫu nhiên từ 1 nhóm từ loại
    const groupResults = await Promise.all(
      posGroups.map(({ pos, take }) =>
        this.prisma.$queryRawUnsafe<{
          id: string;
          word: string;
          ipa: string;
          meaning: string;
          example: string;
          exampleMeaning: string;
          level: string;
          topic: string;
          partOfSpeech: string;
        }[]>(
          `SELECT id, word, ipa, meaning, example, "exampleMeaning", level, topic, part_of_speech AS "partOfSpeech"
           FROM words
           WHERE part_of_speech = $1
           ORDER BY RANDOM()
           LIMIT $2`,
          pos,
          take,
        ),
      ),
    );

    // Gộp kết quả và shuffle lần cuối bằng Fisher-Yates để trộn đều các nhóm
    const merged = groupResults.flat();
    for (let i = merged.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [merged[i], merged[j]] = [merged[j], merged[i]];
    }

    return merged;
  }

  /**
   * 🧠 Lấy chi tiết từ vựng chuyên sâu (Synonyms, Origin, AI Nuance) bằng Gemini API
   * Kết quả được cache trong bộ nhớ 1 giờ để tránh gọi AI lặp lại (tiết kiệm quota)
   */
  async getWordDetails(wordId: string) {
    const wordRecord = await this.prisma.word.findUnique({
      where: { id: wordId },
    });

    if (!wordRecord) {
      throw new NotFoundException('Từ vựng không tồn tại trên hệ thống!');
    }

    // Kiểm tra cache trước khi gọi Gemini
    const cached = this.detailsCache.get(wordId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return {
        ...wordRecord,
        details: cached.data,
      };
    }

    // Sanitize từ vựng trước khi đưa vào prompt — chỉ giữ chữ cái, số, dấu cách, gạch ngang
    const sanitizedWord = wordRecord.word.replace(/[^a-zA-Z0-9\s\-']/g, '').trim();

    const prompt = `You are a professional English lexicographer and linguist.
Generate detailed dictionary information for the English word: "${sanitizedWord}".
Provide:
1. Part of speech (e.g., "adjective", "noun", "verb", "adverb").
2. English definition (concise and clear).
3. Etymology / Origin (concise, where the word came from historically).
4. Synonyms (3-5 synonyms as single words).
5. AI Nuance: A brief explanation in Vietnamese (1-2 sentences) about the subtle nuances of this word, how to use it naturally, or differences from common synonyms.

Format your response strictly as a JSON object matching this schema:
{
  "partOfSpeech": "string",
  "definitionEn": "string",
  "origin": "string",
  "synonyms": ["string"],
  "nuance": "string"
}`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              partOfSpeech: { type: 'STRING' },
              definitionEn: { type: 'STRING' },
              origin: { type: 'STRING' },
              synonyms: {
                type: 'ARRAY',
                items: { type: 'STRING' },
              },
              nuance: { type: 'STRING' },
            },
            required: ['partOfSpeech', 'definitionEn', 'origin', 'synonyms', 'nuance'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Không nhận được phản hồi từ Gemini!');
      }

      const parsedDetails: GeminiWordDetails = JSON.parse(responseText);

      // Lưu vào cache
      this.detailsCache.set(wordId, {
        data: parsedDetails,
        timestamp: Date.now(),
      });

      return {
        ...wordRecord,
        details: parsedDetails,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi phân tích từ vựng "${wordRecord.word}" bằng Gemini:`, error);
      // Trả về dữ liệu fallback nếu lỗi để tránh crash ứng dụng
      const fallback: GeminiWordDetails = {
        partOfSpeech: 'vocabulary',
        definitionEn: 'Definition details currently unavailable.',
        origin: 'Origin history currently unavailable.',
        synonyms: [],
        nuance: 'Giải nghĩa chi tiết tạm thời chưa khả dụng.',
      };
      return {
        ...wordRecord,
        details: fallback,
      };
    }
  }

  /**
   * ➕ Thêm từ vựng thủ công — AI Gemini tự động sinh thông tin đầy đủ
   * 
   * Luồng:
   * 1. Chuẩn hóa từ input (trim, lowercase)
   * 2. Kiểm tra từ đã tồn tại trong DB chưa
   * 3. Nếu có → trả về từ đó kèm flag existed: true
   * 4. Nếu chưa → gọi Gemini sinh IPA, meaning, example, partOfSpeech, level, topic
   * 5. Lưu vào DB và trả về
   */
  async addCustomWord(wordInput: string) {
    // 1. Chuẩn hóa từ input
    const normalizedWord = wordInput.trim().toLowerCase();

    // 2. Kiểm tra từ đã tồn tại trong DB chưa
    const existingWord = await this.prisma.word.findUnique({
      where: { word: normalizedWord },
    });

    if (existingWord) {
      return {
        existed: true,
        word: existingWord,
      };
    }

    // 3. Gọi Gemini AI để sinh thông tin đầy đủ cho từ vựng
    const sanitizedWord = normalizedWord.replace(/[^a-zA-Z0-9\s\-']/g, '').trim();

    const prompt = `You are a professional English-Vietnamese bilingual lexicographer.
Generate complete dictionary information for the English word: "${sanitizedWord}".

Provide ALL of the following fields:
1. ipa: IPA phonetic transcription (e.g., "/ˌserənˈdɪpɪti/")
2. meaning: Vietnamese translation/meaning (concise, 1-2 words or short phrase, e.g., "sự tình cờ may mắn")
3. example: One natural English example sentence using this word
4. exampleMeaning: Vietnamese translation of the example sentence
5. partOfSpeech: One of "Noun", "Verb", "Adjective", "Adverb", "Preposition", "Conjunction", "Pronoun", "Interjection"
6. level: Estimated CEFR level, one of "A1", "A2", "B1", "B2", "C1", "C2"
7. topic: Best matching topic category, one of "Daily Life", "Travel", "Business", "Food", "Health", "Education", "Technology", "Entertainment", "Sports", "Nature", "Science", "Art", "Shopping", "Family", "Socializing", "Beauty"

Format your response strictly as a JSON object matching this schema:
{
  "ipa": "string",
  "meaning": "string",
  "example": "string",
  "exampleMeaning": "string",
  "partOfSpeech": "string",
  "level": "string",
  "topic": "string"
}`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              ipa: { type: 'STRING' },
              meaning: { type: 'STRING' },
              example: { type: 'STRING' },
              exampleMeaning: { type: 'STRING' },
              partOfSpeech: { type: 'STRING' },
              level: { type: 'STRING' },
              topic: { type: 'STRING' },
            },
            required: ['ipa', 'meaning', 'example', 'exampleMeaning', 'partOfSpeech', 'level', 'topic'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Không nhận được phản hồi từ Gemini AI!');
      }

      const aiResult = JSON.parse(responseText);

      // Validate partOfSpeech
      const validPOS = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Preposition', 'Conjunction', 'Pronoun', 'Interjection'];
      const partOfSpeech = validPOS.includes(aiResult.partOfSpeech) ? aiResult.partOfSpeech : 'Noun';

      // Validate level
      const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const level = validLevels.includes(aiResult.level) ? aiResult.level : 'B1';

      // 4. Lưu vào database
      const newWord = await this.prisma.word.create({
        data: {
          word: normalizedWord,
          ipa: aiResult.ipa || `/${normalizedWord}/`,
          meaning: aiResult.meaning || 'Chưa có nghĩa',
          example: aiResult.example || `This is an example with ${normalizedWord}.`,
          exampleMeaning: aiResult.exampleMeaning || 'Đây là câu ví dụ.',
          partOfSpeech,
          level,
          topic: aiResult.topic || 'Daily Life',
        },
      });

      return {
        existed: false,
        word: newWord,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi thêm từ vựng "${normalizedWord}" bằng Gemini:`, error);
      throw new Error(
        `Không thể sinh thông tin cho từ "${normalizedWord}". Vui lòng kiểm tra lại từ vựng hoặc thử lại sau!`,
      );
    }
  }
}
