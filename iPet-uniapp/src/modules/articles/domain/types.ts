export type ArticleSource = 'builtin' | 'remote'
export type ArticleChannel = 'basic' | 'hot' | 'rumor' | 'hotfix'
export type ArticleCategory = 'education' | 'recipe' | 'mythbust' | 'news' | string

export interface ArticleFrontmatter {
    id: string
    title: string
    summary: string
    cover: string
    category: ArticleCategory
    author: string
    tags: string[]
    updateTime: string
    metricKey?: string
    source?: ArticleSource
    channel?: ArticleChannel
    priority?: number
    overrideBuiltin?: boolean
}

export interface ArticleManifestItem extends Required<Omit<ArticleFrontmatter, 'metricKey' | 'overrideBuiltin' | 'source' | 'channel' | 'priority'>> {
    metricKey?: string
    source: ArticleSource
    channel: ArticleChannel
    priority: number
    overrideBuiltin?: boolean
    contentPath: string
    hash: string
    size: number
    readingTime: number
}

export interface ArticlesManifest {
    schemaVersion: string
    contentVersion: string
    generatedAt: string
    articles: ArticleManifestItem[]
}

export interface ArticleWithContent extends ArticleManifestItem {
    content: string
}

export interface ArticleProvider {
    name: string
    list(): Promise<ArticleManifestItem[]>
    getContent?(id: string, hash?: string): Promise<string>
}

export interface ArticleRepositoryConfig {
    remoteBaseUrl?: string
    enableLogging?: boolean
}

