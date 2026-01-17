import request from '@/utils/common/request'
import type { AccountInfo } from '@/types/user'
import type { UpdateUserProfileDto, VerifyIdentityDto, UpdateSettingsDto } from '@/types/dto/user'

export type UpdateProfilePayload = UpdateUserProfileDto

const buildUpdateProfilePayload = (payload: UpdateProfilePayload) => {
    const sanitized: Partial<UpdateProfilePayload> = {}

    if (typeof payload.displayName === 'string') {
        sanitized.displayName = payload.displayName.trim()
    }

    if (typeof payload.avatar === 'string') {
        sanitized.avatar = payload.avatar.trim()
    }

    if (typeof payload.bio === 'string') {
        sanitized.bio = payload.bio.trim()
    }

    if (typeof payload.mbti === 'string') {
        sanitized.mbti = payload.mbti.trim()
    }

    if (Array.isArray(payload.tags)) {
        sanitized.tags = payload.tags
            .filter((tag) => typeof tag === 'string')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
    }

    return sanitized
}

export const updateUserProfile = (payload: UpdateProfilePayload) => {
    return request<AccountInfo>({
        url: '/users/profile',
        method: 'PUT',
        data: buildUpdateProfilePayload(payload)
    })
}

export const verifyIdentity = (data: VerifyIdentityDto) => {
    return request({
        url: '/users/verify',
        method: 'POST',
        data
    })
}

export const updateSettings = (settings: UpdateSettingsDto['settings']) => {
    return request({
        url: '/users/settings',
        method: 'POST',
        data: { settings }
    })
}

export const getUserProfile = () => {
    return request<AccountInfo>({
        url: '/users/me',
        method: 'GET',
        showLoading: false,
        skipErrorHandle: true
    })
}

export const deleteAccount = () => {
    return request({
        url: '/users/account',
        method: 'DELETE'
    })
}

export const userService = {
    updateUserProfile,
    verifyIdentity,
    updateSettings,
    getUserProfile,
    deleteAccount
}
