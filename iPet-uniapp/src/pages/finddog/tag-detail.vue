<template>
    <view class="tag-detail-page">
        <!-- Loading State -->
        <view class="loading-state" v-if="loading && !tag">
            <u-loading-icon mode="circle" size="40" />
            <text class="loading-text">加载中...</text>
        </view>

        <!-- Tag Detail Content -->
        <template v-else-if="tag">
            <!-- Pet Info Header -->
            <view class="pet-header">
                <image class="pet-avatar" :src="petInfo?.avatar || defaultAvatar" mode="aspectFill" />
                <view class="pet-info">
                    <text class="pet-name">{{ petInfo?.name || '我的宠物' }}</text>
                    <view class="tag-name-row">
                        <text class="tag-name">{{ tag.name }}</text>
                        <view class="status-badge" :class="tag.status">
                            {{ statusLabel }}
                        </view>
                    </view>
                </view>
            </view>

            <!-- QR Code Section -->
            <view class="qrcode-section">
                <view class="qrcode-card">
                    <view class="qrcode-wrapper">
                        <!-- QR Code Display -->
                        <canvas canvas-id="qrcode-canvas" id="qrcode-canvas" class="qrcode-canvas" />
                        <!-- Overlay for paused/revoked -->
                        <view class="qrcode-overlay" v-if="tag.status !== 'active'">
                            <text class="overlay-icon iconfont">
                                {{ tag.status === 'paused' ? '&#xe6b8;' : '&#xe6b7;' }}
                            </text>
                            <text class="overlay-text">
                                {{ tag.status === 'paused' ? '已暂停' : '已作废' }}
                            </text>
                        </view>
                    </view>
                    <text class="qrcode-hint">扫码查看宠物信息并提交线索</text>
                </view>

                <!-- URL Section -->
                <view class="url-section">
                    <text class="url-label">网页链接</text>
                    <view class="url-row">
                        <text class="url-text" :class="{ disabled: tag.status !== 'active' }">
                            {{ tag.webUrl }}
                        </text>
                        <view class="copy-btn" @click="copyUrl">
                            <text class="iconfont copy-icon">&#xe6a8;</text>
                        </view>
                    </view>
                </view>
            </view>

            <!-- Action Buttons -->
            <view class="action-section">
                <u-button type="primary" shape="circle" text="保存二维码图片" @click="saveQRCode"
                    :disabled="tag.status === 'revoked'" />
                <u-button v-if="tag.status !== 'revoked'" type="info" plain shape="circle"
                    :text="tag.status === 'active' ? '暂停狗牌' : '恢复狗牌'" @click="toggleStatus" />
            </view>

            <!-- Stats Section -->
            <view class="stats-section">
                <view class="stats-card">
                    <view class="stat-item">
                        <text class="stat-value">{{ tag.scanCount }}</text>
                        <text class="stat-label">扫码次数</text>
                    </view>
                    <view class="stat-divider"></view>
                    <view class="stat-item">
                        <text class="stat-value">{{ tag.clueCount }}</text>
                        <text class="stat-label">线索数量</text>
                    </view>
                </view>
                <view class="view-clues-btn" @click="goToClues" v-if="tag.clueCount > 0">
                    <text class="view-clues-text">查看线索详情</text>
                    <text class="iconfont view-clues-icon">&#xe619;</text>
                </view>
            </view>

            <!-- Print Tips -->
            <view class="tips-section">
                <view class="tips-header">
                    <text class="iconfont tips-icon">&#xe60b;</text>
                    <text class="tips-title">打印建议</text>
                </view>
                <view class="tips-content">
                    <text class="tips-item">• 建议打印尺寸：25mm × 25mm 或更大</text>
                    <text class="tips-item">• 推荐材质：不锈钢、亚克力或防水塑料</text>
                    <text class="tips-item">• 确保二维码清晰可辨，避免刮花</text>
                    <text class="tips-item">• 可搭配宠物项圈或背带使用</text>
                </view>
            </view>

            <!-- Danger Zone -->
            <view class="danger-section" v-if="tag.status !== 'revoked'">
                <view class="danger-card" @click="confirmRevoke">
                    <text class="iconfont danger-icon">&#xe6b7;</text>
                    <view class="danger-content">
                        <text class="danger-title">作废此狗牌</text>
                        <text class="danger-desc">作废后无法恢复，扫码将无法提交线索</text>
                    </view>
                    <text class="iconfont arrow-icon">&#xe619;</text>
                </view>
            </view>
        </template>

        <!-- Error State -->
        <view class="error-state" v-else-if="error">
            <text class="error-text">{{ error }}</text>
            <u-button type="primary" text="返回" @click="goBack" />
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useDogTagStore } from '@/stores/dogtagStore'
import { usePetStore } from '@/stores/petStore'
import { storeToRefs } from 'pinia'
import type { DogTag } from '@/types/dogtag'
import UQRCode from 'uqrcodejs'

