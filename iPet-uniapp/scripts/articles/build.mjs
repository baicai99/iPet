#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import matter from 'gray-matter'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const SOURCE_ROOT = path.resolve(ROOT, '../articles-source')
const CONTENT_DIR = path.resolve(SOURCE_ROOT, 'md')
const SOURCE_IMAGES_DIR = path.resolve(SOURCE_ROOT, 'images')
const STATIC_IMAGES_DIR = path.resolve(ROOT, 'src/static/images/articles')
const PUBLIC_DIR = path.resolve(ROOT, 'public/static/articles')
const MD_OUTPUT_DIR = path.join(PUBLIC_DIR, 'md')
const MANIFEST_OUTPUT = path.join(PUBLIC_DIR, 'articles-manifest.json')
const CACHE_FILE = path.join(PUBLIC_DIR, '.build-cache.json')
const GENERATED_DIR = path.resolve(ROOT, 'src/modules/articles/domain/generated')
const BUILTIN_TS = path.join(GENERATED_DIR, 'builtinManifest.ts')

const SCHEMA_VERSION = '1.0.0'
const SCRIPT_VERSION = 'articles-build@2025-phase1'

const CHANNEL_ORDER = {
    hotfix: 0,
    hot: 1,
    rumor: 2,
    basic: 3
}

const DEFAULT_CHANNEL = {
    builtin: 'basic',
    remote: 'hot'
}

const DEFAULT_PRIORITY = {
    builtin: 100,
    remote: 50
}

const log = (msg) => console.log(`\u001b[36m[articles:build]\u001b[0m ${msg}`)

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true })
}

async function syncImages() {
    if (!fs.existsSync(SOURCE_IMAGES_DIR)) {
        log(`Source images directory missing, skipping sync: ${SOURCE_IMAGES_DIR}`)
        return
    }

    fs.rmSync(STATIC_IMAGES_DIR, { recursive: true, force: true })
    ensureDir(STATIC_IMAGES_DIR)

    const convertToJpeg = async (fromPath, toPath) => {
        await sharp(fromPath)
            .jpeg({ quality: 82 })
            .toFile(toPath)
    }

    const copyDirectory = async (fromDir, toDir) => {
        const entries = fs.readdirSync(fromDir, { withFileTypes: true })
        for (const entry of entries) {
            const fromPath = path.join(fromDir, entry.name)
            const ext = path.extname(entry.name).toLowerCase()
            const targetName = entry.name.replace(/\.(webp|png|jpeg)$/i, '.jpg')
            const toPath = path.join(toDir, ext === '.jpg' ? entry.name : targetName)
            if (entry.isDirectory()) {
                ensureDir(toPath)
                await copyDirectory(fromPath, toPath)
                continue
            }
            if (ext === '.jpg') {
                fs.copyFileSync(fromPath, toPath)
                continue
            }
            await convertToJpeg(fromPath, toPath)
        }
    }

    await copyDirectory(SOURCE_IMAGES_DIR, STATIC_IMAGES_DIR)
}

function hashValue(value) {
    return crypto.createHash('sha1').update(value).digest('hex')
}

function hashDirectory(dir) {
    if (!fs.existsSync(dir)) {
        return 'missing'
    }
    const hash = crypto.createHash('sha1')
    const walk = (current) => {
        const entries = fs.readdirSync(current)
        entries.forEach((entry) => {
            const fullPath = path.join(current, entry)
            const relPath = path.relative(dir, fullPath)
            const stat = fs.statSync(fullPath)
            if (stat.isDirectory()) {
                walk(fullPath)
            } else {
                hash.update(relPath)
                hash.update(stat.size.toString())
                hash.update(stat.mtimeMs.toString())
            }
        })
    }
    walk(dir)
    return hash.digest('hex')
}

function loadCache() {
    if (!fs.existsSync(CACHE_FILE)) return null
    try {
        return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
    } catch (error) {
        console.warn('[articles:build] Failed to read cache, ignoring:', error.message)
        return null
    }
}

