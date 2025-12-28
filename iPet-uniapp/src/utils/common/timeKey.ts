export function toTimestamp(input: unknown): number {
    if (!input) return 0

    if (typeof input === 'number') {
        return input
    }

    if (input instanceof Date) {
        return input.getTime()
    }

    if (typeof input === 'object') {
        const record = input as Record<string, unknown>
        const target = record.date || record.updatedAt || record.timestamp
        if (target) {
            return toTimestamp(target)
        }
    }

    if (typeof input === 'string') {
        const date = new Date(input)
        if (!Number.isNaN(date.getTime())) {
            return date.getTime()
        }
    }

    return 0
}

export function getLocalDayKey(input: unknown): string {
    const ts = toTimestamp(input)
    if (!ts) return ''

    const date = new Date(ts)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}
