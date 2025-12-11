<template>
    <view class="my-page" :style="pageThemeStyles">

        <!-- Header Section -->
        <view class="section">
            <UserProfileCard :user="realUserData" :theme="theme" @click="handleProfileClick" />
        </view>

        <!-- Pet Management -->
        <view class="pet-section-wrapper">
            <PetSelectorBar :pets="activePets" :loading="petListLoading" mode="edit" :theme="theme" @add="goManagePets"
                @click="goEditPet" />
        </view>

        <!-- Stats -->
        <view class="section">
            <UserStatsRow :stats="userStats" @navigate="handleStatsNavigate" />
        </view>

        <!-- App Settings -->
        <view class="section">
            <view class="section-title">{{ STRINGS.MY.APP_SETTINGS }}</view>
            <view class="menu-group">
                <view v-for="(item, index) in appSettings" :key="item.label" class="menu-item"
                    :class="{ 'no-border': index === appSettings.length - 1 }" @click="handleSettingClick(item)">
                    <view class="menu-left">
                        <text class="menu-label">{{ item.label }}</text>
                    </view>
                    <view class="menu-right">
                        <text v-if="item.value" class="menu-value">{{ item.value }}</text>
                        <u-switch v-if="item.isSwitch" v-model="item.switchValue" size="20"
                            @change="handleSwitchChange(item)"></u-switch>
                        <u-icon v-else name="arrow-right" size="16" color="#9ca3af"></u-icon>
                    </view>
                </view>
            </view>
        </view>

        <!-- Help & Feedback -->
        <view class="section">
            <view class="section-title">{{ STRINGS.MY.HELP_FEEDBACK }}</view>
            <view class="menu-group">
                <view v-for="(item, index) in helpFeedback" :key="item.label" class="menu-item"
                    :class="{ 'no-border': index === helpFeedback.length - 1 }" @click="handleMenuClick(item)">
                    <view class="menu-left">
                        <text class="menu-label">{{ item.label }}</text>
                    </view>
                    <view class="menu-right">
                        <text v-if="item.value" class="menu-value">{{ item.value }}</text>
                        <u-icon name="arrow-right" size="16" color="#9ca3af"></u-icon>
                    </view>
                </view>
            </view>
        </view>

        <!-- Logout Button -->
        <view class="section logout-section">
            <view class="logout-button" @click="handleLogout">
                <text class="logout-text">{{ STRINGS.MY.LOGOUT }}</text>
            </view>
        </view>




    </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import UserProfileCard from '@/components/profile/UserProfileCard.vue'
import UserStatsRow from '@/components/profile/UserStatsRow.vue'
import PetSelectorBar from '@/components/profile/PetSelectorBar.vue'
import { useUserStore } from '@/stores/userStore'
import { usePetStore } from '@/stores/petStore'
import { usePreferenceStore } from '@/stores/preferenceStore'
import { useHealthStore } from '@/stores/healthStore'



import { useAppStore } from '@/stores/appStore'
import {
    appSettings as appSettingsConfig,
    helpFeedback as helpFeedbackConfig
} from '@/config/menu'
import { STRINGS } from '@/locale/zh-Hans'
import { clearAuthToken } from '@/utils/business/authStorage'

const userStore = useUserStore()
const petStore = usePetStore()
const preferenceStore = usePreferenceStore()
const healthStore = useHealthStore()



const appStore = useAppStore()

const STORES_REQUIRING_RESET = [
    userStore,
    petStore,
    preferenceStore,
    healthStore,



]
const PERSISTED_PINIA_KEYS = ['user', 'pet', 'preferences', 'health'] as const

const { accountInfo, userStats } = storeToRefs(userStore)

const { activePets } = storeToRefs(petStore)
const { theme } = storeToRefs(preferenceStore)
const isDarkTheme = computed(() => theme.value === 'dark')

