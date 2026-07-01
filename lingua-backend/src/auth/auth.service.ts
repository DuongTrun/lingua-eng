import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import * as crypto from 'crypto';

/**
 * 🌐 LINGUA-ENG — Auth Service
 * 
 * File này: Xử lý logic nghiệp vụ đăng ký và đăng nhập (mã hóa mật khẩu, kiểm tra DB, sinh JWT).
 * 
 * 💡 So sánh với Spring Boot (Javi):
 * - Tương tự AuthServiceImpl.java trong dự án Spring Boot.
 * - Sử dụng `bcrypt` để băm mật khẩu (tương tự BCryptPasswordEncoder).
 * - Sử dụng `ConflictException`, `UnauthorizedException` của NestJS — NestJS tự động bắt các lỗi này 
 *   và chuyển thành HTTP Status 409 Conflict, 401 Unauthorized tương ứng để gửi về client (tự động như @RestControllerAdvice).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService, // Inject PrismaService toàn cục
    private readonly jwtService: JwtService, // Inject JwtService để tạo token
  ) {}

  /**
   * 📝 Đăng ký người dùng mới
   */
  async register(dto: RegisterDto) {
    const { email, password, name, currentLevel } = dto;

    // 1. Kiểm tra xem email đã tồn tại trong DB chưa
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã được đăng ký trên hệ thống!');
    }

    // 2. Băm (hash) mật khẩu bằng bcrypt với salt rounds = 10
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Tạo user mới trong PostgreSQL qua Prisma
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        currentLevel: currentLevel || 'A1',
      },
    });

    // 4. Loại bỏ trường password trước khi trả về client để bảo mật
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * 🔑 Đăng nhập hệ thống
   */
  async login(dto: LoginDto) {
    const { email, password } = dto;

    // 1. Tìm user theo email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác!');
    }

    // 2. So sánh mật khẩu người dùng gửi lên với mật khẩu đã băm trong DB
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác!');
    }

    // 3. Tạo Payload chứa thông tin cơ bản của User để lưu vào Token
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // 4. Ký và sinh ra mã JWT token
    const accessToken = await this.jwtService.signAsync(payload);

    // 5. Trả về thông tin user (không gồm password) và access_token
    const { password: _, ...userProfile } = user;

    return {
      user: userProfile,
      accessToken,
    };
  }

  /**
   * 🌐 Đăng nhập / Đăng ký nhanh bằng Google
   */
  async googleLogin(token: string) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      throw new Error('❌ Hệ thống chưa được cấu hình biến môi trường GOOGLE_CLIENT_ID trong file .env!');
    }

    const client = new OAuth2Client(googleClientId);
    let payload;

    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch (err) {
      throw new UnauthorizedException('Mã xác thực Google không hợp lệ hoặc đã hết hạn!');
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedException('Không thể lấy thông tin email từ tài khoản Google!');
    }

    const { email, name } = payload;

    // 1. Tìm người dùng trong DB
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    // 2. Nếu chưa tồn tại, tự động tạo mới tài khoản
    if (!user) {
      const randomPassword = crypto.randomBytes(20).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      user = await this.prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: hashedPassword,
          currentLevel: 'A1',
        },
      });
    }

    // 3. Ký mã JWT Token cho phiên đăng nhập hệ thống
    const jwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload);
    const { password: _, ...userProfile } = user;

    return {
      user: userProfile,
      accessToken,
    };
  }
}
