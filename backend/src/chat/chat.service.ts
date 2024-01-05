import { Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import {
  CreateChannelDto,
  EditChannelDto,
  JoinChannelDto,
  JoinChannelResult,
  MessageDto,
  UpdateChannelResult,
} from './dto/channel.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';
import { Socket } from 'socket.io';
import { GameService } from 'src/game/game.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly gameservice: GameService,
  ) {}

  async newChannel(info: CreateChannelDto, username: string) {
    let hash = null;
    info.isPasswordProtected = false;
    if (
      info.password != null &&
      info.password != undefined &&
      info.password != ''
    ) {
      const salt = await bcrypt.genSalt();
      hash = await bcrypt.hash(info.password, salt);
      info.isPasswordProtected = true;
    }
    if (info.isPrivate == null || info.isPrivate == undefined) {
      info.isPrivate = false;
    }
    //const user = await this.userService.getUserByUsername(username);
    const channel = await this.prisma.channel.create({
      data: {
        name: info.name,
        password: hash,
        isPrivate: info.isPrivate,
        isPasswordProtected: info.isPasswordProtected,
        owners: {
          connect: {
            username: username,
          },
        },
        admins: {
          connect: {
            username: username,
          },
        },
        members: {
          connect: {
            username: username,
          },
        },
      },
    });
    return channel;
  }

  async newMessage(info: MessageDto, id: number) {
    const chanId = info.chanId;
    const user = await this.prisma.user.findUnique({
      where: { id: id },
    });
    const isInChannel = await this.userIsInChannel(user.accessToken, chanId);
    const isMuted = await this.userIsMuted(user.accessToken, chanId);
    if (!isInChannel || isMuted) return null;
    const message = await this.prisma.message.create({
      data: {
        owner: {
          connect: {
            id: user.id,
          },
        },
        channel: {
          connect: {
            id: info.chanId,
          },
        },
        message: info.message,
      },
      select: {
        id: true,
        owner: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
        createdAt: true,
        message: true,
        ownerId: true,
        channelId: true,
      },
    });
    return message;
  }

  async userIsInChannel(token: string, chanId: number) {
    const user = await this.prisma.user.findUnique({
      where: { accessToken: token },
      select: { members: true },
    });
    return user.members.some((member) => member.id === chanId);
  }

  async userIsMuted(token: string, chanId: number) {
    const user = await this.prisma.user.findUnique({
      where: { accessToken: token },
      select: { muted: true },
    });
    return user.muted.some((muted) => muted.id === chanId);
  }

  async getExcludedUser(chanId: number, userId: number) {
    const users = await this.prisma.user.findMany({
      where: {
        blockedUser: {
          has: userId,
        },
        OR: [
          { owners: { some: { id: chanId } } },
          { admins: { some: { id: chanId } } },
          { members: { some: { id: chanId } } },
          { muted: { some: { id: chanId } } },
        ],
      },
      select: {
        username: true,
      },
    });
    return users;
  }

  async joinChannel(
    data: JoinChannelDto,
    user: User,
  ): Promise<JoinChannelResult> {
    const isInChannel = await this.userIsInChannel(
      user.accessToken,
      data.chanId,
    );
    if (isInChannel) return JoinChannelResult.CurrentUserJoined;
    const channel = await this.prisma.channel.findUnique({
      where: { id: data.chanId },
      select: {
        isPrivate: true,
        isPasswordProtected: true,
        password: true,
        banned: true,
        invited: true,
      },
    });
    if (channel === null) return JoinChannelResult.ChannelNotFound;
    const isBanned = channel.banned.find(
      (banned) => banned.username === user.username,
    );
    const isInvited = channel.invited.find(
      (invited) => invited.username === user.username,
    );
    const isPrivate = channel.isPrivate;
    if (isPrivate || isBanned) {
      if (isPrivate && !isInvited) return JoinChannelResult.ChannelIsPrivate;
      else if (isBanned) return JoinChannelResult.UserIsBanned;
    } else if (
      channel.password !== '' &&
      channel.password !== null &&
      channel.password !== undefined
    ) {
      const isPasswordCorrect = await bcrypt.compare(
        data.password,
        channel.password,
      );
      if (!isPasswordCorrect) return JoinChannelResult.PasswordIncorrect;
    }
    await this.prisma.channel.update({
      where: { id: data.chanId },
      data: {
        members: {
          connect: {
            username: user.username,
          },
        },
      },
    });
    if (isInvited) {
      await this.prisma.channel.update({
        where: { id: data.chanId },
        data: {
          invited: {
            disconnect: {
              username: user.username,
            },
          },
        },
      });
    }
    return JoinChannelResult.NewUserJoined;
  }

  async quitChannel(username: string, id: number) {
    const value = await this.prisma.channel.update({
      where: { id: id },
      data: {
        members: {
          disconnect: {
            username: username,
          },
        },
      },
    });
    console.log(value);
  }

  async isDirectMessage(chanId: number) {
    const value = await this.prisma.channel.findUnique({
      where: { id: chanId },
      select: { isDM: true },
    });
    return value.isDM;
  }

  async isAdmin(username: string, chanId: number) {
    const chan = await this.prisma.channel.findFirst({
      where: {
        id: chanId,
      },
      select: {
        admins: true,
      },
    });
    const isAdmin = chan.admins.find((admin) => admin.username === username);
    return isAdmin;
  }

  async inviteUser(username: string, chanId: number) {
    await this.prisma.channel.update({
      where: { id: chanId },
      data: {
        invited: {
          connect: {
            username: username,
          },
        },
      },
    });
  }

  async getChannelById(id: number) {
    try {
      const channel = await this.prisma.channel.findUnique({
        where: { id: id },
        select: {
          name: true,
        },
      });
      return channel;
    } catch (error) {
      console.log(error);
    }
  }

  async banUser(username: string, chanId: number) {
    await this.prisma.channel.update({
      where: { id: chanId },
      data: {
        admins: {
          disconnect: {
            username: username,
          },
        },
        members: {
          disconnect: {
            username: username,
          },
        },
        muted: {
          disconnect: {
            username: username,
          },
        },
        banned: {
          connect: {
            username: username,
          },
        },
      },
    });
  }

  async unbanUser(username: string, chanId: number) {
    await this.prisma.channel.update({
      where: { id: chanId },
      data: {
        banned: {
          disconnect: {
            username: username,
          },
        },
        members: {
          connect: {
            username: username,
          },
        },
      },
    });
  }

  async kickUser(username: string, chanId: number) {
    await this.prisma.channel.update({
      where: { id: chanId },
      data: {
        admins: {
          disconnect: {
            username: username,
          },
        },
        members: {
          disconnect: {
            username: username,
          },
        },
        muted: {
          disconnect: {
            username: username,
          },
        },
      },
    });
  }

  async muteUser(username: string, chanId: number) {
    await this.prisma.channel.update({
      where: { id: chanId },
      data: {
        muted: {
          connect: {
            username: username,
          },
        },
      },
    });
  }

  async unmuteUser(username: string, chanId: number) {
    await this.prisma.channel.update({
      where: { id: chanId },
      data: {
        muted: {
          disconnect: {
            username: username,
          },
        },
      },
    });
  }

  async createDirectMessage(username1: string, username2: string) {
    const channel = await this.prisma.channel.create({
      data: {
        name: username1 + ',' + username2,
        password: '',
        isPrivate: true,
        isDM: true,
        owners: {
          connect: [{ username: username1 }, { username: username2 }],
        },
        admins: {
          connect: [{ username: username1 }, { username: username2 }],
        },
        members: {
          connect: [{ username: username1 }, { username: username2 }],
        },
      },
    });
    return channel;
  }

  async setAdmin(username: string, chanId: number) {
    await this.prisma.channel.update({
      where: { id: chanId },
      data: {
        admins: {
          connect: {
            username: username,
          },
        },
      },
    });
  }

  async updateChannel(info: EditChannelDto) {
    const idchan = info.chanId;
    let hash = '';
    if (
      info.password != null &&
      info.password != undefined &&
      info.password != ''
    ) {
      const salt = await bcrypt.genSalt();
      hash = await bcrypt.hash(info.password, salt);
      info.isPasswordProtected = true;
    } else info.isPasswordProtected = false;
    if (await this.isAdmin(info.username, idchan)) {
      if (info.isPasswordProtected)
        if (!info.password) return UpdateChannelResult.PasswordNotProvided;
      if (hash == '') hash = null;
      await this.prisma.channel.update({
        where: { id: idchan },
        data: {
          isPasswordProtected: info.isPasswordProtected,
          password: hash,
        },
      });
      return UpdateChannelResult.ChannelUpdated;
    }
    return UpdateChannelResult.UserIsNotAdmin;
  }

  async getDirectMessages(token: string) {
    try {
      const source = await this.prisma.channel.findMany({
        where: {
          members: { some: { accessToken: token } },
          isDM: true,
        },
        select: {
          id: true,
          members: {
            where: {
              NOT: { accessToken: token },
            },
            select: { username: true },
          },
        },
      });
      return source;
    } catch (error) {
      console.log(error);
    }
  }

  async getChannelsUserIn(token: string) {
    try {
      const source = await this.prisma.channel.findMany({
        where: {
          members: { some: { accessToken: token } },
          isDM: false,
        },
        select: {
          id: true,
          name: true,
        },
      });
      return source;
    } catch (error) {
      console.log(error);
    }
  }

  async getChannelsToJoin(token: string) {
    try {
      const source = await this.prisma.channel.findMany({
        where: {
          OR: [
            {
              isPrivate: false,
            },
            { invited: { some: { accessToken: token } } },
          ],
          AND: {
            members: { none: { accessToken: token } },
            banned: { none: { accessToken: token } },
          },
        },
        select: {
          id: true,
          name: true,
        },
      });
      return source;
    } catch (error) {
      console.log(error);
    }
  }

  async getChannelName(id: number) {
    try {
      const source = await this.prisma.channel.findUnique({
        where: { id: id },
        select: {
          name: true,
        },
      });
      return source;
    } catch (error) {
      console.log(error);
    }
  }

  async getChannelIsProtected(id: number) {
    try {
      const source = await this.prisma.channel.findUnique({
        where: { id: id },
        select: {
          password: true,
          members: true,
        },
      });
      return source;
    } catch (error) {
      console.log(error);
    }
  }

  async getUserFromToken(token: string, id: number) {
    try {
      const source = await this.prisma.user.findUnique({
        where: { accessToken: token },
        select: {
          members: true,
        },
      });
      return source.members.some((member) => member.id === id);
    } catch (error) {
      console.log(error);
    }
  }

  async getUsername(token: string) {
    return this.prisma.user.findUnique({
      where: { accessToken: token },
      select: { username: true },
    });
  }

  async getUsersInChannel(id: number) {
    try {
      const source = await this.prisma.channel.findMany({
        where: { id: id },
        select: {
          isDM: true,
          admins: {
            select: { username: true, status: true, avatarUrl: true, id: true },
          },
          members: {
            where: {
              AND: {
                admins: { none: { id: id } },
                muted: { none: { id: id } },
              },
            },
            select: { username: true, status: true, avatarUrl: true, id: true },
          },
          muted: {
            select: { username: true, status: true, avatarUrl: true, id: true },
          },
          banned: {
            select: { username: true, status: true, avatarUrl: true, id: true },
          },
        },
      });
      return source;
    } catch (error) {
      console.log(error);
    }
  }

  async getUserBlocked(token: string) {
    const usersBlocker = await this.prisma.user.findUnique({
      where: { accessToken: token },
      select: { blockedUser: true },
    });
    return usersBlocker.blockedUser;
  }

  async getMessages(id: number, blockedUser: number[]) {
    try {
      const source = await this.prisma.channel.findMany({
        where: { id: id },
        select: {
          messages: {
            where: {
              ownerId: { notIn: blockedUser },
            },
            select: {
              id: true,
              createdAt: true,
              message: true,
              ownerId: true,
              channelId: true,
              owner: {
                select: {
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
      return source;
    } catch (error) {
      console.log(error);
    }
  }

  async getInvites(token: string, id: number) {
    const friends = await this.prisma.user.findUnique({
      where: { accessToken: token },
      select: { friends: true },
    });
    const userToInvite = friends.friends.map(async (idUser) => {
      const user = await this.prisma.user.findUnique({
        where: { id: idUser },
        select: {
          username: true,
          admins: {
            select: {
              id: true,
            },
          },
          members: {
            select: {
              id: true,
            },
          },
          muted: {
            select: {
              id: true,
            },
          },
          banned: {
            select: {
              id: true,
            },
          },
        },
      });
      if (
        user.admins.find((elem) => {
          return elem.id === id;
        }) === undefined &&
        user.members.find((elem) => {
          return elem.id === id;
        }) === undefined &&
        user.muted.find((elem) => {
          return elem.id === id;
        }) === undefined &&
        user.banned.find((elem) => {
          return elem.id === id;
        }) === undefined
      )
        return user.username;
      return;
    });
    return Promise.all(userToInvite);
  }

  async getDmUsers(token: string) {
    const usersAlreadyDM = await this.prisma.channel.findMany({
      where: {
        members: { some: { accessToken: token } },
        isDM: true,
      },
      select: {
        members: {
          where: {
            NOT: { accessToken: token },
          },
          select: { username: true },
        },
      },
    });
    const usernames = [];
    if (usersAlreadyDM.length > 0) {
      usersAlreadyDM[0].members.forEach((user) => {
        usernames.push(user.username);
      });
    }
    const users = await this.prisma.user.findMany({
      where: {
        AND: {
          username: { notIn: usernames },
        },
        NOT: { accessToken: token },
      },
      select: {
        username: true,
      },
    });
    const values = [];
    users.forEach((user) => {
      values.push(user.username);
    });
    return values;
  }

  async playWithFriends(client: Socket, username: string, chanId: number) {
    const users = await this.prisma.channel.findMany({
      where: {
        id: chanId,
        isDM: true,
      },
      select: {
        admins: {
          select: {
            username: true,
          },
        },
      },
    });
    if (
      users.length === 0 ||
      users[0].admins.length === 0 ||
      (users[0].admins[0].username !== username &&
        users[0].admins[1].username !== username)
    )
      return;
    const room = await this.gameservice.createFriendsRoom(
      users[0].admins[0].username,
      users[0].admins[1].username,
    );
    return room;
  }
}
