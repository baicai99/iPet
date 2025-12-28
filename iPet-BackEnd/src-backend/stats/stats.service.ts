import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
    constructor(private readonly prisma: PrismaService) { }

    async getDashboardStats() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            guestUsers,
            activeUsers7d,
            activeUsers30d,
            newUsersToday,
            totalPets,
            totalHealthRecords,
            recordsToday,
            totalArticles,
            totalArticleViews,
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { isGuest: true } }),
            this.prisma.user.count({ where: { lastActiveAt: { gte: last7Days } } }),
            this.prisma.user.count({ where: { lastActiveAt: { gte: last30Days } } }),
            this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
            this.prisma.pet.count({ where: { deleted: false } }),
            this.prisma.healthRecord.count({ where: { deleted: false } }),
            this.prisma.healthRecord.count({ where: { updatedAt: { gte: todayStart } } }),
            this.prisma.article.count(),
            this.prisma.article.aggregate({ _sum: { views: true } }),
        ]);

        // Pet type distribution
        const petTypeDistribution = await this.prisma.pet.groupBy({
            by: ['type'],
            where: { deleted: false },
            _count: { type: true },
        });

        return {
            users: {
                total: totalUsers,
                guests: guestUsers,
                registered: totalUsers - guestUsers,
                active7d: activeUsers7d,
                active30d: activeUsers30d,
                newToday: newUsersToday,
            },
            pets: {
                total: totalPets,
                distribution: petTypeDistribution.map(item => ({
                    type: item.type || 'unknown',
                    count: item._count.type,
                })),
            },
            healthRecords: {
                total: totalHealthRecords,
                today: recordsToday,
            },
            articles: {
                total: totalArticles,
                totalViews: totalArticleViews._sum.views || 0,
            },
            generatedAt: new Date().toISOString(),
        };
    }

    async getUserTrend(days: number = 30) {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const users = await this.prisma.user.findMany({
            where: { createdAt: { gte: startDate } },
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' },
        });

        // Group by date
        const trendMap = new Map<string, number>();
        for (let i = 0; i < days; i++) {
            const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            trendMap.set(dateStr, 0);
        }

        for (const user of users) {
            const dateStr = user.createdAt.toISOString().split('T')[0];
            if (trendMap.has(dateStr)) {
                trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
            }
        }

        return Array.from(trendMap.entries()).map(([date, count]) => ({ date, count }));
    }

    async getRecordTrend(days: number = 30) {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const records = await this.prisma.healthRecord.findMany({
            where: {
                updatedAt: { gte: startDate },
                deleted: false,
            },
            select: { updatedAt: true },
            orderBy: { updatedAt: 'asc' },
        });

        // Group by date
        const trendMap = new Map<string, number>();
        for (let i = 0; i < days; i++) {
            const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            trendMap.set(dateStr, 0);
        }

        for (const record of records) {
            const dateStr = record.updatedAt.toISOString().split('T')[0];
            if (trendMap.has(dateStr)) {
                trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
            }
        }

        return Array.from(trendMap.entries()).map(([date, count]) => ({ date, count }));
    }
}
