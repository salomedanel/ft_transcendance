import { IsNotEmpty, IsString } from 'class-validator';

export class FriendsDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}
