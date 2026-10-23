<template>
    <view class="tags-page">
        <!-- Header with Filter -->
        <view class="page-header">
            <text class="header-title">狗牌管理</text>
            <view class="filter-tabs">
                <view class="filter-tab" :class="{ active: currentFilter === 'all' }" @click="setFilter('all')">
                    全部 ({{ dogTags.length }})
                </view>
                <view class="filter-tab" :class="{ active: currentFilter === 'active' }" @click="setFilter('active')">
                    生效 ({{ activeCount }})
                </view>
                <view class="filter-tab" :class="{ active: currentFilter === 'paused' }" @click="setFilter('paused')">
                    暂停 ({{ pausedCount }})
                </view>
            </view>
        </view>

        <!-- Tag List -->
        <view class="tag-list" v-if="filteredTags.length > 0">
            <view class="tag-card" v-for="tag in filteredTags" :key="tag.id" @click="goToTagDetail(tag.id)">
                <!-- Status Indicator -->
                <view class="status-indicator" :class="tag.status"></view>

                <view class="tag-main">
                    <view class="tag-header">
                        <text class="tag-name">{{ tag.name }}</text>
                        <view class="status-badge" :class="tag.status">
                            {{ statusLabel(tag.status) }}
                        </view>
                    </view>

                    <view class="tag-stats">
                        <view class="stat">
                            <text class="iconfont stat-icon">&#xe6a9;</text>
                            <text class="stat-text">扫码 {{ tag.scanCount }}次</text>
                        </view>
                        <view class="stat">
                            <text class="iconfont stat-icon">&#xe687;</text>
                            <text class="stat-text">线索 {{ tag.clueCount }}条</text>
                        </view>
                    </view>

                    <view class="tag-meta">
                        <text class="meta-item">创建于 {{ formatDate(tag.createdAt) }}</text>
                        <text class="meta-item" v-if="tag.lastScannedAt">
                            最近扫码 {{ formatRelativeTime(tag.lastScannedAt) }}
                        </text>
                    </view>
                </view>

                <view class="tag-arrow">
                    <text class="iconfont">&#xe619;</text>
                </view>
            </view>
        </view>

        <!-- Empty State -->
        <view class="empty-state" v-else-if="!loading">
            <view class="empty-icon">
                <text class="iconfont">&#xe6a9;</text>
            </view>
            <text class="empty-title">
                {{ currentFilter === 'all' ? '暂无狗牌' : '暂无' + filterLabel + '狗牌' }}
            </text>
            <text class="empty-desc" v-if="currentFilter === 'all'">
                点击下方按钮为宠物生成狗牌
            </text>
        </view>

        <!-- Loading State -->
        <view class="loading-state" v-if="loading">
            <u-loading-icon mode="circle" size="40" />
            <text class="loading-text">加载中...</text>
        </view>

        <!-- Add Button (FAB) -->
        <view class="fab-btn" @click="goCreateTag">
            <text class="iconfont fab-icon">&#xe608;</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useDogTagStore } from '@/stores/dogtagStore'
import { storeToRefs } from 'pinia'
import type { DogTagStatus } from '@/types/dogtag'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// ============================================================================
// Store Setup
// ============================================================================

const dogtagStore = useDogTagStore()
const { dogTags, loading } = storeToRefs(dogtagStore)

// ============================================================================
// State
// ============================================================================

const currentFilter = ref<'all' | DogTagStatus>('all')

// Get petId from URL query if provided
const petIdFilter = ref<string | null>(null)

// ============================================================================
// Computed
// ============================================================================

const filteredTags = computed(() => {
    let tags = dogTags.value

    // Filter by petId if provided
    if (petIdFilter.value) {
        tags = tags.filter(t => t.petId === petIdFilter.value)
    }

    // Filter by status
    if (currentFilter.value !== 'all') {
        tags = tags.filter(t => t.status === currentFilter.value)
    }

    // Sort by createdAt desc
    return [...tags].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
})

const activeCount = computed(() =>
    dogTags.value.filter(t => t.status === 'active').length
)

const pausedCount = computed(() =>
    dogTags.value.filter(t => t.status === 'paused').length
)

const filterLabel = computed(() => {
    const labels: Record<string, string> = {
        active: '生效',
        paused: '暂停',
        revoked: '作废'
    }
    return labels[currentFilter.value] || ''
})

// ============================================================================
// Helper Functions
// ============================================================================

