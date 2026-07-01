import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * 🌐 LINGUA-ENG — Login DTO (Data Transfer Object)
 * 
 * File này: Định nghĩa cấu trúc dữ liệu yêu cầu khi người dùng Đăng nhập tài khoản.
 * 
 * 💡 So sánh với Spring Boot (Javi):
 * - Giống như class LoginRequest.java trong Javi.
 */
export class LoginDto {
  
  @IsEmail({}, { message: 'Email không đúng định dạng!' })
  @IsNotEmpty({ message: 'Email không được để trống!' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là một chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống!' })
  password: string;
}
