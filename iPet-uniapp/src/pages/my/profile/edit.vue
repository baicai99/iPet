<template>
    <FormPageLayout>
        <template #header>
            <AppNavbar title="编辑资料" />
        </template>
        <!-- Component Form -->
        <UserProfileForm ref="formRef" v-model="localUser" />

        <!-- 保存按钮 -->
        <template #footer>
            <button class="save-button" @click="handleSave" :disabled="isSavingProfile">
                {{ isSavingProfile ? '保存中...' : '保存' }}
            </button>
        </template>
    </FormPageLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import AppNavbar from '@/components/common/AppNavbar.vue'
import { useUserStore } from '@/stores/userStore'
import { updateUserProfile } from '@/services/userService'
import { storeToRefs } from 'pinia'
import { emitDataChanged } from '@/services/syncEvents'
import UserProfileForm from '@/components/forms/UserProfileForm.vue'
import FormPageLayout from '@/components/layout/FormPageLayout.vue'

const userStore = useUserStore()
const { accountInfo } = storeToRefs(userStore)

const formRef = ref()
const isSavingProfile = ref(false)

// 本地用户数据
interface LocalUser {
    avatar: string | null;
    nickname: string;
    gender?: string;
    bio: string;
    mbti: string;
    tags: string[];
}

const localUser = ref<LocalUser>({
    avatar: accountInfo.value.avatar || null,
    nickname: accountInfo.value.displayName || '',
    gender: accountInfo.value.gender || '', // Added gender support
    bio: accountInfo.value.bio || '',
    mbti: accountInfo.value.mbti || '',
    tags: accountInfo.value.tags && Array.isArray(accountInfo.value.tags)
        ? [...accountInfo.value.tags]
        : ["科技控"],
})

// 保存
const handleSave = async () => {
    // Call component validation
    if (formRef.value && !formRef.value.validate()) {
        uni.showToast({
            title: '请修正错误后保存',
            icon: 'none'
        })
        return
    }

    if (isSavingProfile.value) {
        return
    }

    const payload = {
        displayName: localUser.value.nickname,
        avatar: localUser.value.avatar,
        gender: localUser.value.gender as any, // Added
        bio: localUser.value.bio,
        mbti: localUser.value.mbti,
        tags: [...localUser.value.tags]
    }

    isSavingProfile.value = true
    if (typeof uni !== 'undefined' && typeof uni.showLoading === 'function') {
        uni.showLoading({
            title: '保存中',
            mask: true
        })
    }

    try {
        const remoteProfile = await updateUserProfile(payload)
        userStore.updateUserInfo({
            ...remoteProfile,
            ...payload,
            avatar: payload.avatar || remoteProfile.avatar,
            updatedAt: remoteProfile?.updatedAt ?? Date.now()
        })

        emitDataChanged({ reason: 'user:profile-updated' })

        if (typeof uni !== 'undefined' && typeof uni.hideLoading === 'function') {
            uni.hideLoading()
        }

        uni.showToast({
            title: '资料保存成功',
            icon: 'success'
        })

        setTimeout(() => {
            uni.navigateBack()
        }, 1000)
    } catch (error) {
        console.error('Failed to save profile', error)

        if (typeof uni !== 'undefined' && typeof uni.hideLoading === 'function') {
            uni.hideLoading()
        }

        uni.showToast({
            title: '保存失败，请稍后重试',
            icon: 'none'
        })
    } finally {
        isSavingProfile.value = false
    }
}
</script>

<style lang="scss" scoped>
/* Button Styles only - Layout handled by FormPageLayout */
.save-button {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    font-size: 30rpx;
    font-weight: 600;
    border-radius: 48rpx;
    border: none;
    box-shadow: 0 4rpx 12rpx rgba(59, 130, 246, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
}

.save-button:active {
    opacity: 0.9;
    transform: scale(0.98);
}

/* Disabled state */
.save-button[disabled] {
    opacity: 0.7;
    filter: grayscale(0.5);
}
</style>
