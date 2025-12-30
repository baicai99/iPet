import type { ArticleManifestItem, ArticleProvider } from '../domain/types'

export class EmptyArticleProvider implements ArticleProvider {
    name = 'empty'

    async list(): Promise<ArticleManifestItem[]> {
        return []
    }
}

export const emptyArticleProvider = new EmptyArticleProvider()
