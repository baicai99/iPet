/**
 * timeKey.ts unit tests
 * Focus on local-day key derivation to avoid UTC folding.
 */

import { describe, it, expect } from 'vitest'
import { getLocalDayKey, toTimestamp } from '../common/timeKey'

describe('getLocalDayKey', () => {
    it('uses local calendar day for timestamps', () => {
        const ts = new Date('2025-12-26T01:59:00+08:00').getTime()
        expect(getLocalDayKey(ts)).toBe('2025-12-26')
    })

    it('accepts record-like objects with date fields', () => {
        const record = { date: '2025-12-22T22:59:00+08:00' }
        expect(getLocalDayKey(record)).toBe('2025-12-22')
    })

    it('returns empty string for invalid input', () => {
        expect(getLocalDayKey(null)).toBe('')
        expect(getLocalDayKey(undefined)).toBe('')
    })
})

describe('toTimestamp', () => {
    it('prefers date field in objects', () => {
        const record = {
            date: '2025-12-24T01:59:00+08:00',
            updatedAt: '2025-12-25T01:59:00+08:00'
        }
        const ts = toTimestamp(record)
        expect(new Date(ts).getTime()).toBe(new Date(record.date).getTime())
    })
})
