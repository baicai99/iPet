#!/usr/bin/env node

/**
 * 生成文章构建报告
 * 统计文章数量、大小、图片等指标
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function formatBytes(bytes) {
    return (bytes / 1024).toFixed(2) + ' KB'
}

function generateReport() {
    console.log('\n📊 Generating articles report...\n')

    const stats = {
        timestamp: new Date().toISOString(),
        articles: {},
        images: {},
        build: {},
        warnings: []
    }

    const manifestFile = path.resolve(__dirname, '../public/static/articles/articles-manifest.json')
    const mdOutputDir = path.resolve(__dirname, '../public/static/articles/md')
        const contentDir = path.resolve(__dirname, '../src/articles/source/md')

    // 1. 统计 Manifest 数据
    try {
        if (!fs.existsSync(manifestFile)) {
            throw new Error('articles-manifest.json not found. Run scripts/articles/build.mjs first.')
        }
        const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf-8'))
        stats.articles.count = manifest.articles.length
        stats.articles.schemaVersion = manifest.schemaVersion
        stats.articles.contentVersion = manifest.contentVersion
        stats.articles.generatedAt = manifest.generatedAt
        const totalSize = manifest.articles.reduce((sum, article) => sum + (article.size || 0), 0)
        stats.articles.contentSize = totalSize
        stats.articles.contentSizeFormatted = formatBytes(totalSize)
        stats.articles.avgContentSize = manifest.articles.length ? Math.round(totalSize / manifest.articles.length) : 0
        stats.articles.avgContentSizeFormatted = formatBytes(stats.articles.avgContentSize || 0)
        stats.articles.builtinCount = manifest.articles.filter(a => a.source === 'builtin').length
        stats.articles.remoteCount = manifest.articles.filter(a => a.source === 'remote').length
    } catch (error) {
        stats.warnings.push(`❌ Failed to read manifest: ${error.message}`)
    }

    // 2. 源 Markdown 数据
    try {
        const files = fs.readdirSync(contentDir).filter(file => file.endsWith('.md'))
        stats.articles.sourceCount = files.length
    } catch (error) {
        stats.warnings.push(`❌ Failed to scan source markdown: ${error.message}`)
    }

    // 3. 构建后的 Markdown
    try {
        if (fs.existsSync(mdOutputDir)) {
            const files = fs.readdirSync(mdOutputDir).filter(file => file.endsWith('.md'))
            const sizes = files.map(file => fs.statSync(path.join(mdOutputDir, file)).size)
            const total = sizes.reduce((sum, value) => sum + value, 0)
            stats.articles.outputCount = files.length
            stats.articles.outputSize = total
            stats.articles.outputSizeFormatted = (total / 1024).toFixed(2) + ' KB'
            stats.articles.maxOutput = formatBytes(Math.max(...sizes))
        } else {
            stats.warnings.push('⚠️ Markdown output directory missing. Run scripts/articles/build.mjs first.')
        }
    } catch (error) {
        stats.warnings.push(`❌ Failed to inspect markdown output: ${error.message}`)
    }

    // 4. 统计图片
    try {
        const imagesDir = path.resolve(__dirname, '../src/static/images/articles')
        if (fs.existsSync(imagesDir)) {
            const images = fs.readdirSync(imagesDir)
            const imageSizes = images.map(img =>
                fs.statSync(path.join(imagesDir, img)).size
            )
            const totalImageSize = imageSizes.reduce((a, b) => a + b, 0)

            stats.images.count = images.length
            stats.images.totalSize = totalImageSize
            stats.images.totalSizeFormatted = (totalImageSize / 1024 / 1024).toFixed(2) + ' MB'
            stats.images.avgSize = Math.round(totalImageSize / images.length)
            stats.images.avgSizeFormatted = formatBytes(stats.images.avgSize)
            stats.images.maxSize = Math.max(...imageSizes)
            stats.images.maxSizeFormatted = formatBytes(Math.max(...imageSizes))
            stats.images.largestFiles = images
                .map((name, i) => ({
                    name,
                    size: imageSizes[i],
                    sizeFormatted: formatBytes(imageSizes[i])
                }))
                .sort((a, b) => b.size - a.size)
                .slice(0, 5)
        }
    } catch (error) {
        stats.warnings.push(`❌ Failed to read images: ${error.message}`)
    }

    // 5. 检查构建产物（H5）
    try {
        const distDir = path.resolve(__dirname, '../dist/build/h5/assets')
        if (fs.existsSync(distDir)) {
            const chunks = fs.readdirSync(distDir)
                .filter(f => f.includes('articles') && f.endsWith('.js'))

            if (chunks.length > 0) {
                const chunkSizes = chunks.map(chunk => ({
                    name: chunk,
                    size: fs.statSync(path.join(distDir, chunk)).size,
                    sizeFormatted: formatBytes(fs.statSync(path.join(distDir, chunk)).size)
                }))

                stats.build.chunks = chunkSizes
                stats.build.totalChunkSize = chunkSizes.reduce((sum, chunk) => sum + chunk.size, 0)
                stats.build.totalChunkSizeFormatted = formatBytes(stats.build.totalChunkSize)
            }
        } else {
            stats.build.note = 'Build dist not found (run build:h5 first)'
        }
    } catch (error) {
        stats.warnings.push(`❌ Failed to check build output: ${error.message}`)
    }

    // 6. 生成警告
    if (stats.images.maxSize && stats.images.maxSize > 100 * 1024 && stats.images.largestFiles?.length) {
        const largest = stats.images.largestFiles[0]
        stats.warnings.push(`⚠️ Image larger than 100KB found: ${largest.name} (${largest.sizeFormatted})`)
    }
    if ((stats.articles.count || 0) > 100) {
        stats.warnings.push('⚠️ Article count exceeds 100, consider migrating to API')
    }
    if (stats.images.totalSize && stats.images.totalSize > 5 * 1024 * 1024) {
        stats.warnings.push(`⚠️ Total image size exceeds 5MB (${stats.images.totalSizeFormatted})`)
    }

    // 7. 输出到文件
    const outputFile = path.resolve(__dirname, '../dist/articles-report.json')
    fs.mkdirSync(path.dirname(outputFile), { recursive: true })
    fs.writeFileSync(outputFile, JSON.stringify(stats, null, 2))

    // 8. 控制台输出
    console.log('📄 Articles Report Summary:')
    console.log('─'.repeat(50))
    console.log(`  Articles Count:     ${stats.articles.count || 0}`)
    console.log(`  Manifest Version:   ${stats.articles.contentVersion || 'n/a'}`)
    console.log(`  Builtin / Remote:   ${(stats.articles.builtinCount || 0)} / ${(stats.articles.remoteCount || 0)}`)
    if (stats.articles.contentSizeFormatted) {
        console.log(`  Manifest Payload:   ${stats.articles.contentSizeFormatted}`)
        console.log(`  Avg Content:        ${stats.articles.avgContentSizeFormatted}`)
    }
    if (stats.articles.outputSizeFormatted) {
        console.log(`  Output Markdown:    ${stats.articles.outputSizeFormatted}`)
    }
    console.log(`  Images:             ${(stats.images.count || 0)} (${stats.images.totalSizeFormatted || '0 KB'})`)
    if (stats.build.totalChunkSizeFormatted) {
        console.log(`  Build Chunks:       ${stats.build.totalChunkSizeFormatted}`)
    }
    console.log('─'.repeat(50))

    if (stats.warnings.length > 0) {
        console.log('\n⚠️  Warnings:')
        stats.warnings.forEach(warning => console.log(`  ${warning}`))
    } else {
        console.log('\n✅ No warnings')
    }

    console.log(`\n📁 Report saved to: ${outputFile}\n`)
}

generateReport()
