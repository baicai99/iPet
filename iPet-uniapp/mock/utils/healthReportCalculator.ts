import dayjs, { Dayjs } from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
import {
    stepHistory,
    weightHistory,
    vaccineHistory,
    medicalHistory
} from '../healthReportData.js'

export const TIME_RANGE = {
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year'
}

function getDateRange(timeRange: string) {
    const endDate = dayjs()
    let startDate: Dayjs = endDate

    switch (timeRange) {
        case TIME_RANGE.WEEK:
            startDate = endDate.subtract(7, 'day')
            break
        case TIME_RANGE.MONTH:
            startDate = endDate.subtract(1, 'month')
            break
        case TIME_RANGE.YEAR:
            startDate = endDate.subtract(1, 'year')
            break
        default:
            startDate = endDate
            break
    }

    return { startDate, endDate }
}

function filterByDateRange<T extends { [key: string]: any }>(
    data: T[],
    startDate: Dayjs,
    endDate: Dayjs,
    dateField: string = 'date'
): T[] {
    return data.filter(item => {
        const itemDate = dayjs(item[dateField])
        return itemDate.isSameOrAfter(startDate, 'day') && itemDate.isSameOrBefore(endDate, 'day')
    })
}

function calculateExerciseScore(steps: any[]) {
    if (steps.length === 0) return { score: 0, status: 'poor' }

    const dailyGoal = 8000
    const totalGoalSteps = steps.length * dailyGoal
    const totalActualSteps = steps.reduce((sum, item) => sum + item.steps, 0)
    const goalRate = (totalActualSteps / totalGoalSteps) * 100

    let score = Math.min(100, goalRate)
    let status = 'poor'

    if (score >= 90) status = 'excellent'
    else if (score >= 75) status = 'good'
    else if (score >= 60) status = 'fair'

    return {
        score: Math.round(score),
        status,
        totalSteps: totalActualSteps,
        avgDailySteps: Math.round(totalActualSteps / steps.length),
        goalRate: Math.round(goalRate * 10) / 10
    }
}

function calculateWeightScore(weights: any[]) {
    if (weights.length < 2) return { score: 100, status: 'excellent' }

    const firstWeight = weights[0].weight
    const lastWeight = weights[weights.length - 1].weight
    const weightChange = lastWeight - firstWeight
    const weightChangePercent = Math.abs((weightChange / firstWeight) * 100)

    let score = 100
    let status = 'excellent'

    if (weightChangePercent > 5) {
        score = Math.max(0, 100 - (weightChangePercent - 5) * 10)
    } else if (weightChangePercent > 3) {
        score = 90
        status = 'good'
    } else if (weightChangePercent > 2) {
        score = 95
    }

    if (score < 60) status = 'poor'
    else if (score < 75) status = 'fair'
    else if (score < 90) status = 'good'

    return {
        score: Math.round(score),
        status,
        weightChange: Math.round(weightChange * 10) / 10,
        weightChangePercent: Math.round(weightChangePercent * 10) / 10,
        currentWeight: lastWeight,
        previousWeight: firstWeight
    }
}

function calculateVaccineScore(vaccines: any[]) {
    if (vaccines.length === 0) return { score: 0, status: 'poor' }

    const now = dayjs()
    const completedCount = vaccines.filter(v => v.status === 'completed').length
    const overdueCount = vaccines.filter(v => {
        const dueDate = dayjs(v.nextDue)
        return dueDate.isBefore(now, 'day') && v.status !== 'completed'
    }).length

    let score = (completedCount / vaccines.length) * 100

    if (overdueCount > 0) {
        score = Math.max(0, score - overdueCount * 20)
    }

    let status = 'poor'
    if (score >= 90) status = 'excellent'
    else if (score >= 75) status = 'good'
    else if (score >= 60) status = 'fair'

    return {
        score: Math.round(score),
        status,
        totalVaccines: vaccines.length,
        completedCount,
        overdueCount
    }
}

