import type { ArticleManifestItem } from './types'

const CHANNEL_WEIGHT: Record<string, number> = {
    hotfix: 4,
    hot: 3,
    rumor: 2,
    basic: 1
}

function sortByScore(items: { article: ArticleManifestItem; score: number }[]) {
    return items.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        if (b.article.priority !== a.article.priority) {
            return b.article.priority - a.article.priority
        }
        return b.article.updateTime.localeCompare(a.article.updateTime)
    })
}

export function recommendByTags(
    articles: ArticleManifestItem[],
    tags: string[],
    excludeId?: string,
    count: number = 3
): ArticleManifestItem[] {
    if (!tags.length) return []
    const tagSet = new Set(tags)

    const matched = articles
        .filter(article => article.id !== excludeId)
        .map(article => {
            const matchCount = article.tags.reduce((acc, tag) => acc + (tagSet.has(tag) ? 1 : 0), 0)
            if (matchCount === 0) return null
            const score = matchCount * 10 + (CHANNEL_WEIGHT[article.channel] ?? 0)
            return { article, score }
        })
        .filter((item): item is { article: ArticleManifestItem; score: number } => Boolean(item))

    return sortByScore(matched).slice(0, count).map(item => item.article)
}

export function recommendByMetric(
    articles: ArticleManifestItem[],
    metricKey: string,
    excludeId?: string,
    count: number = 2
): ArticleManifestItem[] {
    if (!metricKey) return []
    const matched = articles
        .filter(article => article.id !== excludeId && (article.metricKey === metricKey || article.tags.includes(metricKey)))
        .map(article => ({
            article,
            score: (CHANNEL_WEIGHT[article.channel] ?? 0) + article.priority
        }))

    return sortByScore(matched).slice(0, count).map(item => item.article)
}

export function recommendLatest(
    articles: ArticleManifestItem[],
    excludeId?: string,
    count: number = 3
): ArticleManifestItem[] {
    return articles
        .filter(article => article.id !== excludeId)
        .sort((a, b) => b.updateTime.localeCompare(a.updateTime))
        .slice(0, count)
}
