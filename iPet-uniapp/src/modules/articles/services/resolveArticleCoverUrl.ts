export function resolveArticleCoverUrl(coverUrl: string): string {
    if (!coverUrl) return coverUrl

    // #ifdef MP-WEIXIN
    if (coverUrl.startsWith('/static/images/articles/')) {
        return coverUrl.replace('/static/images/articles/', '/pages/articles/images/articles/')
    }
    // #endif

    return coverUrl
}

