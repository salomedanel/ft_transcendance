import { Injectable, Req } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { Socket, Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { cp } from 'fs';

type Ball = {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  speed: number;
  radius: number;
};

type Game = {
  player1Position: number;
  player2Position: number;
  player1Score: number;
  player2Score: number;
  isPlaying: boolean;
  ball: Ball;
};

type Room = {
  name: string;
  player1: string;
  player2: string;
  game: Game;
};

@Injectable()
export class GameService {
  constructor(
    private scheduleRegistry: SchedulerRegistry,
    private prisma: PrismaService,
  ) {}
  playerNumber: number = 0;
  rooms: { [key: string]: Room } = {};
  queue: string[] = [];
  clients: { [key: string]: Socket } = {};

  async handleConnection(client: Socket) {
    if (client.handshake.auth.token === '') return;
    const user = await this.getUserName(client.handshake.auth.token);
    this.clients[user] = client;
  }

  async getUserName(token: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        accessToken: token,
      },
      select: { username: true },
    });
    return user.username;
  }

  handleDisconnect(client: Socket, server: Server) {
    const user = this.getUsernameFromId(client.id);
    if (user === undefined) return;
    if (this.queue.includes(user)) {
      this.queue.splice(this.queue.indexOf(user), 1);
    }
    for (const room in this.rooms) {
      if (
        this.rooms[room].player1 === user &&
        this.rooms[room].game.isPlaying === true
      )
        this.leaveRoom(client, this.rooms[room].name, server);
      else if (
        this.rooms[room].player2 === user &&
        this.rooms[room].game.isPlaying === true
      )
        this.leaveRoom(client, this.rooms[room].name, server);
    }
  }

  getUsernameFromId(id: string) {
    return Object.keys(this.clients).find((key) => this.clients[key].id === id);
  }

  leaveRoom(client: Socket, roomName: string, server: Server) {
    const room: Room = this.rooms[roomName];
    const user = this.getUsernameFromId(client.id);
    if (user === undefined) return;
    if (room !== undefined) {
      if (room.player1 === user) {
        room.player1 = '';
        if (room.game.isPlaying) {
          this.scheduleRegistry.deleteInterval(room.name);
          room.game.player1Score = 0;
          room.game.player2Score = 0;
          room.game.isPlaying = false;
          room.game.ball.speed = 0;
        }
        server.to(room.name).emit('playerLeft', {
          player: 1,
          score: [room.game.player1Score, room.game.player2Score],
        });
        delete this.rooms[room.name];
        server.emit('RoomDeleted', roomName);
        server.socketsLeave(room.name);
      } else if (room.player2 === user) {
        room.player2 = '';
        if (room.game.isPlaying) {
          this.scheduleRegistry.deleteInterval(room.name);
          room.game.player1Score = 0;
          room.game.player2Score = 0;
          room.game.isPlaying = false;
          room.game.ball.speed = 0;
        }
        server.to(room.name).emit('playerLeft', {
          player: 2,
          score: [room.game.player1Score, room.game.player2Score],
        });
        delete this.rooms[room.name];
        server.emit('RoomDeleted', roomName);
        server.socketsLeave(room.name);
      }
    }
  }

  handleMatchmaking(client: Socket, server: Server) {
    const user = this.getUsernameFromId(client.id);
    if (user === undefined) return;
    if (this.queue.includes(user)) return;
    this.queue.push(user);
    if (this.queue.length > 1) {
      const Player1 = this.queue[0];
      const Player2 = this.queue[1];
      this.queue.splice(0, 2);
      this.createRoom(Player1, Player2, server);
    }
  }

  async createRoom(Player1: string, Player2: string, server: Server) {
    const uniqueId = uuidv4();

    await this.prisma.game.create({
      data: {
        players: {
          connect: [{ username: Player1 }, { username: Player2 }],
        },
        score: [0, 0],
        playerName: Player1,
        roomName: uniqueId,
		winner: "none",
      },
    });

    const room: Room = {
      name: uniqueId,
      player1: Player1,
      player2: Player2,
      game: {
        player1Position: 0,
        player2Position: 0,
        player1Score: 0,
        player2Score: 0,
        isPlaying: false,
        ball: {
          x: 0.5,
          y: 0.5,
          velocityX: 0.001,
          velocityY: 0.001,
          speed: 0,
          radius: 0.015,
        },
      },
    };
    this.rooms[room.name] = room;
    server.emit('RoomCreated', room.name);
    server
      .to([this.clients[Player1].id, this.clients[Player2].id])
      .emit('matchFound', room.name);
  }

  handleCancelMatchmaking(client: Socket) {
    const user = this.getUsernameFromId(client.id);
    if (user === undefined) return;
    if (this.queue.includes(user)) {
      this.queue.splice(this.queue.indexOf(user), 1);
    }
    return;
  }

  handleJoinRoom(client: Socket, roomName: string, server: Server) {
    const user = this.getUsernameFromId(client.id);
    const room: Room = this.rooms[roomName];
    if (room !== undefined && user !== undefined) {
      if (room.player1 === user) {
        server
          .in(room.name)
          .fetchSockets()
          .then((sockets) => {
            for (let i = 0; i < sockets.length; i++) {
              if (
                this.clients[room.player2] !== undefined &&
                sockets[i].id === this.clients[room.player2].id
              )
                this.startGame(room.name, server);
            }
          });
        this.clients[user].join(room.name);
      } else if (room.player2 === user) {
        this.clients[user].join(room.name);
        server
          .in(room.name)
          .fetchSockets()
          .then((sockets) => {
            for (let i = 0; i < sockets.length; i++) {
              if (
                this.clients[room.player1] !== undefined &&
                sockets[i].id === this.clients[room.player1].id
              )
                this.startGame(room.name, server);
            }
          });
      }
    }
  }

  startGame(roomName: string, server: Server) {
    const room: Room = this.rooms[roomName];
    if (room !== undefined) {
      room.game.isPlaying = true;
      room.game.ball.speed = 10;
      server.to(room.name).emit('GameStarted', room.name);
      server.emit('NewGame', this.rooms);
      const interval = setInterval(() => {
        this.ballPosition(roomName, server);
      }, 1000 / 60);
      this.scheduleRegistry.addInterval(roomName, interval);
    }
  }

  ballPosition(roomName: string, server: Server) {
    const room: Room = this.rooms[roomName];
    if (room === undefined) return;
    const ball = room.game.ball;
    server.to(room.name).emit('GetBallPosition', ball);
    if (
      ball.x - ball.radius <= 0.02 &&
      ball.y >= this.rooms[roomName].game.player2Position &&
      ball.y <= this.rooms[roomName].game.player2Position + 0.2
    )
      ball.velocityX = -ball.velocityX;
    else if (
      ball.x + ball.radius >= 1 - 0.02 &&
      ball.y >= this.rooms[roomName].game.player1Position &&
      ball.y <= this.rooms[roomName].game.player1Position + 0.2
    )
      ball.velocityX = -ball.velocityX;
    else if (ball.x - ball.radius <= 0.02) {
      ball.x = 0.5;
      ball.y = 0.5;
      this.rooms[roomName].game.player1Score++;
      this.updateScore(roomName, 1, server);
    } else if (ball.x + ball.radius >= 1 - 0.02) {
      ball.x = 0.5;
      ball.y = 0.5;
      this.rooms[roomName].game.player2Score++;
      this.updateScore(roomName, 2, server);
    } else if (ball.y - ball.radius < 0) ball.velocityY = -ball.velocityY;
    else if (ball.y + ball.radius >= 1) ball.velocityY = -ball.velocityY;
    ball.x += ball.velocityX * ball.speed;
    ball.y += ball.velocityY * ball.speed;
    if (this.rooms[roomName] !== undefined)
      this.rooms[roomName].game.ball = ball;
  }

  updateScore(roomName: string, player: number, server: Server) {
    if (this.rooms[roomName] === undefined) return;
    server.to(roomName).emit('UpdateScore', {
      score: [
        this.rooms[roomName].game.player1Score,
        this.rooms[roomName].game.player2Score,
      ],
    });
    if (
      this.rooms[roomName].game.player1Score === 5 ||
      this.rooms[roomName].game.player2Score === 5
    ) {
      this.endGame(roomName, server);
    }
  }

  endGame(roomName: string, server: Server) {
    const scoreArray = [
      this.rooms[roomName].game.player1Score,
      this.rooms[roomName].game.player2Score,
    ];
	const winner = this.rooms[roomName].game.player1Score > this.rooms[roomName].game.player2Score ? this.rooms[roomName].player1 : this.rooms[roomName].player2;
    this.prisma.game
      .update({
        where: {
          roomName: roomName,
        },
        data: {
          score: scoreArray,
		  winner: winner
        },
      })
      .then(() => {
        this.scheduleRegistry.deleteInterval(roomName);
        if (
          this.rooms[roomName].game.player1Score >
          this.rooms[roomName].game.player2Score
        )
          server
            .to(roomName)
            .emit('GameEnded', { score: scoreArray, winner: 1 });
        else
          server
            .to(roomName)
            .emit('GameEnded', { score: scoreArray, winner: 2 });
        server.emit('RoomDeleted', roomName);
        this.rooms[roomName].game.ball.speed = 0;
        this.rooms[roomName].game.isPlaying = false;
        delete this.rooms[roomName];
        server.socketsLeave(roomName);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  handleMove(client: Socket, data: any, server: Server) {
    const user = this.getUsernameFromId(client.id);
    if (user === undefined) return;
    if (this.rooms[data.idGame] !== undefined) {
      if (data.player == 1 && this.rooms[data.idGame].player1 === user)
        this.rooms[data.idGame].game.player1Position = data.position;
      else if (data.player == 2 && this.rooms[data.idGame].player2 === user)
        this.rooms[data.idGame].game.player2Position = data.position;
    }
    server.to(data.idGame.toString()).except(client.id).emit('UpdatePostion', {
      playerRole: data.player,
      position: data.position,
    });
  }

  getRooms(): { [key: string]: Room } {
    return this.rooms;
  }

  getPlayers(): number {
    return this.playerNumber;
  }

  async getRoomPlayer(@Req() req: Request, roomName: string) {
    const user = await this.getUserName(req.headers.authorization);
    const room: Room = this.rooms[roomName];
    if (room !== undefined) {
      if (room.player1 === user) return 1;
      else if (room.player2 === user) return 2;
	  else return 3;
    }
    return 0;
  }

  async createFriendsRoom(Player1: string, Player2: string) {
    const uniqueId = uuidv4();

    await this.prisma.game.create({
      data: {
        players: {
          connect: [{ username: Player1 }, { username: Player2 }],
        },
        score: [0, 0],
        playerName: Player1,
        roomName: uniqueId,
		winner: "none",
      },
    });

    const room: Room = {
      name: uniqueId,
      player1: Player1,
      player2: Player2,
      game: {
        player1Position: 0,
        player2Position: 0,
        player1Score: 0,
        player2Score: 0,
        isPlaying: false,
        ball: {
          x: 0.5,
          y: 0.5,
          velocityX: 0.001,
          velocityY: 0.001,
          speed: 0,
          radius: 0.015,
        },
      },
    };
    this.rooms[room.name] = room;
    return room;
  }
}
