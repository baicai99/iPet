
import dayjs, { ConfigType } from 'dayjs'

export const getValues = (records: any[] | undefined | null) => records ? records.map(r => r.value) : []

export const calcAverage = (vals: number[]) => {
    if (!vals || !vals.length) return 0
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}

export const getLinePosition = (average: number, maxValue: number) => {
    if (maxValue === 0) return '100%'
    const percentage = (average / maxValue) * 100
    return `${100 - percentage}%`
}

export const formatDate = (date: ConfigType, pattern: string = 'YYYY-MM-DD') => {
    const parsed = dayjs(date)
    return parsed.isValid() ? parsed.format(pattern) : ''
}

export const formatPetAge = (birthTimestamp: ConfigType) => {
    if (!birthTimestamp) {
        return '未知'
    }

    const birth = dayjs(birthTimestamp)
    if (!birth.isValid()) {
        return '未知'
    }

    const now = dayjs()
    const years = now.diff(birth, 'year')
    const months = now.diff(birth.add(years, 'year'), 'month')

    if (years > 0) {
        if (months >= 6) {
            return `${years}岁半`
        }
        return `${years}岁`
    }

    const displayMonths = Math.max(0, months)
    return displayMonths === 0 ? '不足1个月' : `${displayMonths}个月`
}

export const formatSmartDate = (dateString: ConfigType) => {
    if (!dateString) return ''

    const date = dayjs(dateString)
    if (!date.isValid()) return ''

    const now = dayjs()
    const today = now.startOf('day')
    const targetDate = date.startOf('day')
    const diffDays = today.diff(targetDate, 'day')

    // Today: HH:mm
    if (diffDays === 0) {
        return date.format('HH:mm')
    }

    // Yesterday
    if (diffDays === 1) {
        return '昨天'
    }

    // Day before yesterday
    if (diffDays === 2) {
        return '前天'
    }

    // This year: M月D日
    if (date.year() === now.year()) {
        return date.format('M月D日')
    }

    // Past years: YYYY年M月
    return date.format('YYYY年M月')
}
