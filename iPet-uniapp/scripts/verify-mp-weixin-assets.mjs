#!/usr/bin/env node
/**
 * 构建后验收：检查微信小程序产物中的资产
 * 1. 禁止大 PNG（除 tabs）
 * 2. 检查是否仍存在 WebP
 * 3. 报告总包大小
 */
import fs from 'node:fs'
import path from 'node:path'

function parseArgs(argv) {
    const args = {}
    for (let i = 0; i < argv.length; i++) {
        if (!argv[i].startsWith('--')) continue
        const key = argv[i].slice(2)
        const next = argv[i + 1]
        args[key] = (!next || next.startsWith('--')) ? true : next
        if (typeof args[key] === 'string') i++
    }
    return args
}

function walk(dir) {
    const results = []
    if (!fs.existsSync(dir)) return results
    for (const name of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, name)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) results.push(...walk(fullPath))
        else results.push({ path: fullPath, size: stat.size })
    }
    return results
}

function main() {
    const args = parseArgs(process.argv.slice(2))
    const distDir = path.resolve(args.dist ?? 'dist/build/mp-weixin')

    if (!fs.existsSync(distDir)) {
        console.error(`❌ Dist directory not found: ${distDir}`)
        process.exit(1)
    }

    const allFiles = walk(distDir)
    const pngFiles = allFiles.filter(f => f.path.toLowerCase().endsWith('.png'))
    const jpgFiles = allFiles.filter(f => f.path.toLowerCase().endsWith('.jpg'))
    const webpFiles = allFiles.filter(f => f.path.toLowerCase().endsWith('.webp'))

    // 检查 PNG
    const forbiddenPngs = pngFiles.filter(f => {
        const relativePath = path.relative(distDir, f.path)
        // 允许 tabs 和 logo
        if (relativePath.startsWith('static/tabs/')) return false
        if (relativePath === 'static/logo.png') return false
        // 禁止大于 50KB 的 PNG
        return f.size > 50 * 1024
    })

    // 计算大小
    const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0)
    const pngSize = pngFiles.reduce((sum, f) => sum + f.size, 0)
    const jpgSize = jpgFiles.reduce((sum, f) => sum + f.size, 0)

    console.log('─'.repeat(60))
    console.log('📊 MP-Weixin Build Asset Report')
    console.log('─'.repeat(60))
    console.log(`Total size:     ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`PNG total:      ${(pngSize / 1024).toFixed(0)} KB (${pngFiles.length} files)`)
    console.log(`JPG total:      ${(jpgSize / 1024).toFixed(0)} KB (${jpgFiles.length} files)`)
    console.log('─'.repeat(60))

    let hasError = false

    if (forbiddenPngs.length > 0) {
        console.error('\x1b[31m❌ Forbidden large PNG files in build:\x1b[0m')
        forbiddenPngs.forEach(f => {
            const rel = path.relative(distDir, f.path)
            console.error(`   - ${rel} (${(f.size / 1024 / 1024).toFixed(1)} MB)`)
        })
        hasError = true
    }

    if (webpFiles.length > 0) {
        console.error('\x1b[33m⚠️ WebP files detected in build (expected JPG):\x1b[0m')
        webpFiles.forEach(f => {
            const rel = path.relative(distDir, f.path)
            console.error(`   - ${rel}`)
        })
        // 这是警告，不算错误（可用于排查遗漏转换）
    }

    // 主包大小检查（假设 2MB 限制）
    const mainPackageLimit = 2 * 1024 * 1024
    if (totalSize > mainPackageLimit * 5) {
        console.error(`\x1b[31m❌ Total size exceeds 10MB: ${(totalSize / 1024 / 1024).toFixed(2)} MB\x1b[0m`)
        hasError = true
    }

    if (hasError) {
        process.exit(1)
    } else {
        console.log('\x1b[32m✓ Asset verification passed\x1b[0m')
    }
}

main()
