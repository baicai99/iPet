const TOKEN_STORAGE_KEY = 'token'
const TOKEN_EXPIRES_AT_KEY = 'token_expires_at'

let sessionAccessToken = ''
let persistAccessToken = true
let sessionTokenExpiresAt: number | null = null
let expiresInitialized = false

const toNumeric = (value: unknown): number | null => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null
    }
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : null
    }
    return null
}

const ensureExpiresInitialized = () => {
    if (expiresInitialized) {
        return
    }
    const stored = uni.getStorageSync(TOKEN_EXPIRES_AT_KEY)
    const parsed = toNumeric(stored)
    sessionTokenExpiresAt = parsed && parsed > 0 ? parsed : null
    expiresInitialized = true
}

const persistExpiresAt = (expiresAt: number | null, shouldPersist: boolean) => {
    sessionTokenExpiresAt = typeof expiresAt === 'number' && expiresAt > 0 ? expiresAt : null
    expiresInitialized = true

    if (shouldPersist && sessionTokenExpiresAt) {
        uni.setStorageSync(TOKEN_EXPIRES_AT_KEY, sessionTokenExpiresAt)
    } else {
        uni.removeStorageSync(TOKEN_EXPIRES_AT_KEY)
    }
}

export const getAccessToken = (): string => {
    if (sessionAccessToken) {
        return sessionAccessToken
    }
    const storedToken = uni.getStorageSync(TOKEN_STORAGE_KEY)
    if (storedToken) {
        sessionAccessToken = storedToken
        persistAccessToken = true
        ensureExpiresInitialized()
        return storedToken
    }
    return ''
}

export const getTokenExpiresAt = (): number | null => {
    ensureExpiresInitialized()
    return sessionTokenExpiresAt
}

export const isTokenExpired = (bufferMs = 0): boolean => {
    const expiresAt = getTokenExpiresAt()
    if (!expiresAt) {
        return true
    }
    const buffer = Number.isFinite(bufferMs) ? Math.max(bufferMs, 0) : 0
    return expiresAt - buffer <= Date.now()
}

export const setAuthToken = (token: string, remember?: boolean, expiresAt?: number | null): void => {
    const shouldPersist = typeof remember === 'boolean' ? remember : persistAccessToken
    persistAccessToken = shouldPersist
    sessionAccessToken = token || ''

    if (shouldPersist) {
        if (token) {
            uni.setStorageSync(TOKEN_STORAGE_KEY, token)
        } else {
            uni.removeStorageSync(TOKEN_STORAGE_KEY)
        }
    } else {
        uni.removeStorageSync(TOKEN_STORAGE_KEY)
    }

    if (typeof expiresAt === 'number' || expiresAt === null) {
        persistExpiresAt(expiresAt, shouldPersist)
    } else if (!token) {
        persistExpiresAt(null, shouldPersist)
    }
}

export const clearAuthToken = (): void => {
    sessionAccessToken = ''
    persistAccessToken = false
    sessionTokenExpiresAt = null
    expiresInitialized = true
    uni.removeStorageSync(TOKEN_STORAGE_KEY)
    uni.removeStorageSync(TOKEN_EXPIRES_AT_KEY)
    uni.removeStorageSync('refreshToken')
}

export const getRefreshToken = (): string => uni.getStorageSync('refreshToken') || ''

export const setRefreshToken = (token: string): void => {
    if (token) {
        uni.setStorageSync('refreshToken', token)
    } else {
        uni.removeStorageSync('refreshToken')
    }
}
