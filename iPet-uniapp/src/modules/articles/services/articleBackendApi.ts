import request from '@/utils/common/request'
import type { ArticleCategoryOption } from '../domain/types'

export async function fetchArticleCategories(): Promise<ArticleCategoryOption[]> {
    return await request<ArticleCategoryOption[]>({
        url: '/articles/categories',
        method: 'GET',
        skipErrorHandle: true
    })
}
