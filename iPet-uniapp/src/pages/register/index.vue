<template>
    <view class="auth-page">
        <!-- Gradient Background -->
        <view class="bg-gradient">
            <!-- Card Container -->
            <view class="auth-card">

                <!-- Logo and Title -->
                <view class="header-section">
                    <view class="logo-container">
                        <u-icon name="account-fill" size="48" color="#ffffff"></u-icon>
                    </view>
                    <text class="title">创建新账号</text>
                    <text class="subtitle">免费注册，开启您的旅程</text>
                </view>

                <!-- Form Section -->
                <view class="form-section">
                    <!-- Email Input -->
                    <view class="input-group">
                        <text class="input-label">电子邮箱</text>
                        <view class="input-wrapper">
                            <view class="input-icon">
                                <u-icon name="email" size="20" :color="emailFocused ? '#4F46E5' : '#94A3B8'"></u-icon>
                            </view>
                            <input type="text" v-model="email" class="input-field" placeholder="请输入邮箱"
                                @focus="emailFocused = true" @blur="emailFocused = false" />
                        </view>
                    </view>

                    <!-- Password Input -->
                    <view class="input-group">
                        <text class="input-label">密码</text>
                        <view class="input-wrapper">
                            <view class="input-icon">
                                <u-icon name="lock" size="20" :color="passwordFocused ? '#4F46E5' : '#94A3B8'"></u-icon>
                            </view>
                            <input :type="showPassword ? 'text' : 'password'" v-model="password" class="input-field"
                                placeholder="至少8位，需包含字母和数字" @focus="passwordFocused = true"
                                @blur="passwordFocused = false" />
                            <view class="password-toggle" @click="showPassword = !showPassword">
                                <u-icon :name="showPassword ? 'eye-off' : 'eye'" size="20" color="#94A3B8"></u-icon>
                            </view>
                        </view>
                    </view>

                    <!-- Confirm Password Input -->
                    <view class="input-group">
                        <text class="input-label">确认密码</text>
                        <view class="input-wrapper">
                            <view class="input-icon">
                                <u-icon name="lock" size="20"
                                    :color="confirmPasswordFocused ? '#4F46E5' : '#94A3B8'"></u-icon>
                            </view>
                            <input :type="showConfirmPassword ? 'text' : 'password'" v-model="confirmPassword"
                                class="input-field" placeholder="请再次输入密码" @focus="confirmPasswordFocused = true"
                                @blur="confirmPasswordFocused = false" />
                            <view class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
                                <u-icon :name="showConfirmPassword ? 'eye-off' : 'eye'" size="20"
                                    color="#94A3B8"></u-icon>
                            </view>
                        </view>
                    </view>

                    <!-- Primary Button -->
                    <button class="primary-btn" :class="{ 'loading': isLoading }" :disabled="isLoading"
                        @click="handleRegister" hover-class="primary-btn-hover">
                        <u-loading-icon v-if="isLoading" mode="circle" size="18" color="#ffffff"></u-loading-icon>
                        <text class="btn-text">{{ isLoading ? '注册中...' : '创建账号' }}</text>
                        <u-icon v-if="!isLoading" name="arrow-right" size="18" color="#ffffff"></u-icon>
                    </button>

                    <!-- Divider -->
                    <view class="divider">
                        <view class="divider-line"></view>
                        <text class="divider-text">其他登录方式</text>
                        <view class="divider-line"></view>
                    </view>

                    <!-- Social Login Buttons -->
                    <view class="social-buttons">
                        <button class="social-btn" hover-class="social-btn-hover">
                            <u-icon name="weixin-fill" size="20" color="#10B981"></u-icon>
                            <text class="social-text">微信</text>
                        </button>
                        <button class="social-btn" hover-class="social-btn-hover">
                            <u-icon name="github-circle-fill" size="20" color="#111827"></u-icon>
                            <text class="social-text">Github</text>
                        </button>
                    </view>

                    <!-- Guest Login -->
                    <view class="guest-section">
                        <button class="guest-btn" @click="handleGuestLogin" hover-class="guest-btn-hover">
                            <u-icon name="account" size="20" color="#64748B"></u-icon>
                            <text class="guest-text">游客登录 / 试用</text>
                        </button>
                        <text class="guest-hint">游客模式连续7天未使用将会清空数据。</text>
                    </view>
                </view>

                <!-- Footer Navigation -->
                <view class="footer-section">
                    <view class="footer-links">
                        <text class="link-btn" @click="goToLogin">直接登录</text>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { registerUser } from '@/services/authService';
