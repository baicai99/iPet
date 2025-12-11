import { defineStore } from 'pinia'
import type { Article } from '@/types/article'

interface ArticleState {
    articles: Article[];
}

export const useArticleStore = defineStore('article', {
    state: (): ArticleState => ({
        articles: []
    }),
    getters: {
        getArticlesByCategory: (state) => (category: string): Article[] => {
            if (category === 'all') return state.articles
            return state.articles.filter(article => article.category === category)
        },
        getRecommendedArticles: (state) => (count: number = 2): Article[] => {
            // Simple recommendation: just take the last few
            return state.articles.slice(-count)
        }
    },
    actions: {
        async fetchArticles(category: string = 'all'): Promise<Article[]> {
            try {
                // Dynamic import to avoid circular dependencies if any, 
                // though usually services should be imported at top level if possible.
                // Assuming articleService is a module with getArticles
                const { getArticles } = await import('@/services/articleService')
                const res = await getArticles(category)
                this.articles = res
                return this.articles
            } catch (error) {
                console.error('Failed to fetch articles', error)
                throw error
            }
        },
        async prefetchRecommended(count: number = 2) {
            try {
                if (this.articles.length === 0) {
                    await this.fetchArticles()
                }
                return this.getRecommendedArticles(count)
            } catch (error) {
                console.error('Failed to prefetch articles', error)
                throw error
            }
        }
    }
})
