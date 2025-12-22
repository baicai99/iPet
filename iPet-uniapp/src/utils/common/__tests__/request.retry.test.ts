import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ErrorCode } from '@/types/error'

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

vi.mock('@/utils/performance/performanceMonitor', () => ({
    performanceMonitor: {
        trackApiCall: () => { }
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

type UniRequestSuccess = { type: 'success'; statusCode: number; data?: any }
type UniRequestFail = { type: 'fail'; errMsg: string }
type UniRequestStep = UniRequestSuccess | UniRequestFail

const setupUni = (steps: UniRequestStep[]) => {
    const request = vi.fn((options: any) => {
        let done = false

        const task = {
            abort: vi.fn(() => {
                if (done) return
                done = true
                queueMicrotask(() => {
                    options.fail?.({ errMsg: 'request:fail abort' })
                    options.complete?.({})
                })
            })
        }

        const step = steps.shift()
        queueMicrotask(() => {
            if (done) return
            done = true

            if (!step) {
                options.fail?.({ errMsg: 'request:fail no-mock-step' })
                options.complete?.({})
                return
            }

            if (step.type === 'success') {
                options.success?.({ statusCode: step.statusCode, data: step.data })
                options.complete?.({})
                return
            }

            options.fail?.({ errMsg: step.errMsg })
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

describe('request retry (exponential backoff)', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.resetModules()
        vi.clearAllMocks()
        delete (globalThis as any).uni
    })

    it('retries retryable HTTP statuses with exponential backoff', async () => {
        const { request: uniRequest } = setupUni([
            { type: 'success', statusCode: 500, data: { message: 'e1' } },
            { type: 'success', statusCode: 502, data: { message: 'e2' } },
            { type: 'success', statusCode: 200, data: { ok: true } }
        ])

        const { default: request } = await import('@/utils/common/request')
        const promise = request<{ ok: boolean }>({ url: '/test', method: 'GET' })

        expect(uniRequest).toHaveBeenCalledTimes(1)

        await vi.advanceTimersByTimeAsync(1000)
        expect(uniRequest).toHaveBeenCalledTimes(2)

        await vi.advanceTimersByTimeAsync(2000)
        expect(uniRequest).toHaveBeenCalledTimes(3)

        await expect(promise).resolves.toEqual({ ok: true })
    })

    it('does not retry non-retryable HTTP statuses', async () => {
        const { request: uniRequest } = setupUni([
            { type: 'success', statusCode: 400, data: { message: 'bad' } }
        ])

        const { default: request } = await import('@/utils/common/request')
        await expect(request({ url: '/bad', method: 'GET' })).rejects.toMatchObject({ code: ErrorCode.INVALID_PARAMS })
        expect(uniRequest).toHaveBeenCalledTimes(1)
    })

    it('retries timeout/network failures before rejecting (GET)', async () => {
        const { request: uniRequest } = setupUni([
            { type: 'fail', errMsg: 'request:fail timeout' },
            { type: 'fail', errMsg: 'request:fail' },
            { type: 'success', statusCode: 200, data: { ok: true } }
        ])

        const { default: request } = await import('@/utils/common/request')
        const promise = request<{ ok: boolean }>({ url: '/unstable', method: 'GET' })

        expect(uniRequest).toHaveBeenCalledTimes(1)

        await vi.advanceTimersByTimeAsync(1000)
        expect(uniRequest).toHaveBeenCalledTimes(2)

        await vi.advanceTimersByTimeAsync(2000)
        expect(uniRequest).toHaveBeenCalledTimes(3)

        await expect(promise).resolves.toEqual({ ok: true })
    })

    it('abortKey cancels pending retries from previous request', async () => {
        const { request: uniRequest } = setupUni([
            { type: 'success', statusCode: 500, data: { message: 'e1' } }, // p1 attempt 1, schedules retry
            { type: 'success', statusCode: 200, data: { ok: true } } // p2 attempt 1
        ])

        const { default: request } = await import('@/utils/common/request')
        const p1 = request({ url: '/t', method: 'GET', abortKey: 'search' })
        const p1Expectation = expect(p1).rejects.toMatchObject({ code: ErrorCode.ABORTED })
        const p2 = request({ url: '/t2', method: 'GET', abortKey: 'search' })

        await expect(p2).resolves.toEqual({ ok: true })
        await p1Expectation

        await vi.advanceTimersByTimeAsync(10_000)
        expect(uniRequest).toHaveBeenCalledTimes(2)
    })
})
