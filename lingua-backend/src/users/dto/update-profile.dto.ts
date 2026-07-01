import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

/**
 * 🌐 LINGUA-ENG — UpdateProfile DTO
 * 
 * File này: Định nghĩa các trường dữ liệu người dùng có thể cập nhật thông tin cá nhân.
 */
export class UpdateProfileDto {
  @IsString({ message: 'Tên hiển thị phải là chuỗi ký tự!' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'Cấp độ tiếng Anh hiện tại phải là chuỗi ký tự!' })
  @IsOptional()
  currentLevel?: string; // Ví dụ: "A1", "A2", "B1", "B2", "C1", "C2"

  @IsInt({ message: 'Mục tiêu XP hàng ngày phải là số nguyên!' })
  @Min(10, { message: 'Mục tiêu XP tối thiểu hàng ngày là 10 XP!' })
  @Max(500, { message: 'Mục tiêu XP tối đa hàng ngày là 500 XP!' })
  @IsOptional()
  dailyGoalXp?: number;
}
