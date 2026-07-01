import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * 🌐 LINGUA-ENG — EvaluatePronunciation DTO
 * 
 * File này: Định nghĩa cấu trúc dữ liệu gửi lên khi yêu cầu AI chấm điểm phát âm câu Shadowing.
 * 
 * 🔒 Bảo mật: Thêm @MaxLength để giới hạn độ dài input gửi vào AI prompt,
 * tránh tốn chi phí token quá lớn hoặc vượt context limit.
 */
export class EvaluatePronunciationDto {
  
  @IsString({ message: 'Passage ID phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Passage ID không được để trống!' })
  @MaxLength(100, { message: 'Passage ID không được dài quá 100 ký tự!' })
  passageId: string; // ID của câu/đoạn văn mẫu

  @IsString({ message: 'Tiêu đề (passageTitle) phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống!' })
  @MaxLength(200, { message: 'Tiêu đề không được dài quá 200 ký tự!' })
  passageTitle: string; // Tiêu đề bài luyện đọc (ví dụ: "At the Airport - Checking In")

  @IsString({ message: 'Văn bản gốc (referenceText) phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Văn bản gốc không được để trống!' })
  @MaxLength(2000, { message: 'Văn bản gốc không được dài quá 2000 ký tự!' })
  referenceText: string; // Câu tiếng Anh chuẩn mẫu

  @IsString({ message: 'Văn bản người dùng đọc (spokenText) phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Văn bản người dùng đọc không được để trống!' })
  @MaxLength(2000, { message: 'Văn bản người dùng đọc không được dài quá 2000 ký tự!' })
  spokenText: string; // Văn bản mà trình STT của trình duyệt dịch từ giọng đọc của user
}
