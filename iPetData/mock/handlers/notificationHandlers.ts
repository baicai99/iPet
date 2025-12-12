import { RequestConfig } from '../types/common'

export const markReadMock = (config: RequestConfig) => {
    return { success: true }
}

export const markAllReadMock = (config: RequestConfig) => {
    return { success: true }
}

export const updatePreferenceMock = (config: RequestConfig) => {
    return { success: true }
}

export const syncAllPreferencesMock = (config: RequestConfig) => {
    return { success: true }
}
