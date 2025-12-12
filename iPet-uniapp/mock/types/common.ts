/**
 * Common types for mock handlers
 */

export interface RequestConfig {
    url: string
    method?: string
    data?: any
    header?: Record<string, string>
    params?: Record<string, any>
}
