#!/usr/bin/env node

/**
 * 图片格式永久转换脚本
 * 
 * 功能：
 * 1. 调用 optimize-images.js 生成 WebP 文件到 dist 目录
 * 2. 将 WebP 文件复制回 src/static/images/articles 目录
 * 3. 删除原始的 PNG/JPG 文件
 * 4. 生成转换报告
 * 
 * 目的：
 * 确保无论使用何种编译工具（HBuilderX、npm、Vite等），
 * 都能使用优化后的 WebP 图片，避免编译大体积的 PNG 文件
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const CONFIG = {
    sourceDir: path.resolve(ROOT, 'src/static/images/articles'),
    distDir: path.resolve(ROOT, 'dist/static/images/articles'),
    reportPath: path.resolve(ROOT, 'dist/image-conversion-report.json')
}

// 颜色输出
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
}

function log(color, symbol, message) {
    console.log(`${colors[color]}${symbol} ${message}${colors.reset}`)
}

function formatBytes(bytes) {
    return (bytes / 1024).toFixed(2) + ' KB'
}

async function convertImages() {
    console.log('\n🔄 Starting permanent image conversion to WebP...\n')
    console.log(`Source directory: ${CONFIG.sourceDir}`)
    console.log(`Working directory: ${CONFIG.distDir}\n`)

    // Step 1: 运行优化脚本
    log('cyan', '📦', 'Step 1/4: Running image optimization script...')
    try {
        execSync('node scripts/optimize-images.js', {
            cwd: ROOT,
            stdio: 'inherit'
        })
        log('green', '✓', 'Optimization completed')
    } catch (error) {
        log('red', '✗', 'Optimization failed')
        throw error
    }

    console.log('')

    // Step 2: 检查生成的 WebP 文件
    log('cyan', '🔍', 'Step 2/4: Checking generated WebP files...')

    if (!fs.existsSync(CONFIG.distDir)) {
        throw new Error(`Dist directory not found: ${CONFIG.distDir}`)
    }

    const webpFiles = fs.readdirSync(CONFIG.distDir)
        .filter(f => f.endsWith('.webp'))

    if (webpFiles.length === 0) {
        throw new Error('No WebP files were generated')
    }

    log('green', '✓', `Found ${webpFiles.length} WebP files`)
    console.log('')

    // Step 3: 复制 WebP 文件到源目录
    log('cyan', '📋', 'Step 3/4: Copying WebP files to source directory...')

    const copyResults = []
    for (const file of webpFiles) {
        const sourcePath = path.join(CONFIG.distDir, file)
        const destPath = path.join(CONFIG.sourceDir, file)

        const sourceSize = fs.statSync(sourcePath).size

        fs.copyFileSync(sourcePath, destPath)

        copyResults.push({
            filename: file,
            size: sourceSize,
            path: destPath
        })

        log('green', '→', `${file} (${formatBytes(sourceSize)})`)
    }

    console.log('')

    // Step 4: 删除原始 PNG/JPG 文件
    log('cyan', '🗑️ ', 'Step 4/4: Removing original PNG/JPG files...')

    const originalFiles = fs.readdirSync(CONFIG.sourceDir)
        .filter(f => /\.(png|jpg|jpeg)$/i.test(f))

    const deletionResults = []
    for (const file of originalFiles) {
        const filePath = path.join(CONFIG.sourceDir, file)
        const size = fs.statSync(filePath).size

        fs.unlinkSync(filePath)

        deletionResults.push({
            filename: file,
            size,
            deleted: true
        })

        log('yellow', '✗', `${file} (${formatBytes(size)})`)
    }

    console.log('')

    // 生成报告
    console.log('─'.repeat(60))
    console.log('📊 Conversion Summary')
    console.log('─'.repeat(60))
    console.log(`WebP files created:  ${colors.green}${copyResults.length}${colors.reset}`)
    console.log(`PNG/JPG deleted:     ${colors.yellow}${deletionResults.length}${colors.reset}`)

    const totalWebpSize = copyResults.reduce((sum, r) => sum + r.size, 0)
    const totalDeletedSize = deletionResults.reduce((sum, r) => sum + r.size, 0)

    console.log(`New total size:      ${formatBytes(totalWebpSize)}`)
    console.log(`Old total size:      ${formatBytes(totalDeletedSize)}`)
    console.log(`Space saved:         ${formatBytes(totalDeletedSize - totalWebpSize)} (${((1 - totalWebpSize / totalDeletedSize) * 100).toFixed(1)}%)`)
    console.log('─'.repeat(60))

    // 保存详细报告
    const report = {
        timestamp: new Date().toISOString(),
        sourceDirectory: CONFIG.sourceDir,
        summary: {
            webpCreated: copyResults.length,
            originalDeleted: deletionResults.length,
            totalWebpSizeKB: totalWebpSize / 1024,
            totalDeletedSizeKB: totalDeletedSize / 1024,
            spaceSavedKB: (totalDeletedSize - totalWebpSize) / 1024,
            spaceSavedPercent: ((1 - totalWebpSize / totalDeletedSize) * 100).toFixed(1)
        },
        webpFiles: copyResults,
        deletedFiles: deletionResults
    }

    fs.writeFileSync(CONFIG.reportPath, JSON.stringify(report, null, 2))
    log('blue', '📄', `Detailed report saved to: ${CONFIG.reportPath}`)

    console.log(`\n${colors.green}✨ Conversion completed successfully!${colors.reset}`)
    console.log(`${colors.cyan}Next steps:${colors.reset}`)
    console.log(`  1. Update article frontmatter to use .webp extensions`)
    console.log(`  2. Update article-schema.json to enforce .webp format`)
    console.log(`  3. Run 'npm run articles:build' to regenerate manifest\n`)
}

convertImages().catch(error => {
    console.error(`${colors.red}❌ Conversion failed:${colors.reset}`, error)
    process.exit(1)
})
