import { describe, expect, it } from 'vitest'
import { getTrendStatus } from '../getTrendStatus'
import type { TrendAnalysis } from '../detectSignificantChanges'

const makeTrend = (overrides: Partial<TrendAnalysis> = {}): TrendAnalysis => ({
    hasSignificantChange: false,
    changePercent: 0,
    previousAvg: 100,
    recentAvg: 100,
    dataPoints: 20,
    direction: 'stable',
    ...overrides
})

describe('getTrendStatus', () => {
    it('returns insufficient-data when total days is below the threshold', () => {
        const result = getTrendStatus({}, 10)

        expect(result.status).toBe('insufficient-data')
        expect(result.samplingDays).toBe(10)
        expect(result.message).toContain('累计采样 10 天')
        expect(result.changedCount).toBe(0)
        expect(result.stableCount).toBe(0)
    })

    it('returns all-stable when sampling threshold is met but no metric has changes', () => {
        const stableTrend = makeTrend({ dataPoints: 25 })
        const result = getTrendStatus({ weight: stableTrend }, 25)

        expect(result.status).toBe('all-stable')
        expect(result.message).toBe('当前所有趋势趋于稳定')
        expect(result.changedCount).toBe(0)
        expect(result.stableCount).toBe(1)
    })

    it('returns has-trends when there is at least one changed metric', () => {
        const changedTrend = makeTrend({
            hasSignificantChange: true,
            changePercent: 35,
            previousAvg: 80,
            recentAvg: 120,
            dataPoints: 30,
            direction: 'up'
        })
        const stableTrend = makeTrend({ dataPoints: 22 })
        const result = getTrendStatus({ step_count: changedTrend, weight: stableTrend }, 32)

        expect(result.status).toBe('has-trends')
        expect(result.message).toBe('')
        expect(result.changedCount).toBe(1)
        expect(result.stableCount).toBe(1)
    })
})
