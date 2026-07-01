import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config'; // Đảm bảo các biến môi trường trong file .env được load ngay lập tức

/**
 * 🌐 LINGUA-ENG — Prisma Service (Phiên bản tương thích Prisma 7.x)
 * 
 * File này: Quản lý kết nối tới Database PostgreSQL thông qua Prisma Client sử dụng Driver Adapter.
 * Vai trò: Kế thừa PrismaClient để cung cấp các hàm truy vấn DB cho các Service khác.
 * 
 * 💡 Kiến thức mới (Prisma 7.x):
 * - Kể từ Prisma 7.x, PrismaClient bắt buộc phải được khởi tạo kèm theo một Driver Adapter (ví dụ: pg adapter cho Postgres)
 *   hoặc một Accelerate URL thay vì tự đọc ngầm file schema.prisma như các bản trước.
 * - Chúng ta cài đặt thêm gói `@prisma/adapter-pg` và `pg` (PostgreSQL Client cho Node.js).
 * - Chúng ta tạo một Pool kết nối từ thư viện `pg` dựa trên `DATABASE_URL` và bọc nó vào `PrismaPg` adapter để truyền vào `super()`.
 * 
 * 🔒 Fix: Giữ reference tới pg Pool để close đúng cách trong onModuleDestroy,
 * tránh connection leak khi ứng dụng restart hoặc shutdown.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool; // Giữ reference để close pool khi shutdown

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('❌ Không tìm thấy biến môi trường DATABASE_URL trong file .env!');
    }
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    // Gọi constructor của lớp cha PrismaClient với adapter pg vừa tạo
    super({ adapter });

    // Lưu reference tới pool để close trong onModuleDestroy
    this.pool = pool;
  }

  // Hàm này chạy ngay khi Module chứa Service này được khởi tạo (tương tự @PostConstruct trong Spring)
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Đã kết nối thành công tới Database PostgreSQL (Supabase)!');
  }

  // Hàm này chạy khi ứng dụng tắt (tương tự @PreDestroy trong Spring)
  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end(); // ✅ Close pg Pool đúng cách, tránh connection leak
    console.log('🔌 Đã ngắt kết nối database an toàn.');
  }
}
