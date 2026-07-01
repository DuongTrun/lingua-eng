import { Controller, Post, Get, Body, UseGuards, Query, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ShadowingService } from './shadowing.service';
import { EvaluatePronunciationDto } from './dto/evaluate-pronunciation.dto';
import { CreateShadowingPassageDto } from './dto/create-shadowing-passage.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * 🌐 LINGUA-ENG — Shadowing Controller
 * 
 * File này: Tiếp nhận các request HTTP gửi tới các route bảo mật `/shadowing/...`
 * để phân tích giọng đọc và gửi kết quả chấm điểm phát âm cho người học.
 */
@Controller('shadowing')
@UseGuards(AuthGuard) // Bảo vệ tất cả các endpoints trong controller này bằng JWT AuthGuard
export class ShadowingController {
  constructor(private readonly shadowingService: ShadowingService) {}

  /**
   * 🎙️ POST: /shadowing/evaluate
   * Gửi đoạn text người dùng đọc lên để AI so sánh với câu gốc, chấm điểm và chỉ ra lỗi phát âm từng từ
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('evaluate')
  async evaluate(
    @CurrentUser('sub') userId: string,
    @Body() dto: EvaluatePronunciationDto,
  ) {
    return this.shadowingService.evaluatePronunciation(userId, dto);
  }

  /**
   * 📊 GET: /shadowing/history
   * Xem lịch sử kết quả luyện phát âm Shadowing của user
   */
  @Get('history')
  async getHistory(@CurrentUser('sub') userId: string) {
    return this.shadowingService.getHistory(userId);
  }

  /**
   * 🎙️ GET: /shadowing/passages
   * Lấy danh sách bài Shadowing (hỗ trợ lọc theo topic & level)
   */
  @Get('passages')
  async getPassages(
    @CurrentUser('sub') userId: string,
    @Query('topic') topic?: string,
    @Query('level') level?: string,
  ) {
    return this.shadowingService.getPassages(userId, topic, level);
  }

  /**
   * 🎙️ GET: /shadowing/passages/:id
   * Lấy chi tiết bài Shadowing theo ID
   */
  @Get('passages/:id')
  async getPassageById(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.shadowingService.getPassageById(userId, id);
  }

  /**
   * 🎙️ POST: /shadowing/passages
   * Tạo bài luyện đọc Shadowing mới
   */
  @Post('passages')
  async createPassage(@Body() dto: CreateShadowingPassageDto) {
    return this.shadowingService.createPassage(dto);
  }
}
