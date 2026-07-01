import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

/**
 * 🌐 LINGUA-ENG — Add Custom Word DTO
 *
 * File này: Validate đầu vào cho endpoint thêm từ vựng thủ công.
 * User chỉ cần gửi lên từ tiếng Anh, backend sẽ gọi AI sinh phần còn lại.
 */
export class AddCustomWordDto {
  @IsString({ message: 'Từ vựng phải là chuỗi ký tự!' })
  @IsNotEmpty({ message: 'Vui lòng nhập từ vựng tiếng Anh!' })
  @MinLength(1, { message: 'Từ vựng phải có ít nhất 1 ký tự!' })
  @MaxLength(100, { message: 'Từ vựng không được vượt quá 100 ký tự!' })
  word: string;
}
