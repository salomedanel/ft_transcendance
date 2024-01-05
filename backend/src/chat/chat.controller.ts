import { Controller, Get, Logger, Param, Req, Res } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ChatService } from './chat.service';
import { UserService } from 'src/user/user.service';
import { Request, Response } from 'express';

@Controller('chat')
export class ChatController {
  private readonly _logger: Logger;
  private readonly _prisma: PrismaClient;

  constructor(
    private chatService: ChatService,
    private userService: UserService,
  ) {
    this.chatService = chatService;
    this.userService = userService;
    this._logger = new Logger(ChatController.name);
  }

  @Get('/channels')
  async getChannels(@Req() req: Request) {
    const directMessages = await this.chatService.getDirectMessages(
      req.headers.authorization,
    );
    const channels = await this.chatService.getChannelsUserIn(
      req.headers.authorization,
    );
    const channelsToJoin = await this.chatService.getChannelsToJoin(
      req.headers.authorization,
    );
    const myDMs = [];
    directMessages.forEach((dm) => {
      myDMs.push({ id: dm.id, name: dm.members[0].username });
    });
    return {
      myDMS: myDMs,
      mychannels: channels,
      channelsToJoin: channelsToJoin,
    };
  }

  @Get('/channels/:id/name')
  async getChannelName(@Param('id') id: string) {
    const channelName = await this.chatService.getChannelName(parseInt(id));
    return channelName;
  }

  @Get('/channels/:id/isprotected')
  async getChannelIsProtected(@Req() req: Request, @Param('id') id: string) {
    const password = await this.chatService.getChannelIsProtected(parseInt(id));
    const user = await this.chatService.getUserFromToken(
      req.headers.authorization,
      parseInt(id),
    );
    if (user) return false;
    if (
      password.password == '' ||
      password.password == null ||
      password.password == undefined
    )
      return false;
    return true;
  }

  @Get('/channels/:id/isadmin')
  async getChannelIsAdmin(@Req() req: Request, @Param('id') id: string) {
    const user = await this.chatService.getUsername(req.headers.authorization);
    const idChan = parseInt(id);
    const users = await this.chatService.getUsersInChannel(idChan);

    if (user === null || users.length == 0) return false;
    if (users[0].admins.find((admin) => admin.username === user.username))
      return true;
    return false;
  }

  @Get('/channels/users/:id')
  async getUsersInChannel(@Req() req: Request, @Param('id') id: string) {
    const idChan = parseInt(id);
    const users = await this.chatService.getUsersInChannel(idChan);
    const user = await this.chatService.getUsername(req.headers.authorization);
    if (user === null || users.length == 0) return { status: 'none' };
    if (users[0].admins.find((admin) => admin.username === user.username))
      return {
        status: 'admin',
        isDM: users[0].isDM,
        admins: users[0].admins,
        members: users[0].members,
        muted: users[0].muted,
        banned: users[0].banned,
      };
    if (
      users[0].members.find((member) => member.username === user.username) ||
      users[0].muted.find((mute) => mute.username === user.username)
    )
      return {
        status: 'member',
        isDM: users[0].isDM,
        admins: users[0].admins,
        members: users[0].members,
        muted: users[0].muted,
        banned: users[0].banned,
      };
    return { status: 'none' };
  }

  @Get('/channels/:id/messages')
  async getMessages(
    @Req() req: Request,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const idChan = parseInt(id);
    const isInChannel = await this.chatService.getUserFromToken(
      req.headers.authorization,
      idChan,
    );
    const blockedUser = await this.chatService.getUserBlocked(
      req.headers.authorization,
    );
    if (isInChannel) {
      const messages = await this.chatService.getMessages(idChan, blockedUser);
      return res.status(200).json(messages[0].messages);
    }
    return res.status(403).json({ message: 'You are not in this channel' });
  }

  @Get('/channels/:id/invites')
  async getInvites(@Req() req: Request, @Param('id') id: string) {
    const idChan = parseInt(id);
    const invited = await this.chatService.getInvites(
      req.headers.authorization,
      idChan,
    );
    return invited.filter((invite) => invite !== undefined);
  }

  @Get('/Dm/users')
  async getDmUsers(@Req() req: Request) {
    const users = await this.chatService.getDmUsers(req.headers.authorization);
    return users;
  }
}
