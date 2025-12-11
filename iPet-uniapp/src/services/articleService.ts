import request from '@/utils/common/request'
import type { Article } from '@/types/article'

type MaybeWrapped<T> = T | { data: T }

const unwrapData = <T>(payload: MaybeWrapped<T>): T => {
    if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, any>)) {
        return (payload as { data: T }).data
    }
    return payload as T
}

export const getArticles = async (category: string = 'all'): Promise<Article[]> => {
    const query = category && category !== 'all' ? { category } : undefined
    const response = await request<MaybeWrapped<Article[]>>({
        url: '/articles',
        method: 'GET',
        data: query
    })
    const normalized = unwrapData<Article[] | undefined>(response) || []
    return Array.isArray(normalized) ? normalized : []
}

export const getArticleDetail = async (id: string): Promise<Article> => {
    const response = await request<MaybeWrapped<Article>>({
        url: `/articles/${id}`,
        method: 'GET'
    })
    const normalized = unwrapData<Article | null | undefined>(response)
    if (!normalized) {
        throw new Error('Article not found')
    }
    return normalized
}
