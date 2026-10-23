<template>
    <view class="clue-detail-page">
        <!-- Loading State -->
        <view class="loading-state" v-if="loading && !clue">
            <u-loading-icon mode="circle" size="40" />
            <text class="loading-text">加载中...</text>
        </view>

        <!-- Clue Detail Content -->
        <template v-else-if="clue">
            <!-- Header Card -->
            <view class="header-card" :class="clue.type">
                <view class="header-icon">
                    <text class="iconfont">
                        {{ clue.type === 'clue' ? '&#xe687;' : '&#xe6a9;' }}
                    </text>
                </view>
                <view class="header-content">
                    <text class="header-type">
                        {{ clue.type === 'clue' ? '线索提交' : '扫码事件' }}
                    </text>
                    <text class="header-time">{{ formatTime(clue.createdAt) }}</text>
                </view>
                <view class="status-badge" :class="clue.status">
                    {{ statusLabel }}
                </view>
            </view>

            <!-- Finder Action -->
            <view class="action-card" v-if="clue.finderAction">
                <text class="action-label">拾获者表示</text>
                <view class="action-tag" :class="clue.finderAction">
                    <text class="iconfont action-icon">
                        {{ actionIcon }}
                    </text>
                    <text class="action-text">{{ actionLabel }}</text>
                </view>
            </view>

            <!-- Location Section -->
            <view class="section-card" v-if="clue.location || clue.latitude">
                <view class="section-header">
                    <text class="iconfont section-icon">&#xe6a3;</text>
                    <text class="section-title">位置信息</text>
                </view>
                <view class="location-content">
                    <text class="location-text">{{ clue.location || '未填写位置描述' }}</text>
                    <view class="location-coords" v-if="clue.latitude && clue.longitude">
                        <text class="coords-text">
                            坐标：{{ clue.latitude.toFixed(4) }}, {{ clue.longitude.toFixed(4) }}
                        </text>
                        <view class="map-btn" @click="openMap">
                            <text class="iconfont map-icon">&#xe6a3;</text>
                            <text class="map-text">查看地图</text>
                        </view>
                    </view>
                </view>
            </view>

            <!-- Notes Section -->
            <view class="section-card" v-if="clue.notes">
                <view class="section-header">
                    <text class="iconfont section-icon">&#xe60b;</text>
                    <text class="section-title">备注信息</text>
                </view>
                <text class="notes-content">{{ clue.notes }}</text>
            </view>

            <!-- Photos Section -->
            <view class="section-card" v-if="clue.photos && clue.photos.length > 0">
                <view class="section-header">
                    <text class="iconfont section-icon">&#xe6a6;</text>
                    <text class="section-title">照片 ({{ clue.photos.length }})</text>
                </view>
                <view class="photos-grid">
                    <image v-for="(photo, index) in clue.photos" :key="index" :src="photo" mode="aspectFill"
                        class="photo-item" @click="previewPhoto(index)" />
                </view>
            </view>

            <!-- Device Info (for scan events) -->
            <view class="section-card" v-if="clue.type === 'scan' && clue.deviceInfo">
                <view class="section-header">
                    <text class="iconfont section-icon">&#xe6b0;</text>
                    <text class="section-title">设备信息</text>
                </view>
                <text class="device-text">{{ clue.deviceInfo }}</text>
            </view>

            <!-- Action Buttons -->
            <view class="action-section" v-if="clue.status !== 'resolved' && clue.status !== 'spam'">
                <u-button type="primary" shape="circle" text="标记为已解决" @click="markResolved" />
                <u-button type="error" plain shape="circle" text="举报此线索" @click="showReportDialog" />
            </view>

            <!-- Resolved State -->
            <view class="resolved-card" v-if="clue.status === 'resolved'">
                <text class="iconfont resolved-icon">&#xe6b4;</text>
                <text class="resolved-text">已确认解决</text>
            </view>

            <!-- Spam State -->
            <view class="spam-card" v-if="clue.status === 'spam'">
                <text class="iconfont spam-icon">&#xe6b7;</text>
                <text class="spam-text">已举报为骚扰/虚假信息</text>
            </view>
        </template>

        <!-- Error State -->
        <view class="error-state" v-else-if="error">
            <text class="error-text">{{ error }}</text>
            <u-button type="primary" text="返回" @click="goBack" />
        </view>

        <!-- Report Dialog -->
        <u-popup :show="showReport" mode="bottom" round="24" @close="closeReportDialog">
            <view class="report-popup">
                <view class="popup-header">
                    <text class="popup-title">举报原因</text>
                    <view class="popup-close" @click="closeReportDialog">
                        <text class="iconfont">&#xe6b7;</text>
                    </view>
                </view>
                <view class="report-options">
                    <view class="report-option" v-for="option in reportOptions" :key="option.value"
                        :class="{ selected: reportReason === option.value }" @click="reportReason = option.value">
                        <view class="option-radio">
                            <view class="radio-inner" v-if="reportReason === option.value"></view>
                        </view>
                        <text class="option-text">{{ option.label }}</text>
                    </view>
                </view>
                <view class="report-desc" v-if="reportReason === 'other'">
                    <textarea class="desc-input" v-model="reportDescription" placeholder="请描述具体原因..."
                        :maxlength="200" />
                </view>
                <view class="popup-actions">
                    <u-button type="error" shape="circle" text="提交举报" :disabled="!reportReason" @click="submitReport" />
                </view>
            </view>
        </u-popup>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDogTagStore } from '@/stores/dogtagStore'
