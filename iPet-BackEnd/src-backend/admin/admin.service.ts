import { Injectable, UnauthorizedException, NotFoundException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminLoginProtectionService } from './admin-login-protection.service';
import { AuditLogService } from './audit-log.service';

export interface AdminJwtPayload {
    adminId: string;
    username: string;
    role: string;
    isAdmin: true;
    iat?: number; // Issued at timestamp
}

@Injectable()
export class AdminService {
    private readonly jwtSecret: string;
    private readonly tokenTtlSeconds = 24 * 60 * 60; // 24 hours for admin
    private readonly saltRounds = 12;

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly loginProtection: AdminLoginProtectionService,
        private readonly auditLogService: AuditLogService,
    ) {
        const secret = this.configService.get<string>('jwtSecret');
        if (!secret) {
            throw new Error('JWT_SECRET is not defined in configuration');
        }
        this.jwtSecret = secret;
    }

    async login(dto: AdminLoginDto, ip?: string, userAgent?: string) {
        const identifier = dto.username.trim().toLowerCase();
        const ipAddress = ip || 'unknown';

        // Check login protection before anything else
        try {
            await this.loginProtection.assertNotLocked(dto.username, ipAddress);
        } catch (error: any) {
            await this.auditLogService.logLoginFailure({
                username: identifier,
                reason: error?.message || '登录失败次数过多',
                ip: ipAddress,
                ua: userAgent,
            });
            throw error;
        }

        const admin = await this.prisma.admin.findFirst({
            where: {
                OR: [
                    { username: identifier },
                    { email: identifier },
                ],
            },
        });

        if (!admin) {
            // Record failure even for non-existent users (prevent enumeration)
            await this.loginProtection.recordFailure(dto.username, ipAddress);
            await this.auditLogService.logLoginFailure({
                username: identifier,
                reason: '管理员账号不存在',
                ip: ipAddress,
                ua: userAgent,
            });
            throw new NotFoundException('管理员账号不存在');
        }

        if (admin.role !== 'admin') {
            await this.prisma.admin.update({
                where: { id: admin.id },
                data: { role: 'admin' },
            });
            admin.role = 'admin';
        }

        if (!admin.isActive) {
            await this.loginProtection.recordFailure(dto.username, ipAddress);
            await this.auditLogService.logLoginFailure({
                adminId: admin.id,
                username: identifier,
                reason: '管理员账号已被禁用',
                ip: ipAddress,
                ua: userAgent,
            });
            throw new UnauthorizedException('该管理员账号已被禁用');
        }

        if (!(await compare(dto.password, admin.passwordHash))) {
            await this.loginProtection.recordFailure(dto.username, ipAddress);
            const remaining = await this.loginProtection.getRemainingAttempts(dto.username, ipAddress);
            await this.auditLogService.logLoginFailure({
                adminId: admin.id,
                username: identifier,
                reason: '密码错误',
                remaining,
                ip: ipAddress,
                ua: userAgent,
            });
            throw new UnauthorizedException(`密码错误，剩余尝试次数: ${remaining}`);
        }

        // Reset failure count on successful login
        await this.loginProtection.reset(dto.username, ipAddress);

        // Update last login time
        await this.prisma.admin.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() },
        });

        // Audit log
        await this.auditLogService.logLogin(admin.id, ipAddress, userAgent);

        return this.generateToken(admin);
    }

    generateToken(admin: { id: string; username: string; role: string; displayName?: string | null }) {
        const payload: AdminJwtPayload = {
            adminId: admin.id,
            username: admin.username,
            role: admin.role,
            isAdmin: true,
        };

        const accessToken = sign(payload, this.jwtSecret, { expiresIn: this.tokenTtlSeconds });

        return {
            accessToken,
            expiresIn: this.tokenTtlSeconds,
            admin: {
                id: admin.id,
                username: admin.username,
                displayName: admin.displayName || admin.username,
                role: admin.role,
            },
        };
    }

    async validateAdminToken(token: string): Promise<AdminJwtPayload> {
        try {
            const payload = verify(token, this.jwtSecret) as AdminJwtPayload;

            if (!payload.isAdmin || !payload.adminId) {
                throw new UnauthorizedException('Invalid admin token');
            }

            // Verify admin still exists and is active
            const admin = await this.prisma.admin.findUnique({
                where: { id: payload.adminId },
            });

            if (!admin) {
                throw new UnauthorizedException('Admin account not found');
            }

            if (!admin.isActive) {
                throw new UnauthorizedException('Admin account is disabled');
            }

            // Check token revocation
            if (admin.tokenRevokedAt && payload.iat) {
                const tokenIssuedAt = new Date(payload.iat * 1000);
                if (tokenIssuedAt < admin.tokenRevokedAt) {
                    throw new UnauthorizedException('Token has been revoked, please login again');
                }
            }

            return payload;
        } catch (error: any) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException('Invalid or expired admin token');
        }
    }

    async revokeAllTokens(adminId: string): Promise<void> {
        await this.prisma.admin.update({
            where: { id: adminId },
            data: { tokenRevokedAt: new Date() },
        });
    }

    async disableAdmin(adminId: string): Promise<void> {
        await this.prisma.admin.update({
            where: { id: adminId },
            data: {
                isActive: false,
                tokenRevokedAt: new Date(), // Also revoke tokens
            },
        });
    }

    async createAdmin(username: string, email: string | undefined, password: string, displayName?: string, role = 'admin') {
        const passwordHash = await hash(password, this.saltRounds);

        return this.prisma.admin.create({
            data: {
                username,
                email,
                passwordHash,
                displayName,
                role,
            },
            select: {
                id: true,
                username: true,
                displayName: true,
                role: true,
                createdAt: true,
            },
        });
    }

    async updateAdminSettings(adminId: string, updates: {
        username?: string;
        email?: string | null;
        password?: string;
    }) {
        const data: {
            username?: string;
            email?: string | null;
            passwordHash?: string;
        } = {};

        if (updates.username !== undefined) {
            data.username = updates.username;
        }

        if (updates.email !== undefined) {
            data.email = updates.email;
        }

        if (updates.password) {
            data.passwordHash = await hash(updates.password, this.saltRounds);
        }

        return this.prisma.admin.update({
            where: { id: adminId },
            data,
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                role: true,
            },
        });
    }
}
