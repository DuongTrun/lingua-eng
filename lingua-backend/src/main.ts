import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cấu hình CORS để cho phép Frontend truy cập API
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Đăng ký bộ lọc ngoại lệ toàn cục
  app.useGlobalFilters(new HttpExceptionFilter());

  // Kích hoạt Validation toàn cục (Tương tự như cấu hình Spring Validation)
  // Tự động kiểm tra dữ liệu đầu vào dựa trên các DTO đã khai báo
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Tự động loại bỏ các thuộc tính lạ gửi lên không được định nghĩa trong DTO
    forbidNonWhitelisted: true, // Trả về lỗi 400 nếu client gửi trường lạ không nằm trong DTO
    transform: true, // Tự động biến đổi kiểu dữ liệu phù hợp (ví dụ: chuyển string '5' thành number 5)
  }));

  // Đọc cổng PORT từ biến môi trường, mặc định là 5005 cho Backend
  const port = process.env.PORT ?? 5005;
  await app.listen(port);
  console.log(`🚀 Server đang chạy tại: http://localhost:${port}`);
}
bootstrap();
