import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface SafeMarkdownProps {
    content: string;
}

export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
        >
            {content}
        </ReactMarkdown>
    );
};
