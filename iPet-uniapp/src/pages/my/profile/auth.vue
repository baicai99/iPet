<template>
    <view class="auth-page">
        <!-- 已认证状态 -->
        <view v-if="isVerified" class="verified-container">
            <view class="verified-icon">
                <u-icon name="checkmark-circle" size="80" color="#10b981"></u-icon>
            </view>
            <text class="verified-title">已通过认证</text>
            <text class="verified-desc">您的身份信息已核验通过,享有社区完整权益。</text>

            <view class="info-card">
                <view class="info-item">
                    <text class="info-label">真实姓名</text>
                    <text class="info-value">*{{ maskedName }}</text>
                </view>
                <view class="divider"></view>
                <view class="info-item">
                    <text class="info-label">身份证号</text>
                    <text class="info-value">440*************88</text>
                </view>
            </view>
        </view>

        <!-- 未认证状态 -->
        <view v-else class="unverified-container">
            <!-- 提示信息 -->
            <view class="notice-box">
                <u-icon name="info-circle" size="18" color="#3b82f6"></u-icon>
                <text class="notice-text">
                    依据相关法律法规,发布内容前需完成实名认证。我们严格保障您的信息安全,仅用于身份核验。
                </text>
            </view>

            <!-- 认证表单 -->
            <view class="form-card">
                <view class="form-item">
                    <text class="form-label">真实姓名</text>
                    <input v-model="formData.name" class="form-input" placeholder="请输入真实姓名" />
                </view>
                <view class="form-item">
                    <text class="form-label">身份证号</text>
                    <input v-model="formData.idCard" class="form-input" placeholder="请输入18位身份证号" maxlength="18" />
                </view>
            </view>

            <!-- 身份证照片上传 -->
            <view class="upload-card">
                <text class="form-label">上传身份证照片 (模拟)</text>
                <view class="upload-grid">
                    <view class="upload-item" @click="handleUpload('front')">
                        <u-icon name="camera" size="24" color="#9ca3af"></u-icon>
                        <text class="upload-text">人像面</text>
                    </view>
                    <view class="upload-item" @click="handleUpload('back')">
                        <u-icon name="camera" size="24" color="#9ca3af"></u-icon>
                        <text class="upload-text">国徽面</text>
                    </view>
                </view>
            </view>

            <!-- 提交按钮 -->
            <view class="submit-section">
                <button class="submit-button" :class="{ 'button-loading': loading }" :disabled="loading"
                    @click="handleSubmit">
                    {{ loading ? '提交审核中...' : '提交认证' }}
                </button>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { userService } from '@/services/userService'

const isVerified = ref(false)
const loading = ref(false)

const formData = reactive({
    name: '',
    idCard: ''
})

const maskedName = computed(() => {
    if (!formData.name) return '某某'
    return '*' + formData.name.slice(1)
})

const handleUpload = (type) => {
    uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: () => {
            uni.showToast({
                title: `${type === 'front' ? '人像面' : '国徽面'}上传成功`,
                icon: 'success'
            })
        }
    })
}

const handleSubmit = () => {
    if (!formData.name || !formData.idCard) {
        uni.showToast({
            title: '请填写完整信息',
            icon: 'none'
        })
        return
    }

    loading.value = true

    // Call API
    userService.verifyIdentity(formData)
        .then(() => {
            isVerified.value = true
            uni.showToast({
                title: '认证成功!',
                icon: 'success'
            })

            setTimeout(() => {
                uni.navigateBack()
            }, 1500)
        })
        .catch(err => {
            uni.showToast({
                title: err.message || '认证失败',
                icon: 'none'
            })
        })
        .finally(() => {
            loading.value = false
        })
}
</script>

<style lang="scss" scoped>
.auth-page {
    min-height: 100vh;
    background: #f5f5f5;
    padding: 32rpx;
}

/* 已认证容器 */
.verified-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 128rpx 32rpx;
}

.verified-icon {
    margin-bottom: 32rpx;
}

.verified-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 16rpx;
}

.verified-desc {
    font-size: 24rpx;
    color: #6b7280;
    text-align: center;
    margin-bottom: 64rpx;
}

.info-card {
    width: 100%;
    background: #f9fafb;
    border-radius: 16rpx;
    padding: 32rpx;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.info-label {
    font-size: 24rpx;
    color: #6b7280;
}

.info-value {
    font-size: 28rpx;
    font-weight: 600;
    color: #1f2937;
}

.divider {
    height: 1px;
    background: #e5e7eb;
    margin: 24rpx 0;
}

/* 未认证容器 */
.unverified-container {
    display: flex;
    flex-direction: column;
    gap: 32rpx;
}

.notice-box {
    display: flex;
    align-items: flex-start;
    gap: 24rpx;
    padding: 24rpx;
    background: #dbeafe;
    border-radius: 16rpx;
}

.notice-text {
    flex: 1;
    font-size: 20rpx;
    color: #1e40af;
    line-height: 1.6;
}

/* 表单卡片 */
.form-card,
.upload-card {
    background: white;
    border-radius: 24rpx;
    padding: 32rpx;
}

.form-item {
    margin-bottom: 32rpx;
}

.form-item:last-child {
    margin-bottom: 0;
}

.form-label {
    display: block;
    font-size: 24rpx;
    font-weight: 600;
    color: #374151;
    margin-bottom: 16rpx;
}

.form-input {
    width: 100%;
    padding: 24rpx 32rpx;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 16rpx;
    font-size: 28rpx;
    color: #1f2937;
}

.form-input::placeholder {
    color: #9ca3af;
}

/* 上传区域 */
.upload-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 32rpx;
}

.upload-item {
    aspect-ratio: 3/2;
    background: #f3f4f6;
    border: 2px dashed #d1d5db;
    border-radius: 16rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
}

.upload-item:active {
    background: #e5e7eb;
}

.upload-text {
    font-size: 20rpx;
    color: #9ca3af;
}

/* 提交按钮 */
.submit-section {
    margin-top: 32rpx;
}

.submit-button {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    font-size: 28rpx;
    font-weight: 600;
    border-radius: 24rpx;
    border: none;
    box-shadow: 0 4rpx 12rpx rgba(59, 130, 246, 0.3);
}

.button-loading {
    background: #93c5fd;
}

.submit-button:active {
    opacity: 0.9;
}
</style>
