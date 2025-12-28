export function resolveArticleImageAssetUrl(url: string): string {
    return url
}

export function normalizeArticleMarkdownImageUrls(markdown: string): string {
    if (!markdown) {
        return ''
    }

    const lines = markdown.split(/\r?\n/)
    let inCodeBlock = false
    const normalizedLines = lines.map((line) => {
        const trimmed = line.trim()
        if (trimmed.startsWith('```')) {
            inCodeBlock = !inCodeBlock
            return line
        }
        if (inCodeBlock) {
            return line
        }
        if (/^(\*{3,}|-{3,})$/.test(trimmed)) {
            return '---'
        }
        return line.replace(/\*\*([^*\n]*？)\*\*/g, '__$1__')
    })

    return normalizedLines.join('\n')
}