// ============================================================================
// Store Setup
// ============================================================================

const dogtagStore = useDogTagStore()
const petStore = usePetStore()

const { currentDogTag: tag, loading, error } = storeToRefs(dogtagStore)
const { activePets } = storeToRefs(petStore)

// ============================================================================
// State
// ============================================================================

const tagId = ref<string>('')
const qrcodeGenerated = ref(false)
const defaultAvatar = '/static/images/default-pet.png'

// ============================================================================
// Computed
// ============================================================================

const petInfo = computed(() => {
    if (!tag.value) return null
    return activePets.value.find(p => p.id === tag.value?.petId)
})

const statusLabel = computed(() => {
    if (!tag.value) return ''
    const labels: Record<string, string> = {
        active: '生效中',
        paused: '已暂停',
        revoked: '已作废'
    }
    return labels[tag.value.status]
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
        tagId.value = options.id
        await loadTagDetail()
    }
})

onShow(async () => {
    if (tagId.value) {
        await loadTagDetail()
    }
})

// ============================================================================
// Methods
// ============================================================================

const loadTagDetail = async () => {
    if (!tagId.value) return
    await dogtagStore.fetchDogTagDetail(tagId.value)

    // Generate QR code after tag loads
    await nextTick()
    if (tag.value) {
        generateQRCode()
    }
}

const generateQRCode = () => {
    if (!tag.value || qrcodeGenerated.value) return

    try {
        // Create QR code instance
        const qr = new UQRCode()
        qr.data = tag.value.webUrl
        qr.size = 200
        qr.margin = 10
        qr.backgroundColor = '#ffffff'
        qr.foregroundColor = '#000000'
        qr.errorCorrectLevel = UQRCode.errorCorrectLevel.H

        // Make the QR code
        qr.make()

        // Draw to canvas using uni-app canvas context
        const ctx = uni.createCanvasContext('qrcode-canvas')
        qr.canvasContext = ctx
        qr.draw()

        // Submit the draw commands
        ctx.draw(false, () => {
            qrcodeGenerated.value = true
        })
    } catch (e) {
        console.error('QRCode error:', e)
    }
}

const copyUrl = () => {
    if (!tag.value) return

    uni.setClipboardData({
        data: tag.value.webUrl,
        success: () => {
            uni.showToast({
                title: '链接已复制',
                icon: 'success'
            })
        }
    })
}

const saveQRCode = () => {
    // #ifdef MP-WEIXIN
    uni.canvasToTempFilePath({
        canvasId: 'qrcode-canvas',
        success: (res) => {
            uni.saveImageToPhotosAlbum({
                filePath: res.tempFilePath,
                success: () => {
                    uni.showToast({
                        title: '已保存到相册',
                        icon: 'success'
                    })
                },
                fail: (err) => {
                    console.error('Save failed:', err)
                    uni.showToast({
                        title: '保存失败，请授权相册权限',
                        icon: 'none'
                    })
                }
            })
        },
        fail: (err) => {
            console.error('Canvas to temp file failed:', err)
        }
    })
    // #endif

    // #ifdef H5
    uni.showToast({
        title: '请长按图片保存',
        icon: 'none'
    })
    // #endif
}

const toggleStatus = async () => {
    if (!tag.value) return

    const newStatus = tag.value.status === 'active' ? 'paused' : 'active'
    const actionText = newStatus === 'paused' ? '暂停' : '恢复'

    uni.showLoading({ title: `${actionText}中...` })
    const success = await dogtagStore.updateDogTagStatus(tag.value.id, newStatus)
    uni.hideLoading()

    if (success) {
        uni.showToast({
            title: `已${actionText}`,
            icon: 'success'
        })
    } else {
        uni.showToast({
            title: `${actionText}失败，请重试`,
            icon: 'none'
        })
    }
}

