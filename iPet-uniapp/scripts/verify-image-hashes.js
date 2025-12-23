#!/usr/bin/env node

/**
 * 图片哈希验证脚本
 * 
 * 功能：
 * 1. 验证 /src/static/images/article/ 目录下的图片没有被修改
 * 2. 对比当前哈希与基线哈希
 * 3. 用于 CI/pre-commit hook 保护 P0 约束
 * 
 * 用法：
 *   node scripts/verify-image-hashes.js --verify   # 验证模式
 *   node scripts/verify-image-hashes.js --update   # 更新基线
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const CONFIG = {
    sourceDir: path.resolve(ROOT, 'src/static/images/article'),
    hashBaseline: path.resolve(ROOT, 'scripts/image-hashes-baseline.json')
}

const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
}

function log(color, symbol, message) {
    console.log(`${colors[color]}${symbol} ${message}${colors.reset}`)
}

function getFileHash(filePath) {
    const content = fs.readFileSync(filePath)
    return crypto.createHash('sha256').update(content).digest('hex')
}

function loadBaseline() {
    if (!fs.existsSync(CONFIG.hashBaseline)) {
        return null
    }
    return JSON.parse(fs.readFileSync(CONFIG.hashBaseline, 'utf8'))
}

function getCurrentHashes() {
    const files = fs.readdirSync(CONFIG.sourceDir)
        .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))

    const hashes = {}
    for (const file of files) {
        const filePath = path.join(CONFIG.sourceDir, file)
        const stat = fs.statSync(filePath)
        hashes[file] = {
            hash: getFileHash(filePath),
            size: stat.size
        }
    }
    return hashes
}

function verifyHashes() {
    console.log('\n🔍 Verifying image hashes...\n')

    const baseline = loadBaseline()
    if (!baseline) {
        log('red', '✗', 'No baseline found. Run with --update first.')
        process.exit(1)
    }

    const current = getCurrentHashes()
    const baselineFiles = baseline.files

    let hasError = false
    let verified = 0

    // Check for modified files
    for (const [filename, data] of Object.entries(baselineFiles)) {
        if (!current[filename]) {
            log('red', '✗', `MISSING: ${filename}`)
            hasError = true
            continue
        }

        if (current[filename].hash !== data.hash) {
            log('red', '🚨', `P0 VIOLATION: ${filename} has been modified!`)
            log('red', '  ', `Expected: ${data.hash.substring(0, 16)}...`)
            log('red', '  ', `Actual:   ${current[filename].hash.substring(0, 16)}...`)
            hasError = true
            continue
        }

        verified++
    }

    // Check for new files not in baseline
    for (const filename of Object.keys(current)) {
        if (!baselineFiles[filename]) {
            log('yellow', '⚠️ ', `NEW FILE (not in baseline): ${filename}`)
        }
    }

    console.log('\n' + '─'.repeat(50))
    if (hasError) {
        log('red', '❌', `Verification FAILED`)
        console.log('─'.repeat(50))
        process.exit(1)
    } else {
        log('green', '✓', `Verified ${verified} files - all hashes match`)
        console.log('─'.repeat(50))
        console.log(`\n${colors.green}✨ P0 constraint verified!${colors.reset}\n`)
    }
}

function updateBaseline() {
    console.log('\n📝 Updating hash baseline...\n')

    const current = getCurrentHashes()
    const timestamp = new Date().toISOString()

    const baseline = {
        generated: timestamp,
        directory: CONFIG.sourceDir,
        files: current
    }

    fs.writeFileSync(CONFIG.hashBaseline, JSON.stringify(baseline, null, 2))

    log('green', '✓', `Updated baseline with ${Object.keys(current).length} files`)
    log('blue', '📄', `Saved to: ${CONFIG.hashBaseline}`)
    console.log(`\n${colors.green}✨ Baseline updated!${colors.reset}\n`)
}

// Main
const args = process.argv.slice(2)
const mode = args[0]

if (mode === '--verify') {
    verifyHashes()
} else if (mode === '--update') {
    updateBaseline()
} else {
    console.log(`
Usage:
  node scripts/verify-image-hashes.js --verify   # Verify hashes against baseline
  node scripts/verify-image-hashes.js --update   # Update baseline with current hashes
`)
    process.exit(1)
}
