import type { ArticleManifestItem, ArticleProvider } from '../domain/types'
import { BUILTIN_ARTICLE_CONTENT, BUILTIN_ARTICLES_MANIFEST } from '../domain/generated/builtinManifest'

const resolveTags = (article: ArticleManifestItem): string[] => {
    return article.tags?.length ? article.tags : [article.category]
}

export class LocalArticleProvider implements ArticleProvider {
    name = 'local'

    async list(): Promise<ArticleManifestItem[]> {
        return BUILTIN_ARTICLES_MANIFEST.map(article => ({
            ...article,
            tags: resolveTags(article),
            views: article.views ?? 0,
            sectionPinned: article.sectionPinned ?? false,
            sectionPinnedAt: article.sectionPinnedAt || article.updateTime,
            pinnedMetrics: article.pinnedMetrics ?? [],
        }))
    }

    async getContent(id: string): Promise<string> {
        const content = BUILTIN_ARTICLE_CONTENT[id]
        if (!content) {
            throw new Error(`Local article content not found: ${id}`)
        }
        return content
    }
}

export const localArticleProvider = new LocalArticleProvider()
