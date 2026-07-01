import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export để các Module khác (như Exercises, Conversations) có thể dùng chung logic cập nhật Streak và cộng XP
})
export class UsersModule {}