// Map store data to UserProfileCard props
const realUserData = computed(() => {
    if (!userStore.isLoggedIn) return null

    return {
        avatarUrl: accountInfo.value.avatar,
        nickname: accountInfo.value.nickname || accountInfo.value.displayName || accountInfo.value.username,
        bio: accountInfo.value.bio || "暂无个性签名",
        gender: accountInfo.value.gender || undefined,
        mbti: accountInfo.value.mbti || undefined,
        isVip: accountInfo.value.isVip || undefined,
        vipLevel: accountInfo.value.vipLevel || undefined
    }
})

const pageThemeStyles = computed(() => ({
    '--app-background': isDarkTheme.value ? '#0f172a' : '#f5f5f5',
    '--app-card-bg': isDarkTheme.value ? '#1f2937' : '#ffffff',
    '--app-border-color': isDarkTheme.value ? 'rgba(255, 255, 255, 0.08)' : '#f3f4f6',
    '--app-text-primary': isDarkTheme.value ? '#f8fafc' : '#1f2937',
    '--app-text-secondary': isDarkTheme.value ? '#e5e7eb' : '#4b5563',
    '--app-text-muted': isDarkTheme.value ? '#94a3b8' : '#9ca3af'
}))

const petListLoading = computed(() => !appStore.isAppReady)

type StatNavigationTarget = 'anniversary' | 'records' | 'activity'


const STAT_TARGET_ROUTES: Record<StatNavigationTarget, string> = {
    anniversary: '',
    records: '/pages/metrics/list',
    activity: '/pages/trends/trends'
}

interface MenuItem {
    label: string;
    icon?: string;
    path?: string;
    value?: string;
    avatars?: string[];
    isSwitch?: boolean;
    switchValue?: boolean;
    bgColor?: string;
    iconColor?: string;
}




// Data


const appSettings = ref<MenuItem[]>([])
const helpFeedback = ref<MenuItem[]>(helpFeedbackConfig)

const syncAppSettings = () => {
    appSettings.value = appSettingsConfig.map((item) => {

        if (item.label === '深色模式') {
            return {
                ...item,
                isSwitch: true,
                switchValue: theme.value === 'dark'
            }
        }
        return { ...item }
    })
}

syncAppSettings()
watch([theme], syncAppSettings)

// Methods
const handleProfileClick = () => {
    uni.navigateTo({
        url: '/pages/my/profile/edit'
    })
}

const goManagePets = () => {
    // uni.showToast({
    //     title: STRINGS.MY.TOAST_ADD_PET,
    //     icon: 'none'
    // })
    uni.navigateTo({
        url: '/pages/my/pet/add'
    })
}

const goEditPet = (petId: string) => {
    // uni.showToast({
    //     title: `${STRINGS.MY.TOAST_EDIT_PET}: ${petId}`,
    //     icon: 'none'
    // })
    uni.navigateTo({
        url: `/pages/my/pet/add?id=${petId}`
    })
}







const handleMenuClick = (item: any) => {
    if (item.path) {
        uni.navigateTo({
            url: item.path
        })
    } else {
        uni.showToast({
            title: `${STRINGS.MY.TOAST_NAVIGATE}: ${item.label}`,
            icon: 'none'
        })
    }
}

const handleStatsNavigate = (target: StatNavigationTarget) => {
    const route = STAT_TARGET_ROUTES[target]
    if (route) {
        uni.navigateTo({ url: route })
    } else {
        uni.showToast({
            title: STRINGS.MY.CUSTOM_DEV,
            icon: 'none'
        })
    }
}

const handleSettingClick = (item: any) => {
    if (item.isSwitch) {
        return
    }

    if (item.path) {
        uni.navigateTo({
            url: item.path
        })
    } else {
        uni.showToast({
            title: `${STRINGS.MY.TOAST_NAVIGATE}: ${item.label}`,
            icon: 'none'
        })
    }
}

