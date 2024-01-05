import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaClient } from '@prisma/client';

@Global()
@Module({
  providers: [PrismaService, PrismaClient],
  exports: [PrismaService, PrismaClient],
})
export class PrismaModule {}
