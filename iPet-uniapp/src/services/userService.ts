import request from '@/utils/common/request'
import type { AccountInfo } from '@/types/user'

export interface UpdateProfilePayload {
    displayName: string;
    avatar?: string | null;
    bio?: string;
    mbti?: string;
    tags?: string[];
}

export const updateUserProfile = (payload: UpdateProfilePayload) => {
    return request<AccountInfo>({
        url: '/users/profile',
        method: 'PUT',
        data: payload
    })
}

export const verifyIdentity = (data: { realName: string; idCard: string }) => {
    return request({
        url: '/users/verify',
        method: 'POST',
        data
    })
}



export const updateSettings = (settings: any) => {
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
