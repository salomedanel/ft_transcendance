import { Injectable, Req } from '@nestjs/common';
import { Status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Request } from 'express';
import { FriendsDto } from './dto/friends.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async setOnline(@Req() req: Request) {
    const status = Status.ONLINE;

    const existingUser = await this.prisma.user.findUnique({
      where: { accessToken: req.headers.authorization },
    });

    if (existingUser) {
      await this.prisma.user.update({
        where: { accessToken: req.headers.authorization },
        data: { status },
      });

      return { message: 'User status is Online!' };
    } else {
      return { message: 'User not found.' };
    }
  }

  async setOffline(@Req() req: Request) {
    const status = Status.OFFLINE;
    await this.prisma.user.update({
      where: { accessToken: req.headers.authorization },
      data: { status },
    });
    return { message: 'User status is Offline!' };
  }

  async setPlaying(@Req() req: Request) {
    const status = Status.PLAYING;
    await this.prisma.user.update({
      where: { accessToken: req.headers.authorization },
      data: { status },
    });
    return { message: 'User status is Playing!' };
  }

  async getUsername(@Req() req: Request) {
    return this.prisma.user.findUnique({
      where: { accessToken: req.headers.authorization },
      select: { username: true },
    });
  }

  async setUsername(@Req() req: Request) {
    const existingUser = await this.prisma.user.findUnique({
      where: { accessToken: req.headers.authorization },
    });
  
    if (existingUser && existingUser.avatarUrl.startsWith(`${process.env.BACKEND_URL}/files/`)) {
      return this.prisma.user.update({
        where: { accessToken: req.headers.authorization },
        data: {
          username: req.body.username,
          avatarUrl: `${process.env.BACKEND_URL}/files/` + req.body.username,
        },
      });
    } else {
      return this.prisma.user.update({
        where: { accessToken: req.headers.authorization },
        data: { username: req.body.username },
      });
    }
  }

  async checkUsernameExists(username: string): Promise<boolean> {
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });

    return !!existingUser;
  }

  async getMyId(@Req() req: Request) {
    return this.prisma.user.findUnique({
      where: { accessToken: req.headers.authorization },
      select: { id: true },
    });
  }

  async getUserById(@Req() req: Request) {
    const { id } = req.params;
    return this.prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        username: true,
        avatarUrl: true,
        status: true,
        friends: true,
        blockedUser: true,
      },
    });
  }

  async getMyAvatar(@Req() req: Request) {
    const username = Array.isArray(req.headers.username)
      ? req.headers.username[0]
      : req.headers.username;
    if (!username) return { error: 'Username not found.' };

    return this.prisma.user.findUnique({
      where: { username: username },
      select: { avatarUrl: true },
    });
  }

  async setMyAvatar(@Req() req: Request) {
    await this.prisma.user.update({
      where: { accessToken: req.body.token },
      data: {
        avatarUrl: `${process.env.BACKEND_URL}` + '/files/' + req.body.username,
      },
    });
    console.log(req.body.username);
    return { message: 'Avatar set!' };
  }

  async addFriend(data: FriendsDto) {
    const { username, token } = data;
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    const friend = await this.prisma.user.findUnique({
      where: { accessToken: token },
      select: { friends: true },
    });
    if (!user || !friend) return { error: 'User or friend not found.' };
    friend.friends.push(user.id);
    await this.prisma.user.update({
      where: { accessToken: token },
      data: {
        friends: { set: friend.friends },
      },
    });
    return { message: 'Friend added!', value: true };
  }

  async removeFriend(data: FriendsDto) {
    const { username, token } = data;
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    const friend = await this.prisma.user.findUnique({
      where: { accessToken: token },
      select: { friends: true },
    });
    if (!user || !friend) return { error: 'User or friend not found.' };
    const index = friend.friends.indexOf(user.id);
    if (index > -1) friend.friends.splice(index, 1);
    await this.prisma.user.update({
      where: { accessToken: token },
      data: {
        friends: { set: friend.friends },
      },
    });
    return { message: 'Friend removed!', value: true };
  }

  async getFriendStatus(@Req() req: Request) {
    const user = await this.prisma.user.findUnique({
      where: { accessToken: req.headers.authorization },
      select: { friends: true },
    });
    return {
      value: user.friends.includes(parseInt(req.headers.id as string, 10)),
    };
  }

  async blockUser(data: FriendsDto) {
    const { username, token } = data;
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    const block = await this.prisma.user.findUnique({
      where: { accessToken: token },
      select: { blockedUser: true },
    });
    if (!user || !block) return { error: 'User or friend not found.' };
    block.blockedUser.push(user.id);
    await this.prisma.user.update({
      where: { accessToken: token },
      data: {
        blockedUser: { set: block.blockedUser },
      },
    });
    return { message: 'User blocked!', value: true };
  }

  async unblockUser(data: FriendsDto) {
    const { username, token } = data;
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    const block = await this.prisma.user.findUnique({
      where: { accessToken: token },
      select: { blockedUser: true },
    });
    if (!user || !block) return { error: 'User or friend not found.' };
    const index = block.blockedUser.indexOf(user.id);
    if (index > -1) block.blockedUser.splice(index, 1);
    await this.prisma.user.update({
      where: { accessToken: token },
      data: {
        blockedUser: { set: block.blockedUser },
      },
    });
    return { message: 'User unblocked!', value: true };
  }

  async getBlockedUserStatus(@Req() req: Request) {
    const user = await this.prisma.user.findUnique({
      where: { accessToken: req.headers.authorization },
      select: { blockedUser: true },
    });
    return {
      value: user.blockedUser.includes(parseInt(req.headers.id as string, 10)),
    };
  }

  async getFriendsList(@Req() req: Request) {
    const user = await this.prisma.user.findUnique({
      where: { accessToken: req.headers.authorization },
      select: { friends: true },
    });
    return user.friends;
  }

  async getUserStatus(@Req() req: Request) {
    const user = await this.prisma.user.findUnique({
      where: { accessToken: req.headers.authorization },
      select: { status: true },
    });
    return user.status;
  }

  async getUserByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async whoIsTheUser(@Req() req: Request) {
    const username = Array.isArray(req.headers.username)
      ? req.headers.username[0]
      : req.headers.username;

    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    const loggedUser = await this.prisma.user.findUnique({
      where: { accessToken: req.headers.authorization },
    });

    if (user.username === loggedUser.username) {
      return { value: true, loggedUser: true };
    } else if (user) return { value: true, loggedUser: false };
    else return { value: false, loggedUser: false };
  }

  async getUserIdByUsername(@Req() req: Request) {
    const username = Array.isArray(req.headers.username)
      ? req.headers.username[0]
      : req.headers.username;

    return this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
  }

  async getFriendsByUsername(@Req() req: Request) {
    const username = Array.isArray(req.headers.username)
      ? req.headers.username[0]
      : req.headers.username;

    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    const friendIds = user.friends;

    const friendsDetails = await this.prisma.user.findMany({
      where: {
        id: {
          in: friendIds,
        },
      },
      select: {
        username: true,
        status: true,
        avatarUrl: true,
      },
    });

    const friendsArray = friendsDetails.map((friend) => ({
      username: friend.username,
      status: friend.status,
      avatar: friend.avatarUrl,
    }));

    return friendsArray;
  }

  async getMyAchievements(@Req() req: Request) {
    const username = Array.isArray(req.headers.username)
      ? req.headers.username[0]
      : req.headers.username;

    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        games: true,
        friends: true,
      },
    });

    const games = await this.prisma.game.findMany({
      where: {
        players: {
          some: {
            id: user.id,
          },
        },
      },
      include: {
        players: true,
      },
    });

    const hasPlayed = user.games.length > 0;
    let hasWon = false;

    games.forEach((game) => {
      if (game.playerName === username && game.score[0] > game.score[1])
        hasWon = true;
      else if (game.playerName !== username && game.score[1] > game.score[0])
        hasWon = true;
    });

    const hasFriend = user.friends.length > 0;

    return {
      hasPlayed,
      hasWon,
      hasFriend,
    };
  }

  async getMyHistory(@Req() req: Request) {
    const username = Array.isArray(req.headers.username)
      ? req.headers.username[0]
      : req.headers.username;

    const games = await this.prisma.game.findMany({
      where: {
        players: {
          some: {
            username: username,
          },
        },
      },
      select: {
        players: true,
        playerName: true,
        score: true,
        createdAt: true,
		winner: true,
      },
    });

    return games.map((game) => {
      const sortedPlayers = game.players.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
      const player1 = game.players[0].username;
      const player2 = game.players[1].username;
      const player = game.playerName;

      return {
        player1,
        player2,
        player,
        score: game.score,
        date: game.createdAt,
		winner: game.winner,
      };
    });
  }
}
