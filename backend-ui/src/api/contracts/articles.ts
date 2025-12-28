/**
 * 文章管理 API 契约
 */

import httpClient from '../client';
import type {
    Article,
    ArticleDetail,
    ArticleCategory,
    PaginatedData,
    PaginationParams,
} from '../types';

// ============ 请求类型 ============

export interface ArticleListParams extends PaginationParams {
    /** 文章分类 */
    category?: ArticleCategory;
    /** 搜索标题/摘要 */
    search?: string;
}

export interface CreateArticleRequest {
    /** 文章标题 */
    title: string;
    /** 文章摘要 */
    summary: string;
    /** 文章正文内容（Markdown/HTML） */
    content: string;
    /** 文章分类 */
    category: ArticleCategory;
    /** 封面图片 URL */
    cover?: string;
    /** 作者 */
    author?: string;
}

export interface UpdateArticleRequest {
    /** 文章标题 */
    title?: string;
    /** 文章摘要 */
    summary?: string;
    /** 文章正文内容 */
    content?: string;
    /** 文章分类 */
    category?: ArticleCategory;
    /** 封面图片 URL */
    cover?: string;
    /** 作者 */
    author?: string;
}

// ============ API 调用 ============

/**
 * 获取文章列表
 * GET /api/admin/articles
 */
export async function getArticles(params?: ArticleListParams): Promise<PaginatedData<Article>> {
    const response = await httpClient.get<PaginatedData<Article>>('/admin/articles', {
        params,
    });
    return response as unknown as PaginatedData<Article>;
}

/**
 * 获取文章详情
 * GET /api/admin/articles/:id
 */
export async function getArticleById(id: string): Promise<ArticleDetail> {
    const response = await httpClient.get<ArticleDetail>(`/admin/articles/${id}`);
    return response as unknown as ArticleDetail;
}

/**
 * 创建文章
 * POST /api/admin/articles
 */
export async function createArticle(data: CreateArticleRequest): Promise<Article> {
    const response = await httpClient.post<Article>('/admin/articles', data);
    return response as unknown as Article;
}

/**
 * 更新文章
 * PATCH /api/admin/articles/:id
 */
export async function updateArticle(id: string, data: UpdateArticleRequest): Promise<Article> {
    const response = await httpClient.patch<Article>(`/admin/articles/${id}`, data);
    return response as unknown as Article;
}

/**
 * 删除文章
 * DELETE /api/admin/articles/:id
 * 
 * 注意：仅 super_admin 可执行此操作
 */
export async function deleteArticle(id: string): Promise<void> {
    await httpClient.delete(`/admin/articles/${id}`);
}
