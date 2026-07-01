import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewWordDto } from './dto/review-word.dto';

/**
 * 🌐 LINGUA-ENG — Flashcards Service
 * 
 * File này: Xử lý nghiệp vụ liên quan đến quản lý các bộ từ vựng (Decks) 
 * và cập nhật tiến trình ôn tập theo thuật toán Spaced Repetition (SM-2).
 * 
 * 💡 Kiến thức mới (Thuật toán SM-2 - SuperMemo 2):
 * - SM-2 là thuật toán tính khoảng cách thời gian tối ưu cho mỗi lần ôn tập tiếp theo dựa trên đánh giá độ khó:
 *   - Lần 1: Ôn sau 1 ngày (interval = 1).
 *   - Lần 2: Ôn sau 6 ngày (interval = 6).
 *   - Lần 3 trở đi: Khoảng cách = Lần trước * Hệ số dễ (Efactor).
 * - Nếu người học quên (quality < 3), tiến trình bị Reset (repetition = 0, ôn lại sau 1 ngày).
 * - Hệ số dễ (Efactor) sẽ tự tăng/giảm động dựa trên điểm đánh giá `quality` (từ 0 đến 5).
 */
export interface Deck {
  topic: string;
  level: string;
  totalWords: number;
  learnedWords: number;
  dueWords: number;
}

@Injectable()
export class FlashcardsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 📚 Lấy danh sách các Deck từ vựng của User
   * Mỗi Deck được định nghĩa bởi một cặp (topic - level)
   */
  async getDecks(userId: string): Promise<Deck[]> {
    const now = new Date();

    // 🚀 PERFORMANCE: Thay vì loop N+1 (91 queries), chỉ cần 3 queries tổng hợp

    // Query 1: Lấy tất cả nhóm (topic, level) kèm đếm tổng số từ trong mỗi nhóm
    const wordGroups = await this.prisma.word.groupBy({
      by: ['topic', 'level'],
      _count: { id: true },
    });

    // Query 2: Đếm số từ user đã bắt đầu học, nhóm theo (topic, level) của Word
    const learnedCounts = await this.prisma.flashcardProgress.findMany({
      where: { userId },
      select: {
        word: {
          select: { topic: true, level: true },
        },
      },
    });

    // Query 3: Đếm số từ cần ôn hôm nay (dueDate <= now), nhóm theo (topic, level) của Word
    const dueCounts = await this.prisma.flashcardProgress.findMany({
      where: {
        userId,
        dueDate: { lte: now },
      },
      select: {
        word: {
          select: { topic: true, level: true },
        },
      },
    });

    // Tổng hợp kết quả trong bộ nhớ (in-memory aggregation) thay vì gọi DB từng nhóm
    const learnedMap = new Map<string, number>();
    for (const item of learnedCounts) {
      const key = `${item.word.topic}|${item.word.level}`;
      learnedMap.set(key, (learnedMap.get(key) || 0) + 1);
    }

    const dueMap = new Map<string, number>();
    for (const item of dueCounts) {
      const key = `${item.word.topic}|${item.word.level}`;
      dueMap.set(key, (dueMap.get(key) || 0) + 1);
    }

    return wordGroups.map((group) => {
      const key = `${group.topic}|${group.level}`;
      return {
        topic: group.topic,
        level: group.level,
        totalWords: group._count.id,
        learnedWords: learnedMap.get(key) || 0,
        dueWords: dueMap.get(key) || 0,
      };
    });
  }

  /**
   * 📖 Lấy chi tiết danh sách từ vựng kèm trạng thái học trong một Deck cụ thể
   */
  async getDeckWords(userId: string, topic: string, level: string) {
    // Tìm các từ thuộc chủ đề và level chỉ định
    const words = await this.prisma.word.findMany({
      where: { topic, level },
      include: {
        usersProgress: {
          where: { userId }, // Chỉ lấy tiến trình của user hiện tại
        },
      },
    });

    if (words.length === 0) {
      throw new NotFoundException(`Không tìm thấy bộ từ vựng nào thuộc chủ đề ${topic} - level ${level}!`);
    }

    // Định dạng lại dữ liệu trả về cho client
    return words.map((w) => {
      const progress = w.usersProgress[0] || null;
      return {
        id: w.id,
        word: w.word,
        ipa: w.ipa,
        meaning: w.meaning,
        example: w.example,
        exampleMeaning: w.exampleMeaning,
        progress: progress
          ? {
              interval: progress.interval,
              repetition: progress.repetition,
              efactor: progress.efactor,
              dueDate: progress.dueDate,
            }
          : null, // null nghĩa là user chưa bắt đầu học từ này
      };
    });
  }

  /**
   * 🎯 Đánh giá và cập nhật tiến trình ghi nhớ của 1 từ vựng (Thuật toán SM-2)
   */
  async reviewWord(userId: string, dto: ReviewWordDto) {
    const { wordId, quality } = dto;

    // 1. Kiểm tra xem từ vựng đó có tồn tại trong DB không
    const word = await this.prisma.word.findUnique({
      where: { id: wordId },
    });

    if (!word) {
      throw new NotFoundException('Từ vựng không tồn tại trên hệ thống!');
    }

    // 2. Tìm bản ghi tiến trình học trước đó của user cho từ này
    const progress = await this.prisma.flashcardProgress.findUnique({
      where: {
        userId_wordId: { userId, wordId },
      },
    });

    // Các tham số ban đầu mặc định theo SM-2
    let repetition = 0;
    let interval = 0;
    let efactor = 2.5;

    if (progress) {
      repetition = progress.repetition;
      interval = progress.interval;
      efactor = progress.efactor;
    }

    // 3. Thực thi thuật toán SM-2
    if (quality >= 3) {
      // Trả lời đúng (quality 3, 4, 5)
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * efactor);
      }
      repetition++;
    } else {
      // Trả lời sai (quality 0, 1, 2) -> Reset số lần đúng liên tiếp, ôn lại sau 1 ngày
      repetition = 0;
      interval = 1;
    }

    // Tính toán lại độ dễ Efactor động
    // Công thức chuẩn của SM-2: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (efactor < 1.3) {
      efactor = 1.3; // Giới hạn Efactor tối thiểu là 1.3
    }

    // Tính ngày đến hạn ôn tiếp theo (dueDate = hiện tại + interval ngày)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + interval);

    // 4. Lưu lại/Cập nhật vào database
    return this.prisma.flashcardProgress.upsert({
      where: {
        userId_wordId: { userId, wordId },
      },
      update: {
        repetition,
        interval,
        efactor,
        dueDate,
      },
      create: {
        userId,
        wordId,
        repetition,
        interval,
        efactor,
        dueDate,
      },
    });
  }
}