function calculateMedicalScore(medicalRecords: any[], timeRange: string) {
    const visitCount = medicalRecords.length

    let optimalVisits = 1
    if (timeRange === TIME_RANGE.YEAR) optimalVisits = 2
    else if (timeRange === TIME_RANGE.MONTH) optimalVisits = 0

    let score = 100
    let status = 'excellent'

    if (visitCount > optimalVisits + 2) {
        score = 70
        status = 'fair'
    } else if (visitCount > optimalVisits + 1) {
        score = 80
        status = 'good'
    } else if (visitCount === 0 && timeRange === TIME_RANGE.YEAR) {
        score = 85
        status = 'good'
    }

    return {
        score,
        status,
        visitCount,
        routineCheckups: medicalRecords.filter(r => r.reason === '常规体检').length
    }
}

function detectAnomalies(data: any) {
    const anomalies: any[] = []
    const today = dayjs().format('YYYY-MM-DD')

    if (data.weight.weightChangePercent > 5) {
        anomalies.push({
            type: 'weight',
            severity: data.weight.weightChangePercent > 10 ? 'danger' : 'warning',
            message: `体重${data.weight.weightChange > 0 ? '增长' : '下降'} ${Math.abs(data.weight.weightChangePercent)}%，${data.weight.weightChangePercent > 10 ? '严重' : '略'}超出正常范围`,
            value: data.weight.weightChangePercent,
            date: today
        })
    }

    if (data.exercise.goalRate < 70) {
        anomalies.push({
            type: 'exercise',
            severity: data.exercise.goalRate < 50 ? 'danger' : 'warning',
            message: `运动量不足，仅达到目标的 ${data.exercise.goalRate}%`,
            value: data.exercise.goalRate,
            date: today
        })
    }

    if (data.vaccine.overdueCount > 0) {
        anomalies.push({
            type: 'vaccine',
            severity: 'warning',
            message: `有 ${data.vaccine.overdueCount} 项疫苗已逾期，请尽快接种`,
            value: data.vaccine.overdueCount,
            date: today
        })
    }

    return anomalies
}

function calculateOverallScore(scoreBreakdown: any) {
    const weights = {
        exercise: 0.3,
        weight: 0.25,
        vaccine: 0.25,
        medical: 0.2
    }

    const totalScore =
        scoreBreakdown.exercise.score * weights.exercise +
        scoreBreakdown.weight.score * weights.weight +
        scoreBreakdown.vaccine.score * weights.vaccine +
        scoreBreakdown.medical.score * weights.medical

    return Math.round(totalScore)
}

export function generateMockReport(petId: number, timeRange: string) {
    const { startDate, endDate } = getDateRange(timeRange)

    const filteredSteps = filterByDateRange(
        stepHistory.filter(s => s.petId === petId),
        startDate,
        endDate
    )
    const filteredWeights = filterByDateRange(
        weightHistory.filter(w => w.petId === petId),
        startDate,
        endDate
    )
    const filteredVaccines = vaccineHistory.filter(v => v.petId === petId)
    const filteredMedical = filterByDateRange(
        medicalHistory.filter(m => m.petId === petId),
        startDate,
        endDate
    )

    const exerciseData = calculateExerciseScore(filteredSteps)
    const weightData = calculateWeightScore(filteredWeights)
    const vaccineData = calculateVaccineScore(filteredVaccines)
    const medicalData = calculateMedicalScore(filteredMedical, timeRange)

    const scoreBreakdown = {
        exercise: {
            weight: 0.3,
            ...exerciseData
        },
        weight: {
            weight: 0.25,
            ...weightData
        },
        vaccine: {
            weight: 0.25,
            ...vaccineData
        },
        medical: {
            weight: 0.2,
            ...medicalData
        }
    }

    const healthScore = calculateOverallScore(scoreBreakdown)
    const anomalies = detectAnomalies(scoreBreakdown)

    return {
        petId,
        reportDate: dayjs().format('YYYY-MM-DD'),
        timeRange,
        dateRange: {
            start: startDate.format('YYYY-MM-DD'),
            end: endDate.format('YYYY-MM-DD')
        },
        healthScore,
        scoreBreakdown,
        anomalies,
        rawData: {
            steps: filteredSteps,
            weights: filteredWeights,
            vaccines: filteredVaccines,
            medical: filteredMedical
        }
    }
}
