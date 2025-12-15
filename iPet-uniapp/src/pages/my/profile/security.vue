<template>
    <view class="page-container">
        <AppNavbar title="账号安全" />
        <view class="security-page">
        <!-- 手机号 -->
        <view class="section">
            <view class="card">
                <view class="card-item">
                    <view class="item-left">
                        <u-icon name="phone" size="20" color="#9ca3af"></u-icon>
                        <view class="item-info">
                            <text class="item-title">手机号</text>
                            <text class="item-desc">已绑定: {{ maskedPhone }}</text>
                        </view>
                    </view>
                    <button class="action-button primary" @click="handleChangePhone">更换</button>
                </view>
            </view>
        </view>

        <!-- 第三方绑定 -->
        <view class="section">
            <text class="section-label">第三方账号绑定</text>
            <view class="card">
                <!-- 微信 -->
                <view class="card-item">
                    <view class="item-left">
                        <view class="platform-icon wechat">
                            <u-icon name="weixin" size="18" color="#10b981"></u-icon>
                        </view>
                        <text class="item-title">微信</text>
                    </view>
                    <button class="action-button" :class="wechatBound ? 'bound' : 'primary'"
                        @click="handleToggleBind('wechat')">
                        {{ wechatBound ? '已绑定' : '去绑定' }}
                    </button>
                </view>

                <!-- Apple ID -->
                <view class="card-item no-border">
                    <view class="item-left">
                        <view class="platform-icon apple">
                            <u-icon name="apple" size="18" color="#1f2937"></u-icon>
                        </view>
                        <text class="item-title">Apple ID</text>
                    </view>
                    <button class="action-button" :class="appleBound ? 'bound' : 'primary'"
                        @click="handleToggleBind('apple')">
                        {{ appleBound ? '已绑定' : '去绑定' }}
                    </button>
                </view>
            </view>
        </view>

        <!-- 注销账号 -->
        <view class="section danger-section">
            <view class="danger-button" @click="showDeleteModal = true">
                <u-icon name="logout" size="18" color="#ef4444"></u-icon>
                <text class="danger-text">注销账号</text>
            </view>
            <text class="danger-hint">注销后账号数据将不可恢复,请谨慎操作</text>
        </view>

        <!-- 注销确认弹窗 -->
        <u-modal v-model="showDeleteModal" :show-cancel-button="true" :show-confirm-button="true" confirm-text="确认注销"
            cancel-text="我再想想" @confirm="handleDeleteAccount" @cancel="showDeleteModal = false">
            <view class="modal-content">
                <view class="modal-icon">
                    <u-icon name="trash" size="24" color="#ef4444"></u-icon>
                </view>
                <text class="modal-title">确定要注销账号吗?</text>
                <text class="modal-desc">此操作无法撤销,您的所有个人数据、权益将被永久删除。</text>
            </view>
        </u-modal>
        </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppNavbar from '@/components/common/AppNavbar.vue'

const phone = ref('13800138000')
const wechatBound = ref(true)
const appleBound = ref(false)
const showDeleteModal = ref(false)

const maskedPhone = computed(() => {
    return phone.value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
})

const handleChangePhone = () => {
    uni.showToast({
        title: '更换手机号功能开发中',
        icon: 'none'
    })
}

const handleToggleBind = (platform) => {
    const platformName = platform === 'wechat' ? '微信' : 'Apple ID'
    const isBound = platform === 'wechat' ? wechatBound.value : appleBound.value

    if (isBound) {
        uni.showModal({
            title: '解绑确认',
            content: `确定要解绑${platformName}吗?`,
            success: (res) => {
                if (res.confirm) {
                    if (platform === 'wechat') {
                        wechatBound.value = false
                    } else {
                        appleBound.value = false
                    }
                    uni.showToast({
                        title: '解绑成功',
                        icon: 'success'
                    })
                }
            }
        })
    } else {
        // 模拟跳转授权
        setTimeout(() => {
            if (platform === 'wechat') {
                wechatBound.value = true
            } else {
                appleBound.value = true
            }
            uni.showToast({
                title: '绑定成功',
                icon: 'success'
            })
        }, 500)
    }
}

const handleDeleteAccount = () => {
    showDeleteModal.value = false
    uni.showToast({
        title: '账号已进入注销流程',
        icon: 'none'
    })

    setTimeout(() => {
        uni.navigateBack()
    }, 1500)
}
</script>

<style lang="scss" scoped>
.security-page {
    min-height: 100vh;
    background: #f5f5f5;
    padding: 32rpx;
}

.section {
    margin-bottom: 48rpx;
}

.section-label {
    display: block;
    font-size: 20rpx;
    color: #6b7280;
    margin-bottom: 16rpx;
    padding-left: 8rpx;
}

/* 卡片 */
.card {
    background: white;
    border-radius: 24rpx;
    overflow: hidden;
}

.card-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx;
    border-bottom: 1px solid #f3f4f6;
}

.card-item.no-border {
    border-bottom: none;
}

.item-left {
    display: flex;
    align-items: center;
    gap: 24rpx;
}

.item-info {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
}

.item-title {
    font-size: 24rpx;
    font-weight: 600;
    color: #1f2937;
}

.item-desc {
    font-size: 20rpx;
    color: #6b7280;
}

/* 平台图标 */
.platform-icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.wechat {
    background: #d1fae5;
}

.apple {
    background: #f3f4f6;
}

/* 操作按钮 */
.action-button {
    padding: 12rpx 24rpx;
    font-size: 24rpx;
    font-weight: 600;
    border-radius: 12rpx;
    border: none;
}

.action-button.primary {
    background: #dbeafe;
    color: #2563eb;
}

.action-button.bound {
    background: transparent;
    color: #9ca3af;
}

.action-button:active {
    opacity: 0.8;
}

/* 危险区域 */
.danger-section {
    padding-top: 64rpx;
}

.danger-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    padding: 32rpx;
    background: white;
    border-radius: 24rpx;
    border: 1px solid #fecaca;
}

.danger-button:active {
    background: #fef2f2;
}

.danger-text {
    font-size: 24rpx;
    font-weight: 600;
    color: #ef4444;
}

.danger-hint {
    display: block;
    font-size: 20rpx;
    color: #9ca3af;
    text-align: center;
    margin-top: 16rpx;
}

/* 模态框内容 */
.modal-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32rpx;
}

.modal-icon {
    width: 96rpx;
    height: 96rpx;
    background: #fee2e2;
    border-radius: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32rpx;
}

.modal-title {
    font-size: 32rpx;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 16rpx;
}

.modal-desc {
    font-size: 24rpx;
    color: #6b7280;
    text-align: center;
    line-height: 1.6;
}
</style>