const handleSwitchChange = (item: any) => {
    if (item.label === '深色模式') {
        preferenceStore.setTheme(item.switchValue ? 'dark' : 'light')
        uni.showToast({
            title: `已切换为${item.switchValue ? '深色' : '浅色'}模式`,
            icon: 'none'
        })
    } else {
        uni.showToast({
            title: `${item.label}: ${item.switchValue ? '开启' : '关闭'}`,
            icon: 'none'
        })
    }
}



const removeStorageItem = (key: string) => {
    const canUseUni = typeof uni !== 'undefined' && typeof uni.removeStorageSync === 'function'
    if (canUseUni) {
        try {
            uni.removeStorageSync(key)
            return
        } catch (error) {
            console.warn(`[MY] Failed to clear storage key: ${key}`, error)
        }
    }
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            window.localStorage.removeItem(key)
        } catch (error) {
            console.warn(`[MY] Failed to clear localStorage key: ${key}`, error)
        }
    }
}

const resetPersistedAppState = () => {
    STORES_REQUIRING_RESET.forEach((store) => {
        if (store && typeof store.$reset === 'function') {
            store.$reset()
        }
    })

    clearAuthToken()
    removeStorageItem('refreshToken')

    PERSISTED_PINIA_KEYS.forEach((key) => removeStorageItem(key))
}

const handleLogout = () => {
    uni.showModal({
        title: STRINGS.MY.MODAL_LOGOUT_TITLE,
        content: STRINGS.MY.MODAL_LOGOUT_CONTENT,
        success: (res) => {
            if (res.confirm) {
                resetPersistedAppState()
                uni.showToast({
                    title: STRINGS.MY.TOAST_LOGOUT_SUCCESS,
                    icon: 'success'
                })
                setTimeout(() => {
                    uni.reLaunch({
                        url: '/pages/login/index'
                    })
                }, 500)
            }
        }
    })
}





onShow(() => {
    if (userStore.isLoggedIn) {
        // 每次页面显示时（包括登录跳转回来），如果已登录，刷新宠物列表
        petStore.fetchPets()
        // Refresh user profile
        userStore.fetchUserProfile()
    }
})

onMounted(() => {
    const initData = () => {
        petStore.fetchPets()
    }

    if (appStore.isAppReady) {
        initData()
    } else {
        const unwatch = watch(() => appStore.isAppReady, (ready) => {
            if (ready) {
                initData()
                unwatch()
            }
        })
    }
})
</script>

<style lang="scss" scoped>
.my-page {
    // background: #f5f5f5;
    padding: 32rpx 0 32rpx 0;
    display: flex;
    flex-direction: column;
    gap: 32rpx;
}

.section {
    padding: 0 32rpx;
}

.pet-section-wrapper {
    width: 100%;
    overflow: visible;
    box-sizing: border-box;
}

.section-title {
    font-size: 22rpx;
    font-weight: 600;
    color: #666;
    margin-bottom: 24rpx;
    padding-left: 8rpx;
}



/* Logout Section */

.logout-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 28rpx;
    background: white;
    border-radius: 24rpx;
    border: 1px solid #fecaca;
    transition: all 0.2s ease;
}

.logout-button:active {
    transform: scale(0.98);
    background: #fef2f2;
}

.logout-text {
    font-size: 24rpx;
    font-weight: 600;
    color: #dc2626;
}

/* Menu Group Styles */
.menu-group {
    background: white;
    border-radius: 24rpx;
    overflow: hidden;
}

.menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx;
    background: white;
    border-bottom: 1px solid #f3f4f6;
    transition: background-color 0.2s;
}

.menu-item:active {
    background-color: #f9fafb;
}

.menu-item.no-border {
    border-bottom: none;
}

.menu-left {
    display: flex;
    align-items: center;
    gap: 24rpx;
}



.menu-label {
    font-size: 24rpx;
    color: #1f2937;
    font-weight: 500;
}

.menu-right {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.menu-value {
    font-size: 22rpx;
    color: #9ca3af;
}
</style>
