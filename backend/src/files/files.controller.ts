import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import * as sharp from 'sharp';

@Controller('files')
export class FilesController {
  constructor(private prisma: PrismaService) {}

  @Post(':username/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('username') username: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!user) return { error: 'User not found.' };
    const searchFileTest = await this.prisma.file.findFirst({
      where: {
        owner: {
          some: {
            id: user.id,
          },
        },
      },
    });
    if (searchFileTest) {
      await this.prisma.file.delete({
        where: {
          id: searchFileTest.id,
        },
      });
    }
    const newFile = await this.prisma.file.create({
      data: {
        content: file.buffer,
        name: file.originalname,
        mimetype: file.mimetype,
        owner: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    return newFile;
  }

  @Get(':username')
  async getFile(@Param('username') username: string, @Res() res: Response) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { username },
      });
      if (!user) return { error: 'User not found.' };
      const file = await this.prisma.file.findFirst({
        where: {
          owner: {
            some: {
              id: user.id,
            },
          },
        },
      });
      if (!file) {
        res.status(404).send('File not found');
        return { error: 'File not found.' };
      }

      const imageBuffer = await sharp(file.content)
        .resize(200, 200, { fit: 'cover' })
        .toBuffer();
      res.setHeader('Content-Type', file.mimetype);
      //res.setHeader('Content-Disposition', `attachment; filename=${file.name}`);
      res.send(imageBuffer);
    } catch (error) {
      console.log(error);
      res.status(404).send('File not found');
      return { error: 'File not found.' };
    }
  }
}
