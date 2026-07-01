import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EvaluatePronunciationDto } from './dto/evaluate-pronunciation.dto';
import { CreateShadowingPassageDto } from './dto/create-shadowing-passage.dto';
import { GoogleGenAI } from '@google/genai';
import { UsersService } from '../users/users.service';

/**
 * 🌐 LINGUA-ENG — Shadowing Service
 * 
 * File này: Gọi Gemini API để so sánh câu gốc và câu người dùng đọc,
 * trả về đánh giá chi tiết từng từ (đúng, sai phát âm, bỏ sót) kèm điểm số,
 * và lưu trữ kết quả thực hành của người học.
 */
@Injectable()
export class ShadowingService {
  private readonly ai: GoogleGenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * 🎙️ Chấm điểm phát âm câu Shadowing bằng Gemini API
   */
  async evaluatePronunciation(userId: string, dto: EvaluatePronunciationDto) {
    const { passageId, passageTitle, referenceText, spokenText } = dto;

    const prompt = `You are an English pronunciation coach.
Compare the user's spoken text: "${spokenText}"
against the reference text: "${referenceText}"
word-by-word.

For each word in the reference text, identify if it was:
1. "correct": Spoken correctly (matches the pronunciation).
2. "mispronounced": Spoken incorrectly (pronounced poorly or replaced with another word).
3. "missed": Missed/omitted entirely by the user.

For any "mispronounced" word, provide a short, helpful pronunciation tip in Vietnamese.

Also, calculate an overall pronunciation accuracy score from 0 to 100 (where 100 means perfect match of all words).
Format your response strictly as a JSON object matching the provided JSON Schema.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              score: { type: 'INTEGER' }, // Điểm tổng kết phát âm (0-100)
              words: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    word: { type: 'STRING' }, // Từ gốc trong referenceText
                    status: { type: 'STRING' }, // "correct", "mispronounced", hoặc "missed"
                    feedback: { type: 'STRING' }, // Gợi ý cách phát âm bằng tiếng Việt nếu phát âm sai (tùy chọn)
                  },
                  required: ['word', 'status'],
                },
              },
            },
            required: ['score', 'words'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Không nhận được phản hồi từ Gemini!');
      }

      const evaluation = JSON.parse(responseText);
      const score = evaluation.score;

      // Lưu kết quả lượt thực hành Shadowing này vào database
      await this.prisma.shadowingAttempt.create({
        data: {
          userId,
          passageId,
          passageTitle,
          score,
        },
      });

      // Tự động thưởng điểm kinh nghiệm (XP) và cập nhật Streak cho người dùng
      // Quy ước: thưởng số XP tương đương với điểm số phát âm (ví dụ phát âm đạt 85% -> cộng 85 XP)
      await this.usersService.updateActivity(userId, score);

      return evaluation;
    } catch (error) {
      console.error('❌ Lỗi khi chấm điểm phát âm bằng Gemini:', error);
      throw new InternalServerErrorException('Có lỗi xảy ra khi chấm điểm phát âm từ hệ thống AI.');
    }
  }

  /**
   * 📊 Lấy danh sách lịch sử thực hành Shadowing của người dùng
   */
  async getHistory(userId: string) {
    return this.prisma.shadowingAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20, // Lấy tối đa 20 lượt tập gần nhất
    });
  }

  /**
   * 🎙️ Lấy danh sách bài luyện đọc Shadowing
   */
  async getPassages(userId: string, topic?: string, level?: string) {
    const passages = await this.prisma.shadowingPassage.findMany({
      where: {
        ...(topic && topic !== 'All' ? { topic } : {}),
        ...(level && level !== 'All' ? { level } : {}),
      },
      include: {
        attempts: {
          where: { userId },
          orderBy: { score: 'desc' },
          take: 1,
        },
      },
    });

    return passages.map((p) => {
      const bestAttempt = p.attempts[0];
      return {
        id: p.id,
        title: p.title,
        referenceText: p.referenceText,
        vietnameseTranslation: p.vietnameseTranslation,
        level: p.level,
        topic: p.topic,
        duration: p.duration,
        bestScore: bestAttempt ? bestAttempt.score : null,
      };
    });
  }

  /**
   * 🎙️ Lấy chi tiết một bài luyện đọc Shadowing
   */
  async getPassageById(userId: string, id: string) {
    const passage = await this.prisma.shadowingPassage.findUnique({
      where: { id },
      include: {
        attempts: {
          where: { userId },
          orderBy: { score: 'desc' },
          take: 1,
        },
      },
    });

    if (!passage) {
      throw new NotFoundException('Không tìm thấy bài luyện đọc Shadowing!');
    }

    const bestAttempt = passage.attempts[0];
    return {
      id: passage.id,
      title: passage.title,
      referenceText: passage.referenceText,
      vietnameseTranslation: passage.vietnameseTranslation,
      level: passage.level,
      topic: passage.topic,
      duration: passage.duration,
      bestScore: bestAttempt ? bestAttempt.score : null,
    };
  }

  /**
   * 🎙️ Tạo bài luyện đọc Shadowing mới (Hỗ trợ tự gõ và AI tự động sinh)
   */
  async createPassage(dto: CreateShadowingPassageDto) {
    const { mode, title, referenceText, vietnameseTranslation, level, topic, duration } = dto;

    if (mode === 'auto') {
      const prompt = `You are an expert English language teacher.
Create a single short English passage for a pronunciation shadowing exercise.
The passage must be appropriate for English learners at CEFR Level: "${level}" and must be about the Topic: "${topic}".

Requirements:
1. The passage should be concise (around 8 to 20 words), natural, and realistic for everyday spoken English (e.g. daily conversations, hotel/airport interaction, office talks).
2. Create an engaging, short Title (in English) for the passage (e.g. "Ordering Coffee", "At the Hotel Lobby").
3. Translate the passage accurately into Vietnamese.

Format your response strictly as a JSON object matching this schema:
{
  "title": "A short title in English",
  "referenceText": "The English passage content",
  "vietnameseTranslation": "The accurate Vietnamese translation of the referenceText"
}`;

      try {
        const response = await this.ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                referenceText: { type: 'STRING' },
                vietnameseTranslation: { type: 'STRING' }
              },
              required: ['title', 'referenceText', 'vietnameseTranslation']
            }
          }
        });

        const responseText = response.text;
        if (!responseText) {
          throw new Error('Không nhận được phản hồi từ Gemini!');
        }

        const generated = JSON.parse(responseText);
        
        // Tự động tính thời gian đọc
        const wordCount = generated.referenceText.trim().split(/\s+/).length;
        const seconds = Math.max(5, Math.ceil(wordCount * 0.6));
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const finalDuration = `${mins}:${secs.toString().padStart(2, '0')}`;

        return await this.prisma.shadowingPassage.create({
          data: {
            title: generated.title,
            referenceText: generated.referenceText,
            vietnameseTranslation: generated.vietnameseTranslation,
            level,
            topic,
            duration: finalDuration,
          },
        });
      } catch (error) {
        console.error('❌ Lỗi khi tự động sinh câu Shadowing bằng Gemini:', error);
        throw new InternalServerErrorException('Có lỗi xảy ra khi tự động tạo bài luyện tập bằng AI.');
      }
    } else {
      // Chế độ thủ công
      if (!title || !referenceText || !vietnameseTranslation) {
        throw new InternalServerErrorException('Vui lòng cung cấp đầy đủ thông tin cho chế độ nhập thủ công.');
      }

      let finalDuration = duration;
      if (!finalDuration) {
        const wordCount = referenceText.trim().split(/\s+/).length;
        const seconds = Math.max(5, Math.ceil(wordCount * 0.6));
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        finalDuration = `${mins}:${secs.toString().padStart(2, '0')}`;
      }

      return this.prisma.shadowingPassage.create({
        data: {
          title,
          referenceText,
          vietnameseTranslation,
          level,
          topic,
          duration: finalDuration,
        },
      });
    }
  }
}
