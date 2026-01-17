import type { ArticleManifestItem, ArticleProvider } from '../domain/types'
import { articleCache } from '../services/articleCache'
import { fetchManifest, fetchMarkdown } from '../services/articleApi'

interface RemoteProviderOptions {
    baseUrl?: string
}

const applyManifestDefaults = (article: ArticleManifestItem): ArticleManifestItem => ({
    ...article,
    tags: article.tags?.length ? article.tags : [article.category],
    views: article.views ?? 0,
    sectionPinned: article.sectionPinned ?? false,
    sectionPinnedAt: article.sectionPinnedAt || article.updateTime,
    pinnedMetrics: article.pinnedMetrics ?? [],
})

export class RemoteArticleProvider implements ArticleProvider {
    name = 'remote'
    private manifest: ArticleManifestItem[] = []
    private manifestVersion: string | null = null
    private loadingPromise: Promise<ArticleManifestItem[]> | null = null

    constructor(private readonly options: RemoteProviderOptions = {}) {}

    private get baseUrl(): string {
        return this.options.baseUrl || '/static/articles'
    }

    async list(): Promise<ArticleManifestItem[]> {
        if (this.manifest.length) {
            return this.manifest.map(article => applyManifestDefaults(article))
        }
        if (this.loadingPromise) {
            return this.loadingPromise
        }

        this.loadingPromise = (async () => {
            const manifest = await fetchManifest(this.baseUrl)
            this.manifestVersion = manifest.contentVersion
            this.manifest = manifest.articles.filter(item => item.source === 'remote').map(applyManifestDefaults)
            return this.manifest
        })()

        try {
            const result = await this.loadingPromise
            return result.map(article => applyManifestDefaults(article))
        } finally {
            this.loadingPromise = null
        }
    }

    async refresh(): Promise<void> {
        this.manifest = []
        this.manifestVersion = null
        await this.list()
    }

    async getContent(id: string, hash?: string): Promise<string> {
        const manifest = await this.list()
        const target = manifest.find(item => item.id === id)
        if (!target) {
            throw new Error(`Remote article not found: ${id}`)
        }

        try {
            const markdown = await fetchMarkdown(target.contentPath, this.baseUrl)
            articleCache.set(id, markdown, target.hash)
            return markdown
        } catch (error) {
            const cached = articleCache.get(id, hash || target.hash)
            if (cached) {
                console.warn('[RemoteArticleProvider] Network failed, using cached content for', id)
                return cached
            }
            throw error
        }
    }
}

export const remoteArticleProvider = new RemoteArticleProvider()
