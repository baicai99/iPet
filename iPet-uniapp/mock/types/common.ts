import { RequestConfig } from '../../src/utils/common/request'
export type { RequestConfig }

export interface MockHandlerConfig extends RequestConfig {
    params?: Record<string, string>
}

// Unified Mock Definition
export interface MockDefinition {
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    handler: (config: MockHandlerConfig) => any
}

// Helper to define a mock with type inference
export const defineMock = (def: MockDefinition): MockDefinition => def
