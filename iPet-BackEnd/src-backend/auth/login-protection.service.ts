import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';

const keyForFailures = (email: string, ip: string) => `auth:login:fail:${email}:${ip}`;
const keyForLock = (email: string, ip: string) => `auth:login:lock:${email}:${ip}`;

@Injectable()
export class LoginProtectionService {
  private readonly maxFailures: number;
  private readonly failureWindowMs: number;
  private readonly cooldownMs: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {
    const maxFailures = this.configService.get<number>('auth.loginProtection.maxFailures', 5);
    const failureWindowMs = this.configService.get<number>('auth.loginProtection.failureWindowMs', 60 * 60 * 1000);
    const cooldownMs = this.configService.get<number>('auth.loginProtection.cooldownMs', 10 * 60 * 1000);

    this.maxFailures = Math.max(0, maxFailures);
    this.failureWindowMs = Math.max(1000, failureWindowMs);
    this.cooldownMs = Math.max(1000, cooldownMs);
  }

  async assertNotLocked(email: string, ip: string): Promise<void> {
    if (this.maxFailures <= 0) {
      return;
    }

    const lockKey = keyForLock(email, ip);
    const locked = await this.cache.get(lockKey);
    if (locked) {
      throw new HttpException('登录失败次数过多，请稍后再试', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  async recordFailure(email: string, ip: string): Promise<void> {
    if (this.maxFailures <= 0) {
      return;
    }

    const failKey = keyForFailures(email, ip);
    const current = await this.cache.get(failKey);
    const currentCount = typeof current === 'number' ? current : Number(current || 0);
    const nextCount = Number.isFinite(currentCount) ? currentCount + 1 : 1;

    await this.cache.set(failKey, nextCount, this.failureWindowMs);

    if (nextCount >= this.maxFailures) {
      await this.cache.set(keyForLock(email, ip), 1, this.cooldownMs);
    }
  }

  async reset(email: string, ip: string): Promise<void> {
    await this.cache.del(keyForFailures(email, ip));
    await this.cache.del(keyForLock(email, ip));
  }
}
