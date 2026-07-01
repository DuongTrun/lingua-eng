import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';

/**
 * 🌐 LINGUA-ENG — Auth Controller
 * 
 * File này: Tiếp nhận các request HTTP gửi đến endpoint `/auth/...` và gọi Service xử lý.
 * 
 * 💡 So sánh với Spring Boot (Javi):
 * - Tương tự AuthController.java trong Spring.
 * - `@Post('register')` tương đương `@PostMapping("/register")`.
 * - `@HttpCode(HttpStatus.OK)` dùng để đổi mã HTTP trả về thành 200 OK cho API Đăng nhập 
 *   (vì theo mặc định trong NestJS, tất cả các request dạng POST sẽ trả về 201 Created).
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 📝 POST: /auth/register
   * Đăng ký tài khoản người dùng mới
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * 🔑 POST: /auth/login
   * Đăng nhập hệ thống và nhận access token
   */
  @Post('login')
  @HttpCode(HttpStatus.OK) // Trả về status 200 thay vì 201 mặc định
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * 🌐 POST: /auth/google
   * Đăng nhập bằng tài khoản Google (OAuth idToken)
   */
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleLogin(googleLoginDto.token);
  }
}
