<template>
    <view class="finddog-page">
        <!-- Hero Section -->
        <view class="hero-section">
            <view class="hero-icon">
                <text class="iconfont">&#xe6b1;</text>
            </view>
            <text class="hero-title">防走失狗牌</text>
            <text class="hero-subtitle">生成二维码狗牌，走失时别人扫码可通知你</text>
        </view>

        <!-- Feature Cards -->
        <view class="feature-section">
            <view class="feature-card" v-for="feature in features" :key="feature.id">
                <view class="feature-icon" :style="{ backgroundColor: feature.bgColor }">
                    <text class="iconfont" :style="{ color: feature.iconColor }">{{ feature.icon }}</text>
                </view>
                <view class="feature-content">
                    <text class="feature-title">{{ feature.title }}</text>
                    <text class="feature-desc">{{ feature.desc }}</text>
                </view>
            </view>
        </view>

        <!-- Statistics (if user has tags) -->
        <view class="stats-section" v-if="totalTags > 0">
            <view class="stats-card">
                <view class="stat-item">
                    <text class="stat-value">{{ totalTags }}</text>
                    <text class="stat-label">狗牌数量</text>
                </view>
                <view class="stat-divider"></view>
                <view class="stat-item">
                    <text class="stat-value">{{ activeTags }}</text>
                    <text class="stat-label">生效中</text>
                </view>
                <view class="stat-divider"></view>
                <view class="stat-item">
                    <text class="stat-value">{{ unreadClues }}</text>
                    <text class="stat-label">新线索</text>
                </view>
            </view>
        </view>

        <!-- Action Buttons -->
        <view class="action-section">
            <u-button type="primary" shape="circle" :text="hasTags ? '管理我的狗牌' : '立即生成'" @click="handlePrimaryAction" />
            <u-button v-if="hasTags" type="info" plain shape="circle" text="查看线索" @click="goToClues"
                class="secondary-btn" />
        </view>

        <!-- Tips -->
        <view class="tips-section">
            <view class="tips-header">
                <text class="iconfont tips-icon">&#xe60b;</text>
                <text class="tips-title">使用说明</text>
            </view>
            <view class="tips-list">
                <text class="tips-item">1. 选择宠物后生成专属二维码</text>
                <text class="tips-item">2. 下载二维码，打印到狗牌上</text>
                <text class="tips-item">3. 他人扫码后，你会收到通知和位置信息</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useDogTagStore } from '@/stores/dogtagStore'
import { usePetStore } from '@/stores/petStore'
import { storeToRefs } from 'pinia'

// ============================================================================
// Store Setup
// ============================================================================

const dogtagStore = useDogTagStore()
const petStore = usePetStore()

const { dogTags, unreadClueCount } = storeToRefs(dogtagStore)
const { activePets } = storeToRefs(petStore)

// ============================================================================
// Computed
// ============================================================================

const totalTags = computed(() => dogTags.value.length)
const activeTags = computed(() => dogTags.value.filter(t => t.status === 'active').length)
const unreadClues = computed(() => unreadClueCount.value)
const hasTags = computed(() => totalTags.value > 0)
const hasPets = computed(() => activePets.value.length > 0)

// Feature cards data
const features = [
    {
        id: 'qrcode',
        icon: '\ue6a9',
        title: '专属二维码',
        desc: '每只宠物生成独立二维码，支持多张狗牌',
        bgColor: '#e0f2fe',
        iconColor: '#0284c7'
    },
    {
        id: 'notify',
        icon: '\ue687',
        title: '即时通知',
        desc: '扫码后立即收到推送，不错过任何线索',
        bgColor: '#fef3c7',
        iconColor: '#d97706'
    },
    {
        id: 'location',
        icon: '\ue6a3',
        title: '位置信息',
        desc: '拾获者可提交发现位置，帮助快速找回',
        bgColor: '#d1fae5',
        iconColor: '#059669'
    }
]

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
    // 初始化加载狗牌数据
    dogtagStore.fetchDogTags()
    dogtagStore.fetchClues()
})

onShow(() => {
    // 每次显示时刷新数据
    dogtagStore.fetchDogTags()
    dogtagStore.fetchClues()
})

// ============================================================================
// Event Handlers
// ============================================================================

const handlePrimaryAction = () => {
    if (hasTags.value) {
        // 有狗牌 → 进入狗牌管理页
        uni.navigateTo({ url: '/pages/finddog/tags' })
    } else if (hasPets.value) {
        // 有宠物但无狗牌 → 选择宠物生成狗牌
        uni.navigateTo({ url: '/pages/finddog/select-pet' })
    } else {
        // 无宠物 → 提示添加宠物
        uni.showModal({
            title: '提示',
            content: '请先添加您的宠物信息',
            confirmText: '去添加',
            success: (res) => {
                if (res.confirm) {
                    uni.navigateTo({ url: '/pages/my/pet/add' })
                }
            }
        })
    }
}

const goToClues = () => {
    uni.navigateTo({ url: '/pages/finddog/clues' })
}
</script>

<!-- MiniProgram specific styles (non-scoped) -->
<style lang="scss">
page {
    background-color: $app-background;
}
</style>

<style lang="scss" scoped>
.finddog-page {
    min-height: 100vh;
    padding: 32rpx;
    padding-bottom: 120rpx;
}

// Hero Section
.hero-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48rpx 0 32rpx;
}

.hero-icon {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;
    box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.3);

    .iconfont {
        font-size: 80rpx;
        color: #fff;
    }
}

.hero-title {
    @include text-title-2;
    color: $app-text-primary;
    margin-bottom: 12rpx;
}

.hero-subtitle {
    @include text-body;
    color: $app-text-muted;
    text-align: center;
}

// Feature Section
.feature-section {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    margin: 32rpx 0;
}

.feature-card {
    display: flex;
    align-items: center;
    padding: 28rpx 24rpx;
    background: $app-card-bg;
    border-radius: 24rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.feature-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
    flex-shrink: 0;

    .iconfont {
        font-size: 40rpx;
    }
}

.feature-content {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.feature-title {
    @include text-headline;
    color: $app-text-primary;
    margin-bottom: 6rpx;
}

.feature-desc {
    @include text-subhead;
    color: $app-text-muted;
}

// Stats Section
.stats-section {
    margin: 32rpx 0;
}

.stats-card {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 32rpx 24rpx;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(59, 130, 246, 0.3);
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-value {
    font-size: 48rpx;
    font-weight: 700;
    color: #fff;
    line-height: 1.2;
}

.stat-label {
    @include text-caption-1;
    color: rgba(255, 255, 255, 0.8);
    margin-top: 8rpx;
}

.stat-divider {
    width: 1rpx;
    height: 60rpx;
    background: rgba(255, 255, 255, 0.3);
}

// Action Section
.action-section {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    margin: 32rpx 0;
}

.secondary-btn {
    margin-top: 0 !important;
}

// Tips Section
.tips-section {
    background: $app-card-bg;
    border-radius: 24rpx;
    padding: 28rpx 24rpx;
}

.tips-header {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
}

.tips-icon {
    font-size: 32rpx;
    color: $app-text-muted;
    margin-right: 12rpx;
}

.tips-title {
    @include text-headline;
    color: $app-text-primary;
}

.tips-list {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.tips-item {
    @include text-subhead;
    color: $app-text-secondary;
    line-height: 1.6;
}
</style>
