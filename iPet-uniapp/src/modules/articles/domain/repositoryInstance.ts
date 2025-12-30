import { ArticleRepository } from './repository'
import type { ArticleRepositoryConfig } from './types'
import { emptyArticleProvider } from '../providers/emptyProvider'
import { backendArticleProvider } from '../providers/backendProvider'

const DEFAULT_CONFIG: ArticleRepositoryConfig = {
    enableLogging: true
}

export const articleRepository = new ArticleRepository(
    emptyArticleProvider,
    backendArticleProvider,
    DEFAULT_CONFIG
)
