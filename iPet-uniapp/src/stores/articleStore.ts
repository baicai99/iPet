import { defineStore } from 'pinia'
import type { Article } from '@/types/article'
import { ARTICLES_DATA } from '@/data/articles'

interface ArticleState {
    articles: Article[];
    isLoaded: boolean;
}

export const useArticleStore = defineStore('article', {
    state: (): ArticleState => ({
        articles: [],
        isLoaded: false
    }),
    getters: {
        getArticlesByCategory: (state) => (category: string): Article[] => {
            if (category === 'all') return state.articles
            return state.articles.filter(article => article.category === category)
        },
        getRecommendedArticles: (state) => (count: number = 2): Article[] => {
            // Simple recommendation: just take the last few
            return state.articles.slice(-count)
        },
        /**
         * 获取最新文章（按 updateTime 降序排列）
         * 用于 Summary View 展示最新资讯
         * @param count 返回数量，默认3
         */
        getLatestArticles: (state) => (count: number = 3): Article[] => {
            return [...state.articles]
                .sort((a, b) => {
                    const dateA = a.updateTime || ''
                    const dateB = b.updateTime || ''
                    if (dateA === dateB) {
                        return a.id.localeCompare(b.id)
                    }
                    return dateB.localeCompare(dateA)
                })
                .slice(0, count)
        }
    },
    actions: {
        /**
         * 加载静态文章数据
         * PRD 约束：全静态本地资源，秒级加载
         */
        loadStaticArticles() {
            if (this.isLoaded) return
            this.articles = ARTICLES_DATA
            this.isLoaded = true
        },

        /**
         * 确保文章数据已加载
         * 在需要访问文章数据前调用
         */
        ensureLoaded() {
            if (!this.isLoaded || this.articles.length === 0) {
                this.loadStaticArticles()
            }
        },

        async fetchArticles(category: string = 'all'): Promise<Article[]> {
            try {
                // 优先使用静态数据
                this.ensureLoaded()

                // 如果需要从API获取，可以在这里添加逻辑
                // 目前直接返回静态数据
                if (category === 'all') {
                    return this.articles
                }
                return this.articles.filter(a => a.category === category)
            } catch (error) {
                console.error('Failed to fetch articles', error)
                throw error
            }
        },

        async prefetchRecommended(count: number = 2) {
            try {
                this.ensureLoaded()
                return this.getRecommendedArticles(count)
            } catch (error) {
                console.error('Failed to prefetch articles', error)
                throw error
            }
        }
    }
})

