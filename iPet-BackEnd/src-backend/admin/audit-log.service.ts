import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogEntry {
    adminId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    details?: Record<string, any>;
    ip?: string;
    userAgent?: string;
}

@Injectable()
export class AuditLogService {
    constructor(private readonly prisma: PrismaService) { }

    async log(entry: AuditLogEntry): Promise<void> {
        try {
            await this.prisma.adminAuditLog.create({
                data: {
                    adminId: entry.adminId,
                    action: entry.action,
                    targetType: entry.targetType,
                    targetId: entry.targetId,
                    details: entry.details,
                    ip: entry.ip,
                    userAgent: entry.userAgent,
                },
            });
        } catch (error) {
            // Log but don't fail the main operation
            console.error('Failed to write audit log:', error);
        }
    }

    async logBanUser(adminId: string, userId: string, reason: string, ip?: string, ua?: string): Promise<void> {
        await this.log({
            adminId,
            action: 'ban_user',
            targetType: 'user',
            targetId: userId,
            details: { reason },
            ip,
            userAgent: ua,
        });
    }

    async logUnbanUser(adminId: string, userId: string, ip?: string, ua?: string): Promise<void> {
        await this.log({
            adminId,
            action: 'unban_user',
            targetType: 'user',
            targetId: userId,
            ip,
            userAgent: ua,
        });
    }

    async logDeleteUser(adminId: string, userId: string, userEmail: string | null, ip?: string, ua?: string): Promise<void> {
        await this.log({
            adminId,
            action: 'delete_user',
            targetType: 'user',
            targetId: userId,
            details: { userEmail },
            ip,
            userAgent: ua,
        });
    }

    async logLogin(adminId: string, ip?: string, ua?: string): Promise<void> {
        await this.log({
            adminId,
            action: 'login',
            targetType: 'system',
            ip,
            userAgent: ua,
        });
    }

    async logArticleCreate(adminId: string, articleId: string, title: string, ip?: string, ua?: string): Promise<void> {
        await this.log({
            adminId,
            action: 'create_article',
            targetType: 'article',
            targetId: articleId,
            details: { title },
            ip,
            userAgent: ua,
        });
    }

    async logArticleUpdate(adminId: string, articleId: string, changes: Record<string, any>, ip?: string, ua?: string): Promise<void> {
        await this.log({
            adminId,
            action: 'update_article',
            targetType: 'article',
            targetId: articleId,
            details: { changes },
            ip,
            userAgent: ua,
        });
    }

    async logArticleDelete(adminId: string, articleId: string, title: string, ip?: string, ua?: string): Promise<void> {
        await this.log({
            adminId,
            action: 'delete_article',
            targetType: 'article',
            targetId: articleId,
            details: { title },
            ip,
            userAgent: ua,
        });
    }

    async getRecentLogs(limit = 100) {
        return this.prisma.adminAuditLog.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                admin: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                    },
                },
            },
        });
    }

    async getLogsByAdmin(adminId: string, limit = 50) {
        return this.prisma.adminAuditLog.findMany({
            where: { adminId },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    }

    async getLogsByTarget(targetType: string, targetId: string, limit = 50) {
        return this.prisma.adminAuditLog.findMany({
            where: { targetType, targetId },
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                admin: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                    },
                },
            },
        });
    }
}