function saveCache(payload) {
    ensureDir(PUBLIC_DIR)
    fs.writeFileSync(CACHE_FILE, JSON.stringify(payload, null, 2))
}

function nextContentVersion(previous) {
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
    if (!previous) {
        return `${dateStr}-001`
    }
    const [prevDate, prevSeq] = previous.split('-')
    if (prevDate === dateStr) {
        const nextSeq = String(parseInt(prevSeq || '0', 10) + 1).padStart(3, '0')
        return `${dateStr}-${nextSeq}`
    }
    return `${dateStr}-001`
}

function calculateReadingTime(content) {
    const cleaned = content.replace(/\s+/g, '')
    return Math.max(1, Math.ceil(cleaned.length / 200))
}

function normalizeChannel(value, source) {
    if (value && CHANNEL_ORDER[value] !== undefined) {
        return value
    }
    return DEFAULT_CHANNEL[source] || 'basic'
}

function normalizePriority(value, source) {
    if (typeof value === 'number' && !Number.isNaN(value)) {
        return value
    }
    return DEFAULT_PRIORITY[source] || 0
}

function parseFile(filePath) {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(raw)

    const requiredFields = ['id', 'title', 'summary', 'cover', 'category', 'author', 'tags', 'updateTime']
    const missing = requiredFields.filter((field) => data[field] === undefined)
    if (missing.length) {
        throw new Error(`Missing required frontmatter fields: ${missing.join(', ')}`)
    }

    if (!Array.isArray(data.tags) || data.tags.length === 0) {
        throw new Error('Frontmatter field "tags" must be a non-empty array')
    }

    const sourceValue = data.source === 'remote' ? 'remote' : 'builtin'
    const markdown = content.trimStart()
    const hash = hashValue(`${JSON.stringify(data)}\n${markdown}`)

    const manifestItem = {
        id: data.id,
        title: data.title,
        summary: data.summary,
        cover: data.cover,
        category: data.category,
        author: data.author,
        tags: data.tags,
        updateTime: typeof data.updateTime === 'string' ? data.updateTime : new Date(data.updateTime).toISOString().split('T')[0],
        metricKey: data.metricKey,
        source: sourceValue,
        channel: normalizeChannel(data.channel, sourceValue),
        priority: normalizePriority(data.priority, sourceValue),
        overrideBuiltin: Boolean(data.overrideBuiltin),
        contentPath: `md/${data.id}.md`,
        hash,
        size: Buffer.byteLength(markdown, 'utf-8'),
        readingTime: calculateReadingTime(markdown)
    }

    return { manifestItem, markdown, hash, relativePath: path.relative(CONTENT_DIR, filePath) }
}

function sortManifest(list) {
    return [...list].sort((a, b) => {
        const channelDiff = (CHANNEL_ORDER[a.channel] ?? 99) - (CHANNEL_ORDER[b.channel] ?? 99)
        if (channelDiff !== 0) return channelDiff
        if (b.priority !== a.priority) return b.priority - a.priority
        const timeDiff = b.updateTime.localeCompare(a.updateTime)
        if (timeDiff !== 0) return timeDiff
        return a.id.localeCompare(b.id)
    })
}

