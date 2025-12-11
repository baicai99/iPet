import type { Article } from '@/types/article'
import { ARTICLES_DATA, getArticleById } from '@/data/articles'

/**
 * 获取文章列表
 * @param category 分类，'all' 表示所有分类
 */
export const getArticles = async (category: string = 'all'): Promise<Article[]> => {
    // 使用静态数据，符合 PRD 约束：全静态本地资源，秒级加载
    if (category === 'all') {
        return ARTICLES_DATA
    }
    return ARTICLES_DATA.filter(article => article.category === category)
}

/**
 * 获取文章详情
 * @param id 文章ID
 */
export const getArticleDetail = async (id: string): Promise<Article> => {
    // 从静态数据中查找
    const article = getArticleById(id)

    if (!article) {
        throw new Error(`Article not found: ${id}`)
    }

    return article
}

