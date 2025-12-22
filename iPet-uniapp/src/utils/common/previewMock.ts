import type { RequestConfig } from './request'
import type { HealthRecord } from '@shared/types/health'
import type { Pet } from '@shared/types/pet'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW_TIMESTAMP = Date.now()

type PreviewMockState = {
    pets: Pet[]
    recordsByPetId: Record<string, HealthRecord[]>
    currentUser: {
        id: string
        isGuest: boolean
        displayName: string
        avatar: string
        uid: string
        mbti: string
        bio: string
        gender: string
        theme: string
        isVip: boolean
        vipLevel: string
    }
}

const getState = (): PreviewMockState => {
    const globalAny = globalThis as unknown as Record<string, any>
    if (!globalAny.__IPET_PREVIEW_MOCK_STATE__) {
        globalAny.__IPET_PREVIEW_MOCK_STATE__ = {
            pets: [
                {
                    id: 'preview_pet_001',
                    name: '小白',
                    type: 'dog',
                    breed: '柴犬',
                    gender: 'male',
                    birthday: '2022-03-15',
                    weight: 12.5,
                    avatar: '',
                    updatedAt: NOW_TIMESTAMP
                } as Pet,
                {
                    id: 'preview_pet_002',
                    name: '小黑',
                    type: 'cat',
                    breed: '英短',
                    gender: 'female',
                    birthday: '2023-06-01',
                    weight: 4.2,
                    avatar: '',
                    updatedAt: NOW_TIMESTAMP
                } as Pet
            ],
            recordsByPetId: {},
            currentUser: {
                id: 'preview_guest_' + Date.now(),
                isGuest: true,
                displayName: '游客用户',
                avatar: '',
                uid: '',
                mbti: 'INFJ-T',
                bio: '即使是微小的星光，也不应该被黑夜吞噬。',
                gender: 'male',
                theme: 'light',
                isVip: false,
                vipLevel: 'SVIP'
            }
        } satisfies PreviewMockState
    }
    return globalAny.__IPET_PREVIEW_MOCK_STATE__ as PreviewMockState
}

const normalizeUrl = (raw: string): string => {
    if (!raw) return raw
    if (raw.startsWith('http')) {
        try {
            return new URL(raw).pathname
        } catch {
            return raw
        }
    }
    return raw
}

const round1 = (value: number) => Number(value.toFixed(1))

const generateHealthRecords = (petId: string): HealthRecord[] => {
    const now = Date.now()
    const days = 35
    const records: HealthRecord[] = []

    const metrics = [
        { key: 'weight', unit: 'kg', base: 10.2, drift: 0.01, noise: 0.15 },
        { key: 'meal', unit: 'g', base: 280, drift: 0.6, noise: 12 },
        { key: 'water', unit: 'ml', base: 480, drift: 0.9, noise: 18 },
        { key: 'walk_duration', unit: 'min', base: 25, drift: 0.08, noise: 6 }
    ] as const

    for (let day = 0; day < days; day += 1) {
        const timestamp = now - (days - 1 - day) * DAY_MS
        const weekOffset = (day % 7) - 3

        for (const metric of metrics) {
            const value = metric.base + day * metric.drift + weekOffset * metric.noise * 0.1
            records.push({
                id: `preview_${petId}_${metric.key}_${timestamp}`,
                petId,
                type: metric.key,
                value: round1(value),
                unit: metric.unit,
                updatedAt: timestamp,
                date: new Date(timestamp).toISOString(),
                notes: null,
                source: 'manual',
                status: 'synced'
            } as HealthRecord)
        }
    }

    records.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    return records
}

const ensureRecords = (petId: string): HealthRecord[] => {
    const state = getState()
    if (!state.recordsByPetId[petId]) {
        state.recordsByPetId[petId] = generateHealthRecords(petId)
    }
    return state.recordsByPetId[petId]
}

const resolvePetId = (config: RequestConfig): string => {
    const params = (config.data || {}) as { petId?: string }
    const state = getState()
    return String(params.petId || state.pets[0]?.id || 'preview_pet_001')
}

const paginate = <T>(items: T[], page?: number, limit?: number): T[] => {
    const p = Number(page) > 0 ? Number(page) : 1
    const l = Number(limit) > 0 ? Number(limit) : items.length
    const start = (p - 1) * l
    return items.slice(start, start + l)
}

