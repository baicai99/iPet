import { resolveArticleImageAssetUrl } from './articleImageAssets'

export function resolveArticleCoverUrl(coverUrl: string): string {
    if (!coverUrl) return coverUrl
    return resolveArticleImageAssetUrl(coverUrl)
}
