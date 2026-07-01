import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * 🌐 LINGUA-ENG — SendMessage DTO
 * 
 * File này: Định nghĩa dữ liệu gửi lên khi user nói hoặc chat một câu trong phiên hội thoại.
 * 
 * 🔒 Bảo mật: Thêm @MaxLength để giới hạn độ dài tin nhắn, ngăn chặn prompt quá dài
 * khiến Gemini vượt context limit hoặc tốn chi phí token không cần thiết.
 */
export class SendMessageDto {
  
  @IsUUID('4', { message: 'sessionId phải là định dạng UUID hợp lệ!' })
  @IsNotEmpty({ message: 'Session ID không được để trống!' })
  sessionId: string;

  @IsString({ message: 'Nội dung tin nhắn (text) phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Nội dung tin nhắn không được để trống!' })
  @MaxLength(2000, { message: 'Nội dung tin nhắn không được dài quá 2000 ký tự!' })
  text: string; // Nội dung người dùng nói (sau khi được Web Speech API ở FE dịch thành text)
}
