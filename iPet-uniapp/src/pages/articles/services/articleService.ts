import { useArticleStore } from '@/modules/articles/store/articleStore'
import type { ArticleManifestItem, ArticleWithContent } from '@/modules/articles/domain/types'

/**
 * 获取文章列表（仅 Meta）
 */
export const getArticles = async (category: string = 'all'): Promise<ArticleManifestItem[]> => {
    const store = useArticleStore()
    return await store.fetchArticles(category)
}

/**
 * 获取文章详情（Meta + Content）
 * ⚠️ 会触发异步加载 Content
 */
export const getArticleDetail = async (id: string): Promise<ArticleWithContent> => {
    const store = useArticleStore()
    return await store.getArticleWithContent(id)
}
