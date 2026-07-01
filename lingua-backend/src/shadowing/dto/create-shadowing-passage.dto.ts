import { IsNotEmpty, IsString, MaxLength, IsOptional, IsIn } from 'class-validator';

/**
 * 🌐 LINGUA-ENG — CreateShadowingPassage DTO
 * 
 * File này: Định nghĩa và validate dữ liệu gửi lên khi tạo mới một bài luyện đọc Shadowing.
 * Hỗ trợ 2 chế độ:
 * - 'manual': Người dùng tự nhập mọi thông tin.
 * - 'auto': Hệ thống dùng AI để tự động tạo câu dựa trên cấp độ (level) và chủ đề (topic).
 */
export class CreateShadowingPassageDto {
  
  @IsString({ message: 'Chế độ (mode) phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Chế độ không được để trống!' })
  @IsIn(['manual', 'auto'], { message: 'Chế độ phải là manual hoặc auto!' })
  mode: 'manual' | 'auto';

  @IsString({ message: 'Tiêu đề phải là chuỗi ký tự!' })
  @IsOptional()
  @MaxLength(200, { message: 'Tiêu đề không được dài quá 200 ký tự!' })
  title?: string;

  @IsString({ message: 'Văn bản gốc tiếng Anh phải là chuỗi ký tự!' })
  @IsOptional()
  @MaxLength(2000, { message: 'Văn bản gốc tiếng Anh không được dài quá 2000 ký tự!' })
  referenceText?: string;

  @IsString({ message: 'Bản dịch tiếng Việt phải là chuỗi ký tự!' })
  @IsOptional()
  @MaxLength(2000, { message: 'Bản dịch tiếng Việt không được dài quá 2000 ký tự!' })
  vietnameseTranslation?: string;

  @IsString({ message: 'Cấp độ phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Cấp độ không được để trống!' })
  @MaxLength(10, { message: 'Cấp độ không được dài quá 10 ký tự!' })
  level: string;

  @IsString({ message: 'Chủ đề phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Chủ đề không được để trống!' })
  @MaxLength(50, { message: 'Chủ đề không được dài quá 50 ký tự!' })
  topic: string;

  @IsString({ message: 'Thời lượng phải là chuỗi ký tự!' })
  @IsOptional()
  @MaxLength(10, { message: 'Thời lượng không được dài quá 10 ký tự!' })
  duration?: string;
}
