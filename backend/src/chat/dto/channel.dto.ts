import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsNumber,
} from 'class-validator';

type Tag = {
  id: number;
  name: string;
};

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @IsBoolean()
  @IsOptional()
  isPasswordProtected?: boolean;

  @IsString()
  @IsOptional()
  password?: string;

  @IsArray()
  @IsOptional()
  members?: Array<Tag>;
}

export class MessageDto {
  @IsNumber()
  @IsNotEmpty()
  chanId: number;

  @IsString()
  @IsNotEmpty()
  public message: string = '';
}

export class JoinChannelDto {
  @IsNumber()
  @IsNotEmpty()
  chanId?: number;

  @IsString()
  @IsOptional()
  password?: string;
}

export enum JoinChannelResult {
  CurrentUserJoined = 'current user joined',
  ChannelNotFound = 'Channel not found',
  ChannelIsPrivate = 'Channel is private',
  UserIsBanned = 'User is banned',
  PasswordIncorrect = 'Password is incorrect',
  NewUserJoined = 'new user joined',
}

export class QuitChannelDto {
  @IsNumber()
  chanId?: number;
}

export class IsAdminDto {
  @IsNotEmpty()
  @IsString()
  public username: string;

  @IsNotEmpty()
  @IsNumber()
  public chanId: number;
}

export class ModerateDto {
  @IsNumber()
  chanId?: number;

  @IsString()
  username?: string;
}

export class EditChannelDto {
  @IsNumber()
  chanId?: number;

  @IsString()
  username?: string;

  @IsBoolean()
  @IsOptional()
  isPasswordProtected?: boolean;

  @IsString()
  @IsOptional()
  password?: string;
}

export enum UpdateChannelResult {
  PasswordNotProvided = 'Need a password to update',
  UserIsNotAdmin = 'Not an admin',
  ChannelUpdated = 'Channel updated',
}

export class PlayDto {
  @IsNumber()
  chanId?: number;
}
