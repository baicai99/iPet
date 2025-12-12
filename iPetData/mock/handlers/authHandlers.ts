import { RequestConfig } from '../types/common'
import { userState } from '../state.js'

export const sendCodeMock = (config: RequestConfig) => {
    return {
        code: 200,
        message: 'success',
        data: {
            expiresIn: 30 * 24 * 60 * 60 // 30 days
        }
    }
}

export const registerMock = (config: RequestConfig) => {
    const { email, password } = config.data as { email: string, password: string }

    const existingUser = userState.users.find(u => u.email === email)
    if (existingUser) {
        return {
            code: 409,
            message: 'User already exists',
            data: null
        }
    }

    const newUser = {
        id: Math.floor(Math.random() * 10000),
        email,
        password: password || '123456',
        createdAt: new Date().toISOString()
    }
    userState.users.push(newUser)

    return {
        code: 200,
        message: 'success',
        data: {
            id: newUser.id,
            email: newUser.email,
            createdAt: newUser.createdAt
        }
    }
}

export const loginMock = (config: RequestConfig) => {
    const { email, password } = config.data as any

    let user = userState.users.find(u => u.email === email)

    // Auto-create user if not found (for easy mock testing)
    if (!user) {
        user = {
            id: Math.floor(Math.random() * 10000),
            email: email || 'mock@test.com',
            password: password || '123456',
            createdAt: new Date().toISOString()
        }
        userState.users.push(user)
    }

    // Set current user for session simulation
    userState.currentUserId = user.id as any

    return {
        accessToken: 'mock-access-token-' + Date.now(),
        expiresIn: 3600,
        refreshToken: 'mock-refresh-token-' + Date.now(),
        refreshExpiresIn: 86400,
        user: {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt
        }
    }
}
export const refreshTokenMock = (config: RequestConfig) => {
    return {
        accessToken: 'mock-access-token-' + Date.now(),
        expiresIn: 3600,
        refreshToken: 'mock-refresh-token-' + Date.now(),
        refreshExpiresIn: 86400
    }
}
