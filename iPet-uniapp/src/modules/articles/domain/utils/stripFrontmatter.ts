const FRONTMATTER_REGEX = /^---\s*\n[\s\S]*?\n---\s*\n?/

/**
 * Removes YAML frontmatter from a markdown string.
 * Frontmatter is defined as a leading block wrapped by ---.
 */
export function stripFrontmatter(content: string): string {
    if (!content || !content.startsWith('---')) {
        return content?.trimStart() || ''
    }

    const stripped = content.replace(FRONTMATTER_REGEX, '')
    return stripped.trimStart()
}

