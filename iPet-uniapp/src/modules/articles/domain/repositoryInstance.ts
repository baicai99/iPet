import { ArticleRepository } from './repository'
import type { ArticleRepositoryConfig } from './types'
import { localArticleProvider } from '../providers/localProvider'
import { remoteArticleProvider } from '../providers/remoteProvider'

const DEFAULT_CONFIG: ArticleRepositoryConfig = {
    remoteBaseUrl: '/static/articles',
    enableLogging: true
}

export const articleRepository = new ArticleRepository(
    localArticleProvider,
    remoteArticleProvider,
    DEFAULT_CONFIG
)

