<template>
  <!-- 认证页面通用布局组件 -->
  <view class="auth-page">
    <!-- Gradient Background -->
    <view class="bg-gradient">
      <!-- Card Container -->
      <view class="auth-card" :class="{ 'is-mounted': mounted }">

        <!-- Logo and Title -->
        <view class="header-section">
          <view class="logo-container">
            <u-icon :name="logoIcon" size="48" color="#ffffff"></u-icon>
          </view>
          <text class="title">{{ title }}</text>
          <text v-if="subtitle" class="subtitle">{{ subtitle }}</text>
        </view>

        <!-- Form Section (Slot) -->
        <view class="form-section">
          <slot></slot>

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
            <button class="guest-btn" :disabled="guestLoading || primaryLoading" @click="$emit('guest-login')"
              hover-class="guest-btn-hover">
              <u-icon name="account" size="20" color="#64748B"></u-icon>
              <text class="guest-text">{{ guestLoading ? '进入中...' : '游客登录 / 试用' }}</text>
            </button>
            <text class="guest-hint">游客模式连续7天未使用将会清空数据。</text>
          </view>
        </view>

        <!-- Footer Section (Slot) -->
        <view class="footer-section">
          <slot name="footer"></slot>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * AuthLayout - 认证页面通用布局组件
 * 
 * 用于登录、注册等认证页面，提供统一的：
 * - 渐变背景和卡片容器
 * - Logo 和标题区域
 * - 社交登录按钮（微信、Github）
 * - 游客登录入口
 * - 底部导航区域
 * 
 * @example
 * <AuthLayout 
 *   title="欢迎回来" 
 *   :primary-loading="isLoading"
 *   @guest-login="handleGuestLogin"
 * >
 *   <!-- 表单内容 -->
 *   <template #footer>
 *     <view class="footer-links">
 *       <text class="link-btn" @click="goToRegister">立即注册</text>
 *     </view>
 *   </template>
 * </AuthLayout>
 */

import { ref, onMounted } from 'vue'

withDefaults(defineProps<{
  /** 页面标题 */
  title: string
  /** 副标题（可选） */
  subtitle?: string
  /** Logo 图标名称 */
  logoIcon?: string
  /** 游客登录加载状态 */
  guestLoading?: boolean
  /** 主按钮加载状态（用于禁用游客按钮） */
  primaryLoading?: boolean
}>(), {
  logoIcon: 'account-fill',
  guestLoading: false,
  primaryLoading: false
})

defineEmits<{
  'guest-login': []
}>()

// 入场动画
const mounted = ref(false)
onMounted(() => {
  setTimeout(() => {
    mounted.value = true
  }, 50)
})
</script>

<style lang="scss" scoped>
/* ============================================================================
   Auth Layout - 认证页面通用样式
   ============================================================================ */

.auth-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  // Safe area
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
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
  background: #FFFFFF;
  border-radius: 32rpx;
  box-shadow: 0 40rpx 80rpx rgba(0, 0, 0, 0.12);
  border: 2rpx solid #F1F5F9;
  overflow: hidden;
  // 入场动画
  opacity: 0;
  transform: translateY(32rpx);
  transition: opacity 0.4s ease-out, transform 0.4s ease-out;

  &.is-mounted {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============================================================================
   Header Section
   ============================================================================ */

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
}

.subtitle {
  font-size: 26rpx;
  color: #64748B;
  display: block;
  margin-top: 16rpx;
}

/* ============================================================================
   Form Section
   ============================================================================ */

.form-section {
  padding: 0 32rpx 32rpx;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

/* ============================================================================
   Divider
   ============================================================================ */

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

/* ============================================================================
   Social Buttons
   ============================================================================ */

.social-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}

.social-btn {
  width: 100%;
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

/* ============================================================================
   Guest Section
   ============================================================================ */

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

  &:disabled {
    opacity: 0.5;
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

/* ============================================================================
   Footer Section
   ============================================================================ */

.footer-section {
  background: #F8FAFC;
  padding: 32rpx 64rpx;
  border-top: 2rpx solid #F1F5F9;
}

/* ============================================================================
   Exposed Classes for Child Components
   深层选择器，用于在页面中自定义样式
   ============================================================================ */

:deep(.footer-links) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
}

:deep(.link-btn) {
  font-size: 28rpx;
  font-weight: 600;
  color: #4F46E5;

  &.secondary {
    color: #64748B;
  }
}

:deep(.separator) {
  font-size: 28rpx;
  color: #CBD5E1;
}
</style>