import { useUserStore } from '@/stores/userStore';

// Local validation constants
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)\S{8,}$/;

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const emailFocused = ref(false);
const passwordFocused = ref(false);
const confirmPasswordFocused = ref(false);
const redirectTarget = ref('');
const userStore = useUserStore();

onLoad((options) => {
    const redirectParam = options?.redirect ? decodeURIComponent(options.redirect) : '';
    redirectTarget.value = redirectParam;
});

const showToast = (title) => {
    uni.showToast({
        title,
        icon: 'none',
        duration: 2000,
    });
};

const isRateLimitError = (error) => Number(error?.statusCode) === 429;

const getErrorMessage = (error, fallback) => {
    const message = error?.data?.message || error?.errMsg;
    if (message && typeof message === 'string') {
        return message;
    }
    return fallback;
};

const handleRegister = async () => {
    if (isLoading.value) return;

    const trimmedEmail = email.value.trim();
    const trimmedPassword = password.value.trim();
    const trimmedConfirmPassword = confirmPassword.value.trim();

    email.value = trimmedEmail;
    password.value = trimmedPassword;
    confirmPassword.value = trimmedConfirmPassword;

    // Validation
    if (!trimmedEmail || !trimmedPassword || !trimmedConfirmPassword) {
        showToast('请填写所有字段');
        return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
        showToast('请输入有效的邮箱地址');
        return;
    }

    if (!PASSWORD_REGEX.test(trimmedPassword)) {
        showToast('密码至少 8 位，需包含字母和数字');
        return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
        showToast('两次输入的密码不一致');
        return;
    }

    try {
        isLoading.value = true;
        const result = await registerUser({
            email: trimmedEmail,
            password: trimmedPassword,
        });

        await userStore.login(
            result.accessToken,
            result.expiresAt ?? null,
            {
                id: `user-${result.user.id}`,
                uid: `user-${result.user.id}`,
                displayName: result.user.email.split('@')[0],
                email: result.user.email,
                updatedAt: Date.now(),
            }
        );

        showToast('注册成功');

        // Always redirect to onboarding for new users
        uni.reLaunch({ url: '/pages/onboarding/index' });
    } catch (error) {
        if (isRateLimitError(error)) {
            showToast(getErrorMessage(error, '注册尝试过于频繁，请稍后再试'));
            return;
        }

        if (error?.errMsg?.includes('request:fail')) {
            showToast('网络连接失败，请检查您的网络设置');
            return;
        }

        const statusCode = Number(error?.statusCode || error?.code);
        if (statusCode === 409) {
            showToast('该邮箱已被注册，请直接登录');
            return;
        }

        const message = getErrorMessage(error, '注册失败，请稍后重试');
        showToast(message);
    } finally {
        isLoading.value = false;
    }
};

const goToLogin = () => {
    const redirectParam = redirectTarget.value ? `?redirect=${encodeURIComponent(redirectTarget.value)}` : '';
    uni.redirectTo({ url: `/pages/login/index${redirectParam}` });
};

const handleGuestLogin = async () => {
    try {
        await userStore.loginAsGuest();
        showToast('已进入游客模式');
        uni.switchTab({ url: '/pages/summary/summary' });
    } catch (error) {
        console.error('[register] guest login failed', error);
        showToast('游客登录失败，请稍后重试');
    }
};
</script>

<style lang="scss" scoped>
.auth-page {
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32rpx;
}

.bg-gradient {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 50%, #ECFEFF 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32rpx;
}

.auth-card {
    width: 100%;
    max-width: 580rpx;
    background: #FFFFFF;
    border-radius: 32rpx;
    box-shadow: 0 40rpx 80rpx rgba(0, 0, 0, 0.12);
    border: 2rpx solid #F1F5F9;
    overflow: hidden;
}

