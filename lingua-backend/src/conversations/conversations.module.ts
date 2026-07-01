import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [ConversationsService],
  controllers: [ConversationsController]
})
export class ConversationsModule {}
