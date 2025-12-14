const STORAGE_KEY = 'ipet:articles-cache:v1'

interface CachedArticle {
    id: string
    hash: string
    content: string
    cachedAt: string
}

function safeGetStorage(): string | undefined {
    try {
        if (typeof uni !== 'undefined' && typeof uni.getStorageSync === 'function') {
            return uni.getStorageSync(STORAGE_KEY)
        }
    } catch (error) {
        console.warn('[ArticleCache] Failed to read storage:', error)
    }
    return undefined
}

function safeSetStorage(value: string): void {
    try {
        if (typeof uni !== 'undefined' && typeof uni.setStorageSync === 'function') {
            uni.setStorageSync(STORAGE_KEY, value)
        }
    } catch (error) {
        console.warn('[ArticleCache] Failed to persist cache:', error)
    }
}

class ArticleCache {
    private cache = new Map<string, CachedArticle>()

    constructor() {
        const raw = safeGetStorage()
        if (raw) {
            try {
                const parsed: CachedArticle[] = JSON.parse(raw)
                parsed.forEach(entry => this.cache.set(entry.id, entry))
            } catch (error) {
                console.warn('[ArticleCache] Failed to parse cache, ignoring', error)
            }
        }
    }

    get(id: string, hash?: string): string | null {
        const entry = this.cache.get(id)
        if (!entry) return null
        if (hash && entry.hash !== hash) return null
        return entry.content
    }

    set(id: string, content: string, hash: string): void {
        const entry: CachedArticle = {
            id,
            hash,
            content,
            cachedAt: new Date().toISOString()
        }
        this.cache.set(id, entry)
        safeSetStorage(JSON.stringify([...this.cache.values()]))
    }

    clear(): void {
        this.cache.clear()
        safeSetStorage(JSON.stringify([]))
    }
}

export const articleCache = new ArticleCache()

