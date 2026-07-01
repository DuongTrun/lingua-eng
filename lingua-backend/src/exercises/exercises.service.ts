import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateExerciseDto } from './dto/generate-exercise.dto';
import { SubmitExerciseDto } from './dto/submit-exercise.dto';
import { GoogleGenAI } from '@google/genai';
import { UsersService } from '../users/users.service';

/**
 * 🌐 LINGUA-ENG — Exercises Service
 * 
 * File này: Kết nối tới Google Gemini API qua SDK `@google/genai` để sinh câu hỏi trắc nghiệm tự động,
 * đồng thời xử lý lưu trữ kết quả và tích lũy điểm kinh nghiệm (XP) cho người học.
 */
@Injectable()
export class ExercisesService {
  private readonly ai: GoogleGenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'API_KEY_GEMINI_CỦA_BẠN_Ở_ĐÂY') {
      console.warn('⚠️ Cảnh báo: Biến môi trường GEMINI_API_KEY chưa được cấu hình hoặc sử dụng giá trị mặc định!');
    }
    // Khởi tạo client của Google Gen AI
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * 🧠 Gọi Gemini API sinh bài tập trắc nghiệm dưới dạng JSON
   */
  async generate(dto: GenerateExerciseDto) {
    const { topic, level, count } = dto;
    
    // Thiết kế prompt yêu cầu sinh đúng số câu, chủ đề và cấp độ
    const prompt = `Generate a high-quality English grammar/vocabulary quiz with exactly ${count} questions.
Topic: "${topic}"
Level: "${level}"

Requirements:
- Each question must be a multiple-choice question.
- Format the options as a unique, non-repeating array of 4 plausible choices.
- Provide a clear, educational explanation in Vietnamese (Vietnamese language) for why the correctAnswer is correct and why other choices are incorrect.
- The output must strictly conform to the provided JSON Schema. Do not wrap in markdown blocks, do not return any other text than the raw JSON.`;

    try {
      // Gọi API Gemini 3.1 Flash-Lite
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json', // Ép định dạng trả về là JSON
          // Ép kiểu (schema) để Gemini trả về mảng dữ liệu có cấu trúc chính xác
          responseSchema: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                question: { type: 'STRING' },
                options: {
                  type: 'ARRAY',
                  items: { type: 'STRING' },
                },
                correctAnswer: { type: 'STRING' },
                explanation: { type: 'STRING' },
              },
              required: ['question', 'options', 'correctAnswer', 'explanation'],
            },
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Không nhận được văn bản phản hồi từ Gemini!');
      }

      // Parse chuỗi JSON nhận từ Gemini thành Object và trả về cho Controller
      return JSON.parse(responseText);
    } catch (error) {
      console.error('❌ Lỗi khi sinh bài tập bằng Gemini:', error);
      throw new InternalServerErrorException(
        'Không thể sinh bài tập tự động lúc này do lỗi kết nối AI. Vui lòng kiểm tra lại GEMINI_API_KEY trong file .env!'
      );
    }
  }

  /**
   * 💾 Lưu kết quả làm bài tập và cộng điểm XP cho người dùng
   */
  async submit(userId: string, dto: SubmitExerciseDto) {
    const { topic, level, score, total } = dto;

    // 🔒 Bảo mật: Kiểm tra score không vượt quá total (chống Score Manipulation)
    if (score > total) {
      throw new BadRequestException('Số câu đúng không thể lớn hơn tổng số câu hỏi!');
    }

    // Quy ước: Mỗi câu trả lời đúng được cộng 10 điểm kinh nghiệm (XP)
    const xpEarned = score * 10;

    // 1. Tạo bản ghi kết quả bài tập
    const result = await this.prisma.exerciseResult.create({
      data: {
        userId,
        topic,
        level,
        score,
        total,
        xpEarned,
      },
    });

    // 2. Cộng dồn XP và tự động tính toán cập nhật Streak cho người dùng
    await this.usersService.updateActivity(userId, xpEarned);

    return {
      resultId: result.id,
      score,
      total,
      xpEarned,
    };
  }

  /**
   * 📊 Lấy lịch sử làm bài tập gần nhất của user
   */
  async getHistory(userId: string) {
    return this.prisma.exerciseResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10, // Lấy tối đa 10 kết quả gần đây nhất
    });
  }
}
