import { Module } from '@nestjs/common';
import { ShadowingService } from './shadowing.service';
import { ShadowingController } from './shadowing.controller';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [ShadowingService],
  controllers: [ShadowingController]
})
export class ShadowingModule {}
