#!/usr/bin/env node

/**
 * 批量更新文章 frontmatter 中的 cover 路径
 * 将封面路径统一替换为 .jpg
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CONTENT_DIR = path.resolve(ROOT, '../articles-source/md')

const colors = {
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
}

function log(color, symbol, message) {
    console.log(`${colors[color]}${symbol} ${message}${colors.reset}`)
}

function updateFrontmatter() {
    log('cyan', '📝', 'Updating article frontmatter...\n')

    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'))

    let updated = 0
    let unchanged = 0

    for (const file of files) {
        const filePath = path.join(CONTENT_DIR, file)
        let content = fs.readFileSync(filePath, 'utf-8')

        // 替换 cover 路径中的图片扩展名
        const original = content
        content = content.replace(
            /^cover:\s*["']?(\/static\/images\/articles\/.+)\.(png|jpg|jpeg|webp)["']?$/gm,
            'cover: "$1.jpg"'
        )

        if (content !== original) {
            fs.writeFileSync(filePath, content)
            log('green', '✓', file)
            updated++
        } else {
            unchanged++
        }
    }

    console.log('')
    log('cyan', '📊', `Updated: ${updated}, Unchanged: ${unchanged}, Total: ${files.length}`)
}

updateFrontmatter()
