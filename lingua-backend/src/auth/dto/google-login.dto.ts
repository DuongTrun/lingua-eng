import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 🌐 LINGUA-ENG — Google Login DTO
 * 
 * File này: Định nghĩa cấu trúc dữ liệu yêu cầu khi người dùng chọn Đăng nhập bằng Google.
 * Client (Next.js) sẽ gửi lên idToken (credential) nhận được từ Google SDK.
 */
export class GoogleLoginDto {
  @IsString({ message: 'Token phải là một chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Token không được để trống!' })
  token: string;
}
