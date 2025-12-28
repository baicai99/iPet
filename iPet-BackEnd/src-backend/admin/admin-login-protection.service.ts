import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';

const keyForFailures = (username: string, ip: string) => `admin:login:fail:${username}:${ip}`;
const keyForLock = (username: string, ip: string) => `admin:login:lock:${username}:${ip}`;
const keyForIpFailures = (ip: string) => `admin:login:fail:ip:${ip}`;
const keyForIpLock = (ip: string) => `admin:login:lock:ip:${ip}`;

@Injectable()
export class AdminLoginProtectionService {
    private readonly maxFailures: number;
    private readonly maxIpFailures: number;
    private readonly failureWindowMs: number;
    private readonly cooldownMs: number;

    constructor(
        private readonly configService: ConfigService,
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
    ) {
        // Stricter limits for admin login
        this.maxFailures = this.configService.get<number>('auth.adminLoginProtection.maxFailures', 3);
        this.maxIpFailures = this.configService.get<number>('auth.adminLoginProtection.maxIpFailures', 10);
        this.failureWindowMs = this.configService.get<number>('auth.adminLoginProtection.failureWindowMs', 60 * 60 * 1000); // 1 hour
        this.cooldownMs = this.configService.get<number>('auth.adminLoginProtection.cooldownMs', 30 * 60 * 1000); // 30 minutes
    }

    async assertNotLocked(username: string, ip: string): Promise<void> {
        // Check username+IP lock
        const userLockKey = keyForLock(username, ip);
        const userLocked = await this.cache.get(userLockKey);
        if (userLocked) {
            throw new HttpException(
                '登录失败次数过多，账号已被临时锁定，请30分钟后再试',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        // Check IP-level lock (protect against username enumeration)
        const ipLockKey = keyForIpLock(ip);
        const ipLocked = await this.cache.get(ipLockKey);
        if (ipLocked) {
            throw new HttpException(
                '当前IP登录失败次数过多，请稍后再试',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }
    }

    async recordFailure(username: string, ip: string): Promise<void> {
        // Record username+IP failure
        const userFailKey = keyForFailures(username, ip);
        const userCurrent = await this.cache.get(userFailKey);
        const userCount = (typeof userCurrent === 'number' ? userCurrent : 0) + 1;
        await this.cache.set(userFailKey, userCount, this.failureWindowMs);

        if (userCount >= this.maxFailures) {
            await this.cache.set(keyForLock(username, ip), 1, this.cooldownMs);
        }

        // Record IP-level failure
        const ipFailKey = keyForIpFailures(ip);
        const ipCurrent = await this.cache.get(ipFailKey);
        const ipCount = (typeof ipCurrent === 'number' ? ipCurrent : 0) + 1;
        await this.cache.set(ipFailKey, ipCount, this.failureWindowMs);

        if (ipCount >= this.maxIpFailures) {
            await this.cache.set(keyForIpLock(ip), 1, this.cooldownMs);
        }
    }

    async reset(username: string, ip: string): Promise<void> {
        await this.cache.del(keyForFailures(username, ip));
        await this.cache.del(keyForLock(username, ip));
        // Don't reset IP counters on success to prevent IP abuse
    }

    async getRemainingAttempts(username: string, ip: string): Promise<number> {
        const failKey = keyForFailures(username, ip);
        const current = await this.cache.get(failKey);
        const count = typeof current === 'number' ? current : 0;
        return Math.max(0, this.maxFailures - count);
    }
}
