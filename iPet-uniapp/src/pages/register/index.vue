<template>
    <AuthLayout title="创建新账号" subtitle="免费注册，开启您的旅程" icon="account-fill" icon-color="#6366f1" icon-bg-color="#eef2ff">
        <view class="form-container">
            <view class="input-wrapper">
                <StyledInput 
                    icon="email" 
                    label="电子邮箱"
                    v-model="email" 
                />
                <text class="error-text" v-if="errors.email">{{ errors.email }}</text>
            </view>

            <view class="input-wrapper">
                <StyledInput 
                    icon="lock" 
                    label="密码"
                    v-model="password" 
                    isPassword 
                />
                <text class="error-text" v-if="errors.password">{{ errors.password }}</text>
            </view>

            <view class="input-wrapper">
                <StyledInput 
                    icon="lock" 
                    label="验证密码"
                    v-model="confirmPassword" 
                    isPassword 
                />
                <text class="error-text" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</text>
            </view>

            <button class="register-btn" :disabled="isLoading" @click="handleRegister" :hover-class="isLoading ? 'none' : 'btn-hover'">
                <view v-if="isLoading" class="spinner"></view>
                <template v-else>
                    <text class="btn-text">创建账号</text>
                    <u-icon name="arrow-right" size="18" color="#ffffff"></u-icon>
                </template>
            </button>
        </view>

        <view class="footer">
            <text class="footer-text">已经有账号了? </text>
            <text class="link-text" @click="goToLogin">直接登录</text>
        </view>
    </AuthLayout>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import StyledInput from '@/pages/login/components/StyledInput.vue';
import AuthLayout from '@/components/layout/AuthLayout.vue';
import { registerUser } from '@/services/authService';
import { useUserStore } from '@/stores/userStore';
import { usePetStore } from '@/stores/petStore';
// Use shared validation rules
import { EMAIL_REGEX, PASSWORD_REGEX } from '@shared/validation/rules';

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const userStore = useUserStore();

const redirectTarget = ref('');
const errors = reactive({
    email: '',
    password: '',
    confirmPassword: ''
});




onLoad((options) => {
    redirectTarget.value = options?.redirect ? decodeURIComponent(options.redirect) : '';
});



watch(email, () => (errors.email = ''));
watch(password, () => (errors.password = ''));
watch(confirmPassword, () => (errors.confirmPassword = ''));

const showToast = (title: string) => {
    uni.showToast({
        title,
        icon: 'none',
        duration: 2000,
    });
};

type ErrorField = keyof typeof errors;

const setFieldError = (field: ErrorField, message: string) => {
    errors[field] = message;
};

const resetErrors = () => {
    (Object.keys(errors) as ErrorField[]).forEach((key) => {
        errors[key] = '';
    });
};



const handleRegister = async () => {
    if (isLoading.value) return;

    resetErrors();
    const trimmedEmail = email.value.trim();
    const trimmedPassword = password.value.trim();
    const trimmedConfirm = confirmPassword.value.trim();

    if (!trimmedEmail || !trimmedPassword || !trimmedConfirm) {
        if (!trimmedEmail) setFieldError('email', '请输入邮箱地址');
        if (!trimmedPassword) setFieldError('password', '请输入密码');
        if (!trimmedConfirm) setFieldError('confirmPassword', '请再次输入密码');
        return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
        setFieldError('email', '请输入有效的邮箱地址');
        return;
    }

    if (!PASSWORD_REGEX.test(trimmedPassword)) {
        setFieldError('password', '密码至少 8 位，需包含字母和数字');
        return;
    }



    if (trimmedPassword !== trimmedConfirm) {
        setFieldError('confirmPassword', '两次输入的密码不一致');
        return;
    }

    try {
        isLoading.value = true;
        const result = await registerUser({
            email: trimmedEmail,
            password: trimmedPassword
        });

        // Auto login: Update Pinia state
        await userStore.login(
            result.accessToken,
            result.expiresAt,
            {
                id: `user-${result.user.id}`,
                uid: `user-${result.user.id}`,
                displayName: result.user.email.split('@')[0],
                email: result.user.email,
                updatedAt: Date.now(),
            }
        );

        showToast('注册成功');

        // Fetch pets to check if onboarding is needed
        const petStore = usePetStore();
        await petStore.fetchPets();

        setTimeout(() => {
            if (userStore.needsOnboarding) {
                uni.reLaunch({ url: '/pages/onboarding/index' });
            } else {
                // Handle redirect target or default to home
                const target = redirectTarget.value;
                if (target) {
                    if (['/pages/summary/summary', '/pages/my/my'].includes(target)) {
                        uni.switchTab({ url: target });
                    } else {
                        uni.redirectTo({ url: target });
                    }
                } else {
                    // Default to home or summary
                    uni.switchTab({ url: '/pages/summary/summary' });
                }
            }
        }, 1000);
    } catch (error: any) {
        showToast(error?.message || '注册失败，请稍后重试');
    } finally {
        isLoading.value = false;
    }
};



const goToLogin = () => {
    redirectToLogin(false);
};

const redirectToLogin = (fromSuccess: boolean) => {
    const redirectParam = redirectTarget.value
        ? `?redirect=${encodeURIComponent(redirectTarget.value)}`
        : '';
    const pages = getCurrentPages();
    if (!fromSuccess && pages.length > 1) {
        uni.navigateBack();
        return;
    }
    uni.redirectTo({ url: `/pages/login/index${redirectParam}` });
};
</script>

<style lang="scss" scoped>
.form-container {
    display: flex;
    flex-direction: column;
    gap: 32rpx;
}

.input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.register-btn {
    width: 100%;
    background-color: #6366f1;
    color: #ffffff;
    border-radius: 16rpx;
    padding: 20rpx 32rpx;
    font-weight: 600;
    box-shadow: 0 4rpx 12rpx rgba(99, 102, 241, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    border: none;
    transition: all 0.2s ease;

    &::after {
        display: none;
    }
}

.btn-hover {
    background-color: #4f46e5;
    box-shadow: 0 6rpx 16rpx rgba(99, 102, 241, 0.4);
}

.btn-text {
    font-size: 28rpx;
    font-weight: 600;
}

.spinner {
    width: 32rpx;
    height: 32rpx;
    border: 4rpx solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.footer {
    text-align: center;
    margin-top: 32rpx;
}

.footer-text {
    font-size: 28rpx;
    color: #64748b;
}

.link-text {
    font-size: 28rpx;
    font-weight: 600;
    color: #6366f1;
    margin-left: 8rpx;
}

.error-text {
    color: #ef4444;
    font-size: 24rpx;
    margin-top: -4rpx;
    margin-left: 8rpx;
}
</style>
