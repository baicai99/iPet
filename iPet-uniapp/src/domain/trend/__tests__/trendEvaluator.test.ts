/**
 * Trend Evaluator Tests
 * 
 * 测试趋势判定引擎的核心逻辑：
 * - 数据不足判定
 * - 稳定判定
 * - 上升/下降趋势判定
 * - 边界情况处理
 */

import { describe, it, expect } from 'vitest'
import { evaluateTrend, isPositiveTrend } from '../trendEvaluator'
import { TREND_MIN_DATA_POINTS, TREND_THRESHOLD_PERCENT } from '../trendConstants'

describe('evaluateTrend', () => {
    describe('insufficient data', () => {
        it('should return insufficient when totalRecordDays < minRequired', () => {
            const result = evaluateTrend({
                values: [1, 2, 3, 4, 5],
                totalRecordDays: 10
            })

            expect(result.status).toBe('insufficient')
            expect(result.direction).toBe('unknown')
            expect(result.totalRecordDays).toBe(10)
            expect(result.minRequiredDays).toBe(TREND_MIN_DATA_POINTS)
        })

        it('should return insufficient when values array has less than 2 elements', () => {
            const result = evaluateTrend({
                values: [5],
                totalRecordDays: 25
            })

            expect(result.status).toBe('insufficient')
            expect(result.direction).toBe('unknown')
        })

        it('should return insufficient for empty values array', () => {
            const result = evaluateTrend({
                values: [],
                totalRecordDays: 25
            })

            expect(result.status).toBe('insufficient')
        })
    })

    describe('stable trend', () => {
        it('should return stable when change is below threshold', () => {
            // 创建稳定数据：近期和历史平均值接近
            const values = Array(30).fill(100) // 30 个相同的值

            const result = evaluateTrend({
                values,
                totalRecordDays: 30
            })

            expect(result.status).toBe('stable')
            expect(result.direction).toBe('flat')
            expect(result.changePercent).toBe(0)
        })

        it('should return stable when change is small', () => {
            // 创建小幅变化数据
            const values = [
                ...Array(7).fill(100), // 历史窗口
                ...Array(7).fill(105)  // 当前窗口 (5% 变化)
            ]

            const result = evaluateTrend({
                values,
                totalRecordDays: 25
            })

            expect(result.status).toBe('stable')
            // 方向仍然可以是 up，但状态是 stable
            expect(['up', 'flat']).toContain(result.direction)
        })
    })

    describe('trending up', () => {
        it('should detect upward trend when change exceeds threshold', () => {
            // 创建显著上升数据
            const values = [
                ...Array(7).fill(100), // 历史窗口平均 100
                ...Array(7).fill(150)  // 当前窗口平均 150 (50% 增长)
            ]

            const result = evaluateTrend({
                values,
                totalRecordDays: 25
            })

            expect(result.status).toBe('trending')
            expect(result.direction).toBe('up')
            expect(result.changePercent).toBe(50)
        })

        it('should handle exactly threshold percentage', () => {
            // 创建刚好达到阈值的数据
            const baseValue = 100
            const thresholdValue = baseValue * (1 + TREND_THRESHOLD_PERCENT / 100)

            const values = [
                ...Array(7).fill(baseValue),
                ...Array(7).fill(thresholdValue)
            ]

            const result = evaluateTrend({
                values,
                totalRecordDays: 25
            })

            expect(result.status).toBe('trending')
            expect(result.direction).toBe('up')
        })
    })

    describe('trending down', () => {
        it('should detect downward trend when change exceeds threshold', () => {
            // 创建显著下降数据
            const values = [
                ...Array(7).fill(100), // 历史窗口平均 100
                ...Array(7).fill(50)   // 当前窗口平均 50 (50% 下降)
            ]

            const result = evaluateTrend({
                values,
                totalRecordDays: 25
            })

            expect(result.status).toBe('trending')
            expect(result.direction).toBe('down')
            expect(result.changePercent).toBe(-50)
        })
    })

    describe('custom window size', () => {
        it('should respect custom window size', () => {
            const values = [
                ...Array(14).fill(100), // 14 天历史
                ...Array(14).fill(150)  // 14 天当前
            ]

            const result = evaluateTrend({
                values,
                totalRecordDays: 30,
                windowDays: 14
            })

            expect(result.windowDays).toBe(14)
            expect(result.status).toBe('trending')
        })
    })

    describe('custom compare label', () => {
        it('should use custom compare label', () => {
            const result = evaluateTrend({
                values: Array(30).fill(100),
                totalRecordDays: 30,
                compareLabel: '相比昨天'
            })

            expect(result.compareLabel).toBe('相比昨天')
        })
    })

    describe('edge cases', () => {
        it('should handle previousAvg of zero', () => {
            const values = [
                ...Array(7).fill(0),   // 历史窗口全是 0
                ...Array(7).fill(100)  // 当前窗口有值
            ]

            const result = evaluateTrend({
                values,
                totalRecordDays: 25
            })

            expect(result.status).toBe('stable')
            expect(result.changePercent).toBe(0)
        })

        it('should round percentage to integer', () => {
            const values = [
                ...Array(7).fill(100),
                ...Array(7).fill(133.33) // 33.33% 变化
            ]

            const result = evaluateTrend({
                values,
                totalRecordDays: 25
            })

            expect(Number.isInteger(result.changePercent)).toBe(true)
        })
    })
})

describe('isPositiveTrend', () => {
    it('should return true for stable trends', () => {
        const result = evaluateTrend({
            values: Array(30).fill(100),
            totalRecordDays: 30
        })

        expect(isPositiveTrend(result, 'positive')).toBe(true)
        expect(isPositiveTrend(result, 'negative')).toBe(true)
        expect(isPositiveTrend(result, 'neutral')).toBe(true)
    })

    it('should return true for upward trend with positive sentiment', () => {
        const values = [...Array(7).fill(100), ...Array(7).fill(150)]
        const result = evaluateTrend({ values, totalRecordDays: 25 })

        expect(isPositiveTrend(result, 'positive')).toBe(true)
        expect(isPositiveTrend(result, 'negative')).toBe(false)
    })

    it('should return true for downward trend with negative sentiment', () => {
        const values = [...Array(7).fill(100), ...Array(7).fill(50)]
        const result = evaluateTrend({ values, totalRecordDays: 25 })

        expect(isPositiveTrend(result, 'negative')).toBe(true)
        expect(isPositiveTrend(result, 'positive')).toBe(false)
    })

    it('should always return true for neutral sentiment with trending', () => {
        const values = [...Array(7).fill(100), ...Array(7).fill(150)]
        const result = evaluateTrend({ values, totalRecordDays: 25 })

        expect(isPositiveTrend(result, 'neutral')).toBe(true)
    })
})
