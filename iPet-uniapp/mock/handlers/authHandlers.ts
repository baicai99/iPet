import { RequestConfig } from '@/utils/common/request'
import { userState } from '../state.js'

import { defineMock } from '../types/common'

export const sendCodeMock = defineMock({
    url: '/verification/code',
    method: 'POST',
    handler: (config: RequestConfig) => {
        return {
            code: 200,
            message: 'success',
            data: {
                expiresIn: 30 * 24 * 60 * 60 // 30 days
            }
        }
    }
})

export const registerMock = defineMock({
    url: '/users/register',
    method: 'POST',
    handler: (config: RequestConfig) => {
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
})

export const loginMock = defineMock({
    url: '/auth/login',
    method: 'POST',
    handler: (config: RequestConfig) => {
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
})

export const refreshTokenMock = defineMock({
    url: '/auth/refresh',
    method: 'POST',
    handler: (config: RequestConfig) => {
        return {
            accessToken: 'mock-access-token-' + Date.now(),
            expiresIn: 3600,
            refreshToken: 'mock-refresh-token-' + Date.now(),
            refreshExpiresIn: 86400
        }
    }
})

export const guestMock = defineMock({
    url: '/auth/guest',
    method: 'POST',
    handler: (config: RequestConfig) => {
        const guestUser = {
            id: Math.floor(Math.random() * 10000) + 10000,
            email: '',
            password: '',
            createdAt: new Date().toISOString(),
            isGuest: true
        }

        userState.users.push(guestUser as any)
        userState.currentUserId = guestUser.id as any

        return {
            accessToken: 'mock-guest-access-token-' + Date.now(),
            expiresIn: 3600,
            refreshToken: 'mock-guest-refresh-token-' + Date.now(),
            profile: {
                id: String(guestUser.id),
                isGuest: true
            }
        }
    }
})

export const upgradeMock = defineMock({
    url: '/auth/upgrade',
    method: 'POST',
    handler: (config: RequestConfig) => {
        const { email, password } = config.data as { email: string, password: string }

        const currentId = userState.currentUserId as any
        const user = userState.users.find(u => u.id === currentId)

        if (user) {
            ; (user as any).email = email
                ; (user as any).password = password
                ; (user as any).isGuest = false
        }

        return {
            accessToken: 'mock-user-access-token-' + Date.now(),
            expiresIn: 3600,
            refreshToken: 'mock-user-refresh-token-' + Date.now(),
            profile: {
                id: String(currentId ?? ''),
                isGuest: false
            }
        }
    }
})
