import { resolveArticleImageAssetUrl } from './articleImageAssets'
import { APP_CONFIG } from '@/utils/config'

export function resolveArticleCoverUrl(coverUrl: string): string {
    if (!coverUrl) return coverUrl
    const resolved = resolveArticleImageAssetUrl(coverUrl)
    if (/^https?:\/\//i.test(resolved)) {
        return resolved
    }
    const base = APP_CONFIG.API_BASE_URL.replace(/\/api$/, '')
    const normalized = resolved.startsWith('/') ? resolved : `/${resolved}`
    return `${base}${normalized}`
}
