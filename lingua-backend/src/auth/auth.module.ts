import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';

/**
 * 🌐 LINGUA-ENG — Auth Module
 * 
 * File này: Liên kết Controller, Service của module Auth và cấu hình JWT Token.
 * 
 * 💡 Kiến thức mới (JwtModule):
 * - NestJS cung cấp sẵn `JwtModule` từ gói `@nestjs/jwt` để quản lý tạo và giải mã JWT token.
 * - `global: true` giúp JwtService có thể được sử dụng ở bất kỳ module nào khác 
 *   (ví dụ: dùng để giải mã token kiểm tra quyền đăng nhập tại các service/guard khác sau này) 
 *   mà không cần import lại JwtModule.
 */
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: (() => {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('❌ FATAL: Biến môi trường JWT_SECRET chưa được cấu hình trong file .env!');
        return secret;
      })(),
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
