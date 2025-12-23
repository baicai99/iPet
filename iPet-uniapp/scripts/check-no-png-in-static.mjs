#!/usr/bin/env node
/**
 * 检查 src/static 目录下是否存在不允许的 PNG 文件
 * 允许：tabs 目录下的小图标、logo.png
 * 禁止：其他任何大 PNG（防止误入小程序包）
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// 配置
const DIRS_TO_CHECK = ['src/static', 'src/pages']
const ALLOWLIST_PATTERNS = [
    /^src\/static\/tabs\//,  // TabBar 图标允许
    /^src\/static\/logo\.png$/,  // Logo 允许
]
const MAX_ALLOWED_SIZE_KB = 50  // 允许的最大单文件大小（KB）

function walk(dir) {
    const results = []
    if (!fs.existsSync(dir)) return results

    for (const name of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, name)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
            results.push(...walk(fullPath))
        } else {
            results.push({ path: fullPath, size: stat.size })
        }
    }
    return results
}

function isAllowed(relativePath) {
    return ALLOWLIST_PATTERNS.some(pattern => pattern.test(relativePath))
}

const offenders = []
for (const dir of DIRS_TO_CHECK) {
    const absDir = path.join(ROOT, dir)
    for (const { path: filePath, size } of walk(absDir)) {
        if (!filePath.toLowerCase().endsWith('.png')) continue

        const relativePath = path.relative(ROOT, filePath)

        // 检查是否在 allowlist 中
        if (isAllowed(relativePath)) continue

        // 检查大小是否超过阈值
        const sizeKB = size / 1024
        if (sizeKB <= MAX_ALLOWED_SIZE_KB) continue

        offenders.push({ path: relativePath, sizeKB: sizeKB.toFixed(1) })
    }
}

if (offenders.length > 0) {
    console.error('\x1b[31m❌ Forbidden PNG files detected:\x1b[0m')
    offenders.forEach(f => console.error(`   - ${f.path} (${f.sizeKB} KB)`))
    console.error('')
    console.error('These PNG files will be bundled into the mini-program package.')
    console.error('Actions:')
    console.error('  1. Move to assets_master/ (for preservation)')
    console.error('  2. Or convert to WebP and place in src/static/images/articles/')
    console.error('')
    process.exit(1)
} else {
    console.log('\x1b[32m✓ No forbidden PNG files in packable directories\x1b[0m')
}
