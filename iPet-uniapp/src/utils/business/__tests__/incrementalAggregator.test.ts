/**
 * incrementalAggregator.ts 单元测试
 * 
 * 测试增量聚合器的正确性
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { IncrementalAggregator, createAggregator } from '../incrementalAggregator'

describe('IncrementalAggregator', () => {
    describe('addRecord - sum 聚合', () => {
        let agg: IncrementalAggregator

        beforeEach(() => {
            agg = createAggregator('sum')
        })

        it('单条记录应正确添加', () => {
            const ts = new Date('2024-01-15T10:00:00+08:00').getTime()
            agg.addRecord({ id: '1', ts, value: 100 })

            const points = agg.getDailyPoints()
            expect(points.length).toBe(1)
            expect(points[0].value).toBe(100)
            expect(points[0].count).toBe(1)
        })

        it('同一天多条记录应正确求和', () => {
            const ts1 = new Date('2024-01-15T08:00:00+08:00').getTime()
            const ts2 = new Date('2024-01-15T12:00:00+08:00').getTime()
            const ts3 = new Date('2024-01-15T18:00:00+08:00').getTime()

            agg.addRecord({ id: '1', ts: ts1, value: 100 })
            agg.addRecord({ id: '2', ts: ts2, value: 150 })
            agg.addRecord({ id: '3', ts: ts3, value: 50 })

            const points = agg.getDailyPoints()
            expect(points.length).toBe(1)
            expect(points[0].value).toBe(300)
            expect(points[0].count).toBe(3)
        })

        it('不同天记录应分开聚合', () => {
            const ts1 = new Date('2024-01-15T10:00:00+08:00').getTime()
            const ts2 = new Date('2024-01-16T10:00:00+08:00').getTime()

            agg.addRecord({ id: '1', ts: ts1, value: 100 })
            agg.addRecord({ id: '2', ts: ts2, value: 200 })

            const points = agg.getDailyPoints()
            expect(points.length).toBe(2)
        })
    })

    describe('addRecord - avg 聚合', () => {
        let agg: IncrementalAggregator

        beforeEach(() => {
            agg = createAggregator('avg')
        })

        it('应正确计算平均值', () => {
            const ts = new Date('2024-01-15T10:00:00+08:00').getTime()
            agg.addRecord({ id: '1', ts, value: 100 })
            agg.addRecord({ id: '2', ts: ts + 1000, value: 200 })
            agg.addRecord({ id: '3', ts: ts + 2000, value: 300 })

            const points = agg.getDailyPoints()
            expect(points[0].value).toBe(200) // (100+200+300)/3
        })
    })

    describe('addRecord - latest 聚合', () => {
        let agg: IncrementalAggregator

        beforeEach(() => {
            agg = createAggregator('latest')
        })

        it('应返回当天最后一条记录的值', () => {
            const ts1 = new Date('2024-01-15T08:00:00+08:00').getTime()
            const ts2 = new Date('2024-01-15T12:00:00+08:00').getTime()
            const ts3 = new Date('2024-01-15T18:00:00+08:00').getTime()

            agg.addRecord({ id: '1', ts: ts1, value: 100 })
            agg.addRecord({ id: '2', ts: ts2, value: 150 })
            agg.addRecord({ id: '3', ts: ts3, value: 200 })

            const points = agg.getDailyPoints()
            expect(points[0].value).toBe(200) // 最后一条
        })

        it('乱序添加仍应返回时间最晚的值', () => {
            const ts1 = new Date('2024-01-15T18:00:00+08:00').getTime()
            const ts2 = new Date('2024-01-15T08:00:00+08:00').getTime()
            const ts3 = new Date('2024-01-15T12:00:00+08:00').getTime()

            agg.addRecord({ id: '1', ts: ts1, value: 300 })
            agg.addRecord({ id: '2', ts: ts2, value: 100 })
            agg.addRecord({ id: '3', ts: ts3, value: 200 })

            const points = agg.getDailyPoints()
            expect(points[0].value).toBe(300)
        })
    })

    describe('addRecord - max 聚合', () => {
        let agg: IncrementalAggregator

        beforeEach(() => {
            agg = createAggregator('max')
        })

        it('应返回当天最大值', () => {
            const ts = new Date('2024-01-15T10:00:00+08:00').getTime()
            agg.addRecord({ id: '1', ts, value: 100 })
            agg.addRecord({ id: '2', ts: ts + 1000, value: 300 })
            agg.addRecord({ id: '3', ts: ts + 2000, value: 200 })

            const points = agg.getDailyPoints()
            expect(points[0].value).toBe(300)
        })
    })

    describe('addRecord - min 聚合', () => {
        let agg: IncrementalAggregator

        beforeEach(() => {
            agg = createAggregator('min')
        })

        it('应返回当天最小值', () => {
            const ts = new Date('2024-01-15T10:00:00+08:00').getTime()
            agg.addRecord({ id: '1', ts, value: 100 })
            agg.addRecord({ id: '2', ts: ts + 1000, value: 50 })
            agg.addRecord({ id: '3', ts: ts + 2000, value: 200 })

            const points = agg.getDailyPoints()
            expect(points[0].value).toBe(50)
        })
    })

    describe('removeRecord', () => {
        let agg: IncrementalAggregator

        beforeEach(() => {
            agg = createAggregator('sum')
        })

        it('移除记录后应正确更新聚合值', () => {
            const ts = new Date('2024-01-15T10:00:00+08:00').getTime()
            agg.addRecord({ id: '1', ts, value: 100 })
            agg.addRecord({ id: '2', ts: ts + 1000, value: 200 })

            agg.removeRecord({ id: '1', ts, value: 100 })

            const points = agg.getDailyPoints()
            expect(points[0].value).toBe(200)
            expect(points[0].count).toBe(1)
        })

        it('移除所有记录后应无数据', () => {
            const ts = new Date('2024-01-15T10:00:00+08:00').getTime()
            agg.addRecord({ id: '1', ts, value: 100 })
            agg.removeRecord({ id: '1', ts, value: 100 })

            expect(agg.hasData()).toBe(false)
        })
    })

    describe('updateRecord', () => {
        let agg: IncrementalAggregator

        beforeEach(() => {
            agg = createAggregator('sum')
        })

        it('同一天更新应正确修改聚合值', () => {
            const ts = new Date('2024-01-15T10:00:00+08:00').getTime()
            agg.addRecord({ id: '1', ts, value: 100 })

            agg.updateRecord(
                { id: '1', ts, value: 100 },
                { id: '1', ts, value: 150 }
            )

            const points = agg.getDailyPoints()
            expect(points[0].value).toBe(150)
        })

        it('跨天更新应移动到新的一天', () => {
            const ts1 = new Date('2024-01-15T10:00:00+08:00').getTime()
            const ts2 = new Date('2024-01-16T10:00:00+08:00').getTime()

            agg.addRecord({ id: '1', ts: ts1, value: 100 })

            agg.updateRecord(
                { id: '1', ts: ts1, value: 100 },
                { id: '1', ts: ts2, value: 100 }
            )

            const points = agg.getDailyPoints()
            expect(points.length).toBe(1)
            expect(points[0].date).toContain('2024-01-16')
        })
    })

    describe('Dirty Tracking', () => {
        let agg: IncrementalAggregator

        beforeEach(() => {
            agg = createAggregator('sum')
        })

        it('添加记录后应标记为脏', () => {
            const ts = new Date('2024-01-15T10:00:00+08:00').getTime()
            agg.addRecord({ id: '1', ts, value: 100 })

            expect(agg.isDirty()).toBe(true)
            expect(agg.getDirtyDays().length).toBe(1)
        })

        it('清除脏标记后应不脏', () => {
            const ts = new Date('2024-01-15T10:00:00+08:00').getTime()
            agg.addRecord({ id: '1', ts, value: 100 })
            agg.clearDirty()

            expect(agg.isDirty()).toBe(false)
        })

        it('脏桶应包含周和月', () => {
            const ts = new Date('2024-01-15T10:00:00+08:00').getTime()
            agg.addRecord({ id: '1', ts, value: 100 })

            const buckets = agg.getDirtyBuckets()
            expect(buckets.some(b => b.includes('-W'))).toBe(true) // 周
            expect(buckets.some(b => b.match(/^\d{4}-\d{2}$/))).toBe(true) // 月
        })
    })

    describe('buildFromRecords', () => {
        it('批量初始化应正确构建', () => {
            const agg = createAggregator('sum')
            const ts = new Date('2024-01-15T10:00:00+08:00').getTime()

            agg.buildFromRecords([
                { id: '1', ts, value: 100 },
                { id: '2', ts: ts + 1000, value: 200 },
                { id: '3', ts: ts + MS_PER_DAY, value: 300 }
            ])

            expect(agg.getDayCount()).toBe(2)
            expect(agg.isDirty()).toBe(false) // 初始化后清除脏标记
        })
    })

    describe('getDailyPointsInRange', () => {
        it('应只返回范围内的点', () => {
            const agg = createAggregator('sum')
            const ts1 = new Date('2024-01-15T10:00:00+08:00').getTime()
            const ts2 = new Date('2024-01-16T10:00:00+08:00').getTime()
            const ts3 = new Date('2024-01-17T10:00:00+08:00').getTime()

            agg.addRecord({ id: '1', ts: ts1, value: 100 })
            agg.addRecord({ id: '2', ts: ts2, value: 200 })
            agg.addRecord({ id: '3', ts: ts3, value: 300 })

            const points = agg.getDailyPointsInRange(ts1, ts2)
            expect(points.length).toBe(2)
        })
    })

    describe('Edge Cases', () => {
        it('空聚合器应无数据', () => {
            const agg = createAggregator('sum')
            expect(agg.hasData()).toBe(false)
            expect(agg.getDayCount()).toBe(0)
            expect(agg.getDailyPoints()).toEqual([])
        })

        it('值为 0 应正确处理', () => {
            const agg = createAggregator('sum')
            const ts = new Date('2024-01-15T10:00:00+08:00').getTime()

            agg.addRecord({ id: '1', ts, value: 0 })
            agg.addRecord({ id: '2', ts: ts + 1000, value: 0 })

            const points = agg.getDailyPoints()
            expect(points[0].value).toBe(0)
            expect(points[0].count).toBe(2)
        })

        it('负值应正确处理', () => {
            const agg = createAggregator('sum')
            const ts = new Date('2024-01-15T10:00:00+08:00').getTime()

            agg.addRecord({ id: '1', ts, value: 100 })
            agg.addRecord({ id: '2', ts: ts + 1000, value: -50 })

            const points = agg.getDailyPoints()
            expect(points[0].value).toBe(50)
        })
    })
})

const MS_PER_DAY = 86400000
