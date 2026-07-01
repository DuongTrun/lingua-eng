import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { ExercisesModule } from './exercises/exercises.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ShadowingModule } from './shadowing/shadowing.module';
import { UsersModule } from './users/users.module';
import { WordsModule } from './words/words.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 30, // 30 requests per minute default
      },
    ]),
    PrismaModule,
    AuthModule,
    FlashcardsModule,
    ExercisesModule,
    ConversationsModule,
    ShadowingModule,
    UsersModule,
    WordsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