const confirmRevoke = () => {
    uni.showModal({
        title: '确认作废',
        content: '作废后无法恢复，确定要作废此狗牌吗？',
        confirmText: '确认作废',
        confirmColor: '#ef4444',
        success: async (res) => {
            if (res.confirm && tag.value) {
                uni.showLoading({ title: '作废中...' })
                const success = await dogtagStore.revokeDogTag(tag.value.id)
                uni.hideLoading()

                if (success) {
                    uni.showToast({
                        title: '已作废',
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

const goToClues = () => {
    if (!tag.value) return
    uni.navigateTo({
        url: `/pages/finddog/clues?tagId=${tag.value.id}`
    })
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
.tag-detail-page {
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

// Pet Header
.pet-header {
    display: flex;
    align-items: center;
    padding: 24rpx;
    background: $app-card-bg;
    border-radius: 24rpx;
    margin-bottom: 24rpx;
}

.pet-avatar {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    margin-right: 20rpx;
    background: #f3f4f6;
}

.pet-info {
    flex: 1;
}

.pet-name {
    @include text-headline;
    color: $app-text-primary;
    display: block;
    margin-bottom: 4rpx;
}

.tag-name-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.tag-name {
    @include text-subhead;
    color: $app-text-secondary;
}

.status-badge {
    padding: 4rpx 12rpx;
    border-radius: 12rpx;
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

// QR Code Section
.qrcode-section {
    background: $app-card-bg;
    border-radius: 24rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
}

.qrcode-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 24rpx;
}

.qrcode-wrapper {
    position: relative;
    width: 400rpx;
    height: 400rpx;
    background: #fff;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.qrcode-canvas {
    width: 400rpx;
    height: 400rpx;
}

.qrcode-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
}

.overlay-icon {
    font-size: 80rpx;
    color: #9ca3af;
    margin-bottom: 16rpx;
}

.overlay-text {
    @include text-headline;
    color: $app-text-secondary;
}

.qrcode-hint {
    @include text-subhead;
    color: $app-text-muted;
    margin-top: 16rpx;
}

// URL Section
.url-section {
    border-top: 1rpx solid #f3f4f6;
    padding-top: 24rpx;
}

.url-label {
    @include text-subhead;
    color: $app-text-muted;
    display: block;
    margin-bottom: 12rpx;
}

.url-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.url-text {
    flex: 1;
    @include text-caption-1;
    color: $app-text-secondary;
    word-break: break-all;

    &.disabled {
        color: $app-text-muted;
        text-decoration: line-through;
    }
}

.copy-btn {
    width: 64rpx;
    height: 64rpx;
    border-radius: 16rpx;
    background: #e0f2fe;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.copy-icon {
    font-size: 32rpx;
    color: #0284c7;
}

// Action Section
.action-section {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    margin-bottom: 24rpx;
}

// Stats Section
.stats-section {
    background: $app-card-bg;
    border-radius: 24rpx;
    padding: 24rpx;
    margin-bottom: 24rpx;
}

.stats-card {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding-bottom: 20rpx;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-value {
    font-size: 48rpx;
    font-weight: 700;
    color: $app-text-primary;
    line-height: 1.2;
}

.stat-label {
    @include text-caption-1;
    color: $app-text-muted;
    margin-top: 4rpx;
}

.stat-divider {
    width: 1rpx;
    height: 48rpx;
    background: #e5e7eb;
}

.view-clues-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20rpx;
    border-top: 1rpx solid #f3f4f6;
    margin: 0 -24rpx -24rpx;
    background: #fafafa;
    border-radius: 0 0 24rpx 24rpx;
}

.view-clues-text {
    @include text-subhead;
    color: #3b82f6;
}

.view-clues-icon {
    font-size: 24rpx;
    color: #3b82f6;
    margin-left: 8rpx;
}

// Tips Section
.tips-section {
    background: $app-card-bg;
    border-radius: 24rpx;
    padding: 24rpx;
    margin-bottom: 24rpx;
}

.tips-header {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
}

.tips-icon {
    font-size: 28rpx;
    color: $app-text-muted;
    margin-right: 8rpx;
}

.tips-title {
    @include text-headline;
    color: $app-text-primary;
}

.tips-content {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.tips-item {
    @include text-subhead;
    color: $app-text-secondary;
    line-height: 1.6;
}

// Danger Section
.danger-section {
    margin-top: 32rpx;
}

.danger-card {
    display: flex;
    align-items: center;
    padding: 24rpx;
    background: #fef2f2;
    border-radius: 24rpx;
    border: 1rpx solid #fecaca;
}

.danger-icon {
    font-size: 40rpx;
    color: #ef4444;
    margin-right: 16rpx;
}

.danger-content {
    flex: 1;
}

.danger-title {
    @include text-headline;
    color: #dc2626;
    display: block;
    margin-bottom: 4rpx;
}

.danger-desc {
    @include text-caption-1;
    color: #b91c1c;
}

.arrow-icon {
    font-size: 24rpx;
    color: #ef4444;
}
</style>
