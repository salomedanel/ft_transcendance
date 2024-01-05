import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { Request } from 'express';
import { FriendsDto } from './dto/friends.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('me/status/online/set')
  async setOnline(@Req() req: Request) {
    return await this.userService.setOnline(req);
  }

  @Post('me/status/offline/set')
  async setOffline(@Req() req: Request) {
    return await this.userService.setOffline(req);
  }

  @Post('me/status/playing/set')
  async setPlaying(@Req() req: Request) {
    return await this.userService.setPlaying(req);
  }

  @Get('me/username')
  getUsername(@Req() req: Request) {
    return this.userService.getUsername(req);
  }

  @Patch('me/username')
  setUsername(@Req() req: Request) {
    return this.userService.setUsername(req);
  }

  @Post('checkusername')
  async checkUsernameExists(@Req() req): Promise<{ exists: boolean }> {
    const { username } = req.body;
    const exists = await this.userService.checkUsernameExists(username);
    return { exists };
  }

  @Get('me/id')
  getMyId(@Req() req: Request) {
    return this.userService.getMyId(req);
  }

  @Get('me/avatar')
  getMyAvatar(@Req() req: Request) {
    return this.userService.getMyAvatar(req);
  }

  @Patch('me/avatar')
  setMyAvatar(@Req() req: Request) {
    return this.userService.setMyAvatar(req);
  }

  @Get(':id')
  getUserById(@Req() req: Request) {
    return this.userService.getUserById(req);
  }

  @Patch('me/friends/add')
  addFriend(@Body() data: FriendsDto) {
    return this.userService.addFriend(data);
  }

  @Patch('me/friends/remove')
  removeFriend(@Body() data: FriendsDto) {
    return this.userService.removeFriend(data);
  }

  @Get('me/friends/status')
  getFriendStatus(@Req() req: Request) {
    return this.userService.getFriendStatus(req);
  }

  @Patch('me/user/block')
  blockUser(@Body() data: FriendsDto) {
    return this.userService.blockUser(data);
  }

  @Patch('me/user/unblock')
  unblockUser(@Body() data: FriendsDto) {
    return this.userService.unblockUser(data);
  }

  @Get('me/blocked/status')
  getBlockedUserStatus(@Req() req: Request) {
    return this.userService.getBlockedUserStatus(req);
  }

  @Get('me/friends/list')
  getFriendsList(@Req() req: Request) {
    return this.userService.getFriendsList(req);
  }

  @Get('user/status')
  getUserStatus(@Req() req: Request) {
    return this.userService.getUserStatus(req);
  }

  @Get('username/validation')
  async whoIsTheUser(@Req() req: Request) {
    return await this.userService.whoIsTheUser(req);
  }

  @Get('username/id')
  async getUserIdByUsername(@Req() req: Request) {
    return await this.userService.getUserIdByUsername(req);
  }

  @Get('username/friends')
  async getFriendsByUsername(@Req() req: Request) {
    return await this.userService.getFriendsByUsername(req);
  }

  @Get('me/achievements')
  async getMyAchievements(@Req() req: Request) {
    return await this.userService.getMyAchievements(req);
  }

  @Get('me/history')
  async getMyHistory(@Req() req: Request) {
    return await this.userService.getMyHistory(req);
  }
}
