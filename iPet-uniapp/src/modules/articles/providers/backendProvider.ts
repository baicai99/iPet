import type { ArticleManifestItem, ArticleProvider, ArticleWithContent } from '../domain/types'
import { articleCache } from '../services/articleCache'
import request from '@/utils/common/request'

interface BackendArticle {
    id: string
    title: string
    summary: string
    cover?: string | null
    category: string
    author?: string | null
    tags?: string[] | null
    views?: number | null
    sectionPinned?: boolean | null
    sectionPinnedAt?: string | null
    pinnedMetrics?: string[] | null
    content?: string | null
    createdAt?: string
    updatedAt?: string
}

const DEFAULT_LIMIT = 100
const DEFAULT_CHANNEL = 'basic'

const resolveUpdateTime = (article: BackendArticle): string => {
    return article.updatedAt || article.createdAt || new Date().toISOString()
}

const resolveTags = (article: BackendArticle): string[] => {
    const tags = (article.tags || []).map(tag => tag.trim()).filter(Boolean)
    return tags.length ? tags : [article.category]
}

const toManifestItem = (article: BackendArticle): ArticleManifestItem => {
    const updateTime = resolveUpdateTime(article)
    return {
        id: article.id,
        title: article.title,
        summary: article.summary,
        cover: article.cover || '',
        category: article.category,
        author: article.author || 'iPet',
        tags: resolveTags(article),
        updateTime,
        views: article.views ?? 0,
        sectionPinned: Boolean(article.sectionPinned),
        sectionPinnedAt: article.sectionPinnedAt || updateTime,
        pinnedMetrics: article.pinnedMetrics || [],
        metricKey: undefined,
        source: 'remote',
        channel: DEFAULT_CHANNEL,
        priority: 0,
        contentPath: `/articles/${article.id}`,
        hash: updateTime,
        size: 0,
        readingTime: 0
    }
}

export class BackendArticleProvider implements ArticleProvider {
    name = 'backend'

    async list(): Promise<ArticleManifestItem[]> {
        const response = await request<BackendArticle[] | { items?: BackendArticle[] }>({
            url: '/articles',
            method: 'GET',
            data: {
                category: 'all',
                page: 1,
                limit: DEFAULT_LIMIT
            },
            skipErrorHandle: true
        })

        const items = Array.isArray(response) ? response : response.items || []
        return items.map(toManifestItem)
    }

    async getContent(id: string, hash?: string): Promise<string> {
        const cached = articleCache.get(id, hash)
        if (cached) return cached

        try {
            const article = await request<BackendArticle>({
                url: `/articles/${id}`,
                method: 'GET',
                skipErrorHandle: true
            })

            if (!article || !article.content) {
                throw new Error(`Article content not found: ${id}`)
            }

            const version = resolveUpdateTime(article)
            articleCache.set(id, article.content, version)
            return article.content
        } catch (error) {
            const fallback = articleCache.get(id, hash)
            if (fallback) return fallback
            throw error
        }
    }
}

export const backendArticleProvider = new BackendArticleProvider()
