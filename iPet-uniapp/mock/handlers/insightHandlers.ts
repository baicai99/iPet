import { RequestConfig } from '@/utils/common/request'

import { defineMock } from '../types/common'

export const getTrendInsightMock = defineMock({
    url: '/insights/trend',
    method: 'GET',
    handler: (config: RequestConfig) => {
        const { key } = (config.data || {}) as any
        const insights: Record<string, any> = {
            steps: { suggestion: '保持当前的运动量，有助于维持健康。' },
            sleep: { suggestion: '睡眠时间有所减少，建议调整作息。' },
            weight: { suggestion: '体重保持稳定，继续保持良好的饮食习惯。' },
            heart_rate: { suggestion: '静息心率正常，心脏健康状况良好。' }
        }
        return insights[key] || { suggestion: '暂无建议' }
    }
})

export const getInsightMock = defineMock({
    url: '/insights/:id',
    method: 'GET',
    handler: (config: RequestConfig) => {
        // Extract key from URL: /insights/:key
        const match = config.url.match(/\/insights\/([^/]+)$/)
        const key = match ? match[1] : ''

        const insights: Record<string, any> = {
            weight: { suggestion: '您的宠物体重控制得很好，继续保持！' },
            temperature: { suggestion: '体温正常，未发现异常波动。' },
            sleep: { suggestion: '最近睡眠质量不错，深度睡眠时间充足。' },
            steps: { suggestion: '运动量适中，建议周末可以适当增加户外活动。' }
        }
        return insights[key] || { suggestion: '根据当前数据，各项指标正常。' }
    }
})
