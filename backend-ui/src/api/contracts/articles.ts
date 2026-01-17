/**
 * 文章管理 API 契约
 */

import getHttpClient from '../client';
import type {
    ApiResponseWithMeta,
    Article,
    ArticleDetail,
    ArticleCategory,
    ArticleCategoryOption,
    PaginatedData,
    PaginationParams,
} from '../types';
import type { RawPaginatedData } from '../pagination';
import { normalizePaginatedData } from '../pagination';

// ============ 请求类型 ============

export interface ArticleListParams extends PaginationParams {
    /** 文章分类 */
    category?: ArticleCategory;
    /** 搜索标题/摘要 */
    search?: string;
    /** 列表置顶筛选 */
    pinned?: boolean;
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
    /** 文章标签 */
    tags: string[];
    /** 封面图片 URL */
    cover?: string;
    /** 作者 */
    author?: string;
    /** 列表置顶 */
    sectionPinned?: boolean;
    /** 类目置顶（指标 key 列表） */
    pinnedMetrics?: string[];
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
    /** 文章标签 */
    tags?: string[];
    /** 封面图片 URL */
    cover?: string;
    /** 作者 */
    author?: string;
    /** 列表置顶 */
    sectionPinned?: boolean;
    /** 类目置顶（指标 key 列表） */
    pinnedMetrics?: string[];
}

export interface CreateArticleCategoryRequest {
    key: string;
    label: string;
    order?: number;
}

export interface UpdateArticleCategoryRequest {
    label?: string;
    order?: number;
}

export interface BulkActionResult {
    successIds: string[];
    failed: { id: string; reason: string }[];
}

// ============ API 调用 ============

/**
 * 获取文章列表
 * GET /api/admin/articles
 */
export async function getArticles(params?: ArticleListParams): Promise<PaginatedData<Article>> {
    const response = await getHttpClient().get<ApiResponseWithMeta<RawPaginatedData<Article>>>('/admin/articles', {
        params,
    }) as unknown as ApiResponseWithMeta<RawPaginatedData<Article>>;
    return normalizePaginatedData(response.data);
}

/**
 * 获取文章分类
 * GET /api/admin/articles/categories
 */
export async function getArticleCategories(): Promise<ArticleCategoryOption[]> {
    const response = await getHttpClient().get<ApiResponseWithMeta<ArticleCategoryOption[]>>('/admin/articles/categories') as unknown as ApiResponseWithMeta<ArticleCategoryOption[]>;
    return response.data;
}

/**
 * 创建文章分类
 * POST /api/admin/articles/categories
 */
export async function createArticleCategory(data: CreateArticleCategoryRequest): Promise<ArticleCategoryOption> {
    const response = await getHttpClient().post<ApiResponseWithMeta<ArticleCategoryOption>>('/admin/articles/categories', data) as unknown as ApiResponseWithMeta<ArticleCategoryOption>;
    return response.data;
}

/**
 * 更新文章分类
 * PATCH /api/admin/articles/categories/:key
 */
export async function updateArticleCategory(key: string, data: UpdateArticleCategoryRequest): Promise<ArticleCategoryOption> {
    const response = await getHttpClient().patch<ApiResponseWithMeta<ArticleCategoryOption>>(`/admin/articles/categories/${key}`, data) as unknown as ApiResponseWithMeta<ArticleCategoryOption>;
    return response.data;
}

/**
 * 删除文章分类
 * DELETE /api/admin/articles/categories/:key
 */
export async function deleteArticleCategory(key: string, target?: string): Promise<{ migrated: number; targetCategory: string | null }> {
    const response = await getHttpClient().delete<ApiResponseWithMeta<{ migrated: number; targetCategory: string | null }>>(
        `/admin/articles/categories/${key}`,
        { params: target ? { target } : undefined }
    ) as unknown as ApiResponseWithMeta<{ migrated: number; targetCategory: string | null }>;
    return response.data;
}

/**
 * 批量删除文章
 * POST /api/admin/articles/bulk-delete
 */
export async function bulkDeleteArticles(ids: string[]): Promise<BulkActionResult> {
    const response = await getHttpClient().post<ApiResponseWithMeta<BulkActionResult>>(
        '/admin/articles/bulk-delete',
        { ids }
    ) as unknown as ApiResponseWithMeta<BulkActionResult>;
    return response.data;
}

/**
 * 批量改分类
 * PATCH /api/admin/articles/bulk-category
 */
export async function bulkUpdateArticleCategory(ids: string[], category: ArticleCategory): Promise<BulkActionResult> {
    const response = await getHttpClient().patch<ApiResponseWithMeta<BulkActionResult>>(
        '/admin/articles/bulk-category',
        { ids, category }
    ) as unknown as ApiResponseWithMeta<BulkActionResult>;
    return response.data;
}

/**
 * 批量置顶/取消置顶
 * PATCH /api/admin/articles/bulk-pin
 */
export async function bulkUpdateArticlePinned(ids: string[], sectionPinned: boolean): Promise<BulkActionResult> {
    const response = await getHttpClient().patch<ApiResponseWithMeta<BulkActionResult>>(
        '/admin/articles/bulk-pin',
        { ids, sectionPinned }
    ) as unknown as ApiResponseWithMeta<BulkActionResult>;
    return response.data;
}

/**
 * 获取文章详情
 * GET /api/admin/articles/:id
 */
export async function getArticleById(id: string): Promise<ArticleDetail> {
    const response = await getHttpClient().get<ApiResponseWithMeta<ArticleDetail>>(`/admin/articles/${id}`) as unknown as ApiResponseWithMeta<ArticleDetail>;
    return response.data;
}

/**
 * 创建文章
 * POST /api/admin/articles
 */
export async function createArticle(data: CreateArticleRequest): Promise<Article> {
    const response = await getHttpClient().post<ApiResponseWithMeta<Article>>('/admin/articles', data) as unknown as ApiResponseWithMeta<Article>;
    return response.data;
}

/**
 * 更新文章
 * PATCH /api/admin/articles/:id
 */
export async function updateArticle(id: string, data: UpdateArticleRequest): Promise<Article> {
    const response = await getHttpClient().patch<ApiResponseWithMeta<Article>>(`/admin/articles/${id}`, data) as unknown as ApiResponseWithMeta<Article>;
    return response.data;
}

/**
 * 删除文章
 * DELETE /api/admin/articles/:id
 * 
 * 注意：仅 admin 可执行此操作
 */
export async function deleteArticle(id: string): Promise<void> {
    await getHttpClient().delete(`/admin/articles/${id}`);
}
