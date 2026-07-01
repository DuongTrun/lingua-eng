import { Controller, Get, Post, Query, Body, UseGuards, Param, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { WordsService } from './words.service';
import { AuthGuard } from '../auth/auth.guard';
import { GetWordsQueryDto } from './dto/get-words-query.dto';
import { AddCustomWordDto } from './dto/add-custom-word.dto';

/**
 * 🌐 LINGUA-ENG — Words Controller
 * 
 * File này: Tiếp nhận các request HTTP gửi tới route `/words` và gọi tới
 * service tương ứng để trả dữ liệu từ vựng cho client.
 * 
 * 💡 So sánh với Spring Boot (Javi):
 *    - Tương đương lớp WordController.java trong Spring Boot.
 *    - NestJS sử dụng decorator `@Controller('words')` thay vì `@RestController` + `@RequestMapping("/words")`.
 *    - Sử dụng `@UseGuards(AuthGuard)` tương tự như cấu hình phân quyền truy cập `@PreAuthorize("isAuthenticated()")`
 *      hoặc Spring Security Filter SecurityFilterChain.
 */
@Controller('words')
@UseGuards(AuthGuard) // Bảo vệ route này bằng JWT AuthGuard, yêu cầu đăng nhập mới được truy cập
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  /**
   * 🎙️ GET: /words/topics
   * Lấy danh sách tất cả chủ đề từ vựng hiện có trong database (dynamic)
   * 
   * ⚠️ Route này phải đặt TRƯỚC route ':id/details' để tránh NestJS
   * nhầm "topics" thành param :id
   */
  @Get('topics')
  async getTopics() {
    return this.wordsService.getDistinctTopics();
  }

  /**
   * 🎮 GET: /words/game
   * Lấy danh sách 50 từ vựng ngẫu nhiên phục vụ cho Mini-game phân loại từ loại
   *
   * @Throttle: Giới hạn 10 request/phút để tránh spam gây áp lực database
   */
  @Get('game')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async getWordsForGame() {
    return this.wordsService.getWordsForGame();
  }

  /**
   * 🎙️ GET: /words
   * Lấy danh sách từ vựng hỗ trợ phân trang, tìm kiếm và lọc
   * Sử dụng GetWordsQueryDto để validate input (page, limit, level, topic, search)
   */
  @Get()
  async getWords(@Query() query: GetWordsQueryDto) {
    return this.wordsService.getWords(query);
  }

  /**
   * 🎙️ GET: /words/:id/details
   * Lấy chi tiết từ vựng chuyên sâu (Gemini AI phân tích)
   * 
   * ParseUUIDPipe: Tự động validate id phải là UUID hợp lệ,
   * trả 400 Bad Request nếu không đúng format
   * 
   * @Throttle: Giới hạn 5 request/phút cho endpoint này
   * vì mỗi request gọi Gemini API tốn tài nguyên
   */
  @Get(':id/details')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async getWordDetails(
    @Param('id', new ParseUUIDPipe({
      exceptionFactory: () => new BadRequestException('ID từ vựng phải là định dạng UUID hợp lệ!'),
    })) id: string,
  ) {
    return this.wordsService.getWordDetails(id);
  }

  /**
   * ➕ POST: /words/add-custom
   * Thêm từ vựng thủ công — AI Gemini tự động sinh IPA, nghĩa, ví dụ, loại từ
   *
   * @Throttle: Giới hạn 5 request/phút vì mỗi request gọi Gemini API tốn tài nguyên
   */
  @Post('add-custom')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async addCustomWord(@Body() dto: AddCustomWordDto) {
    return this.wordsService.addCustomWord(dto.word);
  }
}
