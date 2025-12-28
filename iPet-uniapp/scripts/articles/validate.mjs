#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const CONTENT_DIR = path.resolve(ROOT, 'src/articles/source/md')
const SOURCE_IMAGES_DIR = path.resolve(ROOT, 'src/articles/source/images')
const METADATA_FILE = path.resolve(ROOT, 'src/data/metricMetadata.ts')
const COVER_PUBLIC_ROOT = path.resolve(ROOT, 'public')
const COVER_STATIC_ROOT = path.resolve(ROOT, 'src/static')

const REQUIRED_FIELDS = ['id', 'title', 'summary', 'cover', 'category', 'author', 'tags', 'updateTime', 'source']
const VALID_SOURCE = new Set(['builtin', 'remote', 'local'])
const VALID_CHANNELS = new Set(['basic', 'hot', 'rumor', 'hotfix'])
const ID_PATTERN = /^[a-z0-9_-]+$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function log(msg) {
    console.log(`\u001b[35m[articles:validate]\u001b[0m ${msg}`)
}

function loadMetricKeys() {
    if (!fs.existsSync(METADATA_FILE)) {
        return []
    }
    const content = fs.readFileSync(METADATA_FILE, 'utf-8')
    const match = content.match(/export type MetricKey =([\s\S]*?)import /)
    if (!match) return []
    const entries = [...match[1].matchAll(/'([a-z_]+)'/g)]
    return entries.map(([, key]) => key)
}

function validateCoverPath(cover) {
    if (!cover || typeof cover !== 'string') return false
    if (!cover.startsWith('/static/')) return false
    const relative = cover.replace(/^\/static\//, '')
    const sourceRelative = cover.replace(/^\/static\/images\/articles\//, '')
    const sourceFallbackWebp = sourceRelative.replace(/\.jpg$/i, '.webp')
    const candidates = [
        path.resolve(COVER_PUBLIC_ROOT, 'static', relative),
        path.resolve(COVER_STATIC_ROOT, relative),
        path.resolve(SOURCE_IMAGES_DIR, sourceRelative),
        path.resolve(SOURCE_IMAGES_DIR, sourceFallbackWebp)
    ]
    return candidates.some(candidate => fs.existsSync(candidate))
}

function run() {
    log('Starting markdown frontmatter validation...')

    if (!fs.existsSync(CONTENT_DIR)) {
        throw new Error(`Content directory not found: ${CONTENT_DIR}`)
    }

    const metricKeys = new Set(loadMetricKeys())
    const files = fs.readdirSync(CONTENT_DIR).filter((file) => file.endsWith('.md'))
    const errors = []
    const ids = new Set()
    const metricUsage = new Map()

    files.forEach((file) => {
        const fullPath = path.join(CONTENT_DIR, file)
        const raw = fs.readFileSync(fullPath, 'utf-8')
        const { data } = matter(raw)

        REQUIRED_FIELDS.forEach((field) => {
            if (data[field] === undefined || data[field] === null || data[field] === '') {
                errors.push(`${file}: missing required field "${field}"`)
            }
        })

        const { id, updateTime, cover, tags, source, channel, priority, metricKey } = data

        if (typeof id === 'string') {
            if (!ID_PATTERN.test(id)) {
                errors.push(`${file}: id "${id}" must match ${ID_PATTERN}`)
            }
            if (ids.has(id)) {
                errors.push(`${file}: duplicate id "${id}"`)
            } else {
                ids.add(id)
            }
        }

        if (!Array.isArray(tags) || tags.length === 0) {
            errors.push(`${file}: tags must be a non-empty array`)
        }

        const normalizedDate = typeof updateTime === 'string'
            ? updateTime
            : (updateTime instanceof Date ? updateTime.toISOString().split('T')[0] : '')

        if (!normalizedDate || !DATE_PATTERN.test(normalizedDate)) {
            errors.push(`${file}: updateTime must be YYYY-MM-DD string`)
        }

        if (!validateCoverPath(cover)) {
            errors.push(`${file}: cover path "${cover}" does not exist under /public`)
        }

        if (source && !VALID_SOURCE.has(source)) {
            errors.push(`${file}: invalid source "${source}" (expected builtin|remote) `)
        }

        if (channel && !VALID_CHANNELS.has(channel)) {
            errors.push(`${file}: invalid channel "${channel}" (valid: ${[...VALID_CHANNELS].join(', ')})`)
        }

        if (priority !== undefined && typeof priority !== 'number') {
            errors.push(`${file}: priority must be a number when provided`)
        }

        if (metricKey) {
            if (!metricKeys.has(metricKey)) {
                errors.push(`${file}: metricKey "${metricKey}" not found in metricMetadata.ts`)
            } else {
                const existing = metricUsage.get(metricKey) || []
                existing.push(id || '(missing id)')
                metricUsage.set(metricKey, existing)
            }
        }
    })

    // ensure metricKey uniqueness
    metricUsage.forEach((idsForKey, key) => {
        if (idsForKey.length > 1) {
            errors.push(`metricKey "${key}" used by multiple articles: ${idsForKey.join(', ')}`)
        }
    })

    if (errors.length) {
        log('Validation failed:\n')
        errors.forEach((err) => console.error(`  • ${err}`))
        process.exit(1)
    }

    log(`Validation succeeded. Checked ${files.length} markdown files.`)
}

try {
    run()
} catch (error) {
    console.error('\u001b[31m[articles:validate]\u001b[0m', error.message)
    process.exit(1)
}
