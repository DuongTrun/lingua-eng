import { Module } from '@nestjs/common';
import { WordsService } from './words.service';
import { WordsController } from './words.controller';

/**
 * 🌐 LINGUA-ENG — Words Module
 * 
 * File này: Đăng ký WordsController và WordsService với hệ thống NestJS.
 * Nhờ JwtModule và PrismaModule được cấu hình ở dạng Global, module này có thể
 * hoạt động độc lập mà không cần import thêm bất kỳ module nào khác.
 */
@Module({
  providers: [WordsService],
  controllers: [WordsController],
})
export class WordsModule {}
