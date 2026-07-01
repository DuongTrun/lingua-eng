import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import 'dotenv/config';

/**
 * 🌐 LINGUA-ENG — Jwt Auth Guard
 * 
 * File này: Chặn các request gửi tới private route để kiểm tra và giải mã JWT token.
 * 
 * 💡 So sánh với Spring Boot (Javi):
 * - Hoạt động tương tự như Filter (OncePerRequestFilter) trong Spring Security.
 * - Trích xuất Token dạng "Bearer <token>" từ Header Authorization.
 * - Giải mã và kiểm tra tính hợp lệ của token qua JwtService.
 * - Nếu hợp lệ, đính kèm thông tin user (id, email) vào đối tượng request để controller lấy ra sử dụng.
 * - Nếu không hợp lệ, ném ra lỗi 401 Unauthorized.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Bạn cần đăng nhập để truy cập tài nguyên này!');
    }

    try {
      // Xác thực token và lấy ra payload (id, email, name)
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new UnauthorizedException('Hệ thống chưa được cấu hình JWT_SECRET!');
      }
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtSecret,
      });

      // Đính kèm payload vào đối tượng request để controller sử dụng (qua request.user)
      request['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn hoặc token không hợp lệ!');
    }

    return true;
  }

  // Trích xuất token từ header Authorization
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
