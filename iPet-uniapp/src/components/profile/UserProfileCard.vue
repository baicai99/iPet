<template>
    <view class="user-profile-card" :class="[
        themeClass,
        { 'is-pressed': isPressed, 'is-vip': isVip }
    ]" @touchstart="handlePressStart" @touchend="handlePressEnd" @mousedown="handlePressStart"
        @mouseup="handlePressEnd" @mouseleave="handlePressEnd">
        <!-- 1. Avatar Area -->
        <view class="avatar-container">
            <view class="avatar-wrapper" :class="avatarBorderClass">
                <image v-if="!isEmpty && resolvedAvatarUrl" :src="resolvedAvatarUrl" class="avatar-image"
                    mode="aspectFill" />
                <view v-else class="avatar-placeholder" :class="iconBgClass">
                    <u-icon :name="isEmpty ? 'account' : 'account-fill'" :size="isEmpty ? 20 : 18"
                        :color="iconColor"></u-icon>
                </view>
            </view>
        </view>

        <!-- 2. Info Area -->
        <view class="info-container">
            <template v-if="isEmpty">
                <!-- Empty State -->
                <view class="empty-content">
                    <text class="title" :class="textClass">登录 / 注册</text>
                    <text class="subtitle" :class="subTextClass">登录体验更多精彩功能</text>
                </view>
            </template>

            <template v-else>
                <!-- User Data State -->
                <view class="user-header">
                    <text class="nickname" :class="textClass">{{ user?.nickname }}</text>

                    <!-- VIP Badge -->
                    <view v-if="isVip" class="vip-badge">
                        <u-icon name="level" size="10" color="#92400e"></u-icon>
                        <text class="vip-text">{{ user?.vipLevel }}</text>
                    </view>

                    <!-- Gender -->
                    <view class="gender-badge" :class="genderConfig.bgClass">
                        <u-icon :name="genderConfig.icon" size="10" :color="genderConfig.color"></u-icon>
                    </view>

                    <!-- MBTI -->
                    <view class="mbti-badge" :class="tagBgClass">
                        <text>{{ user?.mbti || 'MBTI' }}</text>
                    </view>
                </view>

                <view class="user-bio" :class="subTextClass">
                    <text class="bio-text">{{ user?.bio || "暂无个性签名" }}</text>
                </view>
            </template>
        </view>

        <!-- 3. Arrow/Action -->
        <view class="action-icon" :class="arrowClass">
            <u-icon :name="isEmpty ? 'arrow-right' : 'arrow-right'" size="18" :color="arrowColor"></u-icon>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useImageCacheStore } from '@/stores/imageCacheStore';
import { getGenderStyle, getGenderBgClass } from '@/config/genderConfig';

interface UserData {
    avatarUrl?: string;
    nickname?: string;
    bio?: string;
    gender?: string;
    mbti?: string;
    isVip?: boolean;
    vipLevel?: string;
}

const props = defineProps<{
    user?: UserData | null;
    theme?: 'light' | 'dark';
}>();

const imageCache = useImageCacheStore();
const isPressed = ref(false);

const isDark = computed(() => props.theme === 'dark');
const isEmpty = computed(() => !props.user);
const isVip = computed(() => props.user?.isVip);

// 优化：解析后的头像路径，优先读取本地缓存
const resolvedAvatarUrl = computed(() => {
    if (!props.user?.avatarUrl) return '';
    return imageCache.resolve(props.user.avatarUrl);
});

// Handlers
const handlePressStart = () => {
    isPressed.value = true;
};

const handlePressEnd = () => {
    isPressed.value = false;
};

// Computed Classes
const themeClass = computed(() => {
    if (isDark.value) return 'theme-dark';
    if (isVip.value) return 'theme-vip';
    return 'theme-light';
});

const textClass = computed(() => isDark.value ? 'text-white' : 'text-gray-900');
const subTextClass = computed(() => 'text-gray-400');

const iconBgClass = computed(() => isDark.value ? 'bg-white-10' : 'bg-gray-100');
const iconColor = computed(() => isDark.value ? '#ffffff' : '#9ca3af');

const tagBgClass = computed(() => isDark.value ? 'tag-dark' : 'tag-light');

// Use centralized gender configuration
const genderConfig = computed(() => {
    const style = getGenderStyle(props.user?.gender);
    return {
        icon: style.icon,
        color: style.color,
        bgClass: getGenderBgClass(props.user?.gender, isDark.value)
    };
});

const avatarBorderClass = computed(() => {
    if (isVip.value) return 'border-vip';
    if (isDark.value) return 'border-dark';
    return 'border-light';
});

const arrowClass = computed(() => isDark.value ? 'text-gray-600' : 'text-gray-300');
const arrowColor = computed(() => isDark.value ? '#4b5563' : '#d1d5db');

</script>

