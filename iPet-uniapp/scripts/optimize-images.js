#!/usr/bin/env node

/**
 * 图片优化脚本
 * 
 * 功能：
 * 1. 批量转换 src/static/images/articles/*.{png,jpg,jpeg} 为 JPG
 * 2. 压缩至 < 80KB
 * 3. 输出到 dist 目录（源文件不变）
 * 4. 生成优化报告
 * 
 * 依赖：sharp (需要安装: npm install --save-dev sharp)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 配置
const CONFIG = {
    sourceDir: path.resolve(__dirname, '../src/static/images/articles'),
    outputDir: path.resolve(__dirname, '../dist/static/images/articles'),
    maxSizeKB: 80,
    targetWidth: 800,  // 统一宽度
    targetHeight: 400, // 统一高度
    jpegQuality: 82,   // 初始质量
    minQuality: 60     // 最低质量阈值
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

async function compressImage(inputPath, outputPath, targetSizeKB) {
    const filename = path.basename(inputPath)

    // 确保输出目录存在
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })

    let quality = CONFIG.jpegQuality
    let outputSize = 0
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
        attempts++

        // 转换为 JPG
        await sharp(inputPath)
            .resize(CONFIG.targetWidth, CONFIG.targetHeight, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality })
            .toFile(outputPath)

        // 检查文件大小
        const stats = fs.statSync(outputPath)
        outputSize = stats.size / 1024 // KB

        if (outputSize <= targetSizeKB) {
            // 成功达到目标大小
            return {
                success: true,
                filename,
                originalSize: fs.statSync(inputPath).size / 1024,
                outputSize,
                quality,
                attempts,
                savedPercent: ((1 - outputSize / (fs.statSync(inputPath).size / 1024)) * 100).toFixed(1)
            }
        }

        // 降低质量重试
        quality = Math.max(CONFIG.minQuality, quality - 10)

        if (quality === CONFIG.minQuality && outputSize > targetSizeKB) {
            // 已达到最低质量但仍超出限制
            return {
                success: false,
                filename,
                originalSize: fs.statSync(inputPath).size / 1024,
                outputSize,
                quality,
                attempts,
                message: `无法压缩至 ${targetSizeKB}KB (当前 ${formatBytes(outputSize * 1024)})`
            }
        }
    }

    return {
        success: false,
        filename,
        message: '达到最大尝试次数'
    }
}

async function optimizeImages() {
    console.log('\n🖼️  Starting image optimization...\n')
    console.log(`Source: ${CONFIG.sourceDir}`)
    console.log(`Output: ${CONFIG.outputDir}`)
    console.log(`Target: ${CONFIG.targetWidth}x${CONFIG.targetHeight}, < ${CONFIG.maxSizeKB}KB\n`)

    // 读取源图片
    const files = fs.readdirSync(CONFIG.sourceDir)
        .filter(f => /\.(png|jpg|jpeg)$/i.test(f))

    if (files.length === 0) {
        log('yellow', '⚠️ ', 'No images found to optimize')
        return
    }

    console.log(`Found ${files.length} images to optimize\n`)

    const results = []
    let totalOriginalSize = 0
    let totalOutputSize = 0
    let successCount = 0
    let failureCount = 0

    for (const file of files) {
        const inputPath = path.join(CONFIG.sourceDir, file)
        const outputName = file.replace(/\.(png|jpg|jpeg)$/i, '.jpg')
        const outputPath = path.join(CONFIG.outputDir, outputName)

        try {
            process.stdout.write(`Processing ${file}... `)

            const result = await compressImage(inputPath, outputPath, CONFIG.maxSizeKB)
            results.push(result)

            if (result.success) {
                totalOriginalSize += result.originalSize
                totalOutputSize += result.outputSize
                successCount++

                console.log(`${colors.green}✓${colors.reset} ${formatBytes(result.originalSize * 1024)} → ${formatBytes(result.outputSize * 1024)} (${result.savedPercent}% saved, Q${result.quality})`)
            } else {
                failureCount++
                console.log(`${colors.red}✗${colors.reset} ${result.message}`)
            }
        } catch (error) {
            failureCount++
            console.log(`${colors.red}✗${colors.reset} ${error.message}`)
            results.push({
                success: false,
                filename: file,
                message: error.message
            })
        }
    }

    // 生成报告
    console.log('\n' + '─'.repeat(60))
    console.log('📊 Optimization Summary')
    console.log('─'.repeat(60))
    console.log(`Total images:        ${files.length}`)
    console.log(`Successful:          ${colors.green}${successCount}${colors.reset}`)
    console.log(`Failed:              ${colors.red}${failureCount}${colors.reset}`)
    console.log(`Original size:       ${formatBytes(totalOriginalSize * 1024)}`)
    console.log(`Optimized size:      ${formatBytes(totalOutputSize * 1024)}`)
    console.log(`Total saved:         ${formatBytes((totalOriginalSize - totalOutputSize) * 1024)} (${((1 - totalOutputSize / totalOriginalSize) * 100).toFixed(1)}%)`)
    console.log('─'.repeat(60))

    // 输出失败的文件
    const failures = results.filter(r => !r.success)
    if (failures.length > 0) {
        console.log(`\n${colors.yellow}⚠️  Failed images:${colors.reset}`)
        failures.forEach(f => {
            console.log(`  - ${f.filename}: ${f.message}`)
        })
    }

    // 保存详细报告
    const reportPath = path.resolve(__dirname, '../dist/image-optimization-report.json')
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        config: CONFIG,
        summary: {
            total: files.length,
            successful: successCount,
            failed: failureCount,
            originalSizeKB: totalOriginalSize,
            optimizedSizeKB: totalOutputSize,
            savedKB: totalOriginalSize - totalOutputSize,
            savedPercent: ((1 - totalOutputSize / totalOriginalSize) * 100).toFixed(1)
        },
        results
    }, null, 2))

    console.log(`\n📄 Detailed report saved to: ${reportPath}\n`)

    // 如果有失败的图片，返回非零退出码
    if (failureCount > 0) {
        process.exit(1)
    }
}

optimizeImages().catch(error => {
    console.error(`${colors.red}❌ Fatal error:${colors.reset}`, error)
    process.exit(1)
})
