import { IsNotEmpty, IsString, IsIn, Matches, MaxLength } from 'class-validator';

/**
 * 🌐 LINGUA-ENG — StartSession DTO
 * 
 * File này: Định nghĩa dữ liệu khi yêu cầu khởi tạo một phiên hội thoại luyện nói mới.
 * 
 * 🔒 Bảo mật: Thêm @IsIn và @Matches để chống Prompt Injection vào AI prompt.
 */
export class StartSessionDto {
  
  @IsString({ message: 'Tình huống hội thoại (scenario) phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Tình huống không được để trống!' })
  @MaxLength(150, { message: 'Tình huống không được dài quá 150 ký tự!' })
  @Matches(/^[\p{L}\p{N}\s\-'.,()]+$/u, { message: 'Tình huống chứa ký tự không hợp lệ!' })
  scenario: string; // Ví dụ: "Job Interview", "Ordering at a Restaurant"

  @IsString({ message: 'Cấp độ (level) phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Cấp độ không được để trống!' })
  @IsIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], { message: 'Cấp độ phải là một trong: A1, A2, B1, B2, C1, C2!' })
  level: string; // Ví dụ: "A2", "B1", "B2", "C1"
}
