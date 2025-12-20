export const SECTION_META = {
    today: { title: '今天', key: 'today' },
    past7: { title: '过去7天', key: 'past7' },
    past30: { title: '过去30天', key: 'past30' },
    past12Months: { title: '过去12个月', key: 'past12Months' },
    earlier: { title: '更早', key: 'earlier' },
    noRecords: { title: '暂无记录', key: 'noRecords' }
}

export const determineTimeSection = (date: Date | null | undefined, now: Date): string => {
    if (!date || Number.isNaN(date.getTime())) {
        return 'noRecords'
    }

    const diffMs = now.getTime() - date.getTime()
    if (diffMs < 0) {
        // Future dates are treated as today for now, or could be a separate 'future' section
        return 'today'
    }

    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)

    const dateStart = new Date(date)
    dateStart.setHours(0, 0, 0, 0)

    // Calculate difference in full days
    const dayDiff = Math.floor((startOfDay.getTime() - dateStart.getTime()) / (1000 * 60 * 60 * 24))

    if (dayDiff === 0) {
        return 'today'
    }
    if (dayDiff <= 7) {
        return 'past7'
    }
    if (dayDiff <= 30) {
        return 'past30'
    }
    if (dayDiff <= 365) {
        return 'past12Months'
    }
    return 'earlier'
}
