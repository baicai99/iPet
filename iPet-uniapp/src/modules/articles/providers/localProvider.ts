import type { ArticleManifestItem, ArticleProvider } from '../domain/types'
import { BUILTIN_ARTICLE_CONTENT, BUILTIN_ARTICLES_MANIFEST } from '../domain/generated/builtinManifest'

export class LocalArticleProvider implements ArticleProvider {
    name = 'local'

    async list(): Promise<ArticleManifestItem[]> {
        return BUILTIN_ARTICLES_MANIFEST.map(article => ({ ...article }))
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
