import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_TTL_MS } from '../common/cache/cache.constants';
import { cacheKeys } from '../common/cache/cache.keys';
import { ttlWithJitter } from '../common/cache/cache.utils';
import type { PaginationResult } from '../utils/pagination';
import { ARTICLE_CATEGORIES, normalizeArticleCategoryList } from './article.constants';

@Injectable()
export class ArticleService implements OnModuleInit {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async onModuleInit(): Promise<void> {
        await this.ensureCategorySeed();
    }

    private normalizeTags(tags?: string[]) {
        if (!tags) return [];
        return Array.from(new Set(tags.map(tag => tag.trim()).filter(Boolean)));
    }

    private normalizePinnedMetrics(metrics?: string[]) {
        if (!metrics) return [];
        return Array.from(new Set(metrics.map(metric => metric.trim()).filter(Boolean)));
    }

    private async ensureCategorySeed(): Promise<void> {
        const existingCount = await this.prisma.articleCategory.count();
        if (existingCount > 0) return;

        const configured = normalizeArticleCategoryList(ARTICLE_CATEGORIES);
        const existing = await this.prisma.article.findMany({
            select: { category: true },
            distinct: ['category'],
        });
        const known = new Set(configured.map(item => item.key));
        const extras = existing
            .map(item => item.category)
            .filter(category => category && !known.has(category))
            .map((category, index) => ({
                key: category,
                label: category,
                order: configured.length + index + 1,
            }));

        const seed = normalizeArticleCategoryList([...configured, ...extras]);
        if (seed.length === 0) return;

        await this.prisma.articleCategory.createMany({
            data: seed.map(item => ({
                key: item.key,
                label: item.label,
                order: item.order,
            })),
            skipDuplicates: true,
        });
    }

    private async assertCategoryExists(category: string): Promise<void> {
        await this.ensureCategorySeed();
        const existing = await this.prisma.articleCategory.findUnique({ where: { key: category } });
        if (!existing) {
            throw new BadRequestException(`分类 ${category} 不存在`);
        }
    }

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
                tags: true,
                author: true,
                views: true,
                likes: true,
                sectionPinned: true,
                sectionPinnedAt: true,
                pinnedMetrics: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: [
                { sectionPinned: 'desc' },
                { sectionPinnedAt: 'desc' },
                { createdAt: 'desc' },
            ],
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

    async findOneAndIncrementViews(id: string) {
        const result = await this.prisma.article.update({
            where: { id },
            data: {
                views: { increment: 1 },
            },
        });

        await this.cacheManager.set(
            cacheKeys.articles.byId(id),
            result,
            ttlWithJitter(CACHE_TTL_MS.articleDetail),
        );

        return result;
    }

    async create(data: { title: string; summary: string; content: string; category: string; cover?: string; author?: string; tags: string[]; sectionPinned?: boolean; pinnedMetrics?: string[] }) {
        const normalizedTags = this.normalizeTags(data.tags);
        const normalizedPinnedMetrics = this.normalizePinnedMetrics(data.pinnedMetrics);
        const shouldPinSection = Boolean(data.sectionPinned);
        if (!normalizedTags.length) {
            throw new BadRequestException('文章必须包含至少一个标签');
        }
        await this.assertCategoryExists(data.category);
        const result = await this.prisma.article.create({
            data: {
                title: data.title,
                summary: data.summary,
                content: data.content,
                category: data.category,
                cover: data.cover,
                author: data.author,
                tags: normalizedTags,
                sectionPinned: shouldPinSection,
                sectionPinnedAt: shouldPinSection ? new Date() : null,
                pinnedMetrics: normalizedPinnedMetrics,
            },
        });

        await this.cacheManager.del(cacheKeys.articles.listByCategory(result.category));
        await this.cacheManager.del(cacheKeys.articles.listByCategory('all'));

        return result;
    }

