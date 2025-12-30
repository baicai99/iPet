import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PaginationResult } from '../utils/pagination';

export interface AuditLogEntry {
    adminId?: string | null;
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
            const data: Prisma.AdminAuditLogCreateInput = {
                action: entry.action,
                targetType: entry.targetType,
                targetId: entry.targetId,
                details: entry.details,
                ip: entry.ip,
                userAgent: entry.userAgent,
                ...(entry.adminId ? { admin: { connect: { id: entry.adminId } } } : {}),
            };

            await this.prisma.adminAuditLog.create({
                data,
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

    async logLoginFailure(params: {
        adminId?: string | null;
        username: string;
        reason: string;
        remaining?: number;
        ip?: string;
        ua?: string;
    }): Promise<void> {
        await this.log({
            adminId: params.adminId ?? undefined,
            action: 'login_failed',
            targetType: 'system',
            targetId: params.adminId ?? undefined,
            details: {
                username: params.username,
                reason: params.reason,
                remaining: params.remaining,
            },
            ip: params.ip,
            userAgent: params.ua,
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

    async getLogs(pagination: PaginationResult) {
        const [logs, total] = await Promise.all([
            this.prisma.adminAuditLog.findMany({
                orderBy: { createdAt: 'desc' },
                skip: pagination.skip,
                take: pagination.take,
                include: {
                    admin: {
                        select: {
                            username: true,
                            displayName: true,
                        },
                    },
                },
            }),
            this.prisma.adminAuditLog.count(),
        ]);

        return {
            items: logs.map((log) => ({
                id: log.id,
                action: log.action,
                user: log.admin?.displayName || log.admin?.username || log.adminId || this.getDetailUsername(log.details) || 'unknown',
                timestamp: log.createdAt.toISOString(),
                details: log.details ? JSON.stringify(log.details) : '',
                ip: log.ip || undefined,
            })),
            total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(total / pagination.limit),
        };
    }

    private getDetailUsername(details: unknown): string | undefined {
        if (!details || typeof details !== 'object' || Array.isArray(details)) {
            return undefined;
        }
        const record = details as Record<string, unknown>;
        const username = record.username;
        return typeof username === 'string' ? username : undefined;
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
