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
}
