/**
 * fastTime.ts 单元测试
 * 
 * 测试轻量时间函数的正确性
 */

import { describe, it, expect } from 'vitest'
import {
    startOfDayMs,
    endOfDayMs,
    daysDiff,
    startOfWeekMs,
    startOfMonthMs,
    dayKey,
    weekKey,
    monthKey,
    generateDayAxisMs,
    generateDayAxisMsBackward,
    generateWeekAxisMs,
    generateMonthAxisMs,
    formatDayLabel,
    isSameDay,
    isInRange,
    MS_PER_DAY,
    MS_PER_WEEK
} from '../fastTime'

describe('startOfDayMs', () => {
    it('应返回当天 00:00:00 的时间戳', () => {
        // 2024-01-15 10:30:00 UTC+8
        const ts = new Date('2024-01-15T10:30:00+08:00').getTime()
        const dayStart = startOfDayMs(ts)
        const dayStartDate = new Date(dayStart)

        expect(dayStartDate.getHours()).toBe(0)
        expect(dayStartDate.getMinutes()).toBe(0)
        expect(dayStartDate.getSeconds()).toBe(0)
    })

    it('跨日边界：23:59:59 和 00:00:01 应在同一天', () => {
        const ts1 = new Date('2024-01-15T23:59:59+08:00').getTime()
        const ts2 = new Date('2024-01-15T00:00:01+08:00').getTime()

        expect(startOfDayMs(ts1)).toBe(startOfDayMs(ts2))
    })

    it('跨日边界：00:00:00 和前一天 23:59:59 应在不同天', () => {
        const ts1 = new Date('2024-01-16T00:00:00+08:00').getTime()
        const ts2 = new Date('2024-01-15T23:59:59+08:00').getTime()

        expect(startOfDayMs(ts1)).not.toBe(startOfDayMs(ts2))
    })
})

describe('endOfDayMs', () => {
    it('应返回第二天 00:00:00 的时间戳', () => {
        const ts = new Date('2024-01-15T10:30:00+08:00').getTime()
        const dayEnd = endOfDayMs(ts)

        expect(dayEnd - startOfDayMs(ts)).toBe(MS_PER_DAY)
    })
})

describe('daysDiff', () => {
    it('同一天应返回 0', () => {
        const ts1 = new Date('2024-01-15T08:00:00+08:00').getTime()
        const ts2 = new Date('2024-01-15T20:00:00+08:00').getTime()

        expect(daysDiff(ts1, ts2)).toBe(0)
    })

    it('相隔一天应返回 1', () => {
        const ts1 = new Date('2024-01-15T08:00:00+08:00').getTime()
        const ts2 = new Date('2024-01-16T08:00:00+08:00').getTime()

        expect(daysDiff(ts1, ts2)).toBe(1)
    })

    it('相隔一周应返回 7', () => {
        const ts1 = new Date('2024-01-15T08:00:00+08:00').getTime()
        const ts2 = new Date('2024-01-22T08:00:00+08:00').getTime()

        expect(daysDiff(ts1, ts2)).toBe(7)
    })
})

describe('startOfWeekMs', () => {
    it('周三应返回本周一 00:00', () => {
        // 2024-01-17 是周三
        const ts = new Date('2024-01-17T10:00:00+08:00').getTime()
        const weekStart = startOfWeekMs(ts)
        const weekStartDate = new Date(weekStart)

        // 应该是 2024-01-15 周一
        expect(weekStartDate.getDay()).toBe(1) // 周一
    })

    it('周一应返回当天 00:00', () => {
        // 2024-01-15 是周一
        const ts = new Date('2024-01-15T10:00:00+08:00').getTime()
        const weekStart = startOfWeekMs(ts)

        expect(weekStart).toBe(startOfDayMs(ts))
    })

    it('周日应返回上周一 00:00', () => {
        // 2024-01-21 是周日
        const ts = new Date('2024-01-21T10:00:00+08:00').getTime()
        const weekStart = startOfWeekMs(ts)
        const weekStartDate = new Date(weekStart)

        // 应该是 2024-01-15 周一
        expect(weekStartDate.getDate()).toBe(15)
    })
})

describe('startOfMonthMs', () => {
    it('月中应返回月初 1 日 00:00', () => {
        const ts = new Date('2024-01-15T10:00:00+08:00').getTime()
        const monthStart = startOfMonthMs(ts)
        const date = new Date(monthStart)

        expect(date.getDate()).toBe(1)
    })

    it('月末应返回同月 1 日', () => {
        const ts = new Date('2024-01-31T23:59:59+08:00').getTime()
        const monthStart = startOfMonthMs(ts)
        const date = new Date(monthStart)

        expect(date.getMonth()).toBe(0) // 1月
        expect(date.getDate()).toBe(1)
    })
})

