<template>
    <view class="clues-page">
        <!-- Header with Filter -->
        <view class="page-header">
            <text class="header-title">线索中心</text>
            <view class="filter-tabs">
                <view class="filter-tab" :class="{ active: currentFilter === 'all' }" @click="setFilter('all')">
                    全部
                </view>
                <view class="filter-tab" :class="{ active: currentFilter === 'clue' }" @click="setFilter('clue')">
                    线索 ({{ clueCount }})
                </view>
                <view class="filter-tab" :class="{ active: currentFilter === 'scan' }" @click="setFilter('scan')">
                    扫码 ({{ scanCount }})
                </view>
            </view>
        </view>

        <!-- Unread Badge -->
        <view class="unread-banner" v-if="unreadCount > 0" @click="setFilter('all')">
            <text class="iconfont unread-icon">&#xe687;</text>
            <text class="unread-text">您有 {{ unreadCount }} 条新线索</text>
        </view>

        <!-- Clue List -->
        <view class="clue-list" v-if="filteredClues.length > 0">
            <view class="clue-card" :class="{ unread: clue.status === 'new' }" v-for="clue in filteredClues"
                :key="clue.id" @click="goToClueDetail(clue.id)">
                <!-- Type Icon -->
                <view class="clue-icon" :class="clue.type">
                    <text class="iconfont">
                        {{ clue.type === 'clue' ? '&#xe687;' : '&#xe6a9;' }}
                    </text>
                </view>

                <view class="clue-main">
                    <!-- Header -->
                    <view class="clue-header">
                        <text class="clue-type">
                            {{ clue.type === 'clue' ? '线索提交' : '扫码事件' }}
                        </text>
                        <view class="status-badge" :class="clue.status">
                            {{ statusLabel(clue.status) }}
                        </view>
                    </view>

                    <!-- Content -->
                    <view class="clue-content" v-if="clue.type === 'clue'">
                        <view class="content-row" v-if="clue.location">
                            <text class="iconfont content-icon">&#xe6a3;</text>
                            <text class="content-text">{{ clue.location }}</text>
                        </view>
                        <view class="content-row" v-if="clue.notes">
                            <text class="iconfont content-icon">&#xe60b;</text>
                            <text class="content-text notes">{{ clue.notes }}</text>
                        </view>
                        <view class="content-row photos" v-if="clue.photos && clue.photos.length > 0">
                            <text class="iconfont content-icon">&#xe6a6;</text>
                            <text class="content-text">{{ clue.photos.length }}张照片</text>
                        </view>
                    </view>

                    <!-- Meta -->
                    <view class="clue-meta">
                        <text class="meta-time">{{ formatTime(clue.createdAt) }}</text>
                        <text class="meta-action" v-if="clue.finderAction">
                            {{ actionLabel(clue.finderAction) }}
                        </text>
                    </view>
                </view>

                <view class="clue-arrow">
                    <text class="iconfont">&#xe619;</text>
                </view>
            </view>
        </view>

        <!-- Empty State -->
        <view class="empty-state" v-else-if="!loading">
            <view class="empty-icon">
                <text class="iconfont">&#xe687;</text>
            </view>
            <text class="empty-title">暂无线索</text>
            <text class="empty-desc">当有人扫描您的狗牌时会收到通知</text>
        </view>

        <!-- Loading State -->
        <view class="loading-state" v-if="loading">
            <u-loading-icon mode="circle" size="40" />
            <text class="loading-text">加载中...</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useDogTagStore } from '@/stores/dogtagStore'
import { storeToRefs } from 'pinia'
import type { ClueEventType, ClueStatus } from '@/types/dogtag'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// ============================================================================
// Store Setup
// ============================================================================

const dogtagStore = useDogTagStore()
const { clues, loading } = storeToRefs(dogtagStore)

// ============================================================================
// State
// ============================================================================

const currentFilter = ref<'all' | ClueEventType>('all')
const tagIdFilter = ref<string | null>(null)

// ============================================================================
// Computed
// ============================================================================

const filteredClues = computed(() => {
    let items = clues.value

    // Filter by tagId if provided
    if (tagIdFilter.value) {
        items = items.filter(c => c.tagId === tagIdFilter.value)
    }

    // Filter by type
    if (currentFilter.value !== 'all') {
        items = items.filter(c => c.type === currentFilter.value)
    }

    // Sort by createdAt desc
    return [...items].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
})

const clueCount = computed(() =>
    clues.value.filter(c => c.type === 'clue').length
)