    async update(id: string, data: { title?: string; summary?: string; content?: string; category?: string; cover?: string; author?: string; tags?: string[]; sectionPinned?: boolean; pinnedMetrics?: string[] }) {
        const existing = await this.prisma.article.findUnique({ where: { id } });

        const shouldUpdateSectionPin = typeof data.sectionPinned === 'boolean';
        const shouldUpdateTags = Array.isArray(data.tags);
        const shouldUpdatePinnedMetrics = Array.isArray(data.pinnedMetrics);
        const normalizedTags = shouldUpdateTags ? this.normalizeTags(data.tags) : undefined;
        const normalizedPinnedMetrics = shouldUpdatePinnedMetrics ? this.normalizePinnedMetrics(data.pinnedMetrics) : undefined;
        if (shouldUpdateTags && (!normalizedTags || normalizedTags.length === 0)) {
            throw new BadRequestException('文章必须包含至少一个标签');
        }
        if (data.category) {
            await this.assertCategoryExists(data.category);
        }
        const sectionPinnedAt = shouldUpdateSectionPin
            ? (data.sectionPinned ? (existing?.sectionPinnedAt || new Date()) : null)
            : undefined;

        const result = await this.prisma.article.update({
            where: { id },
            data: {
                title: data.title,
                summary: data.summary,
                content: data.content,
                category: data.category,
                cover: data.cover,
                author: data.author,
                tags: normalizedTags,
                pinnedMetrics: normalizedPinnedMetrics,
                sectionPinned: data.sectionPinned,
                sectionPinnedAt,
            },
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

    async findAllAdmin(
        category: string | undefined,
        search: string | undefined,
        pagination: PaginationResult,
        includeDeleted = false,
        pinned?: boolean
    ) {
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
        if (typeof pinned === 'boolean') {
            where.sectionPinned = pinned;
        }

        const [articles, total] = await Promise.all([
            this.prisma.article.findMany({
                where,
                orderBy: [
                    { sectionPinned: 'desc' },
                    { sectionPinnedAt: 'desc' },
                    { createdAt: 'desc' },
                ],
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

    async getCategories() {
        await this.ensureCategorySeed();
        const categories = await this.prisma.articleCategory.findMany({
            orderBy: [{ order: 'asc' }, { key: 'asc' }],
        });
        const counts = await this.prisma.article.groupBy({
            by: ['category'],
            _count: { category: true },
            where: { deletedAt: null },
        });
        const countMap = new Map(counts.map(item => [item.category, item._count.category]));

        return categories.map(category => ({
            key: category.key,
            label: category.label,
            order: category.order,
            count: countMap.get(category.key) || 0,
        }));
    }

    async createCategory(data: { key: string; label: string; order?: number }) {
        await this.ensureCategorySeed();
        const key = data.key.trim();
        const label = data.label.trim();
        if (!key) {
            throw new BadRequestException('分类 key 不能为空');
        }
        if (!label) {
            throw new BadRequestException('分类名称不能为空');
        }

        const existing = await this.prisma.articleCategory.findUnique({ where: { key } });
        if (existing) {
            throw new BadRequestException('分类已存在');
        }

        const order = typeof data.order === 'number' ? data.order : (await this.prisma.articleCategory.count()) + 1;
        return this.prisma.articleCategory.create({
            data: { key, label, order },
        });
    }

    async updateCategory(key: string, data: { label?: string; order?: number }) {
        await this.ensureCategorySeed();
        const existing = await this.prisma.articleCategory.findUnique({ where: { key } });
        if (!existing) {
            throw new NotFoundException('分类不存在');
        }

        const label = data.label?.trim();
        if (label !== undefined && !label) {
            throw new BadRequestException('分类名称不能为空');
        }

        return this.prisma.articleCategory.update({
            where: { key },
            data: {
                label,
                order: data.order,
            },
        });
    }

    async deleteCategory(key: string, target?: string) {
        await this.ensureCategorySeed();
        if (target && target === key) {
            throw new BadRequestException('目标分类不能与当前分类相同');
        }

        const existing = await this.prisma.articleCategory.findUnique({ where: { key } });
        if (!existing) {
            throw new NotFoundException('分类不存在');
        }

        const articleCount = await this.prisma.article.count({
            where: { category: key },
        });

        if (articleCount > 0) {
            if (!target) {
                throw new BadRequestException('该分类下存在文章，请选择迁移目标分类');
            }
            const targetCategory = await this.prisma.articleCategory.findUnique({ where: { key: target } });
            if (!targetCategory) {
                throw new BadRequestException('目标分类不存在');
            }
            await this.prisma.article.updateMany({
                where: { category: key },
                data: { category: target },
            });
            await this.cacheManager.del(cacheKeys.articles.listByCategory(key));
            await this.cacheManager.del(cacheKeys.articles.listByCategory(target));
            await this.cacheManager.del(cacheKeys.articles.listByCategory('all'));
        }

        await this.prisma.articleCategory.delete({ where: { key } });
        return { migrated: articleCount, targetCategory: target || null };
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
