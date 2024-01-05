import { Controller, Get, Injectable, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { UserService } from 'src/user/user.service';

@Injectable()
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Get('42/register')
  async getToken(@Req() req: Request, @Res() res: Response) {
    const code = req.query.code as string;
    const token = await this.authService.getToken(code);
    const user = await this.authService.getUser(token.access_token);
    if (token) this.authService.makeCookies(res, token.access_token);
    else {
      console.log('Error while getting the token');
      return;
    }
    if (!user.email) res.redirect(`${process.env.FRONTEND_URL}/`);
    else {
      const userInDb = await this.authService.getUserInDb(user.email);
      if (!userInDb) await this.authService.createUser(token, user);
      else this.authService.updateCookies(res, token.access_token, user);
      const currentUser = await this.authService.getUserInDb(user.email);
      if (currentUser.twoFactorActive === false) {
        req.headers.authorization = token.access_token;
        this.userService.setOnline(req);
        res.redirect(`${process.env.FRONTEND_URL}/`);
      } else if (currentUser.twoFactorActive === true) {
        req.headers.authorization = token.access_token;
        this.userService.setOnline(req);
        res.redirect(`${process.env.FRONTEND_URL}/twofactor`);
      }

      return { token: token, user: user };
    }
  }

  @Get('42/logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    req.headers.authorization = req.cookies['token'];
    res.clearCookie('token');
    this.userService.setOffline(req);
    res.redirect(`${process.env.FRONTEND_URL}/`);
  }

  @Get('42/check')
  async checkIfLoggedIn(@Req() req: Request) {
    return this.authService.checkIfLoggedIn(req);
  }

  @Get('twofactor/status')
  async checkIfTwoFactorActive(@Req() req: Request) {
    return this.authService.checkIfTwoFactorActive(req);
  }

  @Post('twofactor/enable')
  async enableTwoFactor(@Req() req: Request) {
    return this.authService.enableTwoFactor(req);
  }

  @Post('twofactor/activate')
  async activateTwoFactor(@Req() req: Request) {
    return this.authService.activateTwoFactor(req);
  }

  @Get('twofactor/qrcode')
  async generateQRCode(otpAuthUrl: any) {
    return this.authService.generateQRCode(otpAuthUrl);
  }

  @Post('twofactor/generate')
  async generateTwoFactor(@Req() req: Request, @Res() res: Response) {
    return this.authService.generateTwoFactor(req, res);
  }

  @Post('twofactor/verify')
  async verifyTwoFactor(@Req() req: Request) {
    return this.authService.verifyTwoFactor(req);
  }

  @Post('twofactor/success')
  async checkIfTwoFactorSuccess(@Req() req: Request) {
    return this.authService.checkIfTwoFactorSuccess(req);
  }
}
