/**
 * Trend Formatter Tests
 * 
 * 测试 formatHeadline 对三类状态的输出：
 * - insufficient (数据不足)
 * - stable (稳定)
 * - trending_up / trending_down (有趋势)
 */

import { describe, it, expect } from 'vitest'
import { formatHeadline, formatDirectionText, formatPercent, formatShortLabel } from '../trendFormatter'
import type { TrendResult } from '../trendTypes'

describe('formatHeadline', () => {
    describe('insufficient status', () => {
        it('should format insufficient data message correctly', () => {
            const result: TrendResult = {
                status: 'insufficient',
                direction: 'unknown',
                compareLabel: '相比上周',
                totalRecordDays: 10,
                minRequiredDays: 20
            }
            expect(formatHeadline('体重', result)).toBe('样本不足：已采集 10 天，至少需要 20 天')
        })

        it('should handle zero days', () => {
            const result: TrendResult = {
                status: 'insufficient',
                direction: 'unknown',
                compareLabel: '相比上周',
                totalRecordDays: 0,
                minRequiredDays: 20
            }
            expect(formatHeadline('体重', result)).toBe('样本不足：已采集 0 天，至少需要 20 天')
        })
    })

    describe('stable status', () => {
        it('should format stable trend message correctly', () => {
            const result: TrendResult = {
                status: 'stable',
                direction: 'flat',
                changePercent: 1,
                compareLabel: '相比上周',
                totalRecordDays: 25,
                minRequiredDays: 20
            }
            expect(formatHeadline('体重', result)).toBe('体重相比上周基本稳定')
        })

        it('should use custom compare label', () => {
            const result: TrendResult = {
                status: 'stable',
                direction: 'flat',
                changePercent: 2,
                compareLabel: '相比昨天',
                totalRecordDays: 25,
                minRequiredDays: 20
            }
            expect(formatHeadline('饭量', result)).toBe('饭量相比昨天基本稳定')
        })
    })

    describe('trending status', () => {
        it('should format upward trend correctly', () => {
            const result: TrendResult = {
                status: 'trending',
                direction: 'up',
                changePercent: 5,
                compareLabel: '相比上周',
                totalRecordDays: 25,
                minRequiredDays: 20
            }
            expect(formatHeadline('体重', result)).toBe('体重相比上周增长 5%')
        })

        it('should format downward trend correctly', () => {
            const result: TrendResult = {
                status: 'trending',
                direction: 'down',
                changePercent: -3,
                compareLabel: '相比上周',
                totalRecordDays: 25,
                minRequiredDays: 20
            }
            expect(formatHeadline('体重', result)).toBe('体重相比上周下降 3%')
        })

        it('should handle large percentage', () => {
            const result: TrendResult = {
                status: 'trending',
                direction: 'up',
                changePercent: 150,
                compareLabel: '相比上周',
                totalRecordDays: 30,
                minRequiredDays: 20
            }
            expect(formatHeadline('步数', result)).toBe('步数相比上周增长 150%')
        })

        it('should handle zero percentage in trending (edge case)', () => {
            const result: TrendResult = {
                status: 'trending',
                direction: 'up',
                changePercent: 0,
                compareLabel: '相比上周',
                totalRecordDays: 25,
                minRequiredDays: 20
            }
            expect(formatHeadline('体重', result)).toBe('体重相比上周增长 0%')
        })
    })

    describe('edge cases', () => {
        it('should handle undefined changePercent', () => {
            const result: TrendResult = {
                status: 'trending',
                direction: 'down',
                changePercent: undefined,
                compareLabel: '相比上周',
                totalRecordDays: 25,
                minRequiredDays: 20
            }
            expect(formatHeadline('体重', result)).toBe('体重相比上周下降 0%')
        })

        it('should handle empty metric name', () => {
            const result: TrendResult = {
                status: 'stable',
                direction: 'flat',
                compareLabel: '相比上周',
                totalRecordDays: 25,
                minRequiredDays: 20
            }
            expect(formatHeadline('', result)).toBe('相比上周基本稳定')
        })
    })
})

describe('formatDirectionText', () => {
    it('should format up direction', () => {
        expect(formatDirectionText('up')).toBe('上升')
    })

    it('should format down direction', () => {
        expect(formatDirectionText('down')).toBe('下降')
    })

    it('should format flat direction', () => {
        expect(formatDirectionText('flat')).toBe('稳定')
    })

    it('should format unknown direction', () => {
        expect(formatDirectionText('unknown')).toBe('')
    })
})

describe('formatPercent', () => {
    it('should format positive percentage', () => {
        expect(formatPercent(5)).toBe('5%')
    })

    it('should format negative percentage', () => {
        expect(formatPercent(-3)).toBe('3%')
    })

    it('should show sign when requested', () => {
        expect(formatPercent(5, { showSign: true })).toBe('+5%')
        expect(formatPercent(-3, { showSign: true })).toBe('-3%')
    })

    it('should handle undefined', () => {
        expect(formatPercent(undefined)).toBe('0%')
    })

    it('should respect decimals option', () => {
        expect(formatPercent(5.567, { decimals: 1 })).toBe('5.6%')
        expect(formatPercent(5.567, { decimals: 2 })).toBe('5.57%')
    })

    it('should omit symbol when requested', () => {
        expect(formatPercent(5, { addSymbol: false })).toBe('5')
    })
})

describe('formatShortLabel', () => {
    it('should format insufficient as 采集中', () => {
        const result: TrendResult = {
            status: 'insufficient',
            direction: 'unknown',
            compareLabel: '相比上周',
            totalRecordDays: 5,
            minRequiredDays: 20
        }
        expect(formatShortLabel(result)).toBe('采集中')
    })

    it('should format stable as 稳定', () => {
        const result: TrendResult = {
            status: 'stable',
            direction: 'flat',
            compareLabel: '相比上周',
            totalRecordDays: 25,
            minRequiredDays: 20
        }
        expect(formatShortLabel(result)).toBe('稳定')
    })

    it('should format trending up with arrow', () => {
        const result: TrendResult = {
            status: 'trending',
            direction: 'up',
            changePercent: 15,
            compareLabel: '相比上周',
            totalRecordDays: 25,
            minRequiredDays: 20
        }
        expect(formatShortLabel(result)).toBe('↑15%')
    })

    it('should format trending down with arrow', () => {
        const result: TrendResult = {
            status: 'trending',
            direction: 'down',
            changePercent: -10,
            compareLabel: '相比上周',
            totalRecordDays: 25,
            minRequiredDays: 20
        }
        expect(formatShortLabel(result)).toBe('↓10%')
    })
})
