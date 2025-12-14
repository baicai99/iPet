import type { ArticleManifestItem, ArticleProvider, ArticleRepositoryConfig, ArticleWithContent } from './types'

const CHANNEL_ORDER: Record<string, number> = {
    hotfix: 0,
    hot: 1,
    rumor: 2,
    basic: 3
}

export class ArticleRepository {
    private combined: ArticleManifestItem[] = []
    private localManifest: ArticleManifestItem[] = []
    private remoteManifest: ArticleManifestItem[] = []
    private loading: Promise<ArticleManifestItem[]> | null = null

    constructor(
        private readonly localProvider: ArticleProvider,
        private readonly remoteProvider: ArticleProvider,
        private readonly config: ArticleRepositoryConfig = {}
    ) {}

    private logWarning(...args: unknown[]) {
        if (this.config.enableLogging === false) return
        console.warn('[ArticleRepository]', ...args)
    }

    private sortManifest(list: ArticleManifestItem[]): ArticleManifestItem[] {
        return [...list].sort((a, b) => {
            const channelDiff = (CHANNEL_ORDER[a.channel] ?? 99) - (CHANNEL_ORDER[b.channel] ?? 99)
            if (channelDiff !== 0) return channelDiff
            if (b.priority !== a.priority) return b.priority - a.priority
            const timeDiff = b.updateTime.localeCompare(a.updateTime)
            if (timeDiff !== 0) return timeDiff
            return a.id.localeCompare(b.id)
        })
    }

    private merge(local: ArticleManifestItem[], remote: ArticleManifestItem[]): ArticleManifestItem[] {
        const merged = new Map<string, ArticleManifestItem>()

        local.forEach(item => merged.set(item.id, item))
        remote.forEach(item => {
            const exists = merged.get(item.id)
            if (exists && item.overrideBuiltin) {
                merged.set(item.id, item)
            } else if (exists && !item.overrideBuiltin) {
                this.logWarning(`Duplicate article id without override: ${item.id}`)
            } else {
                merged.set(item.id, item)
            }
        })

        return this.sortManifest([...merged.values()])
    }

    private async load(force = false): Promise<ArticleManifestItem[]> {
        if (force) {
            this.combined = []
        }
        if (this.combined.length && !force) {
            return this.combined
        }
        if (this.loading) {
            return this.loading
        }

        this.loading = (async () => {
            const [local, remote] = await Promise.all([
                this.localProvider.list(),
                this.remoteProvider.list().catch((error) => {
                    this.logWarning('Failed to load remote manifest:', error)
                    return [] as ArticleManifestItem[]
                })
            ])

            this.localManifest = local
            this.remoteManifest = remote
            this.combined = this.merge(local, remote)
            return this.combined
        })()

        try {
            return await this.loading
        } finally {
            this.loading = null
        }
    }

    async list(force = false): Promise<ArticleManifestItem[]> {
        return this.load(force)
    }

    async getArticleMeta(id: string): Promise<ArticleManifestItem | undefined> {
        const manifest = await this.load()
        return manifest.find(article => article.id === id)
    }

    async getArticleWithContent(id: string): Promise<ArticleWithContent> {
        await this.load()
        const localItem = this.localManifest.find(article => article.id === id)
        const remoteItem = this.remoteManifest.find(article => article.id === id)

        const loadLocalContent = async () => {
            if (!localItem || !this.localProvider.getContent) return null
            const content = await this.localProvider.getContent(id)
            return { ...localItem, content }
        }

        const loadRemoteContent = async () => {
            if (!remoteItem || !this.remoteProvider.getContent) return null
            const content = await this.remoteProvider.getContent(id, remoteItem.hash)
            return { ...remoteItem, content }
        }

        if (remoteItem?.overrideBuiltin) {
            try {
                const remoteContent = await loadRemoteContent()
                if (remoteContent) return remoteContent
            } catch (error) {
                this.logWarning('Remote override failed, falling back to local', error)
                const fallback = await loadLocalContent()
                if (fallback) return fallback
                throw error
            }
        }

        if (localItem) {
            const localContent = await loadLocalContent()
            if (localContent) return localContent
        }

        if (remoteItem) {
            const remoteContent = await loadRemoteContent()
            if (remoteContent) return remoteContent
        }

        throw new Error(`Article not found: ${id}`)
    }
}
