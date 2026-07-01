import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cấu hình CORS để cho phép Frontend truy cập API (cả production và local)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
    // Tự động thêm bản không có dấu gạch chéo '/' ở cuối nếu người dùng cấu hình thừa
    if (process.env.FRONTEND_URL.endsWith('/')) {
      allowedOrigins.push(process.env.FRONTEND_URL.slice(0, -1));
    }
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép request không có origin (như Postman/Mobile) hoặc nằm trong danh sách được phép
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Tên miền ${origin} không được phép truy cập API do chính sách CORS.`));
      }
    },
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
