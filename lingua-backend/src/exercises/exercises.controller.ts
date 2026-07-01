import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ExercisesService } from './exercises.service';
import { GenerateExerciseDto } from './dto/generate-exercise.dto';
import { SubmitExerciseDto } from './dto/submit-exercise.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * 🌐 LINGUA-ENG — Exercises Controller
 * 
 * File này: Tiếp nhận các request HTTP gửi tới các route bảo mật `/exercises/...`
 * để sinh đề bài tập ngữ pháp từ AI và lưu kết quả điểm số của học viên.
 */
@Controller('exercises')
@UseGuards(AuthGuard) // Bảo vệ tất cả các endpoints trong controller này bằng JWT AuthGuard
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  /**
   * 🧠 POST: /exercises/generate
   * Gọi AI sinh ra bài tập trắc nghiệm theo chủ đề và cấp độ yêu cầu
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('generate')
  async generate(@Body() generateExerciseDto: GenerateExerciseDto) {
    return this.exercisesService.generate(generateExerciseDto);
  }

  /**
   * 💾 POST: /exercises/submit
   * Gửi kết quả điểm số sau khi làm bài xong để lưu trữ và tích lũy điểm kinh nghiệm (XP)
   */
  @Post('submit')
  async submit(
    @CurrentUser('sub') userId: string,
    @Body() submitExerciseDto: SubmitExerciseDto,
  ) {
    return this.exercisesService.submit(userId, submitExerciseDto);
  }

  /**
   * 📊 GET: /exercises/history
   * Lấy lịch sử 10 bài tập gần nhất đã làm của người dùng
   */
  @Get('history')
  async getHistory(@CurrentUser('sub') userId: string) {
    return this.exercisesService.getHistory(userId);
  }
}
