import { IsOptional, IsString, IsInt, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 🌐 LINGUA-ENG — Get Words Query DTO
 *
 * File này: Định nghĩa và validate các query params cho endpoint GET /words.
 * Chặn truy vấn bất hợp lệ (page âm, limit quá lớn, search quá dài).
 *
 * 💡 So sánh với Spring Boot (Javi):
 *    - Tương tự như dùng @RequestParam kết hợp @Valid và @Min/@Max trong Spring MVC.
 */
export class GetWordsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số trang (page) phải là số nguyên!' })
  @Min(1, { message: 'Số trang nhỏ nhất là 1!' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Giới hạn (limit) phải là số nguyên!' })
  @Min(1, { message: 'Giới hạn tối thiểu là 1 từ mỗi trang!' })
  @Max(100, { message: 'Giới hạn tối đa là 100 từ mỗi trang!' })
  limit?: number;

  @IsOptional()
  @IsString({ message: 'Cấp độ (level) phải là chuỗi ký tự!' })
  level?: string;

  @IsOptional()
  @IsString({ message: 'Chủ đề (topic) phải là chuỗi ký tự!' })
  topic?: string;

  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự!' })
  @MaxLength(200, { message: 'Từ khóa tìm kiếm không được vượt quá 200 ký tự!' })
  search?: string;

  @IsOptional()
  @IsString()
  beautyMode?: string;
}

