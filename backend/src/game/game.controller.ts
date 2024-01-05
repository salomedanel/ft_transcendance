import { Controller, Get, Param, Req } from '@nestjs/common';
import { GameService } from './game.service';
import { Request } from 'express';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}
  @Get('rooms')
  getRooms() {
    return this.gameService.getRooms();
  }

  @Get('players')
  getPlayers() {
    return this.gameService.getPlayers();
  }

  @Get('rooms/:roomName/player')
  async getRoomPlayer(
    @Req() req: Request,
    @Param('roomName') roomName: string,
  ) {
    return this.gameService.getRoomPlayer(req, roomName);
  }
}