const statusLabel = (status: DogTagStatus) => {
    const labels: Record<DogTagStatus, string> = {
        active: '生效中',
        paused: '已暂停',
        revoked: '已作废'
    }
    return labels[status]
}

const formatDate = (dateStr: string) => {
    return dayjs(dateStr).format('YYYY-MM-DD')
}

const formatRelativeTime = (dateStr: string) => {
    return dayjs(dateStr).fromNow()
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
    // Parse query params
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const options = (currentPage as any)?.options || {}

    if (options.petId) {
        petIdFilter.value = options.petId
    }

    dogtagStore.fetchDogTags()
})

onShow(() => {
    dogtagStore.fetchDogTags()
})

// ============================================================================
// Event Handlers
// ============================================================================

const setFilter = (filter: 'all' | DogTagStatus) => {
    currentFilter.value = filter
}

const goToTagDetail = (tagId: string) => {
    uni.navigateTo({
        url: `/pages/finddog/tag-detail?id=${tagId}`
    })
}

const goCreateTag = () => {
    uni.navigateTo({
        url: '/pages/finddog/select-pet'
    })
}
</script>

<style lang="scss">
page {
    background-color: $app-background;
}
</style>

<style lang="scss" scoped>
.tags-page {
    min-height: 100vh;
    padding: 32rpx;
    padding-bottom: 160rpx;
}

// Page Header
.page-header {
    margin-bottom: 24rpx;
}

.header-title {
    @include text-title-2;
    color: $app-text-primary;
    display: block;
    margin-bottom: 20rpx;
}

.filter-tabs {
    display: flex;
    gap: 16rpx;
}

.filter-tab {
    padding: 12rpx 24rpx;
    background: $app-card-bg;
    border-radius: 32rpx;
    @include text-subhead;
    color: $app-text-secondary;
    transition: all 0.2s ease;

    &.active {
        background: #3b82f6;
        color: #fff;
    }
}

// Tag List
.tag-list {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
}

.tag-card {
    display: flex;
    align-items: stretch;
    background: $app-card-bg;
    border-radius: 24rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    overflow: hidden;
    transition: transform 0.2s ease;

    &:active {
        transform: scale(0.98);
    }
}

.status-indicator {
    width: 8rpx;
    flex-shrink: 0;

    &.active {
        background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
    }

    &.paused {
        background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
    }

    &.revoked {
        background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
    }
}

.tag-main {
    flex: 1;
    padding: 24rpx;
}

.tag-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16rpx;
}

.tag-name {
    @include text-headline;
    color: $app-text-primary;
    flex: 1;
    margin-right: 16rpx;
}

.status-badge {
    padding: 4rpx 16rpx;
    border-radius: 16rpx;
    @include text-caption-1;

    &.active {
        background: #dcfce7;
        color: #16a34a;
    }

    &.paused {
        background: #fef3c7;
        color: #d97706;
    }

    &.revoked {
        background: #fee2e2;
        color: #dc2626;
    }
}

.tag-stats {
    display: flex;
    gap: 24rpx;
    margin-bottom: 12rpx;
}

.stat {
    display: flex;
    align-items: center;
}

.stat-icon {
    font-size: 24rpx;
    color: $app-text-muted;
    margin-right: 8rpx;
}

.stat-text {
    @include text-subhead;
    color: $app-text-secondary;
}

.tag-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.meta-item {
    @include text-caption-1;
    color: $app-text-muted;
}

.tag-arrow {
    display: flex;
    align-items: center;
    padding: 0 20rpx;
    color: $app-text-muted;

    .iconfont {
        font-size: 28rpx;
    }
}

// Empty State
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80rpx 32rpx;
}

.empty-icon {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;

    .iconfont {
        font-size: 80rpx;
        color: #9ca3af;
    }
}

.empty-title {
    @include text-headline;
    color: $app-text-primary;
    margin-bottom: 8rpx;
}

.empty-desc {
    @include text-body;
    color: $app-text-muted;
}

// Loading State
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80rpx 32rpx;
}

.loading-text {
    @include text-body;
    color: $app-text-muted;
    margin-top: 16rpx;
}

// FAB Button
.fab-btn {
    position: fixed;
    right: 32rpx;
    bottom: 120rpx;
    width: 112rpx;
    height: 112rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.4);
    transition: transform 0.2s ease;

    &:active {
        transform: scale(0.9);
    }
}

.fab-icon {
    font-size: 48rpx;
    color: #fff;
}
</style>
