<template>
  <view class="page-container">
    <!-- Account Management Section -->
    <view class="settings-group">
      <view class="group-title">{{ STRINGS.PRIVACY.ACCOUNT_MANAGEMENT }}</view>
      <u-cell-group :border="false">
        <u-cell :title="STRINGS.PRIVACY.DELETE_ACCOUNT" isLink :border="false" @click="handleDeleteAccount">
          <template #title>
            <text class="delete-account-text">{{ STRINGS.PRIVACY.DELETE_ACCOUNT }}</text>
          </template>
        </u-cell>
      </u-cell-group>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { userService } from '@/services/userService';
import { STRINGS } from '@/locale/zh-Hans';
import { useUserStore } from '@/stores/userStore';
import { usePetStore } from '@/stores/petStore';
import { usePreferenceStore } from '@/stores/preferenceStore';
import { useHealthStore } from '@/stores/healthStore';


import { clearAuthToken } from '@/utils/business/authStorage';

const userStore = useUserStore();
const petStore = usePetStore();
const preferenceStore = usePreferenceStore();
const healthStore = useHealthStore();



const STORES_REQUIRING_RESET = [
  userStore,
  petStore,
  preferenceStore,
  healthStore,
];
const PERSISTED_PINIA_KEYS = ['user', 'pet', 'preferences', 'health'];

const resetStoreSafely = (store) => {
  if (!store) return
  if (typeof store.resetStore === 'function') {
    store.resetStore()
    return
  }
  if (typeof store.$reset === 'function') {
    store.$reset()
    return
  }
  if (typeof store.reset === 'function') {
    store.reset()
    return
  }
  console.warn('[PRIVACY] Store does not implement a reset method:', store?.$id || 'unknown')
}

const removeStorageItem = (key) => {
  const canUseUni = typeof uni !== 'undefined' && typeof uni.removeStorageSync === 'function'
  if (canUseUni) {
    try {
      uni.removeStorageSync(key)
      return
    } catch (error) {
      console.warn(`[PRIVACY] Failed to clear storage key: ${key}`, error)
    }
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.warn(`[PRIVACY] Failed to clear localStorage key: ${key}`, error)
    }
  }
}

const resetPersistedAppState = () => {
  STORES_REQUIRING_RESET.forEach(resetStoreSafely)

  clearAuthToken()
  removeStorageItem('refreshToken')

  PERSISTED_PINIA_KEYS.forEach((key) => removeStorageItem(key))
}

const handleDeleteAccount = () => {
  uni.showModal({
    title: STRINGS.PRIVACY.DELETE_ACCOUNT_CONFIRM_TITLE,
    content: STRINGS.PRIVACY.DELETE_ACCOUNT_CONFIRM_CONTENT,
    confirmColor: '#dc2626',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: 'Processing...' })
          await userService.deleteAccount()
          uni.hideLoading()

          resetPersistedAppState()

          uni.showToast({
            title: STRINGS.PRIVACY.DELETE_ACCOUNT_SUCCESS,
            icon: 'success'
          })

          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/login/index'
            })
          }, 1000)
        } catch (error) {
          uni.hideLoading()
          uni.showToast({
            title: 'Failed to delete account',
            icon: 'none'
          })
          console.error('Delete account failed:', error)
        }
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: $uni-bg-color-grey;
  padding-bottom: 40rpx;
}

.settings-group {
  margin-top: 24rpx;
  background-color: #fff;

  .group-title {
    padding: 24rpx 32rpx 12rpx;
    font-size: 26rpx;
    color: $uni-text-color-grey;
    background-color: $uni-bg-color-grey;
  }
}

.delete-account-text {
  color: #dc2626;
}
</style>
