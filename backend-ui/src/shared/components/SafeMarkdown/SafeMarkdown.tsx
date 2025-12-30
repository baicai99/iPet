/**
 * SafeMarkdown - 安全的 Markdown 渲染组件
 * @description 使用 react-markdown + rehype-sanitize 防止 XSS 攻击
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { defaultSchema } from 'rehype-sanitize';
import type { Options } from 'rehype-sanitize';

export interface SafeMarkdownProps {
    /** Markdown 内容 */
    children: string;
    /** 额外的 CSS 类名 */
    className?: string;
}

/**
 * 自定义安全策略（白名单模式）
 * 基于 defaultSchema，移除危险标签和属性
 */
const sanitizeOptions: Options = {
    ...defaultSchema,
    tagNames: [
        // 基础文本
        'p', 'br', 'strong', 'em', 'del', 'code', 'span',
        // 标题
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        // 列表
        'ul', 'ol', 'li',
        // 引用和代码块
        'blockquote', 'pre',
        // 链接和图片
        'a', 'img',
        // 表格
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        // 其他
        'hr', 'div',
    ],
    attributes: {
        // 链接属性
        a: ['href', 'title', 'target', 'rel'],
        // 图片属性
        img: ['src', 'alt', 'title', 'width', 'height'],
        // 通用属性
        '*': ['className'],
    },
    // 协议白名单（禁止 javascript:）
    protocols: {
        href: ['http', 'https', 'mailto'],
        src: ['http', 'https'],
    },
};

/**
 * SafeMarkdown 组件
 * @example
 * <SafeMarkdown>
 *   # Hello World
 *   This is **safe** markdown
 * </SafeMarkdown>
 */
export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({
    children,
    className,
}) => {
    return (
        <div className={className} style={{ wordBreak: 'break-word' }}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[[rehypeSanitize, sanitizeOptions]]}
            >
                {children}
            </ReactMarkdown>
        </div>
    );
};
