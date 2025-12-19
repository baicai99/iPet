<template>
  <AuthLayout 
    title="欢迎回来" 
    :guest-loading="isGuestLoading"
    :primary-loading="isLoading"
    @guest-login="handleGuestLogin"
  >
    <!-- Email Input -->
    <view class="input-group">
      <text class="input-label">电子邮箱</text>
      <view class="input-wrapper">
        <view class="input-icon">
          <u-icon name="email" size="20" :color="emailFocused ? '#4F46E5' : '#94A3B8'"></u-icon>
        </view>
        <input 
          type="text" 
          v-model="email" 
          class="input-field" 
          placeholder="请输入邮箱" 
          @focus="emailFocused = true"
          @blur="emailFocused = false" 
        />
      </view>
    </view>

    <!-- Password Input -->
    <view class="input-group">
      <text class="input-label">密码</text>
      <view class="input-wrapper">
        <view class="input-icon">
          <u-icon name="lock" size="20" :color="passwordFocused ? '#4F46E5' : '#94A3B8'"></u-icon>
        </view>
        <input 
          :type="showPassword ? 'text' : 'password'" 
          v-model="password" 
          class="input-field"
          placeholder="请输入密码" 
          @focus="passwordFocused = true" 
          @blur="passwordFocused = false" 
        />
        <view class="password-toggle" @click="showPassword = !showPassword">
          <u-icon :name="showPassword ? 'eye-off' : 'eye'" size="20" color="#94A3B8"></u-icon>
        </view>
      </view>
    </view>

    <!-- Primary Button -->
    <button 
      class="primary-btn" 
      :class="{ 'loading': isLoading }" 
      :disabled="isLoading" 
      @click="handleLogin"
      hover-class="primary-btn-hover"
    >
      <u-loading-icon v-if="isLoading" mode="circle" size="18" color="#ffffff"></u-loading-icon>
      <text class="btn-text">{{ isLoading ? '登录中...' : '立即登录' }}</text>
    </button>

    <!-- Footer -->
    <template #footer>
      <view class="footer-links">
        <text class="link-btn" @click="goToRegister">立即注册</text>
        <text class="separator">|</text>
        <text class="link-btn secondary" @click="handleForgotPassword">忘记密码？</text>
      </view>
    </template>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { loginUser } from '@/services/authService';
import { useUserStore } from '@/stores/userStore';
import { usePetStore } from '@/stores/petStore';
import AuthLayout from '@/components/layout/AuthLayout.vue';

// ✅ 使用统一的工具函数
import { showToast } from '@/utils/common/toast';
import {
  validateLoginForm,
  isRateLimitError,
  isNetworkError,
  getErrorMessage,
  getAuthErrorMessage
} from '@/utils/validation/auth';

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const isGuestLoading = ref(false);
const showPassword = ref(false);
const emailFocused = ref(false);
const passwordFocused = ref(false);
const redirectTarget = ref('');
const userStore = useUserStore();
const TAB_PAGES = ['/pages/summary/summary', '/pages/my/my'];

onLoad((options) => {
  const redirectParam = options?.redirect ? decodeURIComponent(options.redirect) : '';
  redirectTarget.value = redirectParam;
});

const handleLogin = async () => {
  if (isLoading.value) return;

  const trimmedEmail = email.value.trim();
  const trimmedPassword = password.value.trim();

  email.value = trimmedEmail;
  password.value = trimmedPassword;

  // ✅ 使用统一的表单验证
  const validation = validateLoginForm(trimmedEmail, trimmedPassword);
  if (!validation.valid) {
    showToast(validation.message);
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

    const petStore = usePetStore();
    await petStore.fetchPets();

    if (userStore.needsOnboarding) {
      uni.reLaunch({ url: '/pages/onboarding/index' });
    } else {
      navigateAfterLogin();
    }
  } catch (error) {
    // ✅ 使用统一的错误处理
    if (isRateLimitError(error)) {
      showToast(getErrorMessage(error, '登录尝试过于频繁，请稍后再试'));
      return;
    }

    if (isNetworkError(error)) {
      showToast('网络连接失败，请检查您的网络设置');
      return;
    }

    const authError = getAuthErrorMessage(error, 'login');
    if (authError) {
      showToast(authError);
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

const handleForgotPassword = () => {
  showToast('密码重置功能即将推出');
};

const handleGuestLogin = async () => {
  if (isGuestLoading.value || isLoading.value) return;

  try {
    isGuestLoading.value = true;
    await userStore.loginAsGuest();
    showToast('已进入游客模式');

    const target = redirectTarget.value;
    if (target) {
      if (TAB_PAGES.includes(target)) {
        uni.switchTab({ url: target });
      } else {
        uni.redirectTo({ url: target });
      }
      return;
    }

    uni.switchTab({ url: '/pages/summary/summary' });
  } catch (error) {
    console.error('[login] guest login failed', error);
    showToast('游客登录失败，请稍后重试');
  } finally {
    isGuestLoading.value = false;
  }
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
/* ============================================================================
   Form Inputs - 表单输入框样式
   ============================================================================ */

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

/* ============================================================================
   Primary Button
   ============================================================================ */

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

/* ============================================================================
   Footer Links
   ============================================================================ */

.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
}

.link-btn {
  font-size: 28rpx;
  font-weight: 600;
  color: #4F46E5;

  &.secondary {
    color: #64748B;
  }
}

.separator {
  font-size: 28rpx;
  color: #CBD5E1;
}
</style>