describe('dayKey', () => {
    it('应生成 YYYY-MM-DD 格式', () => {
        const ts = new Date('2024-01-15T10:00:00+08:00').getTime()
        expect(dayKey(ts)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('月份和日期应补零', () => {
        const ts = new Date('2024-01-05T10:00:00+08:00').getTime()
        const key = dayKey(ts)
        expect(key).toContain('-01-')
        expect(key).toContain('-05')
    })
})

describe('weekKey', () => {
    it('应生成 YYYY-Www 格式', () => {
        const ts = new Date('2024-01-15T10:00:00+08:00').getTime()
        expect(weekKey(ts)).toMatch(/^\d{4}-W\d{2}$/)
    })
})

describe('monthKey', () => {
    it('应生成 YYYY-MM 格式', () => {
        const ts = new Date('2024-01-15T10:00:00+08:00').getTime()
        expect(monthKey(ts)).toBe('2024-01')
    })
})

describe('generateDayAxisMs', () => {
    it('应生成连续日期时间戳', () => {
        const start = new Date('2024-01-15T00:00:00+08:00').getTime()
        const axis = generateDayAxisMs(start, 7)

        expect(axis.length).toBe(7)
        // 每个时间戳相差一天
        for (let i = 1; i < axis.length; i++) {
            expect(axis[i] - axis[i - 1]).toBe(MS_PER_DAY)
        }
    })
})

describe('generateDayAxisMsBackward', () => {
    it('应从结束日期向前生成', () => {
        const end = new Date('2024-01-21T10:00:00+08:00').getTime()
        const axis = generateDayAxisMsBackward(end, 7)

        expect(axis.length).toBe(7)
        // 最后一个应该是 endTs 当天
        expect(startOfDayMs(axis[6])).toBe(startOfDayMs(end))
    })
})

describe('generateWeekAxisMs', () => {
    it('应生成连续周时间戳', () => {
        const start = new Date('2024-01-15T00:00:00+08:00').getTime()
        const axis = generateWeekAxisMs(start, 4)

        expect(axis.length).toBe(4)
        for (let i = 1; i < axis.length; i++) {
            expect(axis[i] - axis[i - 1]).toBe(MS_PER_WEEK)
        }
    })
})

describe('generateMonthAxisMs', () => {
    it('应生成连续月时间戳', () => {
        const start = new Date('2024-01-15T00:00:00+08:00').getTime()
        const axis = generateMonthAxisMs(start, 3)

        expect(axis.length).toBe(3)
        // 每个月的 1 日
        axis.forEach(ts => {
            expect(new Date(ts).getDate()).toBe(1)
        })
    })
})

describe('formatDayLabel', () => {
    it('ddd: 应返回星期几缩写', () => {
        const ts = new Date('2024-01-15T10:00:00+08:00').getTime() // 周一
        expect(formatDayLabel(ts, 'ddd')).toBe('Mon')
    })

    it('D: 应返回日期数字', () => {
        const ts = new Date('2024-01-15T10:00:00+08:00').getTime()
        expect(formatDayLabel(ts, 'D')).toBe('15')
    })

    it('MM/DD: 应返回月/日格式', () => {
        const ts = new Date('2024-01-05T10:00:00+08:00').getTime()
        expect(formatDayLabel(ts, 'MM/DD')).toBe('01/05')
    })
})

describe('isSameDay', () => {
    it('同一天不同时间应返回 true', () => {
        const ts1 = new Date('2024-01-15T08:00:00+08:00').getTime()
        const ts2 = new Date('2024-01-15T20:00:00+08:00').getTime()

        expect(isSameDay(ts1, ts2)).toBe(true)
    })

    it('不同天应返回 false', () => {
        const ts1 = new Date('2024-01-15T08:00:00+08:00').getTime()
        const ts2 = new Date('2024-01-16T08:00:00+08:00').getTime()

        expect(isSameDay(ts1, ts2)).toBe(false)
    })
})

describe('isInRange', () => {
    it('范围内应返回 true', () => {
        const from = new Date('2024-01-15T00:00:00+08:00').getTime()
        const to = new Date('2024-01-21T23:59:59+08:00').getTime()
        const ts = new Date('2024-01-17T10:00:00+08:00').getTime()

        expect(isInRange(ts, from, to)).toBe(true)
    })

    it('范围外应返回 false', () => {
        const from = new Date('2024-01-15T00:00:00+08:00').getTime()
        const to = new Date('2024-01-21T23:59:59+08:00').getTime()
        const ts = new Date('2024-01-22T10:00:00+08:00').getTime()

        expect(isInRange(ts, from, to)).toBe(false)
    })

    it('边界值应返回 true', () => {
        const from = new Date('2024-01-15T00:00:00+08:00').getTime()
        const to = new Date('2024-01-21T23:59:59+08:00').getTime()

        expect(isInRange(from, from, to)).toBe(true)
        expect(isInRange(to, from, to)).toBe(true)
    })
})
