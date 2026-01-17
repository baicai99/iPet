export type ArticleSource = 'builtin' | 'remote'
export type ArticleChannel = 'basic' | 'hot' | 'rumor' | 'hotfix'
export type ArticlePinScope = 'section' | 'metric'
export type ArticleCategory = 'education' | 'recipe' | 'mythbust' | 'news' | string

export interface ArticleCategoryOption {
    key: string
    label: string
    order: number
}

export interface ArticleFrontmatter {
    id: string
    title: string
    summary: string
    cover: string
    category: ArticleCategory
    author: string
    tags: string[]
    updateTime: string
    views?: number
    sectionPinned?: boolean
    sectionPinnedAt?: string
    pinnedMetrics?: string[]
    metricKey?: string
    source?: ArticleSource
    channel?: ArticleChannel
    priority?: number
    overrideBuiltin?: boolean
}

type RequiredFrontmatter = Required<Omit<ArticleFrontmatter, 'metricKey' | 'overrideBuiltin' | 'source' | 'channel' | 'priority' | 'views' | 'sectionPinned' | 'sectionPinnedAt' | 'pinnedMetrics'>>

export interface ArticleManifestItem extends RequiredFrontmatter {
    metricKey?: string
    source: ArticleSource
    channel: ArticleChannel
    priority: number
    overrideBuiltin?: boolean
    views?: number
    sectionPinned?: boolean
    sectionPinnedAt?: string
    pinnedMetrics?: string[]
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
