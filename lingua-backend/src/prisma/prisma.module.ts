import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * 🌐 LINGUA-ENG — Prisma Module
 * 
 * File này: Đóng gói PrismaService thành một Module độc lập.
 * 
 * 💡 Kiến thức mới (NestJS Module):
 * - Trong NestJS, các Service mặc định chỉ có thể sử dụng được bên trong Module khai báo nó.
 * - Để các Module khác (như AuthModule, WordModule) có thể sử dụng PrismaService, chúng ta dùng decorator @Global() 
 *   để biến module này thành Global Module. 
 * - Giờ đây, chỉ cần import PrismaModule một lần duy nhất tại AppModule, tất cả các module khác trong hệ thống 
 *   đều có thể inject PrismaService qua constructor mà không cần khai báo import lại.
 * - Điều này giúp NestJS hoạt động tương tự như cơ chế tự động quét (Auto-scanning) của Spring Boot.
 */
@Global()
@Module({
  providers: [PrismaService], // Đăng ký PrismaService là một provider trong module này
  exports: [PrismaService],   // Export PrismaService để các module khác có thể sử dụng
})
export class PrismaModule {}
