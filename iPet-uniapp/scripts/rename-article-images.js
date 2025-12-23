#!/usr/bin/env node

/**
 * 文章图片重命名脚本
 * 
 * 功能：
 * 1. 将中文命名的图片重命名为 ES6 安全的命名格式
 * 2. 仅使用 fs.rename（原子操作），不修改图片内容
 * 3. 生成重命名映射表供文档记录
 * 
 * P0 约束：原图内容不得发生任何字节级变更
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const CONFIG = {
    sourceDir: path.resolve(ROOT, 'src/static/images/article'),
    mappingOutput: path.resolve(ROOT, 'docs/assets/artical-rename-map.md'),
    hashBaseline: path.resolve(ROOT, 'scripts/image-hashes-baseline.json')
}

// 中文名 → ES6 安全名映射表
const RENAME_MAP = {
    '狗狗BMI指数：快速评估体型.png': 'dog-bmi-assessment.png',
    '狗狗体温监测：及时发现健康异常.png': 'dog-body-temp-monitoring.png',
    '狗狗体能训练：打造强健体魄.png': 'dog-fitness-training.png',
    '狗狗体脂率管理：健康体态的秘密.png': 'dog-body-fat-management.png',
    '狗狗抑郁症：别让毛孩心情低落.png': 'dog-depression-awareness.png',
    '狗狗洗澡完全手册.png': 'dog-bathing-guide.png',
    '狗狗焦虑症：识别与缓解.png': 'dog-anxiety-relief.png',
    '碳水化合物：能量来源的平衡之道.png': 'nutrition-carbohydrate.png',
    '脂肪营养：必需但需适量.png': 'nutrition-fat.png',
    '膳食纤维：肠道健康的守护者.png': 'nutrition-fiber.png',
    '膳食能量管理：热量平衡的艺术.png': 'nutrition-energy.png',
    '钙质补充：骨骼健康的基础.png': 'nutrition-calcium.png',
    '驱虫全攻略：守护毛孩健康防线.png': 'dog-deworming-guide.png',
    '鱼油补充：Omega-3的神奇功效.png': 'nutrition-fish-oil.png'
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

function getFileHash(filePath) {
    const content = fs.readFileSync(filePath)
    return crypto.createHash('sha256').update(content).digest('hex')
}

function formatBytes(bytes) {
    return (bytes / 1024).toFixed(2) + ' KB'
}

async function renameImages() {
    console.log('\n🔄 Starting article image rename...\n')
    console.log(`Source directory: ${CONFIG.sourceDir}\n`)

    // Step 1: 检查目录存在
    if (!fs.existsSync(CONFIG.sourceDir)) {
        log('red', '✗', `Source directory not found: ${CONFIG.sourceDir}`)
        process.exit(1)
    }

    // Step 2: 获取所有文件
    const files = fs.readdirSync(CONFIG.sourceDir)
    const pngFiles = files.filter(f => f.endsWith('.png'))

    log('cyan', '📁', `Found ${pngFiles.length} PNG files\n`)

    // Step 3: 记录重命名前的哈希值（P0 保护）
    const renameResults = []
    const hashBaseline = {}

    for (const oldName of pngFiles) {
        const oldPath = path.join(CONFIG.sourceDir, oldName)
        const newName = RENAME_MAP[oldName]

        if (!newName) {
            // 文件已经是 ES6 安全命名或不在映射表中
            const hash = getFileHash(oldPath)
            const size = fs.statSync(oldPath).size
            hashBaseline[oldName] = { hash, size }
            log('yellow', '⏭️ ', `Skipped (not in map): ${oldName}`)
            continue
        }

        const newPath = path.join(CONFIG.sourceDir, newName)
        const hashBefore = getFileHash(oldPath)
        const size = fs.statSync(oldPath).size

        // Step 4: 执行重命名（原子操作，不修改内容）
        fs.renameSync(oldPath, newPath)

        // Step 5: 验证重命名后哈希不变
        const hashAfter = getFileHash(newPath)

        if (hashBefore !== hashAfter) {
            // P0 违规！立即回滚并退出
            fs.renameSync(newPath, oldPath)
            log('red', '🚨', `P0 VIOLATION: Hash changed for ${oldName}! Rolling back.`)
            process.exit(1)
        }

        hashBaseline[newName] = { hash: hashAfter, size }

        renameResults.push({
            oldName,
            newName,
            hash: hashAfter,
            size
        })

        log('green', '✓', `${oldName} → ${newName}`)
    }

    console.log('\n' + '─'.repeat(60))
    console.log('📊 Rename Summary')
    console.log('─'.repeat(60))
    console.log(`Files renamed:  ${colors.green}${renameResults.length}${colors.reset}`)
    console.log('─'.repeat(60))

    // Step 6: 生成映射文档
    fs.mkdirSync(path.dirname(CONFIG.mappingOutput), { recursive: true })

    const timestamp = new Date().toISOString()
    let mdContent = `# Article Images Rename Mapping

Generated: ${timestamp}

## P0 Protection
All images below have been renamed using \`fs.renameSync\` (atomic operation).  
**No image content was modified** - SHA256 hashes are identical before and after rename.

## Mapping Table

| Original Name (Chinese) | New Name (ES6-safe) | SHA256 Hash | Size |
|-------------------------|---------------------|-------------|------|
`

    for (const result of renameResults) {
        mdContent += `| ${result.oldName} | ${result.newName} | \`${result.hash.substring(0, 16)}...\` | ${formatBytes(result.size)} |\n`
    }

    mdContent += `
## Hash Verification

To verify images haven't been modified, run:
\`\`\`bash
node scripts/verify-image-hashes.js --verify
\`\`\`

## Current Files

After renaming, the \`/src/static/images/article/\` directory contains:

\`\`\`
${Object.keys(hashBaseline).sort().join('\n')}
\`\`\`
`

    fs.writeFileSync(CONFIG.mappingOutput, mdContent)
    log('blue', '📄', `Mapping saved to: ${CONFIG.mappingOutput}`)

    // Step 7: 保存哈希基线
    fs.writeFileSync(CONFIG.hashBaseline, JSON.stringify({
        generated: timestamp,
        directory: CONFIG.sourceDir,
        files: hashBaseline
    }, null, 2))
    log('blue', '📄', `Hash baseline saved to: ${CONFIG.hashBaseline}`)

    console.log(`\n${colors.green}✨ Rename completed successfully!${colors.reset}\n`)
}

renameImages().catch(error => {
    console.error(`${colors.red}❌ Rename failed:${colors.reset}`, error)
    process.exit(1)
})
