import { defineMock } from '../types/common'
import { generateMockReport } from '../utils/healthReportCalculator'

export const generateReportMock = defineMock({
    url: '/health/reports/generate',
    method: 'POST',
    handler: (config: any) => {
        const { petId, timeRange } = (config.data || {}) as any
        return generateMockReport(petId, timeRange)
    }
})
