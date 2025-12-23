#!/usr/bin/env node

/**
 * 将新重命名的 PNG 图片转换为 WebP 并更新文章封面
 * 
 * 功能：
 * 1. 读取 /src/static/images/article/ 中的 PNG 文件
 * 2. 生成 WebP 到 /src/pages/articles/images/articles/
 * 3. 映射到对应的文章 ID
 * 
 * P0 约束：原图不修改，只生成新的 WebP 副本
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const CONFIG = {
    sourceDir: path.resolve(ROOT, 'src/static/images/article'),
    // Output to BOTH directories for compatibility
    outputDirs: [
        path.resolve(ROOT, 'src/static/images/articles'),        // For dev mode (H5)
        path.resolve(ROOT, 'src/pages/articles/images/articles') // For WeChat mini-program
    ],
    maxSizeKB: 80,
    targetWidth: 800,
    targetHeight: 400,
    webpQuality: 80,
    minQuality: 60
}

// PNG 文件名 → 文章 cover WebP 文件名映射
const IMAGE_TO_COVER_MAP = {
    'dog-bmi-assessment.png': 'bmi.webp',
    'dog-body-temp-monitoring.png': 'body-temp.webp',
    'dog-fitness-training.png': 'fitness_training.webp',
    'dog-body-fat-management.png': 'body-fat.webp',
    'dog-depression-awareness.png': 'depression.webp',
    'dog-bathing-guide.png': 'bathing.webp',
    'dog-anxiety-relief.png': 'anxiety.webp',
    'nutrition-carbohydrate.png': 'carb.webp',
    'nutrition-fat.png': 'fat.webp',
    'nutrition-fiber.png': 'fiber.webp',
    'nutrition-energy.png': 'diet_energy.webp',
    'nutrition-calcium.png': 'calcium.webp',
    'dog-deworming-guide.png': 'deworming.webp',
    'nutrition-fish-oil.png': 'fish_oil.webp'
}

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
    let quality = CONFIG.webpQuality
    let outputSize = 0
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
        attempts++

        await sharp(inputPath)
            .resize(CONFIG.targetWidth, CONFIG.targetHeight, {
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality })
            .toFile(outputPath)

        const stats = fs.statSync(outputPath)
        outputSize = stats.size / 1024

        if (outputSize <= targetSizeKB) {
            return { success: true, outputSize, quality, attempts }
        }

        quality = Math.max(CONFIG.minQuality, quality - 10)

        if (quality === CONFIG.minQuality && outputSize > targetSizeKB) {
            return { success: false, outputSize, quality, attempts, message: `无法压缩至 ${targetSizeKB}KB` }
        }
    }

    return { success: false, message: '达到最大尝试次数' }
}

async function generateCovers() {
    console.log('\n🖼️  Generating article cover WebP files...\n')
    console.log(`Source: ${CONFIG.sourceDir}`)
    console.log(`Output directories:`)
    CONFIG.outputDirs.forEach(dir => console.log(`  - ${dir}`))
    console.log(`Target: ${CONFIG.targetWidth}x${CONFIG.targetHeight}, < ${CONFIG.maxSizeKB}KB\n`)

    // 确保所有输出目录存在
    CONFIG.outputDirs.forEach(dir => fs.mkdirSync(dir, { recursive: true }))

    const results = []
    let successCount = 0
    let failureCount = 0

    for (const [pngFile, webpFile] of Object.entries(IMAGE_TO_COVER_MAP)) {
        const inputPath = path.join(CONFIG.sourceDir, pngFile)

        if (!fs.existsSync(inputPath)) {
            log('yellow', '⚠️ ', `Source not found: ${pngFile}`)
            continue
        }

        const originalSize = fs.statSync(inputPath).size / 1024

        try {
            process.stdout.write(`${pngFile} → ${webpFile}... `)

            // 先生成到第一个目录
            const primaryOutputPath = path.join(CONFIG.outputDirs[0], webpFile)
            const result = await compressImage(inputPath, primaryOutputPath, CONFIG.maxSizeKB)

            if (result.success) {
                // 复制到其他目录
                for (let i = 1; i < CONFIG.outputDirs.length; i++) {
                    const secondaryPath = path.join(CONFIG.outputDirs[i], webpFile)
                    fs.copyFileSync(primaryOutputPath, secondaryPath)
                }

                successCount++
                const savedPercent = ((1 - result.outputSize / originalSize) * 100).toFixed(1)
                console.log(`${colors.green}✓${colors.reset} ${formatBytes(originalSize * 1024)} → ${formatBytes(result.outputSize * 1024)} (${savedPercent}% saved)`)

                results.push({
                    source: pngFile,
                    output: webpFile,
                    originalSizeKB: originalSize,
                    outputSizeKB: result.outputSize,
                    saved: savedPercent
                })
            } else {
                failureCount++
                console.log(`${colors.red}✗${colors.reset} ${result.message}`)
            }
        } catch (error) {
            failureCount++
            console.log(`${colors.red}✗${colors.reset} ${error.message}`)
        }
    }

    console.log('\n' + '─'.repeat(60))
    console.log('📊 Cover Generation Summary')
    console.log('─'.repeat(60))
    console.log(`Covers generated: ${colors.green}${successCount}${colors.reset}`)
    console.log(`Failed:           ${colors.red}${failureCount}${colors.reset}`)
    console.log('─'.repeat(60))

    if (successCount > 0) {
        console.log(`\n${colors.green}✨ Cover generation completed!${colors.reset}`)
        console.log(`${colors.cyan}Covers are now in ${CONFIG.outputDirs.length} directories${colors.reset}\n`)
    }
}

generateCovers().catch(error => {
    console.error(`${colors.red}❌ Cover generation failed:${colors.reset}`, error)
    process.exit(1)
})
