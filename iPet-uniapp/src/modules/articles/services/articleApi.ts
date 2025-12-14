import type { ArticlesManifest } from '../domain/types'

interface RequestOptions {
    responseType?: 'json' | 'text'
}

const DEFAULT_BASE_URL = '/static/articles'

function joinUrl(base: string, segment: string): string {
    return `${base.replace(/\/$/, '')}/${segment.replace(/^\//, '')}`
}

async function request<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
    const responseType = options.responseType || 'json'

    if (typeof uni === 'undefined') {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`)
        }
        if (responseType === 'json') {
            return response.json() as Promise<T>
        }
        return response.text() as Promise<T>
    }

    return await new Promise<T>((resolve, reject) => {
        uni.request({
            url,
            method: 'GET',
            success: (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(res.data as T)
                } else {
                    reject(new Error(`Request failed: ${res.statusCode}`))
                }
            },
            fail: (error) => reject(error)
        })
    })
}

export async function fetchManifest(baseUrl: string = DEFAULT_BASE_URL): Promise<ArticlesManifest> {
    const url = joinUrl(baseUrl, 'articles-manifest.json')
    const manifest = await request<ArticlesManifest>(url, { responseType: 'json' })
    return manifest
}

export async function fetchMarkdown(contentPath: string, baseUrl: string = DEFAULT_BASE_URL): Promise<string> {
    const url = joinUrl(baseUrl, contentPath)
    const markdown = await request<string>(url, { responseType: 'text' })
    return markdown
}

