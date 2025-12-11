<template>
  <view class="login-page">


    <AuthLayout title="欢迎回来" subtitle="登录以查看您的今日健康数据概览" icon="pulse" icon-color="#6366f1" icon-bg-color="#eef2ff"
      sparkline-color="#6366f1">
      <view class="form-container">
        <StyledInput icon="email" placeholder="邮箱地址" v-model="email" />
        <StyledInput icon="lock" placeholder="密码" v-model="password" isPassword />

        <view class="actions-row">
          <view class="spacer"></view>
          <text class="forgot-text">忘记密码?</text>
        </view>

        <button class="login-btn" :disabled="isLoading" @click="handleLogin" hover-class="btn-hover">
          <view v-if="isLoading" class="spinner"></view>
          <template v-else>
            <text class="btn-text">立即登录</text>
            <u-icon name="arrow-right" size="18" color="rgba(255,255,255,0.7)"></u-icon>
          </template>
        </button>
      </view>

      <view class="divider-row">
        <view class="divider-line"></view>
        <text class="divider-text">其他登录方式</text>
        <view class="divider-line"></view>
      </view>

      <view class="social-row">
        <SocialButton icon="github-circle-fill" color="#1e293b" />
        <SocialButton icon="twitter" color="#0ea5e9" />
        <SocialButton icon="phone" color="#6366f1" />
      </view>

      <view class="footer">
        <text class="footer-text">还没有账号? </text>
        <text class="link-text" @click="goToRegister">免费注册</text>
      </view>
    </AuthLayout>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import StyledInput from './components/StyledInput.vue';
import SocialButton from './components/SocialButton.vue';
import AuthLayout from '@/components/layout/AuthLayout.vue';
import { loginUser } from '@/services/authService';
import { useUserStore } from '@/stores/userStore';
import { usePetStore } from '@/stores/petStore';
// Local validation constants (moved from shared)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)\S+$/;

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const redirectTarget = ref('');
const userStore = useUserStore();
const TAB_PAGES = ['/pages/summary/summary', '/pages/my/my'];

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

const handleLogin = async () => {
  if (isLoading.value) return;

  const trimmedEmail = email.value.trim();
  const trimmedPassword = password.value.trim();

  email.value = trimmedEmail;
  password.value = trimmedPassword;

  if (!trimmedEmail || !trimmedPassword) {
    showToast('邮箱和密码不能为空');
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

  try {
    isLoading.value = true;
    const result = await loginUser({
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

    showToast('登录成功');

    // [新增] 登录后立即刷新一下宠物列表，以便 needsOnboarding 判断准确
    const petStore = usePetStore();
    await petStore.fetchPets();

    if (userStore.needsOnboarding) {
      uni.reLaunch({ url: '/pages/onboarding/index' });
    } else {
      navigateAfterLogin();
    }
  } catch (error) {
    if (isRateLimitError(error)) {
      showToast(getErrorMessage(error, '登录尝试过于频繁，请稍后再试'));
      return;
    }

    // Network Error
    if (error?.errMsg?.includes('request:fail')) {
      showToast('网络连接失败，请检查您的网络设置');
      return;
    }

    // Specific Error Codes
    const statusCode = Number(error?.statusCode || error?.code);
    if (statusCode === 404) {
      showToast('该账号未注册，请先注册');
      return;
    }
    if (statusCode === 401) {
      // Check if it's "Account deleted" or just invalid credentials
      const msg = error?.data?.message || '';
      if (msg.includes('deleted')) {
        showToast('该账号已注销');
      } else {
        showToast('账号或密码错误，请重试');
      }
      return;
    }

    const message = getErrorMessage(error, '登录失败，请稍后重试');
    showToast(message);
  } finally {
    isLoading.value = false;
  }
};

const goToRegister = () => {
  const redirect = redirectTarget.value ? `?redirect=${encodeURIComponent(redirectTarget.value)}` : '';
  uni.navigateTo({ url: `/pages/register/index${redirect}` });
};



const navigateAfterLogin = () => {
  const target = redirectTarget.value;
  if (target) {
    if (TAB_PAGES.includes(target)) {
      uni.switchTab({ url: target });
    } else {
      uni.redirectTo({ url: target });
    }
  } else {
    uni.switchTab({ url: '/pages/summary/summary' });
  }
};
</script>

<style lang="scss" scoped>
.form-container {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.actions-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8rpx;
  margin-top: 4rpx;
}

.forgot-text {
  font-size: 22rpx;
  font-weight: bold;
  color: #6366f1;
  /* text-indigo-500 */
}

.login-btn {
  margin-top: 24rpx;
  width: 100%;
  background-color: #0f172a;
  /* bg-slate-900 */
  color: #ffffff;
  border-radius: 32rpx;
  padding: 24rpx 0;
  font-weight: bold;
  box-shadow: 0 20rpx 50rpx rgba(15, 23, 42, 0.2);
  /* shadow-lg shadow-slate-900/20 */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  position: relative;
  overflow: hidden;
  border: none;

  &::after {
    border: none;
  }
}

.btn-hover {
  background-color: #1e293b;
  /* bg-slate-800 */
  transform: scale(0.98);
}

.btn-text {
  font-size: 28rpx;
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

.divider-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 0 8rpx;
}

.divider-line {
  flex: 1;
  height: 1px;
  background-color: #e2e8f0;
  /* bg-slate-200 */
}

.divider-text {
  font-size: 18rpx;
  font-weight: bold;
  color: #94a3b8;
  /* text-slate-400 */
  text-transform: uppercase;
  letter-spacing: 2px;
  /* tracking-widest */
}

.social-row {
  display: flex;
  gap: 24rpx;
}

.footer {
  text-align: center;
  margin-top: 24rpx;
}

.footer-text {
  font-size: 22rpx;
  font-weight: 500;
  color: #94a3b8;
  /* text-slate-400 */
}

.link-text {
  font-size: 22rpx;
  font-weight: bold;
  color: #6366f1;
  /* text-indigo-500 */
  margin-left: 8rpx;
}


</style>
