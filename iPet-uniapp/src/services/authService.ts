import request from '@/utils/common/request'
import { setAuthToken, setRefreshToken, getRefreshToken } from '@/utils/business/authStorage'

export interface RegisterPayload {
    email: string
    password: string
}

export interface RegisterResponse {
    accessToken: string
    expiresIn: number
    refreshToken?: string
    refreshExpiresIn?: number
    user: {
        id: number
        email: string
        createdAt: string
    }
}

export interface LoginPayload {
    email: string
    password: string
}

export interface LoginResponse {
    accessToken: string
    expiresIn: number
    refreshToken?: string
    refreshExpiresIn?: number
    user: {
        id: number
        email: string
        createdAt: string
    }
}

export type LoginResult = LoginResponse & { expiresAt: number | null }

const resolveExpiresAt = (expiresIn?: number): number | null => {
    if (typeof expiresIn !== 'number' || Number.isNaN(expiresIn)) {
        return null
    }
    const normalized = Math.max(0, expiresIn)
    return normalized ? Date.now() + normalized * 1000 : null
}

export const registerUser = async (payload: RegisterPayload): Promise<LoginResult> => {
    const result = await request<RegisterResponse>({
        url: '/users/register',
        method: 'POST',
        data: payload
    })

    if ((result as any).code && (result as any).code !== 200) {
        const error: any = new Error((result as any).message || 'Registration failed')
        error.statusCode = (result as any).code
        error.data = result
        throw error
    }

    // Auto-login logic: store token
    const expiresAt = resolveExpiresAt(result.expiresIn)
    setAuthToken(result.accessToken, true, expiresAt)
    if (result.refreshToken) {
        setRefreshToken(result.refreshToken)
    }

    return { ...result, expiresAt }
}

export const loginUser = async (payload: LoginPayload): Promise<LoginResult> => {
    const result = await request<any>({
        url: '/auth/login',
        method: 'POST',
        data: {
            email: payload.email,
            password: payload.password,
        },
        skipAuthRefresh: true
    })

    // Handle mock server returning error as 200 OK with code property
    if (result.code && result.code !== 200) {
        const error: any = new Error(result.message || 'Login failed')
        error.statusCode = result.code
        error.data = result
        throw error
    }

    const expiresAt = resolveExpiresAt(result.expiresIn)
    // 始终持久化 Token (30天)
    setAuthToken(result.accessToken, true, expiresAt)
    if (result.refreshToken) {
        setRefreshToken(result.refreshToken)
    }
    return { ...result, expiresAt }
}

// 修改重点：发送 refreshToken 到后端
export const refreshAuthToken = async (): Promise<LoginResult> => {
    const token = getRefreshToken()

    const result = await request<LoginResponse>({
        url: '/auth/refresh',
        method: 'POST',
        skipAuthRefresh: true,
        data: { refreshToken: token }
    })
    const expiresAt = resolveExpiresAt(result.expiresIn)
    setAuthToken(result.accessToken, true, expiresAt)
    if (result.refreshToken) {
        setRefreshToken(result.refreshToken)
    }
    return { ...result, expiresAt }
}

export const logoutUser = () => {
    return request<void>({
        url: '/auth/logout',
        method: 'POST',
        skipAuthRefresh: true
    })
}
