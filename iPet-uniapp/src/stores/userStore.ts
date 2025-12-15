import dayjs from 'dayjs'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { clearAuthToken } from '@/utils/business/authStorage'
import type { UserState, AccountInfo, UserStats } from '@shared/types/user'
import type { Pet } from '@shared/types/pet'
import type { HealthRecord } from '@shared/types/health'
import type { WalletInfo, Transaction } from '@/types/dto/wallet'
import { usePetStore } from './petStore'
import { useHealthStore } from './healthStore'
import { ensureStringId } from '@/utils/common/idUtils'
import { calculateDaysWithPets, calculateRecordCount, calculateWalkDistance } from '@/utils/business/userStatsHelper'
import { getUserProfile } from '@/services/userService'
import { logoutUser } from '@/services/authService'

const DEFAULT_STATS: UserStats = {
    daysWithPet: 0,
    recordCount: 0,
    walkDistance: 0
}

const defaultAccountInfo: AccountInfo = {
    id: '',
    username: '',
    displayName: '',
    uid: '',
    nickname: '',
    avatar: '',
    phone: '',
    email: '',
    updatedAt: 0
}

export const useUserStore = defineStore('user', () => {
    // State
    const token = ref<string>('')
    const tokenExpiresAt = ref<number | null>(null)
    const accountInfo = ref<AccountInfo>({ ...defaultAccountInfo })
    const walletInfo = ref<WalletInfo | null>(null)
    const transactionHistory = ref<Transaction[]>([])

    // Getters
    const isLoggedIn = computed(() => {
        if (!token.value) {
            return false
        }
        if (!tokenExpiresAt.value) {
            return false
        }
        return tokenExpiresAt.value > Date.now()
    })

    const userStats = computed<UserStats>(() => {
        // We need to be careful with circular dependencies or uninitialized stores here
        // but typically in a component usage it's fine.
        // If these stores haven't been created yet, this might throw if called too early,
        // but getters are lazy.
        const petStore = usePetStore()
        const healthStore = useHealthStore()

        if (!petStore || !healthStore) {
            return { ...DEFAULT_STATS }
        }

        return {
            daysWithPet: calculateDaysWithPets(petStore.pets),
            recordCount: calculateRecordCount(healthStore.healthRecords),
            walkDistance: calculateWalkDistance(healthStore.healthRecords)
        }
    })

    const needsOnboarding = computed(() => {
        // Mock mode: skip onboarding
        if (import.meta.env.VITE_USE_MOCK === 'true') {
            return false
        }

        const petStore = usePetStore()

        // 检查核心资料是否完善 (Onboarding 页面会设置 tags 和 gender)
        const hasProfile = Array.isArray(accountInfo.value.tags) && accountInfo.value.tags.length > 0

        // 检查是否有宠物
        const hasPets = petStore.pets && petStore.pets.length > 0

        // 如果既没有完善资料，也没有宠物，就是新用户
        return !hasProfile && !hasPets
    })

    // Actions
    function setToken(newToken: string, expiresAt?: number | null) {
        token.value = newToken
        if (typeof expiresAt === 'number' || expiresAt === null) {
            tokenExpiresAt.value = expiresAt
        } else if (!newToken) {
            tokenExpiresAt.value = null
        }
    }

    function updateUserInfo(info: Partial<AccountInfo>) {
        const normalizedInfo = { ...info }
        if (normalizedInfo.id !== undefined) {
            normalizedInfo.id = ensureStringId(normalizedInfo.id)
        }
        accountInfo.value = { ...accountInfo.value, ...normalizedInfo }
    }

    async function login(newToken: string, expiresAt: number | null, userInfo: Partial<AccountInfo>) {
        setToken(newToken, expiresAt)
        updateUserInfo(userInfo)
    }

    function clearLocalSession() {
        // Clear local session state without calling backend
        token.value = ''
        tokenExpiresAt.value = null
        accountInfo.value = { ...defaultAccountInfo }
        walletInfo.value = null
        transactionHistory.value = []
        clearAuthToken()

        // Also clear other stores
        const petStore = usePetStore()
        petStore.$reset()

        const healthStore = useHealthStore()
        healthStore.$reset()
    }

    async function logout() {
        try {
            // Try to call backend logout, but don't block local cleanup if it fails
            await logoutUser()
        } catch (error) {
            console.warn('Backend logout failed:', error)
        } finally {
            clearLocalSession()
        }
    }

    async function fetchUserProfile() {
        try {
            const profile = await getUserProfile()
            updateUserInfo(profile)

            return profile
        } catch (error) {
            console.error('[userStore] Failed to fetch user profile:', error)
            throw error
        }
    }

    // Since we are using Setup Store, standard $reset is not available by default.
    // We can implement our own $reset if needed by plugins, or just rely on clearLocalSession which effectively does it.
    // However, the component calls `store.$reset()`.
    // In Setup Stores, we need to provide a custom $reset method or the plugin needs to support it.
    // userStore.ts used `petStore.$reset()` and `healthStore.$reset()`. If THEY are options stores, it works.
    // If we change THIS store to setup store, `userStore.$reset()` in my.vue (line 304) might fail if pinia-plugin-persistedstate doesn't add it,
    // or if the standard pinia reset isn't present.
    // The standard Pinia Setup Store does NOT have $reset.

    function $reset() {
        token.value = ''
        tokenExpiresAt.value = null
        accountInfo.value = { ...defaultAccountInfo }
        walletInfo.value = null
        transactionHistory.value = []
    }

    return {
        token,
        tokenExpiresAt,
        accountInfo,
        walletInfo,
        transactionHistory,
        isLoggedIn,
        userStats,
        needsOnboarding,
        setToken,
        login,
        logout,
        clearLocalSession,
        updateUserInfo,
        fetchUserProfile,
        $reset
    }
}, {
    persist: {
        paths: ['token', 'tokenExpiresAt', 'accountInfo']
    } as any
})