function generateBuiltinTs(builtinArticles) {
    if (!builtinArticles.length) {
        const header = `/**\n * ⚠️ 自动生成文件 - 无内置文章\n */\n\nexport const BUILTIN_ARTICLES_MANIFEST: never[] = []\nexport const BUILTIN_ARTICLE_CONTENT: Record<string, string> = {}\n`
        fs.writeFileSync(BUILTIN_TS, header)
        return
    }

    ensureDir(GENERATED_DIR)

    const imports = builtinArticles.map((article, index) => {
        let importPath = path.relative(path.dirname(BUILTIN_TS), path.join(CONTENT_DIR, `${article.id}.md`)).replace(/\\/g, '/')
        if (!importPath.startsWith('.')) {
            importPath = `./${importPath}`
        }
        return `import article${index} from '${importPath}?raw'`
    }).join('\n')

    const contentEntries = builtinArticles.map((article, index) => `    '${article.id}': stripFrontmatter(article${index}),`).join('\n')

    const now = new Date().toISOString()
    const manifestString = JSON.stringify(builtinArticles, null, 2)

    const fileContent = `/**\n * ⚠️ 自动生成文件 - 请勿手动编辑\n * 构建脚本: scripts/articles/build.mjs\n * 生成时间: ${now}\n * 内置文章数: ${builtinArticles.length}\n */\n\nimport type { ArticleManifestItem } from '../types'\nimport { stripFrontmatter } from '../utils/stripFrontmatter'\n${imports ? `\n${imports}\n` : '\n'}export const BUILTIN_ARTICLES_MANIFEST: ArticleManifestItem[] = ${manifestString}\n\nexport const BUILTIN_ARTICLE_CONTENT: Record<string, string> = {\n${contentEntries}\n}\n`

    fs.writeFileSync(BUILTIN_TS, fileContent)
}

async function build() {
    log('Starting article build...')

    if (!fs.existsSync(CONTENT_DIR)) {
        throw new Error(`Content directory not found: ${CONTENT_DIR}`)
    }

    await syncImages()

    const files = fs.readdirSync(CONTENT_DIR).filter((file) => file.endsWith('.md'))
    if (!files.length) {
        throw new Error('No markdown files found to build.')
    }

    const parsed = files.map((file) => parseFile(path.join(CONTENT_DIR, file)))

    const fingerprint = {
        scriptVersion: SCRIPT_VERSION,
        files: Object.fromEntries(parsed.map(({ relativePath, hash }) => [relativePath, hash])),
        imagesHash: hashDirectory(SOURCE_IMAGES_DIR)
    }

    const cache = loadCache()
    if (cache && JSON.stringify(cache.fingerprint) === JSON.stringify(fingerprint)) {
        log('No changes detected. Skipping build (no-op).')
        return
    }

    log('Changes detected. Rebuilding manifest and markdown payloads...')

    ensureDir(PUBLIC_DIR)
    ensureDir(MD_OUTPUT_DIR)
    fs.rmSync(MD_OUTPUT_DIR, { recursive: true, force: true })
    ensureDir(MD_OUTPUT_DIR)

    const manifestItems = sortManifest(parsed.map((entry) => entry.manifestItem))

    parsed.forEach(({ manifestItem, markdown }) => {
        const outputPath = path.join(MD_OUTPUT_DIR, `${manifestItem.id}.md`)
        fs.writeFileSync(outputPath, markdown)
    })

    const builtinArticles = manifestItems.filter((item) => item.source === 'builtin')
    generateBuiltinTs(builtinArticles)

    const existingManifestVersion = fs.existsSync(MANIFEST_OUTPUT)
        ? (() => {
            try {
                const existing = JSON.parse(fs.readFileSync(MANIFEST_OUTPUT, 'utf-8'))
                return existing.contentVersion
            } catch (_) {
                return undefined
            }
        })()
        : undefined

    const contentVersion = nextContentVersion(cache?.contentVersion || existingManifestVersion)
    const generatedAt = new Date().toISOString()

    const manifest = {
        schemaVersion: SCHEMA_VERSION,
        contentVersion,
        generatedAt,
        articles: manifestItems
    }

    fs.writeFileSync(MANIFEST_OUTPUT, JSON.stringify(manifest, null, 2))

    saveCache({ fingerprint, contentVersion, generatedAt })

    const summary = {
        total: manifestItems.length,
        builtin: builtinArticles.length,
        remote: manifestItems.length - builtinArticles.length,
        contentVersion
    }

    log(`Build completed. Total: ${summary.total}, builtin: ${summary.builtin}, remote: ${summary.remote}, version: ${summary.contentVersion}`)
}

build().catch((error) => {
    console.error('\u001b[31m[articles:build]\u001b[0m Build failed:', error)
    process.exit(1)
})
