import { http, HttpResponse } from 'msw';
import { API_PREFIX } from '@/core/config';
import type { Article, ArticleCategory, ArticleDetail } from '@/api/types';

const categories: ArticleCategory[] = ['education', 'health', 'care', 'nutrition'];

const mockArticles: Article[] = Array.from({ length: 20 }).map((_, i) => ({
    id: `article-${i + 1}`,
    title: `Article Title ${i + 1}`,
    summary: `This is a summary for article ${i + 1}`,
    category: categories[i % categories.length],
    views: Math.floor(Math.random() * 1000),
    likes: Math.floor(Math.random() * 100),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
}));

export const articleHandlers = [
    // Get Articles List
    http.get(`${API_PREFIX}/articles`, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page') || '1');
        const limit = Number(url.searchParams.get('limit') || '10');

        const start = (page - 1) * limit;
        const end = start + limit;

        return HttpResponse.json({
            success: true,
            data: {
                items: mockArticles.slice(start, end),
                pagination: {
                    page,
                    limit,
                    total: mockArticles.length,
                    totalPages: Math.ceil(mockArticles.length / limit),
                }
            },
            requestId: 'req_mock_articles_list',
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
    http.put(`${API_PREFIX}/articles/:id`, () => {
        return HttpResponse.json({
            success: true,
            data: { success: true },
            requestId: 'req_mock_update_article',
            timestamp: Date.now(),
        });
    }),

    // Delete Article
    http.delete(`${API_PREFIX}/articles/:id`, () => {
        return HttpResponse.json({
            success: true,
            data: { success: true },
            requestId: 'req_mock_delete_article',
            timestamp: Date.now(),
        });
    }),
];
