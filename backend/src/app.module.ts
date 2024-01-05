import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AuthService } from './auth/auth.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserService } from './user/user.service';
import { FilesModule } from './files/files.module';
import { ChatModule } from './chat/chat.module';
import { ChatService } from './chat/chat.service';
import { GameModule } from './game/game.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    AuthModule,
    UserModule,
    PrismaModule,
    FilesModule,
    ChatModule,
    GameModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService, ChatService],
})
export class AppModule {}
