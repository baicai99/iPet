import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_TTL_MS } from '../common/cache/cache.constants';
import { cacheKeys } from '../common/cache/cache.keys';
import { ttlWithJitter } from '../common/cache/cache.utils';
import type { PaginationResult } from '../utils/pagination';

@Injectable()
export class ArticleService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async findAll(category: string | undefined, pagination: PaginationResult) {
        const normalizedCategory = category && category !== 'all' ? category : 'all';

        const shouldCache = pagination.page === 1 && pagination.limit === 20;
        const cacheKey = cacheKeys.articles.listByCategory(normalizedCategory);

        if (shouldCache) {
            const cached = await this.cacheManager.get(cacheKey);
            if (cached) return cached;
        }

        const where = normalizedCategory !== 'all' ? { category: normalizedCategory } : {};
        const result = await this.prisma.article.findMany({
            where,
            select: {
                id: true,
                title: true,
                summary: true,
                cover: true,
                category: true,
                author: true,
                views: true,
                likes: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
            skip: pagination.skip,
            take: pagination.take,
        });

        if (shouldCache) {
            await this.cacheManager.set(
                cacheKey,
                result,
                ttlWithJitter(CACHE_TTL_MS.articlesList),
            );
        }

        return result;
    }

    async findOne(id: string) {
        const cacheKey = cacheKeys.articles.byId(id);
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) return cached;

        const result = await this.prisma.article.findUnique({
            where: { id },
        });

        if (result) {
            await this.cacheManager.set(
                cacheKey,
                result,
                ttlWithJitter(CACHE_TTL_MS.articleDetail),
            );
        }

        return result;
    }

    async create(data: { title: string; summary: string; content: string; category: string; cover?: string; author?: string }) {
        const result = await this.prisma.article.create({
            data,
        });

        await this.cacheManager.del(cacheKeys.articles.listByCategory(result.category));
        await this.cacheManager.del(cacheKeys.articles.listByCategory('all'));

        return result;
    }

    async update(id: string, data: { title?: string; summary?: string; content?: string; category?: string; cover?: string; author?: string }) {
        const existing = await this.prisma.article.findUnique({ where: { id } });

        const result = await this.prisma.article.update({
            where: { id },
            data,
        });

        // Invalidate caches
        await this.cacheManager.del(cacheKeys.articles.byId(id));
        if (existing) {
            await this.cacheManager.del(cacheKeys.articles.listByCategory(existing.category));
        }
        if (data.category) {
            await this.cacheManager.del(cacheKeys.articles.listByCategory(data.category));
        }
        await this.cacheManager.del(cacheKeys.articles.listByCategory('all'));

        return result;
    }

    async delete(id: string, adminId?: string) {
        const existing = await this.prisma.article.findUnique({ where: { id } });

        if (!existing) {
            return;
        }

        // Soft delete
        await this.prisma.article.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                deletedBy: adminId,
            },
        });

        // Invalidate caches
        await this.cacheManager.del(cacheKeys.articles.byId(id));
        await this.cacheManager.del(cacheKeys.articles.listByCategory(existing.category));
        await this.cacheManager.del(cacheKeys.articles.listByCategory('all'));
    }

    async restore(id: string) {
        const existing = await this.prisma.article.findUnique({ where: { id } });

        if (!existing || !existing.deletedAt) {
            return null;
        }

        const result = await this.prisma.article.update({
            where: { id },
            data: {
                deletedAt: null,
                deletedBy: null,
            },
        });

        // Invalidate caches
        await this.cacheManager.del(cacheKeys.articles.byId(id));
        await this.cacheManager.del(cacheKeys.articles.listByCategory(result.category));
        await this.cacheManager.del(cacheKeys.articles.listByCategory('all'));

        return result;
    }

    async permanentDelete(id: string) {
        const existing = await this.prisma.article.findUnique({ where: { id } });

        if (!existing) {
            return;
        }

        await this.prisma.article.delete({ where: { id } });

        // Invalidate caches
        await this.cacheManager.del(cacheKeys.articles.byId(id));
        await this.cacheManager.del(cacheKeys.articles.listByCategory(existing.category));
        await this.cacheManager.del(cacheKeys.articles.listByCategory('all'));
    }

    async findAllAdmin(category: string | undefined, search: string | undefined, pagination: PaginationResult, includeDeleted = false) {
        const where: any = {};

        // By default, exclude deleted articles
        if (!includeDeleted) {
            where.deletedAt = null;
        }

        if (category && category !== 'all') {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { summary: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [articles, total] = await Promise.all([
            this.prisma.article.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: pagination.skip,
                take: pagination.take,
            }),
            this.prisma.article.count({ where }),
        ]);

        return {
            items: articles,
            total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(total / pagination.limit),
        };
    }

    async getDeletedArticles(pagination: PaginationResult) {
        const where = { deletedAt: { not: null } };

        const [articles, total] = await Promise.all([
            this.prisma.article.findMany({
                where,
                orderBy: { deletedAt: 'desc' },
                skip: pagination.skip,
                take: pagination.take,
            }),
            this.prisma.article.count({ where }),
        ]);

        return {
            items: articles,
            total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(total / pagination.limit),
        };
    }
}

