const ARTICLE_STATIC_IMAGE_PREFIX = '/static/images/articles/'
const ARTICLE_MP_IMAGE_PREFIX = '/pages/articles/images/articles/'

// Production builds currently only ship `/static/images/articles`, so keep the original prefix.
const usePagesArticleImages = false

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const staticImageRegex = new RegExp(escapeRegExp(ARTICLE_STATIC_IMAGE_PREFIX), 'g')

export function resolveArticleImageAssetUrl(url: string): string {
    if (!url || !usePagesArticleImages) return url
    if (!url.startsWith(ARTICLE_STATIC_IMAGE_PREFIX)) return url
    return url.replace(ARTICLE_STATIC_IMAGE_PREFIX, ARTICLE_MP_IMAGE_PREFIX)
}

export function normalizeArticleMarkdownImageUrls(markdown: string): string {
    if (!markdown || !usePagesArticleImages) return markdown
    if (!staticImageRegex.test(markdown)) {
        return markdown
    }
    return markdown.replace(staticImageRegex, ARTICLE_MP_IMAGE_PREFIX)
}
