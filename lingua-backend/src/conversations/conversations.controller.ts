import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConversationsService } from './conversations.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * 🌐 LINGUA-ENG — Conversations Controller
 * 
 * File này: Định nghĩa các API bảo mật để bắt đầu, chat, kết thúc 
 * và lấy lịch sử hội thoại của người học với AI Partner.
 */
@Controller('conversations')
@UseGuards(AuthGuard) // Bảo vệ tất cả các endpoints trong controller này bằng JWT AuthGuard
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  /**
   * 🗣️ POST: /conversations/session
   * Bắt đầu một phiên hội thoại mới và nhận câu chào mừng mở đầu của AI
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('session')
  async startSession(
    @CurrentUser('sub') userId: string,
    @Body() startSessionDto: StartSessionDto,
  ) {
    return this.conversationsService.startSession(userId, startSessionDto);
  }

  /**
   * 💬 POST: /conversations/message
   * Gửi tin nhắn của người dùng và nhận tin nhắn phản hồi của AI cùng phân tích ngữ pháp
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('message')
  async sendMessage(
    @CurrentUser('sub') userId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.conversationsService.sendMessage(userId, sendMessageDto);
  }

  /**
   * 📊 POST: /conversations/session/:id/end
   * Kết thúc cuộc trò chuyện hiện tại và gọi AI chấm điểm tạo báo cáo tổng hợp
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('session/:id/end')
  async endSession(
    @CurrentUser('sub') userId: string,
    @Param('id') sessionId: string,
  ) {
    return this.conversationsService.endSession(userId, sessionId);
  }

  /**
   * 📋 GET: /conversations/history
   * Xem danh sách lịch sử tất cả cuộc hội thoại đã thực hiện của user
   */
  @Get('history')
  async getHistory(@CurrentUser('sub') userId: string) {
    return this.conversationsService.getHistory(userId);
  }

  /**
   * 🔍 GET: /conversations/session/:id
   * Xem chi tiết nội dung cuộc hội thoại cũ và báo cáo kết quả kèm theo
   */
  @Get('session/:id')
  async getSessionDetails(
    @CurrentUser('sub') userId: string,
    @Param('id') sessionId: string,
  ) {
    return this.conversationsService.getSessionDetails(userId, sessionId);
  }
}