<style lang="scss" scoped>
.user-profile-card {
    width: 100%;
    // max-width: 380px; // Removed max-width to fit container
    border-radius: 32rpx;
    padding: 28rpx;
    display: flex;
    align-items: center;
    gap: 28rpx;
    cursor: pointer;
    user-select: none;
    border: 1px solid transparent;
    transition: all 0.2s ease-in-out;
    box-sizing: border-box;

    &.is-pressed {
        transform: scale(0.98);
    }

    // Theme Styles
    &.theme-dark {
        background-color: #1C1C1E;
        border-color: rgba(255, 255, 255, 0.1);
        color: white;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

        &.is-pressed {
            background-color: #2C2C2E;
        }
    }

    &.theme-vip {
        background-color: white;
        border-color: #fde68a; // amber-200
        color: #111827; // gray-900
        box-shadow: 0 4px 20px rgba(251, 191, 36, 0.15);

        &.is-pressed {
            background-color: #f9fafb; // gray-50
        }
    }

    &.theme-light {
        background-color: white;
        border-color: rgba(255, 255, 255, 0.6);
        color: #111827; // gray-900
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);

        &.is-pressed {
            background-color: #f9fafb; // gray-50
        }
    }
}

// Avatar
.avatar-container {
    position: relative;
    flex-shrink: 0;
}

.avatar-wrapper {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    overflow: hidden;
    border-width: 2px;
    border-style: solid;
    display: flex;
    align-items: center;
    justify-content: center;

    &.border-vip {
        border-color: #fde68a; // amber-200
        box-shadow: 0 0 0 1px #fffbeb; // ring-amber-50
    }

    &.border-dark {
        border-color: #2C2C2E;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
    }

    &.border-light {
        border-color: white;
        box-shadow: 0 0 0 1px #f3f4f6; // ring-gray-100
    }
}

.avatar-image {
    width: 100%;
    height: 100%;
}

.avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    &.bg-white-10 {
        background-color: rgba(255, 255, 255, 0.1);
    }

    &.bg-gray-100 {
        background-color: #f3f4f6;
    }
}

// Info
.info-container {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4rpx;
}

.title {
    font-size: 32rpx;
    font-weight: bold;
}

.subtitle {
    font-size: 22rpx;
}

.empty-content {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
}

.user-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.nickname {
    font-size: 32rpx;
    font-weight: bold;
    max-width: 200rpx;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

// Badges
.vip-badge {
    display: flex;
    align-items: center;
    gap: 2rpx;
    padding: 2rpx 8rpx;
    border-radius: 8rpx;
    font-size: 18rpx;
    font-weight: bold;
    background: linear-gradient(to right, #fef3c7, #fde68a); // amber-100 to amber-200
    color: #92400e; // amber-800
    border: 1px solid #fde68a;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.vip-text {
    font-size: 18rpx;
    line-height: 1;
}

.gender-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32rpx;
    height: 32rpx;
    border-radius: 50%;

    &.gender-male-light {
        background-color: #eff6ff; // blue-50
        color: #3b82f6; // blue-500
    }

    &.gender-male-dark {
        background-color: rgba(59, 130, 246, 0.2);
        color: #93c5fd; // blue-300
    }

    &.gender-female-light {
        background-color: #fdf2f8; // pink-50
        color: #ec4899; // pink-500
    }

    &.gender-female-dark {
        background-color: rgba(236, 72, 153, 0.2);
        color: #f9a8d4; // pink-300
    }

    &.gender-bag-light {
        background-color: #fffbeb; // amber-50
        color: #f59e0b; // amber-500
    }

    &.gender-bag-dark {
        background-color: rgba(245, 158, 11, 0.2);
        color: #fbbf24; // amber-400
    }

    &.gender-unknown-light {
        background-color: #f3f4f6; // gray-100
        color: #9ca3af; // gray-400
    }

    &.gender-unknown-dark {
        background-color: rgba(156, 163, 175, 0.2);
        color: #9ca3af; // gray-400
    }
}

.mbti-badge {
    padding: 2rpx 12rpx;
    border-radius: 8rpx;
    font-size: 18rpx;
    font-weight: bold;
    letter-spacing: 0.5px;
    border: 1px solid;

    &.tag-light {
        background-color: #eef2ff; // indigo-50
        color: #4f46e5; // indigo-600
        border-color: rgba(224, 231, 255, 0.5);
    }

    &.tag-dark {
        background-color: rgba(99, 102, 241, 0.2);
        color: #a5b4fc; // indigo-300
        border-color: rgba(99, 102, 241, 0.3);
    }
}

.user-bio {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.bio-text {
    font-size: 22rpx;
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    opacity: 0.9;
    line-height: 1.2;
}

// Text Colors
.text-white {
    color: white;
}

.text-gray-900 {
    color: #111827;
}

.text-gray-400 {
    color: #9ca3af;
}

.text-gray-600 {
    color: #4b5563;
}

.text-gray-300 {
    color: #d1d5db;
}
</style>
