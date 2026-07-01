import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { ReviewWordDto } from './dto/review-word.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * 🌐 LINGUA-ENG — Flashcards Controller
 * 
 * File này: Tiếp nhận các request HTTP gửi tới các route bảo mật `/flashcards/...`
 * để lấy thông tin các bộ từ vựng và xử lý chấm điểm ôn tập.
 * 
 * 💡 Kiến thức mới (@UseGuards(AuthGuard)):
 * - Để bảo vệ các route này, chúng ta sử dụng `@UseGuards(AuthGuard)`. 
 * - Mọi request đi vào đây đều phải đính kèm Header `Authorization: Bearer <token>`.
 * - Nếu không có hoặc token sai, hệ thống tự chặn và trả về lỗi 401 Unauthorized.
 * - Sử dụng `@CurrentUser('sub')` để lấy trực tiếp `userId` từ token đã giải mã.
 */
@Controller('flashcards')
@UseGuards(AuthGuard) // Bảo vệ tất cả các endpoints trong controller này
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  /**
   * 📚 GET: /flashcards/decks
   * Lấy danh sách các bộ từ vựng kèm theo thống kê tiến trình học (số từ đã học, cần ôn)
   */
  @Get('decks')
  async getDecks(@CurrentUser('sub') userId: string) {
    return this.flashcardsService.getDecks(userId);
  }

  /**
   * 📖 GET: /flashcards/decks/:topic/:level
   * Lấy chi tiết các từ vựng kèm theo trạng thái ôn tập trong 1 bộ từ vựng cụ thể
   */
  @Get('decks/:topic/:level')
  async getDeckWords(
    @CurrentUser('sub') userId: string,
    @Param('topic') topic: string,
    @Param('level') level: string,
  ) {
    return this.flashcardsService.getDeckWords(userId, topic, level);
  }

  /**
   * 🎯 POST: /flashcards/review
   * Lưu kết quả đánh giá mức độ nhớ của 1 từ vựng (chạy thuật toán SM-2)
   */
  @Post('review')
  async reviewWord(
    @CurrentUser('sub') userId: string,
    @Body() reviewWordDto: ReviewWordDto,
  ) {
    return this.flashcardsService.reviewWord(userId, reviewWordDto);
  }
}
