import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

/**
 * 🌐 LINGUA-ENG — Users Service
 * 
 * File này: Xử lý logic nghiệp vụ cho User Profile, Dashboard thống kê,
 * Bảng xếp hạng học tập (Leaderboard) và thuật toán tự động tính toán Streak (số ngày học liên tiếp).
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 📅 Helper: Lấy chuỗi ngày YYYY-MM-DD theo múi giờ Việt Nam (Asia/Ho_Chi_Minh)
   */
  private getLocalDateString(date: Date): string {
    return date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
  }

  /**
   * 🔥 Thuật toán tự động cập nhật Streak học tập và cộng điểm XP cho người dùng.
   * Hàm này sẽ được gọi mỗi khi người dùng hoàn thành một hoạt động học tập (Làm bài tập, nói chuyện, Shadowing).
   */
  async updateActivity(userId: string, xpEarned: number) {
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const todayStr = this.getLocalDateString(now);

      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('❌ Không tìm thấy thông tin người học!');
      }

      let newStreak = user.streak;

      if (!user.lastActiveAt) {
        // 1. Chưa từng hoạt động trước đây -> Đặt streak ban đầu bằng 1
        newStreak = 1;
      } else {
        const lastActiveStr = this.getLocalDateString(user.lastActiveAt);

        if (todayStr === lastActiveStr) {
          // 2. Học nhiều lần trong cùng một ngày -> Giữ nguyên streak
        } else {
          const todayDate = new Date(todayStr);
          const lastActiveDate = new Date(lastActiveStr);

          // Tính khoảng cách số ngày thực tế giữa hôm nay và ngày học gần nhất
          const diffTime = Math.abs(todayDate.getTime() - lastActiveDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // 3. Học vào ngày tiếp theo -> Tăng streak lên 1 ngày 🔥
            newStreak += 1;
          } else {
            // 4. Nghỉ học quá 1 ngày -> Reset chuỗi ngày liên tiếp về 1
            newStreak = 1;
          }
        }
      }

      // Cập nhật database: Cộng dồn XP, cập nhật streak và ngày hoạt động gần nhất
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          xp: {
            increment: xpEarned,
          },
          streak: newStreak,
          lastActiveAt: now,
        },
        select: {
          id: true,
          name: true,
          streak: true,
          xp: true,
        },
      });

      return updatedUser;
    }); // Prisma $transaction tự động ROLLBACK nếu có lỗi
  }

  /**
   * 👤 Lấy thông tin cá nhân của người học
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        currentLevel: true,
        streak: true,
        xp: true,
        dailyGoalXp: true,
        lastActiveAt: true,
        createdAt: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('❌ Không tìm thấy thông tin người dùng!');
    }

    return user;
  }

  /**
   * ✏️ Cập nhật thông tin Profile người học
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('❌ Không tìm thấy thông tin người dùng!');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.currentLevel !== undefined && { currentLevel: dto.currentLevel }),
        ...(dto.dailyGoalXp !== undefined && { dailyGoalXp: dto.dailyGoalXp }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        currentLevel: true,
        streak: true,
        xp: true,
        dailyGoalXp: true,
        role: true,
      },
    });
  }

  /**
   * 📊 Lấy các chỉ số thống kê học tập cho màn hình Dashboard chính
   */
  async getDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('❌ Không tìm thấy thông tin người dùng!');
    }

    const now = new Date();
    const todayStr = this.getLocalDateString(now);
    // Tính mốc 00:00:00 ngày hôm nay theo múi giờ Việt Nam (GMT+7)
    const startOfToday = new Date(`${todayStr}T00:00:00.000+07:00`);

    // 🚀 PERFORMANCE: Chạy 5 queries song song bằng Promise.all thay vì tuần tự
    // Giảm response time từ ~6x RTT xuống ~1x RTT (Round-Trip Time)
    const [
      learnedWordsCount,
      dueWordsCount,
      totalExercisesCount,
      totalConversationsCount,
      exerciseXpToday,
    ] = await Promise.all([
      // 1. Thống kê số từ vựng đã thuộc (repetition >= 3 trong SM-2)
      this.prisma.flashcardProgress.count({
        where: { userId, repetition: { gte: 3 } },
      }),
      // 2. Thống kê số từ vựng cần ôn tập hôm nay (dueDate <= hiện tại)
      this.prisma.flashcardProgress.count({
        where: { userId, dueDate: { lte: now } },
      }),
      // 3. Thống kê tổng số bài tập AI đã làm
      this.prisma.exerciseResult.count({
        where: { userId },
      }),
      // 4. Thống kê tổng số cuộc hội thoại AI đã thực hiện thành công
      this.prisma.conversationSession.count({
        where: { userId, status: 'COMPLETED' },
      }),
      // 5. Thống kê điểm XP tích lũy nhận được ngày hôm nay từ các bài tập trắc nghiệm
      this.prisma.exerciseResult.aggregate({
        where: { userId, createdAt: { gte: startOfToday } },
        _sum: { xpEarned: true },
      }),
    ]);

    const todayXpEarned = exerciseXpToday._sum.xpEarned || 0;
    const isGoalCompleted = todayXpEarned >= user.dailyGoalXp;

    return {
      learnedWordsCount,
      dueWordsCount,
      totalExercisesCount,
      totalConversationsCount,
      todayXpEarned,
      dailyGoalXp: user.dailyGoalXp,
      isGoalCompleted,
    };
  }

  /**
   * 🏆 Lấy danh sách Top 10 học viên có điểm kinh nghiệm (XP) cao nhất hệ thống
   */
  async getLeaderboard() {
    return this.prisma.user.findMany({
      orderBy: {
        xp: 'desc',
      },
      take: 10,
      select: {
        name: true,
        xp: true,
        streak: true,
        currentLevel: true,
      },
    });
  }

  /**
   * 👥 Lấy danh sách tất cả người dùng trong hệ thống (Chỉ dành cho ADMIN)
   */
  async getAllUsers() {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        currentLevel: true,
        streak: true,
        xp: true,
        createdAt: true,
      },
    });
  }

  /**
   * 🔄 Cập nhật vai trò người dùng (Chỉ dành cho ADMIN)
   */
  async updateUserRole(userId: string, role: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('❌ Không tìm thấy thông tin người dùng!');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  /**
   * ❌ Xóa tài khoản người dùng (Chỉ dành cho ADMIN)
   */
  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('❌ Không tìm thấy thông tin người dùng!');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Đã xóa người dùng thành công!' };
  }
}
