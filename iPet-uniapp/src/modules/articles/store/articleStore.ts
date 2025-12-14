import { defineStore } from 'pinia'
import { articleRepository } from '../domain/repositoryInstance'
import type { ArticleManifestItem, ArticleWithContent } from '../domain/types'

interface ArticleState {
    manifest: ArticleManifestItem[]
    isLoaded: boolean
    contentCache: Map<string, string>
}

export const useArticleStore = defineStore('article', {
    state: (): ArticleState => ({
        manifest: [],
        isLoaded: false,
        contentCache: new Map()
    }),

    getters: {
        getArticlesByCategory: (state) => (category: string): ArticleManifestItem[] => {
            if (category === 'all') return state.manifest
            return state.manifest.filter(article => article.category === category)
        },
        getLatestArticles: (state) => (count: number = 3): ArticleManifestItem[] => {
            return [...state.manifest]
                .sort((a, b) => b.updateTime.localeCompare(a.updateTime))
                .slice(0, count)
        },
        getArticleMeta: (state) => (id: string): ArticleManifestItem | undefined => {
            return state.manifest.find(article => article.id === id)
        },
        getRecommendedArticles: (state) => (count: number = 2): ArticleManifestItem[] => {
            return state.manifest.slice(0, count)
        }
    },

    actions: {
        async ensureLoaded(force = false): Promise<void> {
            if (this.isLoaded && !force) return
            this.manifest = await articleRepository.list(force)
            this.isLoaded = true
        },

        async refresh(): Promise<void> {
            await this.ensureLoaded(true)
        },

        async fetchArticles(category: string = 'all'): Promise<ArticleManifestItem[]> {
            await this.ensureLoaded()
            if (category === 'all') {
                return this.manifest
            }
            return this.manifest.filter(article => article.category === category)
        },

        async getArticleWithContent(id: string): Promise<ArticleWithContent> {
            await this.ensureLoaded()
            if (this.contentCache.has(id)) {
                const meta = this.getArticleMeta(id)
                if (meta) {
                    return { ...meta, content: this.contentCache.get(id)! }
                }
            }

            const article = await articleRepository.getArticleWithContent(id)
            this.contentCache.set(id, article.content)
            return article
        }
    }
})

