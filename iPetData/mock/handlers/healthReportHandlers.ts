import { generateMockReport } from '../utils/healthReportCalculator'

export const generateReportMock = (config: any) => {
    const { petId, timeRange } = (config.data || {}) as any
    return generateMockReport(petId, timeRange)
}
