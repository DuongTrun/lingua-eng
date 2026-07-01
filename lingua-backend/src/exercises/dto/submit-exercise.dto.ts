import { IsNotEmpty, IsString, IsInt, Min, Max, IsIn, Matches, MaxLength } from 'class-validator';

/**
 * 🌐 LINGUA-ENG — SubmitExercise DTO
 * 
 * File này: Định nghĩa dữ liệu client gửi lên sau khi làm bài tập xong để lưu điểm và cộng XP.
 * 
 * 🔒 Bảo mật: Thêm @Max cho score/total để chống Score Manipulation.
 * Attacker không thể gửi score: 9999 để ăn XP vô hạn.
 */
export class SubmitExerciseDto {
  
  @IsString({ message: 'Chủ đề (topic) phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Chủ đề không được để trống!' })
  @MaxLength(100, { message: 'Chủ đề không được dài quá 100 ký tự!' })
  @Matches(/^[\p{L}\p{N}\s\-'.,()]+$/u, { message: 'Chủ đề chứa ký tự không hợp lệ!' })
  topic: string;

  @IsString({ message: 'Cấp độ (level) phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Cấp độ không được để trống!' })
  @IsIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], { message: 'Cấp độ phải là một trong: A1, A2, B1, B2, C1, C2!' })
  level: string;

  @IsInt({ message: 'Số câu đúng phải là số nguyên!' })
  @Min(0, { message: 'Số câu đúng không được nhỏ hơn 0!' })
  @Max(20, { message: 'Số câu đúng không được vượt quá 20!' })
  score: number; // Ví dụ: 8

  @IsInt({ message: 'Tổng số câu phải là số nguyên!' })
  @Min(1, { message: 'Tổng số câu phải lớn hơn 0!' })
  @Max(20, { message: 'Tổng số câu không được vượt quá 20!' })
  total: number; // Ví dụ: 10
}