import { storeToRefs } from 'pinia'
import type { ClueStatus } from '@/types/dogtag'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

// ============================================================================
// Store Setup
// ============================================================================

const dogtagStore = useDogTagStore()
const { currentClue: clue, loading, error } = storeToRefs(dogtagStore)

// ============================================================================
// State
// ============================================================================

const clueId = ref<string>('')
const showReport = ref(false)
const reportReason = ref<string>('')
const reportDescription = ref<string>('')

const reportOptions = [
    { value: 'spam_scan', label: '恶意/重复扫码' },
    { value: 'fake_clue', label: '虚假线索信息' },
    { value: 'abuse', label: '包含辱骂/骚扰内容' },
    { value: 'other', label: '其他原因' }
]

// ============================================================================
// Computed
// ============================================================================

const statusLabel = computed(() => {
    if (!clue.value) return ''
    const labels: Record<ClueStatus, string> = {
        new: '新线索',
        viewed: '已查看',
        resolved: '已解决',
        spam: '已举报'
    }
    return labels[clue.value.status]
})

const actionIcon = computed(() => {
    if (!clue.value?.finderAction) return ''
    const icons: Record<string, string> = {
        seen: '\ue6a4',
        controlled: '\ue6b4',
        has_clue: '\ue60b'
    }
    return icons[clue.value.finderAction] || ''
})

const actionLabel = computed(() => {
    if (!clue.value?.finderAction) return ''
    const labels: Record<string, string> = {
        seen: '我看到了它',
        controlled: '我已控制住它',
        has_clue: '我有线索想告诉主人'
    }
    return labels[clue.value.finderAction] || ''
})

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(async () => {
    // Parse query params
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const options = (currentPage as any)?.options || {}

    if (options.id) {
        clueId.value = options.id
        await dogtagStore.fetchClueDetail(options.id)
    }
})

// ============================================================================
// Methods
// ============================================================================

const formatTime = (dateStr: string) => {
    return dayjs(dateStr).format('YYYY年MM月DD日 HH:mm')
}

const previewPhoto = (index: number) => {
    if (!clue.value?.photos) return
    uni.previewImage({
        current: clue.value.photos[index],
        urls: clue.value.photos
    })
}

const openMap = () => {
    if (!clue.value?.latitude || !clue.value?.longitude) return

    uni.openLocation({
        latitude: clue.value.latitude,
        longitude: clue.value.longitude,
        name: clue.value.location || '线索位置',
        address: clue.value.location || ''
    })
}

const markResolved = async () => {
    uni.showModal({
        title: '确认解决',
        content: '确定要标记此线索为已解决吗？这表示宠物已找回。',
        confirmText: '确认',
        success: async (res) => {
            if (res.confirm && clue.value) {
                uni.showLoading({ title: '处理中...' })
                const success = await dogtagStore.resolveClue(clue.value.id)
                uni.hideLoading()

                if (success) {
                    uni.showToast({
                        title: '已标记为解决',
                        icon: 'success'
                    })
                } else {
                    uni.showToast({
                        title: '操作失败，请重试',
                        icon: 'none'
                    })
                }
            }
        }
    })
}

const showReportDialog = () => {
    reportReason.value = ''
    reportDescription.value = ''
    showReport.value = true
}

const closeReportDialog = () => {
    showReport.value = false
}

const submitReport = async () => {
    if (!clue.value || !reportReason.value) return

    uni.showLoading({ title: '提交中...' })
    const success = await dogtagStore.reportClue(clue.value.id, {
        reason: reportReason.value as any,
        description: reportDescription.value || undefined
    })
    uni.hideLoading()
    closeReportDialog()

    if (success) {
        uni.showToast({
            title: '举报已提交',
            icon: 'success'
        })
    } else {
        uni.showToast({
            title: '提交失败，请重试',
            icon: 'none'
        })
    }
}

const goBack = () => {
    uni.navigateBack()
}
</script>

<style lang="scss">
page {
    background-color: $app-background;
}
</style>

<style lang="scss" scoped>
.clue-detail-page {
    min-height: 100vh;
    padding: 32rpx;
    padding-bottom: 80rpx;
}

// Loading & Error States
.loading-state,
.error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120rpx 32rpx;
}

.loading-text,
.error-text {
    @include text-body;
    color: $app-text-muted;
    margin-top: 16rpx;
}

// Header Card
.header-card {
    display: flex;
    align-items: center;
    padding: 28rpx;
    border-radius: 24rpx;
    margin-bottom: 20rpx;

    &.clue {
        background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    }

    &.scan {
        background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
    }
}