export async function handlePreviewMockRequest<T>(config: RequestConfig<T>): Promise<T | undefined> {
    const method = (config.method || 'GET').toUpperCase()
    const url = normalizeUrl(config.url)
    const state = getState()

    // Handle POST /auth/guest
    if (method === 'POST' && url === '/auth/guest') {
        const guestUser = {
            id: 'preview_guest_' + Date.now(),
            isGuest: true,
            displayName: '游客用户',
            avatar: '',
            uid: '',
            mbti: 'INFJ-T',
            bio: '即使是微小的星光，也不应该被黑夜吞噬。',
            gender: 'male',
            theme: 'light',
            isVip: false,
            vipLevel: 'SVIP'
        }
        state.currentUser = guestUser
        console.log('[PreviewMock] Guest login successful:', guestUser.id)
        return {
            accessToken: 'mock-guest-access-token-' + Date.now(),
            expiresIn: 3600,
            refreshToken: 'mock-guest-refresh-token-' + Date.now(),
            profile: {
                id: guestUser.id,
                isGuest: true
            }
        } as any
    }

    // Handle GET /users/me
    if (method === 'GET' && url === '/users/me') {
        console.log('[PreviewMock] Get user profile:', state.currentUser.id)
        return {
            ...state.currentUser,
            membership: {
                level: '普通会员',
                expireAt: ''
            }
        } as any
    }

    if (url === '/pets') {
        return state.pets as any
    }

    if (url === '/health') {
        const params = (config.data || {}) as {
            petId?: string
            page?: number
            limit?: number
            type?: string
        }
        const petId = String(params.petId || state.pets[0]?.id || 'preview_pet_001')
        let records = ensureRecords(petId)
        if (params.type) {
            records = records.filter(record => record.type === params.type)
        }
        return paginate(records, params.page, params.limit) as any
    }

    if (url === '/health/summary') {
        const petId = resolvePetId(config)
        const records = ensureRecords(petId)

        const pinnedKeys = ['weight', 'meal', 'water', 'walk_duration'] as const
        const pinnedMetrics = pinnedKeys.map((key) => {
            const metricRecords = records.filter(r => r.type === key)
            const latestRecord = metricRecords[0] || null
            const history = metricRecords.slice(0, 7)
            const start = history[history.length - 1]?.value ?? null
            const end = history[0]?.value ?? null
            const delta = typeof start === 'number' && typeof end === 'number' ? end - start : 0
            const trend = Math.abs(delta) < 0.2 ? 'stable' : delta > 0 ? 'up' : 'down'
            return {
                key,
                latestRecord,
                history,
                trend,
                trendValue: round1(delta).toFixed(1)
            }
        })

        const trends = ['weight', 'meal'].map((key) => ({
            key,
            records: records.filter(r => r.type === key).slice(0, 30)
        }))

        const dailySummaries: Record<string, any> = {}
        for (let i = 0; i < 7; i += 1) {
            const date = new Date(Date.now() - i * DAY_MS)
            const dateKey = date.toISOString().split('T')[0]
            dailySummaries[dateKey] = {
                meal: round1(260 + i * 0.7),
                water: round1(450 + i * 1.1),
                weight: round1(10.2 + i * 0.01)
            }
        }

        return {
            tasks: [
                {
                    id: 'task_preview_1',
                    type: 'deworming',
                    title: '体内驱虫',
                    dueDate: new Date(Date.now() + 3 * DAY_MS).toISOString(),
                    status: 'pending'
                }
            ],
            pinnedMetrics,
            trends,
            dailySummaries
        } as any
    }

    if (url === '/health/series') {
        const params = (config.data || {}) as {
            petId?: string
            metricKey?: string
        }
        const petId = String(params.petId || state.pets[0]?.id || 'preview_pet_001')
        const metricKey = String(params.metricKey || 'weight')

        const series = ensureRecords(petId)
            .filter(r => r.type === metricKey)
            .slice(0, 60)
            .map(r => ({
                value: Number(r.value),
                date: r.date || new Date(r.updatedAt || Date.now()).toISOString(),
                timestamp: Number(r.updatedAt || Date.now())
            }))
            .sort((a, b) => a.timestamp - b.timestamp)

        const values = series.map(item => item.value).filter(v => typeof v === 'number' && !Number.isNaN(v))
        const count = values.length
        const avg = count ? values.reduce((a, b) => a + b, 0) / count : null
        const min = count ? Math.min(...values) : null
        const max = count ? Math.max(...values) : null

        return {
            series,
            stats: {
                avg: avg === null ? null : round1(avg),
                min: min === null ? null : round1(min),
                max: max === null ? null : round1(max),
                count
            },
            meta: { metricKey }
        } as any
    }

    return undefined
}

