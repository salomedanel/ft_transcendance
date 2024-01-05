import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Req,
  Res,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import axios from 'axios';
import { Response, Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { toDataURL } from 'qrcode';
import { authenticator } from 'otplib';

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
  ) {}

  async getToken(code: string) {
    try {
      const response = await fetch('https://api.intra.42.fr/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=authorization_code&client_id=${process.env.MY_AWESOME_UID}&client_secret=${process.env.MY_AWESOME_SECRET}&code=${code}&redirect_uri=${process.env.MY_AWESOME_URI}`,
      });
      const data = await response.json();
      if (!data) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Empty tokken',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      return data;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Error whilte getting the user with token',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getUser(token: string) {
    try {
      const response = await fetch('https://api.intra.42.fr/v2/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Empty user data',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      const data = await response.json();
      return data;
    } catch (error) {
      throw new ForbiddenException('invalid token');
    }
  }

  async makeCookies(@Res() res: Response, token: string) {
    res.cookie('token', token, {
      expires: new Date(new Date().getTime() + 60 * 24 * 10 * 1000), // expires in 10 days
      httpOnly: false,
    });
  }

  async getUserInDb(email: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { email: email },
      });
      return user;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Error while getting user in db',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async createUser(token: any, user: any) {
    try {
      const newUser = await this.prisma.user.create({
        data: {
          email: user.email,
          username: user.login,
          avatarUrl: user.image.versions.medium,
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          twoFactorAuth: false,
          twoFactorActive: false,
          friends: [], // Array of Int
          blockedUser: [], // Array of Int
        },
      });

      const response = await fetch(user.image.versions.medium);
      const imageBlob = await response.blob();
      const formData = new FormData();
      formData.append('file', imageBlob, 'avatar.png');
      const username = user.login;
      const uploadUrl = `${process.env.BACKEND_URL}/files/${username}/upload`;
      const uploadResponse = await axios.post(uploadUrl, formData);
      return newUser;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials taken');
        }
      }
    }
  }

  async updateCookies(
    @Res() res: Response,
    token: string,
    user: { email: string },
  ) {
    try {
      if (user) {
        const userToReturn = await this.prisma.user.update({
          where: { email: user.email },
          data: { accessToken: token },
        });
        return userToReturn;
      } else return null;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Error while updating cookies',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async checkIfLoggedIn(@Req() req: Request) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { accessToken: req.headers.authorization },
      });
      if (!user)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      delete user.accessToken;
      return user;
    } catch (error) {
      console.log(error);
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
  }

  async checkIfTwoFactorActive(@Req() req: Request) {
    try {
      const status = await this.prisma.user.findFirst({
        where: { accessToken: req.headers.authorization },
        select: { twoFactorAuth: true, twoFactorActive: true },
      });
      return status;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Error while checking if two factor is active',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async enableTwoFactor(@Req() req: Request) {
    await this.prisma.user.update({
      where: { accessToken: req.body.token },
      data: { twoFactorAuth: req.body.twoFactorAuth },
    });
  }

  async activateTwoFactor(@Req() req: Request) {
    await this.prisma.user.update({
      where: { accessToken: req.body.token },
      data: { twoFactorActive: req.body.twoFactorActive },
    });
  }

  async generateQRCode(otpAuthUrl: string) {
    return toDataURL(otpAuthUrl);
  }

  async generateTwoFactor(@Req() req: Request, @Res() res: Response) {
    const user = await this.prisma.user.findFirst({
      where: { accessToken: req.body.token },
    });
    if (user.twoFactorAuth == true) {
      const secret = authenticator.generateSecret();
      await this.prisma.user.update({
        where: { accessToken: req.body.token },
        data: { twoFactorSecret: secret },
      });
      const twoFactorSecret = await this.prisma.user.findFirst({
        where: { accessToken: req.body.token },
        select: { twoFactorSecret: true },
      });
      if (twoFactorSecret.twoFactorSecret == null)
        return { message: 'Error while generating two factor secret' };
      const otpAuthUrl = authenticator.keyuri(
        user.email,
        'PingPongShow',
        twoFactorSecret.twoFactorSecret,
      );

      const qrCodeData = await this.generateQRCode(otpAuthUrl);

      return res.json(qrCodeData);
    }
    return { message: 'Two factor auth not enabled' };
  }

  async verifyTwoFactor(@Req() req: Request) {
    const user = await this.prisma.user.findFirst({
      where: { accessToken: req.body.token },
    });
    // console.log(req.body.twoFactorCode);
    // console.log(user.twoFactorSecret);
    return authenticator.verify({
      token: req.body.twoFactorCode,
      secret: user.twoFactorSecret,
    });
  }

  async checkIfTwoFactorSuccess(@Req() req: Request) {
    try {
      await this.prisma.user.update({
        where: { accessToken: req.body.token },
        data: { twoFactorVerified: req.body.status },
      });
      return { message: 'Login with TwoFactor Succeded ' };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Error while connecting user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
