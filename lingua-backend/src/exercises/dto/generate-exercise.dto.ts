import { IsNotEmpty, IsString, IsOptional, IsInt, Min, Max, IsIn, Matches, MaxLength } from 'class-validator';

/**
 * 🌐 LINGUA-ENG — GenerateExercise DTO
 * 
 * File này: Định nghĩa dữ liệu đầu vào khi yêu cầu AI sinh bài tập củng cố.
 * 
 * 🔒 Bảo mật: Thêm @IsIn và @Matches để chống Prompt Injection —
 * ngăn attacker chèn lệnh vào trường topic/level nhằm thao túng AI.
 */
export class GenerateExerciseDto {
  
  @IsString({ message: 'Chủ đề (topic) phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Chủ đề không được để trống!' })
  @MaxLength(100, { message: 'Chủ đề không được dài quá 100 ký tự!' })
  @Matches(/^[\p{L}\p{N}\s\-'.,()]+$/u, { message: 'Chủ đề chứa ký tự không hợp lệ!' })
  topic: string; // Ví dụ: "Present Perfect", "Reported Speech"

  @IsString({ message: 'Cấp độ (level) phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Cấp độ không được để trống!' })
  @IsIn(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], { message: 'Cấp độ phải là một trong: A1, A2, B1, B2, C1, C2!' })
  level: string; // Chỉ chấp nhận CEFR levels hợp lệ

  @IsInt({ message: 'Số lượng câu hỏi phải là số nguyên!' })
  @Min(3, { message: 'Sinh tối thiểu 3 câu hỏi!' })
  @Max(20, { message: 'Sinh tối đa 20 câu hỏi!' })
  @IsOptional()
  count?: number = 10; // Mặc định sinh ra 10 câu
}