const scanCount = computed(() =>
    clues.value.filter(c => c.type === 'scan').length
)

const unreadCount = computed(() =>
    clues.value.filter(c => c.status === 'new').length
)

// ============================================================================
// Helper Functions
// ============================================================================

const statusLabel = (status: ClueStatus) => {
    const labels: Record<ClueStatus, string> = {
        new: '新',
        viewed: '已读',
        resolved: '已解决',
        spam: '已举报'
    }
    return labels[status]
}

const actionLabel = (action: string) => {
    const labels: Record<string, string> = {
        seen: '看到了',
        controlled: '已控制',
        has_clue: '有线索'
    }
    return labels[action] || ''
}

const formatTime = (dateStr: string) => {
    const date = dayjs(dateStr)
    const now = dayjs()

    if (now.diff(date, 'day') < 1) {
        return date.fromNow()
    } else if (now.diff(date, 'day') < 7) {
        return date.format('MM-DD HH:mm')
    } else {
        return date.format('YYYY-MM-DD HH:mm')
    }
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
    // Parse query params
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const options = (currentPage as any)?.options || {}

    if (options.tagId) {
        tagIdFilter.value = options.tagId
    }

    dogtagStore.fetchClues({ tagId: tagIdFilter.value || undefined })
})

onShow(() => {
    dogtagStore.fetchClues({ tagId: tagIdFilter.value || undefined })
})

// ============================================================================
// Event Handlers
// ============================================================================

const setFilter = (filter: 'all' | ClueEventType) => {
    currentFilter.value = filter
}

const goToClueDetail = (clueId: string) => {
    uni.navigateTo({
        url: `/pages/finddog/clue-detail?id=${clueId}`
    })
}
</script>

<style lang="scss">
page {
    background-color: $app-background;
}
</style>

<style lang="scss" scoped>
.clues-page {
    min-height: 100vh;
    padding: 32rpx;
    padding-bottom: 80rpx;
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

// Unread Banner
.unread-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20rpx;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-radius: 16rpx;
    margin-bottom: 24rpx;
}

.unread-icon {
    font-size: 32rpx;
    color: #d97706;
    margin-right: 12rpx;
}

.unread-text {
    @include text-body;
    color: #92400e;
    font-weight: 500;
}

// Clue List
.clue-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.clue-card {
    display: flex;
    align-items: flex-start;
    padding: 24rpx;
    background: $app-card-bg;
    border-radius: 20rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    transition: transform 0.2s ease;

    &.unread {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border: 1rpx solid #93c5fd;
    }

    &:active {
        transform: scale(0.98);
    }
}

.clue-icon {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20rpx;
    flex-shrink: 0;

    &.clue {
        background: #dcfce7;

        .iconfont {
            color: #16a34a;
        }
    }

    &.scan {
        background: #e0f2fe;

        .iconfont {
            color: #0284c7;
        }
    }

    .iconfont {
        font-size: 32rpx;
    }
}

.clue-main {
    flex: 1;
    min-width: 0;
}

.clue-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12rpx;
}

.clue-type {
    @include text-headline;
    color: $app-text-primary;
}

.status-badge {
    padding: 4rpx 12rpx;
    border-radius: 12rpx;
    @include text-caption-2;

    &.new {
        background: #fee2e2;
        color: #dc2626;
    }

    &.viewed {
        background: #e5e7eb;
        color: #6b7280;
    }

    &.resolved {
        background: #dcfce7;
        color: #16a34a;
    }

    &.spam {
        background: #fef3c7;
        color: #d97706;
    }
}

.clue-content {
    margin-bottom: 12rpx;
}

.content-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 8rpx;

    &:last-child {
        margin-bottom: 0;
    }
}

.content-icon {
    font-size: 24rpx;
    color: $app-text-muted;
    margin-right: 8rpx;
    margin-top: 4rpx;
    flex-shrink: 0;
}

.content-text {
    @include text-subhead;
    color: $app-text-secondary;
    flex: 1;

    &.notes {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
}

.clue-meta {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.meta-time {
    @include text-caption-1;
    color: $app-text-muted;
}

.meta-action {
    @include text-caption-1;
    color: #3b82f6;
    padding: 2rpx 8rpx;
    background: #dbeafe;
    border-radius: 8rpx;
}

.clue-arrow {
    padding: 8rpx;
    color: $app-text-muted;

    .iconfont {
        font-size: 24rpx;
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
    text-align: center;
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
</style>
