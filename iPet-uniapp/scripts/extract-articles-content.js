#!/usr/bin/env node

/**
 * 从 articles.ts 提取 content 到独立的 .md 文件
 * 用于一次性迁移现有内容
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ARTICLES_FILE = path.resolve(__dirname, '../src/data/articles.ts')
const OUTPUT_DIR = path.resolve(__dirname, '../../articles-source/md')

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// 读取 articles.ts
const content = fs.readFileSync(ARTICLES_FILE, 'utf-8')

// 提取 HTML 转 Markdown 的简单转换
function htmlToMarkdown(html) {
    return html
        // 移除开头的反引号和 content: 
        .replace(/`/g, '')
        // H2 标题
        .replace(/<h2>(.*?)<\/h2>/g, '## $1')
        // 段落
        .replace(/<p>(.*?)<\/p>/g, '\n$1\n')
        // 无序列表
        .replace(/<ul>/g, '')
        .replace(/<\/ul>/g, '')
        .replace(/<li>(.*?)<\/li>/g, '- $1')
        // 有序列表
        .replace(/<ol>/g, '')
        .replace(/<\/ol>/g, '')
        // 清理多余空行
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

// 正则提取所有文章对象
const articleMatches = content.matchAll(/{[\s\S]*?id:\s*'([^']+)'[\s\S]*?content:\s*`([\s\S]*?)`[\s\S]*?cover:/g)

let count = 0
for (const match of articleMatches) {
    const id = match[1]
    const htmlContent = match[2]

    // 转换为 Markdown
    const markdown = htmlToMarkdown(htmlContent)

    // 写入文件
    const outputFile = path.join(OUTPUT_DIR, `${id}.md`)
    fs.writeFileSync(outputFile, markdown, 'utf-8')

    console.log(`✅ Extracted: ${id}.md`)
    count++
}

console.log(`\n📦 Total extracted: ${count} articles`)
console.log(`📁 Output directory: ${OUTPUT_DIR}`)
