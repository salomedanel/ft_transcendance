import { UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { PrismaClient } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { UserService } from 'src/user/user.service';
import { ChatService } from './chat.service';
import {
  CreateChannelDto,
  EditChannelDto,
  IsAdminDto,
  JoinChannelDto,
  JoinChannelResult,
  MessageDto,
  ModerateDto,
  PlayDto,
  QuitChannelDto,
  UpdateChannelResult,
} from './dto/channel.dto';

interface User {
  id: number;
  username: string;
}
@UsePipes(new ValidationPipe())
@WebSocketGateway({
  cors: {
    origin: `${process.env.CHAT_URL}`,
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;
  clients: { [key: string]: User } = {};

  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaClient,
    private readonly userService: UserService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { accessToken: client.handshake.auth.token },
        select: {
          id: true,
          username: true,
        },
      });
      this.clients[client.id] = user;
    } catch (error) {
      console.log(error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    delete this.clients[client.id];
  }

  @SubscribeMessage('create channel')
  async createChannel(
    @MessageBody() data: CreateChannelDto,
    @ConnectedSocket() client: Socket,
  ) {
    const chat = await this.chatService.newChannel(
      data,
      this.clients[client.id].username,
    );
    if (!chat.isPrivate)
      this.server.emit('Channel Created', {
        name: data.name,
        id: chat.id,
        clientId: client.id,
      });
    else
      this.server.to(client.id).emit('Channel Created', {
        name: data.name,
        id: chat.id,
        clientId: client.id,
      });
  }

  @SubscribeMessage('Send Message')
  async sendMessage(
    @MessageBody() data: MessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const chat = await this.chatService.newMessage(
      data,
      this.clients[client.id].id,
    );
    const excludeUser = await this.chatService.getExcludedUser(
      data.chanId,
      this.clients[client.id].id,
    );
    const excluded = await this.server
      .in(data.chanId.toString())
      .fetchSockets()
      .then((sockets) => {
        const excludedUserSocket = [];
        sockets.forEach((socket) => {
          if (
            excludeUser.some(
              (user) => user.username === this.clients[socket.id].username,
            )
          )
            excludedUserSocket.push(socket.id);
        });
        return excludedUserSocket;
      });
    if (!chat) return { error: 'error' };
    this.server
      .to(data.chanId.toString())
      .except(excluded)
      .emit('NewMessage', chat);
  }

  @SubscribeMessage('Join New Channel')
  async joinNewChannel(
    @MessageBody() data: JoinChannelDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (this.clients[client.id] === undefined) {
      this.server.to(client.id).emit('error', 'Invalid Token');
      return;
    }
    const user = await this.userService.getUserByUsername(
      this.clients[client.id].username,
    );
    const ret = await this.chatService.joinChannel(data, user);
    if (
      ret === JoinChannelResult.CurrentUserJoined ||
      ret === JoinChannelResult.NewUserJoined
    ) {
      client.join(data.chanId.toString());
      if (ret === JoinChannelResult.NewUserJoined)
        client.to(data.chanId.toString()).emit('NewUserJoin', {
          username: user.username,
          id: user.id,
          status: user.status,
          avatarUrl: user.avatarUrl,
        });
      this.server.to(client.id).emit('Joined', { chanId: data.chanId });
    } else if (ret === JoinChannelResult.ChannelNotFound)
      this.server.to(client.id).emit('error', 'Channel Not Found');
    else if (ret === JoinChannelResult.ChannelIsPrivate)
      this.server.to(client.id).emit('error', 'Channel Is Private');
    else if (ret === JoinChannelResult.UserIsBanned)
      this.server.to(client.id).emit('error', 'User Is Banned');
    else if (ret === JoinChannelResult.PasswordIncorrect)
      this.server.to(client.id).emit('error', 'Password Incorrect');
  }

  @SubscribeMessage('Join Channel')
  async joinChannel(
    @MessageBody() data: number,
    @ConnectedSocket() client: Socket,
  ) {
    if (this.clients[client.id] === undefined) {
      return;
    }
    const user = await this.userService.getUserByUsername(
      this.clients[client.id].username,
    );
    const userIsInChannel = await this.chatService.userIsInChannel(
      user.accessToken,
      data,
    );
    if (userIsInChannel) {
      client.join(data.toString());
    } else this.server.to(client.id).emit('error', 'WTF Not In Channel');
  }

  @SubscribeMessage('Leave Channel')
  async leaveChannel(
    @MessageBody() data: QuitChannelDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (this.clients[client.id] === undefined) {
      return;
    }
    const isDirectMessage = await this.chatService.isDirectMessage(data.chanId);
    if (isDirectMessage) {
      this.server.to(client.id).emit('Quit Direct Message');
      return;
    }
    await this.chatService.quitChannel(
      this.clients[client.id].username,
      data.chanId,
    );
    client.leave(data.chanId.toString());
    this.server.to(client.id).emit('Quit Channel', { chanId: data.chanId });
    this.server
      .to(data.chanId.toString())
      .emit('User Left', { username: this.clients[client.id].username });
  }

  @SubscribeMessage('Is Admin')
  async isAdmin(
    @MessageBody() data: IsAdminDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (this.clients[client.id] === undefined) return;
    const isAdmin = await this.chatService.isAdmin(
      this.clients[client.id].username,
      data.chanId,
    );
    if (isAdmin)
      this.server.to(client.id).emit('IsAdmin', { isAdmin: isAdmin });
    else this.server.to(client.id).emit('error', 'User Is Not Admin');
  }

  @SubscribeMessage('Invite User')
  async inviteUser(
    @MessageBody() data: ModerateDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (this.clients[client.id] === undefined) return;
    const isAdmin = await this.chatService.isAdmin(
      this.clients[client.id].username,
      data.chanId,
    );
    if (!isAdmin) return;
    await this.chatService.inviteUser(data.username, data.chanId);
    for (const clientToInvite in this.clients) {
      if (this.clients[clientToInvite].username === data.username) {
        const channel = await this.chatService.getChannelById(data.chanId);
        this.server
          .to(clientToInvite)
          .emit('Invited', { chanId: data.chanId, channelName: channel.name });
        return;
      }
    }
  }

  @SubscribeMessage('Ban User')
  async banUser(
    @MessageBody() data: ModerateDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (this.clients[client.id] === undefined) return;
    const isAdmin = await this.chatService.isAdmin(
      this.clients[client.id].username,
      data.chanId,
    );
    if (!isAdmin) return;
    await this.chatService.banUser(data.username, data.chanId);
    for (const clientToBan in this.clients) {
      if (this.clients[clientToBan].username === data.username) {
        this.server.fetchSockets().then((sockets) => {
          sockets
            .find((socket) => socket.id === clientToBan)
            .leave(data.chanId.toString());
        });
        this.server.to(clientToBan).emit('Banned', { chanId: data.chanId });
        break;
      }
    }
    this.server
      .to(data.chanId.toString())
      .emit('User Banned', { username: data.username });
  }

  @SubscribeMessage('Unban User')
  async unbanUser(
    @MessageBody() data: ModerateDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (this.clients[client.id] === undefined) return;
    const isAdmin = await this.chatService.isAdmin(
      this.clients[client.id].username,
      data.chanId,
    );
    if (!isAdmin) return;
    await this.chatService.unbanUser(data.username, data.chanId);
    for (const clientToUnban in this.clients) {
      if (this.clients[clientToUnban].username === data.username) {
        this.server.to(clientToUnban).emit('Unbanned', { chanId: data.chanId });
        break;
      }
    }
    this.server
      .to(data.chanId.toString())
      .emit('User Unbanned', { username: data.username });
  }

  @SubscribeMessage('Kick User')
  async kickUser(
    @MessageBody() data: ModerateDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (this.clients[client.id] === undefined) return;
    const isAdmin = await this.chatService.isAdmin(
      this.clients[client.id].username,
      data.chanId,
    );
    if (!isAdmin) return;
    await this.chatService.kickUser(data.username, data.chanId);
    for (const clientToKick in this.clients) {
      if (this.clients[clientToKick].username === data.username) {
        this.server.fetchSockets().then((sockets) => {
          sockets
            .find((socket) => socket.id === clientToKick)
            .leave(data.chanId.toString());
        });
        this.server.to(clientToKick).emit('Kicked', { chanId: data.chanId });
        break;
      }
    }
    this.server
      .to(data.chanId.toString())
      .emit('User Kicked', { username: data.username });
  }

  @SubscribeMessage('Mute User')
  async muteUser(
    @MessageBody() data: ModerateDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (this.clients[client.id] === undefined) return;
    const isAdmin = await this.chatService.isAdmin(
      this.clients[client.id].username,
      data.chanId,
    );
    if (!isAdmin) return;
    await this.chatService.muteUser(data.username, data.chanId);
    this.server
      .to(data.chanId.toString())
      .emit('User Muted', { username: data.username });
  }

  @SubscribeMessage('Unmute User')
  async unmuteUser(
    @MessageBody() data: ModerateDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (this.clients[client.id] === undefined) return;
    const isAdmin = await this.chatService.isAdmin(
      this.clients[client.id].username,
      data.chanId,
    );
    if (!isAdmin) return;
    await this.chatService.unmuteUser(data.username, data.chanId);
    this.server
      .to(data.chanId.toString())
      .emit('User Unmuted', { username: data.username });
  }

  @SubscribeMessage('Create Direct Message')
  async createDirectMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const channel = await this.chatService.createDirectMessage(
      this.clients[client.id].username,
      data.username,
    );
    for (const clientToInvite in this.clients) {
      if (this.clients[clientToInvite].username === data.username) {
        this.server.to(clientToInvite).emit('DM Created', {
          channelName: this.clients[client.id].username,
          id: channel.id,
        });
      }
    }
    this.server.to(client.id).emit('DM Created', {
      channelName: data.username,
      id: channel.id,
    });
    return;
  }

  @SubscribeMessage('Set Admin')
  async setAdmin(
    @MessageBody() data: ModerateDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (this.clients[client.id] === undefined) return;
    const isAdmin = await this.chatService.isAdmin(
      this.clients[client.id].username,
      data.chanId,
    );
    if (!isAdmin) return;
    await this.chatService.setAdmin(data.username, data.chanId);
    this.server
      .to(data.chanId.toString())
      .emit('User Set Admin', { username: data.username });
  }

  @SubscribeMessage('Update Channel')
  async updateChannel(
    @MessageBody() data: EditChannelDto,
    @ConnectedSocket() client: Socket,
  ) {
    const res = await this.chatService.updateChannel(data);
    if (res === UpdateChannelResult.PasswordNotProvided)
      client.broadcast.emit(UpdateChannelResult.PasswordNotProvided, data);
    else if (res === UpdateChannelResult.UserIsNotAdmin)
      client.broadcast.emit(UpdateChannelResult.UserIsNotAdmin, data);
    else client.broadcast.emit(UpdateChannelResult.ChannelUpdated, data);
  }

  @SubscribeMessage('play')
  async playWithFriends(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: PlayDto,
  ) {
    const room = await this.chatService.playWithFriends(
      client,
      this.clients[client.id].username,
      data.chanId,
    );
    setTimeout(async () => {
      this.server.to(client.id).emit('NewParty', room.name);
      const msg = await this.chatService.newMessage(
        {
          chanId: data.chanId,
          message: `Link to play with me:\n ${process.env.FRONTEND_URL}/PongGame/${room.name}`,
        },
        this.clients[client.id].id,
      );
      this.server.to(data.chanId.toString()).emit('NewMessage', msg);
    }, 2000);
  }
}
