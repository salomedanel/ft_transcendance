import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { UserModule } from 'src/user/user.module';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GameModule } from 'src/game/game.module';

@Module({
  imports: [UserModule, PrismaModule, GameModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, AuthService, UserService],
  exports: [ChatService],
})
export class ChatModule {}
