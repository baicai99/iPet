import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeEmail } from '../utils/sanitizers';
import { LoginDto } from './dto/login.dto';
import { UpgradeDto } from './dto/upgrade.dto';
import { LoginProtectionService } from './login-protection.service';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly tokenTtlSeconds = 30 * 24 * 60 * 60; // 30天有效期
  private readonly saltRounds = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly loginProtection: LoginProtectionService,
  ) {
    const secret = this.configService.get<string>('jwtSecret');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in configuration');
    }
    this.jwtSecret = secret;
  }

  async createGuestSession(options: { ip?: string; deviceId?: string; origin?: string }) {
    const now = new Date();
    const guest = await this.prisma.user.create({
      data: {
        isGuest: true,
        lastActiveAt: now,
        guestCreatedAt: now,
        guestDeviceId: options.deviceId,
        guestOrigin: options.origin || options.ip,
      },
    });

    const tokenResult = this.generateToken(guest);
    return {
      ...tokenResult,
      expiresAt: Date.now() + tokenResult.expiresIn * 1000,
      profile: {
        id: guest.id,
        isGuest: true,
      },
    };
  }

  async login(dto: LoginDto, ip: string) {
    const normalizedEmail = normalizeEmail(dto.email);
    await this.loginProtection.assertNotLocked(normalizedEmail, ip);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      await this.loginProtection.recordFailure(normalizedEmail, ip);
      throw new NotFoundException('该账号未注册');
    }

    if (!user.passwordHash) {
      await this.loginProtection.recordFailure(normalizedEmail, ip);
      throw new UnauthorizedException('该账号未设置密码');
    }

    if (!(await compare(dto.password, user.passwordHash))) {
      await this.loginProtection.recordFailure(normalizedEmail, ip);
      throw new UnauthorizedException('密码错误');
    }

    await this.loginProtection.reset(normalizedEmail, ip);
    return this.generateToken(user);
  }

  async upgradeGuestToUser(userId: string, dto: UpgradeDto) {
    const guest = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!guest) {
      throw new NotFoundException('User not found');
    }

    if (!guest.isGuest) {
      throw new BadRequestException('Only guest accounts can be upgraded');
    }

    const normalizedEmail = normalizeEmail(dto.email);
    const passwordHash = await hash(dto.password, this.saltRounds);

    let upgraded;
    try {
      upgraded = await this.prisma.user.update({
        where: { id: guest.id },
        data: {
          email: normalizedEmail,
          passwordHash,
          isGuest: false,
          lastActiveAt: new Date(),
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }

    const tokenResult = this.generateToken(upgraded);
    return {
      ...tokenResult,
      expiresAt: Date.now() + tokenResult.expiresIn * 1000,
      profile: {
        id: upgraded.id,
        isGuest: false,
      },
    };
  }

  generateToken(user: any) {
    const payload = {
      uid: String(user.id),
      email: user.email ?? undefined,
      isGuest: Boolean(user.isGuest),
    };
    const accessToken = sign(payload, this.jwtSecret, { expiresIn: this.tokenTtlSeconds });

    return {
      accessToken,
      expiresIn: this.tokenTtlSeconds,
      refreshToken: accessToken, // 返回刷新凭证
      user: {
        id: user.id,
        email: user.email ?? null,
        createdAt: user.createdAt,
      },
    };
  }

  // 修改重点：手动验证 Token，不再依赖 Guard，确保持有旧凭证能换取新凭证
  async refreshToken(token: string) {
    try {
      // Allow expired tokens to be verified for refresh purposes
      const payload = verify(token, this.jwtSecret, { ignoreExpiration: true }) as {
        uid: string;
        email?: string | null;
        isGuest?: boolean;
      };

      const newPayload = {
        uid: payload.uid,
        email: payload.email ?? undefined,
        isGuest: Boolean(payload.isGuest),
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
