import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

@WebSocketGateway(3090, {
  transports: ['websocket'],
  namespace: 'game',
  cors: false,
})
export class GameGateway {
  @WebSocketServer() server: Server;
  constructor(private readonly gameService: GameService) {}

  afterInit() {}

  handleConnection(client: Socket) {
    this.gameService.handleConnection(client);
  }

  handleDisconnect(client: Socket) {
    this.gameService.handleDisconnect(client, this.server);
  }

  @SubscribeMessage('matchmaking')
  handleMatchmaking(@ConnectedSocket() client: Socket) {
    this.gameService.handleMatchmaking(client, this.server);
  }

  @SubscribeMessage('cancelMatchmaking')
  handleCancelMatchmaking(@ConnectedSocket() client: Socket) {
    this.gameService.handleCancelMatchmaking(client);
  }

  @SubscribeMessage('JoinRoom')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    this.gameService.handleJoinRoom(client, data.roomName, this.server);
  }

  @SubscribeMessage('LeaveRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    this.gameService.leaveRoom(client, data.roomName, this.server);
  }

  @SubscribeMessage('move')
  handleMove(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    this.gameService.handleMove(client, data, this.server);
  }
}
