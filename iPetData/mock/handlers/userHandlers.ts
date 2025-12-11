import { RequestConfig } from '@/utils/common/request'
import { accountInfo as mockAccountInfo, vipStatus as mockVipStatus } from '../user.js'
import { userState } from '../state.js'
import { getMockStorage } from '../utils/mockStorage'

const PROFILE_STORAGE_KEY = 'mock_user_profile'
const storage = getMockStorage()

// Initialize from storage if available
try {
    const storedProfile = storage.get(PROFILE_STORAGE_KEY)
    if (storedProfile) {
        Object.assign(mockAccountInfo, storedProfile)
    }
} catch (e) {
    console.error('Failed to load mock profile from storage', e)
}

export const getProfileMock = (config: RequestConfig) => {
    return {
        ...mockAccountInfo
    }
}

export const getVipStatusMock = (config: RequestConfig) => {
    return {
        ...mockVipStatus
    }
}

export const updateProfileMock = (config: RequestConfig) => {
    const payload = (config.data || {}) as any

    // Update the mock object in place to persist changes
    Object.assign(mockAccountInfo, {
        ...payload,
        displayName: payload.displayName || mockAccountInfo.displayName,
        avatar: payload.avatar ?? mockAccountInfo.avatar,
        gender: payload.gender ?? mockAccountInfo.gender,
        mbti: payload.mbti ?? mockAccountInfo.mbti,
        bio: payload.bio ?? mockAccountInfo.bio,
        theme: payload.theme ?? mockAccountInfo.theme,
        updatedAt: Date.now()
    })

    // Persist to storage
    try {
        storage.set(PROFILE_STORAGE_KEY, mockAccountInfo)
    } catch (e) {
        console.error('Failed to save mock profile to storage', e)
    }

    return mockAccountInfo
}

export const deleteAccountMock = (config: RequestConfig) => {
    if (!userState.currentUserId) {
        // Fallback for testing if no login happened in this session, assume default user
        const defaultUser = userState.users.find(u => u.email === 'test@example.com')
        if (defaultUser) {
            userState.currentUserId = defaultUser.id
        } else {
            return {
                code: 401,
                message: 'Unauthorized',
                data: null
            }
        }
    }

    const index = userState.users.findIndex(u => u.id === userState.currentUserId)
    if (index !== -1) {
        userState.users.splice(index, 1)
        userState.currentUserId = null

        // Clear persisted data
        try {
            storage.remove(PROFILE_STORAGE_KEY)
            // Also clear other related storage if needed
        } catch (e) {
            console.error('Failed to clear mock storage', e)
        }

        return {
            code: 200,
            message: 'Account deleted successfully',
            data: null
        }
    }

    return {
        code: 404,
        message: 'User not found',
        data: null
    }
}
