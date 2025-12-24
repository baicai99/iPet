import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock dependencies first
vi.mock('@/utils/config', () => ({
    APP_CONFIG: {
        API_BASE_URL: 'https://example.test',
        USE_MOCK: false,
    },
    USE_MOCK: false,
}))

vi.mock('@/utils/business/authStorage', () => ({
    getAccessToken: () => null,
    setAuthToken: () => { },
    clearAuthToken: () => { },
    getRefreshToken: () => null,
    setRefreshToken: () => { }
}))

vi.mock('@/utils/common/errorHandler', () => ({
    showError: () => { }
}))

const mockTrackApiCall = vi.fn()
vi.mock('@/utils/performance/performanceMonitor', () => ({
    performanceMonitor: {
        trackApiCall: mockTrackApiCall
    }
}))

vi.mock('@/utils/common/mockRegistry', () => ({
    handleMockRequest: async () => {
        throw new Error('mock not used in this test')
    },
    handleMockRefreshToken: async () => {
        throw new Error('mock not used in this test')
    }
}))

// Import the module under test
import { generateRequestId, isValidRequestId } from '@/utils/http/generateRequestId'

describe('generateRequestId', () => {
    it('generates a valid UUID v4 string', () => {
        const id = generateRequestId()
        expect(isValidRequestId(id)).toBe(true)
    })

    it('generates unique IDs', () => {
        const ids = new Set<string>()
        for (let i = 0; i < 100; i++) {
            ids.add(generateRequestId())
        }
        expect(ids.size).toBe(100)
    })

    it('follows UUID v4 format', () => {
        const id = generateRequestId()
        // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })
})

describe('isValidRequestId', () => {
    it('validates correct UUID v4', () => {
        expect(isValidRequestId('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
        expect(isValidRequestId('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true)
    })

    it('rejects invalid formats', () => {
        expect(isValidRequestId('')).toBe(false)
        expect(isValidRequestId('not-a-uuid')).toBe(false)
        expect(isValidRequestId('550e8400-e29b-51d4-a716-446655440000')).toBe(false) // version 5, not 4
        expect(isValidRequestId('550e8400-e29b-41d4-c716-446655440000')).toBe(false) // wrong variant
    })
})

describe('request with requestId', () => {
    const setupUni = () => {
        const request = vi.fn((options: any) => {
            const task = { abort: vi.fn() }
            queueMicrotask(() => {
                options.success?.({ statusCode: 200, data: { ok: true } })
                options.complete?.({})
            })
            return task
        })

            ; (globalThis as any).uni = {
                request,
                showLoading: vi.fn(),
                hideLoading: vi.fn(),
                showToast: vi.fn(),
                reLaunch: vi.fn(),
                getStorageSync: vi.fn(() => []),
                setStorageSync: vi.fn(),
                onNetworkStatusChange: vi.fn()
            }

        return { request }
    }

    beforeEach(() => {
        vi.useFakeTimers()
        mockTrackApiCall.mockClear()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.resetModules()
        vi.clearAllMocks()
        delete (globalThis as any).uni
    })

    it('injects X-Request-Id header in every request', async () => {
        const { request: uniRequest } = setupUni()

        const { default: request } = await import('@/utils/common/request')
        const promise = request<{ ok: boolean }>({ url: '/test', method: 'GET' })

        await vi.advanceTimersByTimeAsync(10)
        await expect(promise).resolves.toEqual({ ok: true })

        expect(uniRequest).toHaveBeenCalledTimes(1)
        const callArgs = uniRequest.mock.calls[0][0]
        expect(callArgs.header).toHaveProperty('X-Request-Id')
        expect(isValidRequestId(callArgs.header['X-Request-Id'])).toBe(true)
    })

    it('passes requestId to performanceMonitor.trackApiCall', async () => {
        setupUni()

        const { default: request } = await import('@/utils/common/request')
        const promise = request<{ ok: boolean }>({ url: '/test', method: 'GET' })

        await vi.advanceTimersByTimeAsync(10)
        await expect(promise).resolves.toEqual({ ok: true })

        expect(mockTrackApiCall).toHaveBeenCalledWith(
            '/test',
            'GET',
            expect.any(Number),
            200,
            expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
        )
    })
})
