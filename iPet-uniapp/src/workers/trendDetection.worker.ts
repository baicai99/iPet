import { detectSignificantChange, type MetricRecord, type TrendAnalysis } from '../domain/trend/detectSignificantChanges'

type WorkerRequest = {
    id: number
    metricKey: string
    records: MetricRecord[]
}

type WorkerResponse =
    | { id: number; metricKey: string; hash: string; result: TrendAnalysis }
    | { id: number; error: string }

function calculateMetricHash(records: MetricRecord[]): string {
    if (records.length === 0) return '0:0'
    const lastTimestamp = records[records.length - 1].date || '0'
    return `${lastTimestamp}:${records.length}`
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
    const { id, metricKey, records } = event.data

    try {
        const hash = calculateMetricHash(records)
        const result = detectSignificantChange(records)

        const response: WorkerResponse = {
            id,
            metricKey,
            hash,
            result
        }
        ;(self as any).postMessage(response)
    } catch (err) {
        const response: WorkerResponse = {
            id,
            error: err instanceof Error ? err.message : String(err)
        }
        ;(self as any).postMessage(response)
    }
}