.header-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20rpx;

    .clue & .iconfont {
        color: #16a34a;
    }

    .scan & .iconfont {
        color: #0284c7;
    }

    .iconfont {
        font-size: 40rpx;
    }
}

.header-content {
    flex: 1;
}

.header-type {
    @include text-headline;
    color: $app-text-primary;
    display: block;
    margin-bottom: 4rpx;
}

.header-time {
    @include text-subhead;
    color: $app-text-secondary;
}

.status-badge {
    padding: 8rpx 16rpx;
    border-radius: 16rpx;
    @include text-caption-1;
    background: rgba(255, 255, 255, 0.8);

    &.new {
        color: #dc2626;
    }

    &.viewed {
        color: #6b7280;
    }

    &.resolved {
        color: #16a34a;
    }

    &.spam {
        color: #d97706;
    }
}

// Action Card
.action-card {
    background: $app-card-bg;
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
}

.action-label {
    @include text-caption-1;
    color: $app-text-muted;
    display: block;
    margin-bottom: 12rpx;
}

.action-tag {
    display: inline-flex;
    align-items: center;
    padding: 12rpx 20rpx;
    border-radius: 32rpx;
    background: #dbeafe;

    &.controlled {
        background: #dcfce7;
    }
}

.action-icon {
    font-size: 28rpx;
    margin-right: 8rpx;

    .action-tag.seen & {
        color: #0284c7;
    }

    .action-tag.controlled & {
        color: #16a34a;
    }

    .action-tag.has_clue & {
        color: #3b82f6;
    }
}

.action-text {
    @include text-body;
    font-weight: 500;

    .action-tag.seen & {
        color: #0284c7;
    }

    .action-tag.controlled & {
        color: #16a34a;
    }

    .action-tag.has_clue & {
        color: #3b82f6;
    }
}

// Section Card
.section-card {
    background: $app-card-bg;
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
}

.section-header {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
}

.section-icon {
    font-size: 28rpx;
    color: $app-text-muted;
    margin-right: 12rpx;
}

.section-title {
    @include text-headline;
    color: $app-text-primary;
}

.location-content {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.location-text {
    @include text-body;
    color: $app-text-secondary;
}

.location-coords {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.coords-text {
    @include text-caption-1;
    color: $app-text-muted;
}

.map-btn {
    display: flex;
    align-items: center;
    padding: 8rpx 16rpx;
    background: #e0f2fe;
    border-radius: 16rpx;
}

.map-icon {
    font-size: 24rpx;
    color: #0284c7;
    margin-right: 6rpx;
}

.map-text {
    @include text-caption-1;
    color: #0284c7;
}

.notes-content {
    @include text-body;
    color: $app-text-secondary;
    line-height: 1.6;
    white-space: pre-wrap;
}

.photos-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12rpx;
}

.photo-item {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 12rpx;
    background: #f3f4f6;
}

.device-text {
    @include text-subhead;
    color: $app-text-muted;
}

// Action Section
.action-section {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    margin-top: 32rpx;
}

// Resolved Card
.resolved-card {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32rpx;
    background: #dcfce7;
    border-radius: 20rpx;
    margin-top: 32rpx;
}

.resolved-icon {
    font-size: 48rpx;
    color: #16a34a;
    margin-right: 16rpx;
}

.resolved-text {
    @include text-headline;
    color: #16a34a;
}

// Spam Card
.spam-card {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32rpx;
    background: #fef3c7;
    border-radius: 20rpx;
    margin-top: 32rpx;
}

.spam-icon {
    font-size: 48rpx;
    color: #d97706;
    margin-right: 16rpx;
}

.spam-text {
    @include text-headline;
    color: #d97706;
}

// Report Popup
.report-popup {
    padding: 32rpx;
}

.popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32rpx;
}

.popup-title {
    @include text-title-2;
    color: $app-text-primary;
}

.popup-close {
    padding: 8rpx;

    .iconfont {
        font-size: 32rpx;
        color: $app-text-muted;
    }
}

.report-options {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    margin-bottom: 24rpx;
}

.report-option {
    display: flex;
    align-items: center;
    padding: 20rpx;
    background: #f9fafb;
    border-radius: 16rpx;
    border: 2rpx solid transparent;
    transition: all 0.2s ease;

    &.selected {
        background: #eff6ff;
        border-color: #3b82f6;
    }
}

.option-radio {
    width: 36rpx;
    height: 36rpx;
    border-radius: 50%;
    border: 3rpx solid #d1d5db;
    margin-right: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .selected & {
        border-color: #3b82f6;
    }
}

.radio-inner {
    width: 20rpx;
    height: 20rpx;
    border-radius: 50%;
    background: #3b82f6;
}

.option-text {
    @include text-body;
    color: $app-text-primary;
}

.report-desc {
    margin-bottom: 24rpx;
}

.desc-input {
    width: 100%;
    min-height: 160rpx;
    padding: 20rpx;
    background: #f9fafb;
    border-radius: 16rpx;
    @include text-body;
    color: $app-text-primary;
}

.popup-actions {
    padding-top: 16rpx;
}
</style>
