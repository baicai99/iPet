/**
 * Trend Consistency Tests
 * 
 * 验证 TrendCard 和 InsightBubble 使用相同的 headline
 * 确保 Summary 页面的事实句与 Detail 页面的气泡文案前缀一致
 */

import { describe, it, expect } from 'vitest'
import { evaluateTrend } from '../trendEvaluator'
import { formatHeadline } from '../trendFormatter'
import { buildInsightBubble } from '@/utils/business/insightBubble'

describe('TrendCard vs InsightBubble consistency', () => {
    describe('headline matching', () => {
        it('should generate identical headline for same data (trending up)', () => {
            // 模拟有明显上升趋势的数据（需要 >= 20 天）
            const values = [
                ...Array(10).fill(100),  // 历史窗口
                ...Array(10).fill(150)   // 当前窗口 (50% 增长)
            ]
            const metricName = '体重'

            // TrendCard 路径（使用 values.length，与 InsightBubble 一致）
            const trendResult = evaluateTrend({
                values,
                totalRecordDays: values.length
            })
            const cardHeadline = formatHeadline(metricName, trendResult)

            // InsightBubble 路径
            const bubbleResult = buildInsightBubble({
                metricTitle: metricName,
                category: 'bodyMeasurement',
                values
            })

            // 验证：两者的 headline 完全一致
            expect(bubbleResult.headline).toBe(cardHeadline)
        })

        it('should generate identical headline for same data (trending down)', () => {
            const values = [
                ...Array(10).fill(100),  // 历史窗口
                ...Array(10).fill(50)    // 当前窗口 (50% 下降)
            ]
            const metricName = '饭量'

            const trendResult = evaluateTrend({
                values,
                totalRecordDays: values.length
            })
            const cardHeadline = formatHeadline(metricName, trendResult)

            const bubbleResult = buildInsightBubble({
                metricTitle: metricName,
                category: 'nutritionIntake',
                values
            })

            expect(bubbleResult.headline).toBe(cardHeadline)
        })

        it('should generate identical headline for stable data', () => {
            const values = Array(30).fill(10)  // 稳定数据
            const metricName = '体温'

            const trendResult = evaluateTrend({
                values,
                totalRecordDays: values.length
            })
            const cardHeadline = formatHeadline(metricName, trendResult)

            const bubbleResult = buildInsightBubble({
                metricTitle: metricName,
                category: 'vitalSigns',
                values
            })

            expect(bubbleResult.headline).toBe(cardHeadline)
        })

        it('should generate identical headline for insufficient data', () => {
            const values = [10, 10.5]  // 数据不足
            const metricName = '步数'

            const trendResult = evaluateTrend({
                values,
                totalRecordDays: values.length
            })
            const cardHeadline = formatHeadline(metricName, trendResult)

            const bubbleResult = buildInsightBubble({
                metricTitle: metricName,
                category: 'activity',
                values
            })

            expect(bubbleResult.headline).toBe(cardHeadline)
        })
    })

    describe('text structure', () => {
        it('InsightBubble text should start with headline', () => {
            const values = [...Array(10).fill(100), ...Array(10).fill(150)]

            const bubbleResult = buildInsightBubble({
                metricTitle: '体重',
                category: 'bodyMeasurement',
                values
            })

            // 验证：完整 text 以 headline 开头
            expect(bubbleResult.text.startsWith(bubbleResult.headline)).toBe(true)
        })

        it('InsightBubble should contain advice after headline', () => {
            const values = [...Array(10).fill(100), ...Array(10).fill(150)]

            const bubbleResult = buildInsightBubble({
                metricTitle: '体重',
                category: 'bodyMeasurement',
                values
            })

            // 验证：text 包含 advice（如果有的话）
            if (bubbleResult.advice) {
                expect(bubbleResult.text).toContain(bubbleResult.advice)
            }
        })

        it('InsightBubble text format should be headline + comma + advice', () => {
            const values = [...Array(10).fill(100), ...Array(10).fill(150)]

            const bubbleResult = buildInsightBubble({
                metricTitle: '体重',
                category: 'bodyMeasurement',
                values
            })

            if (bubbleResult.advice) {
                const expectedFormat = `${bubbleResult.headline}，${bubbleResult.advice}`
                expect(bubbleResult.text).toBe(expectedFormat)
            }
        })
    })

    describe('trendResult consistency', () => {
        it('should return matching trendResult in InsightBubble', () => {
            const values = [...Array(10).fill(100), ...Array(10).fill(150)]

            const directResult = evaluateTrend({
                values,
                totalRecordDays: values.length
            })

            const bubbleResult = buildInsightBubble({
                metricTitle: '体重',
                category: 'bodyMeasurement',
                values
            })

            // 验证关键字段一致
            expect(bubbleResult.trendResult.status).toBe(directResult.status)
            expect(bubbleResult.trendResult.direction).toBe(directResult.direction)
            expect(bubbleResult.trendResult.changePercent).toBe(directResult.changePercent)
        })
    })
})
