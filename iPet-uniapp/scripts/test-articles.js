#!/usr/bin/env node

/**
 * 文章系统自动化测试脚本（v3）
 * 验证 Markdown -> Manifest -> 构建产物的链路完整性
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.resolve(__dirname, '../src/modules/articles/content/articles')
const MANIFEST_JSON = path.resolve(__dirname, '../public/static/articles/articles-manifest.json')
const MD_OUTPUT_DIR = path.resolve(__dirname, '../public/static/articles/md')
const STATIC_ROOT = path.resolve(__dirname, '../src/static')

let totalTests = 0
let passedTests = 0
let failedTests = 0

function assert(condition, message) {
    totalTests++
    if (condition) {
        console.log(`  ✅ ${message}`)
        passedTests++
    } else {
        console.error(`  ❌ ${message}`)
        failedTests++
    }
}

function hashContent(content) {
    return crypto.createHash('sha1').update(content.trimStart()).digest('hex')
}

function validateCoverPath(cover) {
    if (!cover?.startsWith('/static/')) return false
    const relative = cover.replace(/^\/static\//, '')
    const fullPath = path.resolve(STATIC_ROOT, relative)
    return fs.existsSync(fullPath)
}

function testFrontmatterCompleteness() {
    console.log('\n📋 Test Suite 1: Frontmatter Completeness\n')
    const files = fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.md'))
    const requiredFields = ['id', 'title', 'summary', 'cover', 'category', 'author', 'tags', 'updateTime', 'source']

    files.forEach(file => {
        const filePath = path.join(CONTENT_DIR, file)
        const raw = fs.readFileSync(filePath, 'utf-8')
        const { data } = matter(raw)

        assert(raw.trim().startsWith('---'), `${file}: has frontmatter`)
        requiredFields.forEach(field => {
            assert(data[field] !== undefined && data[field] !== null, `${file}: has field "${field}"`)
        })
        assert(Array.isArray(data.tags) && data.tags.length > 0, `${file}: tags is non-empty array`)
    })
}

function testManifestIntegrity() {
    console.log('\n📋 Test Suite 2: Manifest Integrity\n')
    assert(fs.existsSync(MANIFEST_JSON), 'articles-manifest.json exists')
    if (!fs.existsSync(MANIFEST_JSON)) return

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_JSON, 'utf-8'))
    assert(manifest.schemaVersion === '1.0.0', 'schemaVersion equals 1.0.0')
    assert(Boolean(manifest.contentVersion), 'contentVersion populated')
    assert(Array.isArray(manifest.articles), 'articles array exists')
    assert(manifest.articles.length > 0, 'articles array non-empty')

    manifest.articles.forEach(article => {
        const required = ['id', 'title', 'summary', 'cover', 'category', 'author', 'tags', 'updateTime', 'source', 'channel', 'priority', 'contentPath', 'hash']
        required.forEach(field => {
            assert(article[field] !== undefined && article[field] !== null, `manifest ${article.id}: has field ${field}`)
        })
        assert(typeof article.readingTime === 'number' && article.readingTime >= 1, `manifest ${article.id}: readingTime valid`)
    })
}

function testOutputConsistency() {
    console.log('\n📋 Test Suite 3: Output Consistency\n')
    if (!fs.existsSync(MANIFEST_JSON)) {
        assert(false, 'manifest missing, cannot verify output')
        return
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_JSON, 'utf-8'))
    const files = fs.readdirSync(MD_OUTPUT_DIR).filter(file => file.endsWith('.md'))

    assert(files.length === manifest.articles.length, 'markdown file count matches manifest entries')

    manifest.articles.forEach(article => {
        const outputFile = path.join(MD_OUTPUT_DIR, `${article.id}.md`)
        assert(fs.existsSync(outputFile), `markdown output exists for ${article.id}`)
        if (!fs.existsSync(outputFile)) return
        const content = fs.readFileSync(outputFile, 'utf-8')
        assert(!content.trim().startsWith('---'), `${article.id}: content stripped frontmatter`)
        const computedHash = hashContent(content)
        assert(computedHash === article.hash, `${article.id}: content hash matches manifest`)
    })
}

function testCriticalFields() {
    console.log('\n📋 Test Suite 4: Critical Field Validation\n')
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_JSON, 'utf-8'))
    manifest.articles.forEach(article => {
        const coverValid = validateCoverPath(article.cover)
        assert(coverValid, `${article.id}: cover path exists under src/static`)
        assert(/^\d{4}-\d{2}-\d{2}$/.test(article.updateTime), `${article.id}: updateTime format valid`)
        assert(Array.isArray(article.tags) && article.tags.length > 0, `${article.id}: tags non-empty`)
        assert(['builtin', 'remote'].includes(article.source), `${article.id}: source is builtin or remote`)
    })
}

function runAllTests() {
    console.log('\n🧪 Running Article System Tests...\n')
    console.log('='.repeat(60))

    try {
        testFrontmatterCompleteness()
        testManifestIntegrity()
        testOutputConsistency()
        testCriticalFields()

        console.log('\n' + '='.repeat(60))
        console.log('\n📊 Test Results:\n')
        console.log(`  Total Tests:    ${totalTests}`)
        console.log(`  Passed:         ${passedTests} ✅`)
        console.log(`  Failed:         ${failedTests} ❌`)
        console.log(`  Success Rate:   ${totalTests ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`)

        if (failedTests === 0) {
            console.log('\n✨ All tests passed! 🎉\n')
            process.exit(0)
        } else {
            console.log(`\n❌ ${failedTests} test(s) failed.\n`)
            process.exit(1)
        }
    } catch (error) {
        console.error('\n💥 Test execution failed:', error.message)
        console.error(error.stack)
        process.exit(1)
    }
}

runAllTests()
