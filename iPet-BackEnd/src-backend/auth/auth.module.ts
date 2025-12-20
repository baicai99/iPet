import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginProtectionService } from './login-protection.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, LoginProtectionService],
  exports: [AuthService],
})
export class AuthModule { }