/* Header Section */
.header-section {
    padding: 64rpx 64rpx 48rpx;
    text-align: center;
}

.logo-container {
    width: 96rpx;
    height: 96rpx;
    margin: 0 auto 32rpx;
    background: #4F46E5;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 16rpx 32rpx rgba(79, 70, 229, 0.3);
}

.title {
    font-size: 48rpx;
    font-weight: 700;
    color: #0F172A;
    letter-spacing: -0.5rpx;
    display: block;
    margin-bottom: 16rpx;
}

.subtitle {
    font-size: 26rpx;
    color: #64748B;
    display: block;
}

/* Form Section */
.form-section {
    padding: 0 64rpx 64rpx;
    display: flex;
    flex-direction: column;
    gap: 32rpx;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.input-label {
    font-size: 22rpx;
    font-weight: 600;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 1rpx;
    margin-left: 8rpx;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.input-icon {
    position: absolute;
    left: 24rpx;
    display: flex;
    align-items: center;
    z-index: 1;
    transition: color 0.2s;
}

.input-field {
    width: 100%;
    height: 88rpx;
    padding-left: 68rpx;
    padding-right: 24rpx;
    border: 2rpx solid #E2E8F0;
    border-radius: 16rpx;
    background: #F8FAFC;
    font-size: 28rpx;
    color: #0F172A;
    transition: all 0.2s;

    &:focus {
        background: #FFFFFF;
        border-color: #4F46E5;
        box-shadow: 0 0 0 6rpx rgba(79, 70, 229, 0.1);
    }
}

.password-toggle {
    position: absolute;
    right: 24rpx;
    display: flex;
    align-items: center;
    padding: 8rpx;
    cursor: pointer;
}

/* Buttons */
.primary-btn {
    width: 100%;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    background: #4F46E5;
    border: none;
    border-radius: 16rpx;
    box-shadow: 0 8rpx 16rpx rgba(79, 70, 229, 0.2);
    margin-top: 16rpx;
    transition: all 0.2s;

    &::after {
        display: none;
    }

    &.loading {
        opacity: 0.7;
    }

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
}

.primary-btn-hover {
    background: #4338CA;
    box-shadow: 0 12rpx 24rpx rgba(79, 70, 229, 0.3);
}

.btn-text {
    font-size: 28rpx;
    font-weight: 600;
    color: #FFFFFF;
}

/* Divider */
.divider {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin: 16rpx 0;
}

.divider-line {
    flex: 1;
    height: 2rpx;
    background: #E2E8F0;
}

.divider-text {
    font-size: 24rpx;
    color: #94A3B8;
}

/* Social Buttons */
.social-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24rpx;
}

.social-btn {
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    background: #FFFFFF;
    border: 2rpx solid #E2E8F0;
    border-radius: 16rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    transition: all 0.2s;

    &::after {
        display: none;
    }
}

.social-btn-hover {
    background: #F8FAFC;
}

.social-text {
    font-size: 28rpx;
    font-weight: 500;
    color: #64748B;
}

/* Guest Section */
.guest-section {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    margin-top: 8rpx;
}

.guest-btn {
    width: 100%;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    background: #FFFFFF;
    border: 2rpx dashed #CBD5E1;
    border-radius: 16rpx;
    transition: all 0.2s;

    &::after {
        display: none;
    }
}

.guest-btn-hover {
    background: #F8FAFC;
    border-color: #94A3B8;
}

.guest-text {
    font-size: 28rpx;
    font-weight: 500;
    color: #64748B;
}

.guest-hint {
    font-size: 22rpx;
    color: #94A3B8;
    text-align: center;
}

/* Footer Section */
.footer-section {
    background: #F8FAFC;
    padding: 32rpx 64rpx;
    border-top: 2rpx solid #F1F5F9;
}

.footer-links {
    display: flex;
    align-items: center;
    justify-content: center;
}

.link-btn {
    font-size: 28rpx;
    font-weight: 600;
    color: #4F46E5;
}
</style>
