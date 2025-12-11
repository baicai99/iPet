import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeEmail } from '../utils/sanitizers';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly tokenTtlSeconds = 30 * 24 * 60 * 60; // 30天有效期

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const secret = this.configService.get<string>('jwtSecret');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in configuration');
    }
    this.jwtSecret = secret;
  }

  async login(dto: LoginDto, ip: string) {
    const normalizedEmail = normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException('该账号未注册');
    }

    if (!(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('密码错误');
    }

    if (!(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('密码错误');
    }

    return this.generateToken(user);
  }

  generateToken(user: any) {
    const payload = { uid: String(user.id), email: user.email };
    const accessToken = sign(payload, this.jwtSecret, { expiresIn: this.tokenTtlSeconds });

    return {
      accessToken,
      expiresIn: this.tokenTtlSeconds,
      refreshToken: accessToken, // 返回刷新凭证
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }

  // 修改重点：手动验证 Token，不再依赖 Guard，确保持有旧凭证能换取新凭证
  async refreshToken(token: string) {
    try {
      // Allow expired tokens to be verified for refresh purposes
      const payload = verify(token, this.jwtSecret, { ignoreExpiration: true }) as { uid: string; email: string };

      const newPayload = {
        uid: payload.uid,
        email: payload.email
      };

      // 签发新的30天 Token
      const accessToken = sign(newPayload, this.jwtSecret, { expiresIn: this.tokenTtlSeconds });

      return {
        accessToken,
        expiresIn: this.tokenTtlSeconds,
        refreshToken: accessToken // 滚动更新刷新凭证
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
