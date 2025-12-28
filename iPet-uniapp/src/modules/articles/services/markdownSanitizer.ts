export const sanitizeMarkdown = (markdown: string): string => {
    if (!markdown) {
        return '';
    }

    // Escape angle brackets to avoid raw HTML injection in markdown rendering.
    return markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};
