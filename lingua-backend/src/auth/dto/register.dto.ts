import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * 🌐 LINGUA-ENG — Register DTO (Data Transfer Object)
 * 
 * File này: Định nghĩa cấu trúc dữ liệu yêu cầu khi người dùng Đăng ký tài khoản.
 * Vai trò: Kiểm tra và lọc dữ liệu (Validation) được gửi lên từ client trước khi đi vào Controller.
 * 
 * 💡 So sánh với Spring Boot (Javi):
 * - Giống như class RegisterRequest.java trong Javi.
 * - Sử dụng các decorators của `class-validator` như `@IsEmail()`, `@IsNotEmpty()` 
 *   tương tự các annotation `@Email`, `@NotBlank` trong Jakarta Validation.
 */
export class RegisterDto {
  
  @IsEmail({}, { message: 'Email không đúng định dạng!' })
  @IsNotEmpty({ message: 'Email không được để trống!' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là một chuỗi ký tự!' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự!' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống!' })
  password: string;

  @IsString({ message: 'Tên người dùng phải là một chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Tên người dùng không được để trống!' })
  name: string;

  @IsString({ message: 'Trình độ tiếng Anh phải là một chuỗi ký tự!' })
  @IsOptional() // Trường này không bắt buộc gửi lên (nếu không gửi sẽ lấy mặc định là "A1" ở DB)
  currentLevel?: string;
}
