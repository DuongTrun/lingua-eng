import { IsInt, Max, Min, IsUUID } from 'class-validator';

/**
 * 🌐 LINGUA-ENG — Review Word DTO
 * 
 * File này: Định nghĩa dữ liệu yêu cầu khi người dùng đánh giá mức độ ghi nhớ của một từ.
 */
export class ReviewWordDto {
  
  @IsUUID('4', { message: 'wordId phải là định dạng UUID hợp lệ!' })
  wordId: string;

  @IsInt({ message: 'Mức độ nhớ (quality) phải là số nguyên!' })
  @Min(0, { message: 'Mức độ nhớ nhỏ nhất là 0 (quên hoàn toàn)!' })
  @Max(5, { message: 'Mức độ nhớ lớn nhất là 5 (nhớ cực rõ)!' })
  quality: number; // Điểm đánh giá (0-5) để chạy thuật toán SM-2
}
