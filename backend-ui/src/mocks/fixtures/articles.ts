import { http, HttpResponse } from 'msw';
import { API_PREFIX } from '@/core/config';
import type { Article, ArticleCategory, ArticleDetail } from '@/api/types';

let categories: ArticleCategory[] = ['education', 'recipe', 'mythbust', 'news', 'health', 'care', 'nutrition'];

const mockArticles: Article[] = Array.from({ length: 20 }).map((_, i) => ({
    id: `article-${i + 1}`,
    title: `Article Title ${i + 1}`,
    summary: `This is a summary for article ${i + 1}`,
    category: categories[i % categories.length],
    tags: [`tag-${(i % 3) + 1}`, 'pet-health'],
    views: Math.floor(Math.random() * 1000),
    likes: Math.floor(Math.random() * 100),
    sectionPinned: i % 7 === 0,
    sectionPinnedAt: new Date().toISOString(),
    pinnedMetrics: i % 5 === 0 ? ['weight'] : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
}));

const buildCategoryOptions = () => categories.map((category, index) => ({
    key: category,
    label: category,
    order: index + 1,
    count: mockArticles.filter(article => article.category === category).length,
}));

let categoryOptions = buildCategoryOptions();

export const articleHandlers = [
    // Get Articles List
    http.get(`${API_PREFIX}/articles`, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page') || '1');
        const limit = Number(url.searchParams.get('limit') || '10');
        const category = url.searchParams.get('category');
        const search = url.searchParams.get('search');
        const pinned = url.searchParams.get('pinned');

        let filtered = [...mockArticles];
        if (category && category !== 'all') {
            filtered = filtered.filter(article => article.category === category);
        }
        if (search) {
            const keyword = search.toLowerCase();
            filtered = filtered.filter(article =>
                article.title.toLowerCase().includes(keyword)
                || article.summary.toLowerCase().includes(keyword)
            );
        }
        if (pinned === 'true') {
            filtered = filtered.filter(article => article.sectionPinned);
        }
        if (pinned === 'false') {
            filtered = filtered.filter(article => !article.sectionPinned);
        }

        const start = (page - 1) * limit;
        const end = start + limit;
        return HttpResponse.json({
            success: true,
            data: {
                items: filtered.slice(start, end),
                pagination: {
                    page,
                    limit,
                    total: filtered.length,
                    totalPages: Math.ceil(filtered.length / limit),
                }
            },
            requestId: 'req_mock_articles_list',
            timestamp: Date.now(),
        });
    }),

    // Get Article Categories
    http.get(`${API_PREFIX}/articles/categories`, () => {
        return HttpResponse.json({
            success: true,
            data: categoryOptions,
            requestId: 'req_mock_article_categories',
            timestamp: Date.now(),
        });
    }),

    // Create Article Category
    http.post(`${API_PREFIX}/articles/categories`, async ({ request }) => {
        const body = await request.json() as { key?: string; label?: string; order?: number };
        if (!body.key || !body.label) {
            return HttpResponse.json({
                success: false,
                error: { code: 'BAD_REQUEST', message: '分类 key 或名称不能为空' },
            }, { status: 400 });
        }
        if (categories.includes(body.key as ArticleCategory)) {
            return HttpResponse.json({
                success: false,
                error: { code: 'BAD_REQUEST', message: '分类已存在' },
            }, { status: 400 });
        }
        const label = body.label;
        categories = [...categories, body.key as ArticleCategory];
        categoryOptions = buildCategoryOptions().map(item => item.key === body.key ? { ...item, label } : item);
        return HttpResponse.json({
            success: true,
            data: categoryOptions.find(item => item.key === body.key),
            requestId: 'req_mock_article_category_create',
            timestamp: Date.now(),
        });
    }),

    // Update Article Category
    http.patch(`${API_PREFIX}/articles/categories/:key`, async ({ params, request }) => {
        const body = await request.json() as { label?: string; order?: number };
        const key = params.key as string;
        const existing = categoryOptions.find(item => item.key === key);
        if (!existing) {
            return HttpResponse.json({
                success: false,
                error: { code: 'NOT_FOUND', message: '分类不存在' },
            }, { status: 404 });
        }
        categoryOptions = categoryOptions.map(item => {
            if (item.key !== key) return item;
            return {
                ...item,
                label: body.label ?? item.label,
                order: body.order ?? item.order,
            };
        });
        return HttpResponse.json({
            success: true,
            data: categoryOptions.find(item => item.key === key),
            requestId: 'req_mock_article_category_update',
            timestamp: Date.now(),
        });
    }),

    // Delete Article Category
    http.delete(`${API_PREFIX}/articles/categories/:key`, ({ params, request }) => {
        const url = new URL(request.url);
        const target = url.searchParams.get('target') || undefined;
        const key = params.key as string;
        const existing = categoryOptions.find(item => item.key === key);
        if (!existing) {
            return HttpResponse.json({
                success: false,
                error: { code: 'NOT_FOUND', message: '分类不存在' },
            }, { status: 404 });
        }
        const count = mockArticles.filter(article => article.category === key).length;
        if (count > 0 && !target) {
            return HttpResponse.json({
                success: false,
                error: { code: 'BAD_REQUEST', message: '该分类下存在文章，请选择迁移目标分类' },
            }, { status: 400 });
        }
        if (target && !categories.includes(target as ArticleCategory)) {
            return HttpResponse.json({
                success: false,
                error: { code: 'BAD_REQUEST', message: '目标分类不存在' },
            }, { status: 400 });
        }
        if (target) {
            mockArticles.forEach(article => {
                if (article.category === key) {
                    article.category = target as ArticleCategory;
                }
            });
        }
        categories = categories.filter(category => category !== key);
        categoryOptions = buildCategoryOptions();
        return HttpResponse.json({
            success: true,
            data: { migrated: count, targetCategory: target || null },
            requestId: 'req_mock_article_category_delete',
            timestamp: Date.now(),
        });
    }),

    // Get Article Detail
    http.get(`${API_PREFIX}/articles/:id`, ({ params }) => {
        const article = mockArticles.find(a => a.id === params.id);
        if (!article) {
            return HttpResponse.json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Article not found' }
            }, { status: 404 });
        }

        const detail: ArticleDetail = {
            ...article,
            content: '# Mock Content\n\nThis is the content of the article.',
            author: 'Admin User'
        };

        return HttpResponse.json({
            success: true,
            data: detail,
            requestId: 'req_mock_article_detail',
            timestamp: Date.now(),
        });
    }),

    // Create Article
    http.post(`${API_PREFIX}/articles`, () => {
        return HttpResponse.json({
            success: true,
            data: { id: `new-article-${Date.now()}` },
            requestId: 'req_mock_create_article',
            timestamp: Date.now(),
        });
    }),

    // Update Article
    http.patch(`${API_PREFIX}/articles/:id`, async ({ params, request }) => {
        const body = await request.json() as Partial<Article>;
        const id = params.id as string;
        const existing = mockArticles.find(article => article.id === id);
        if (!existing) {
            return HttpResponse.json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Article not found' }
            }, { status: 404 });
        }
        Object.assign(existing, {
            ...body,
            updatedAt: new Date().toISOString(),
        });
        categoryOptions = buildCategoryOptions();
        return HttpResponse.json({
            success: true,
            data: existing,
            requestId: 'req_mock_update_article',
            timestamp: Date.now(),
        });
    }),

    // Delete Article
    http.delete(`${API_PREFIX}/articles/:id`, ({ params }) => {
        const id = params.id as string;
        const index = mockArticles.findIndex(article => article.id === id);
        if (index >= 0) {
            mockArticles.splice(index, 1);
            categoryOptions = buildCategoryOptions();
        }
        return HttpResponse.json({
            success: true,
            data: { success: true },
            requestId: 'req_mock_delete_article',
            timestamp: Date.now(),
        });
    }),

    // Bulk delete articles
    http.post(`${API_PREFIX}/articles/bulk-delete`, async ({ request }) => {
        const body = await request.json() as { ids?: string[] };
        const ids = body.ids || [];
        const successIds: string[] = [];
        const failed: { id: string; reason: string }[] = [];

        ids.forEach((id) => {
            const index = mockArticles.findIndex(article => article.id === id);
            if (index >= 0) {
                mockArticles.splice(index, 1);
                successIds.push(id);
            } else {
                failed.push({ id, reason: '文章不存在或已删除' });
            }
        });

        categoryOptions = buildCategoryOptions();

        return HttpResponse.json({
            success: true,
            data: { successIds, failed },
            requestId: 'req_mock_bulk_delete_articles',
            timestamp: Date.now(),
        });
    }),

    // Bulk update category
    http.patch(`${API_PREFIX}/articles/bulk-category`, async ({ request }) => {
        const body = await request.json() as { ids?: string[]; category?: string };
        const ids = body.ids || [];
        const category = body.category;
        const successIds: string[] = [];
        const failed: { id: string; reason: string }[] = [];

        if (!category || !categories.includes(category as ArticleCategory)) {
            return HttpResponse.json({
                success: false,
                error: { code: 'BAD_REQUEST', message: '目标分类不存在' },
            }, { status: 400 });
        }

        ids.forEach((id) => {
            const article = mockArticles.find(item => item.id === id);
            if (!article) {
                failed.push({ id, reason: '文章不存在' });
                return;
            }
            article.category = category as ArticleCategory;
            successIds.push(id);
        });

        categoryOptions = buildCategoryOptions();

        return HttpResponse.json({
            success: true,
            data: { successIds, failed },
            requestId: 'req_mock_bulk_category_articles',
            timestamp: Date.now(),
        });
    }),

    // Bulk update pinned
    http.patch(`${API_PREFIX}/articles/bulk-pin`, async ({ request }) => {
        const body = await request.json() as { ids?: string[]; sectionPinned?: boolean };
        const ids = body.ids || [];
        const sectionPinned = Boolean(body.sectionPinned);
        const successIds: string[] = [];
        const failed: { id: string; reason: string }[] = [];

        ids.forEach((id) => {
            const article = mockArticles.find(item => item.id === id);
            if (!article) {
                failed.push({ id, reason: '文章不存在' });
                return;
            }
            article.sectionPinned = sectionPinned;
            successIds.push(id);
        });

        return HttpResponse.json({
            success: true,
            data: { successIds, failed },
            requestId: 'req_mock_bulk_pin_articles',
            timestamp: Date.now(),
        });
    }),
];
