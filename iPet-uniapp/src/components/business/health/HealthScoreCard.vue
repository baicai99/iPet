<template>
    <view class="health-score-card">
        <!-- 评分圆环 -->
        <view class="score-circle">
            <view class="circle-container">
                <!-- 使用 canvas 绘制圆环 -->
                <canvas canvas-id="scoreCircle" class="canvas"
                    :style="{ width: canvasSize + 'px', height: canvasSize + 'px' }"></canvas>

                <view class="score-content">
                    <text class="score-number">{{ score }}</text>
                    <text class="score-label">健康评分</text>
                </view>
            </view>
        </view>

        <!-- 评分说明 -->
        <view class="score-description">
            <text class="status-text" :style="{ color: statusColor }">
                {{ statusText }}
            </text>
            <text class="description-text">{{ description }}</text>
        </view>

        <!-- 评分维度 -->
        <view v-if="showBreakdown" class="score-breakdown">
            <view v-for="item in breakdownItems" :key="item.key" class="breakdown-item">
                <view class="item-header">
                    <text class="item-label">{{ item.label }}</text>
                    <text class="item-score">{{ item.score }}</text>
                </view>
                <view class="item-bar">
                    <view class="item-progress" :style="{
                        width: item.score + '%',
                        background: getStatusColor(item.status)
                    }"></view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
    score: {
        type: Number,
        default: 0
    },
    breakdown: {
        type: Object,
        default: null
    },
    showBreakdown: {
        type: Boolean,
        default: true
    }
})

const canvasSize = ref(200)

/**
 * 状态文本
 */
const statusText = computed(() => {
    if (props.score >= 90) return '优秀'
    if (props.score >= 75) return '良好'
    if (props.score >= 60) return '一般'
    return '较差'
})

/**
 * 状态颜色
 */
const statusColor = computed(() => {
    if (props.score >= 90) return '#34C759'
    if (props.score >= 75) return '#007AFF'
    if (props.score >= 60) return '#FF9500'
    return '#FF3B30'
})

/**
 * 描述文本
 */
const description = computed(() => {
    if (props.score >= 90) return '您的宠物健康状况非常好！'
    if (props.score >= 75) return '您的宠物健康状况良好'
    if (props.score >= 60) return '建议关注宠物健康状况'
    return '请尽快带宠物就医检查'
})

/**
 * 评分维度数据
 */
const breakdownItems = computed(() => {
    if (!props.breakdown) return []

    return [
        {
            key: 'exercise',
            label: '运动',
            score: props.breakdown.exercise?.score || 0,
            status: props.breakdown.exercise?.status || 'poor'
        },
        {
            key: 'weight',
            label: '体重',
            score: props.breakdown.weight?.score || 0,
            status: props.breakdown.weight?.status || 'poor'
        },
        {
            key: 'vaccine',
            label: '疫苗',
            score: props.breakdown.vaccine?.score || 0,
            status: props.breakdown.vaccine?.status || 'poor'
        },
        {
            key: 'medical',
            label: '就诊',
            score: props.breakdown.medical?.score || 0,
            status: props.breakdown.medical?.status || 'poor'
        }
    ]
})

/**
 * 获取状态颜色
 */
function getStatusColor(status) {
    const colors = {
        excellent: '#34C759',
        good: '#007AFF',
        fair: '#FF9500',
        poor: '#FF3B30'
    }
    return colors[status] || colors.poor
}

/**
 * 绘制评分圆环
 */
function drawScoreCircle() {
    const ctx = uni.createCanvasContext('scoreCircle')
    const centerX = canvasSize.value / 2
    const centerY = canvasSize.value / 2
    const radius = (canvasSize.value / 2) - 10
    const lineWidth = 12

    // 绘制背景圆环
    ctx.setLineWidth(lineWidth)
    ctx.setStrokeStyle('#F2F2F7')
    ctx.setLineCap('round')
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.stroke()

    // 绘制进度圆环
    const progress = props.score / 100
    const endAngle = -Math.PI / 2 + (2 * Math.PI * progress)

    ctx.setLineWidth(lineWidth)
    ctx.setStrokeStyle(statusColor.value)
    ctx.setLineCap('round')
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, endAngle)
    ctx.stroke()

    ctx.draw()
}

/**
 * 转换 rpx 到 px
 */
function rpxToPx(rpx) {
    const systemInfo = uni.getSystemInfoSync()
    return (rpx / 750) * systemInfo.windowWidth
}

onMounted(() => {
    // 将 rpx 转换为 px
    canvasSize.value = rpxToPx(400)

    // 延迟绘制，确保 canvas 已渲染
    setTimeout(() => {
        drawScoreCircle()
    }, 100)
})

watch(() => props.score, () => {
    drawScoreCircle()
})
</script>

<style lang="scss" scoped>
.health-score-card {
    background: $uni-bg-color;
    border-radius: 24rpx;
    padding: 48rpx 32rpx;
}

.score-circle {
    @include flex-center;
    margin-bottom: 32rpx;
}

.circle-container {
    position: relative;
    width: 400rpx;
    height: 400rpx;
}

.canvas {
    position: absolute;
    top: 0;
    left: 0;
}

.score-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    @include flex-center;
    flex-direction: column;
}

.score-number {
    @include text-large-title;
    font-weight: 700;
    color: $uni-text-color;
    line-height: 1;
}

.score-label {
    @include text-subhead;
    color: $uni-text-color-grey;
    margin-top: 8rpx;
}

.score-description {
    @include flex-center;
    flex-direction: column;
    gap: 8rpx;
    padding-bottom: 32rpx;
    border-bottom: 1rpx solid $uni-border-color;
}

.status-text {
    @include text-title-2;
    font-weight: 600;
}

.description-text {
    @include text-body;
    color: $uni-text-color-grey;
}

.score-breakdown {
    margin-top: 32rpx;
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.breakdown-item {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.item-header {
    @include flex-between;
}

.item-label {
    @include text-body;
    color: $uni-text-color;
}

.item-score {
    @include text-body;
    font-weight: 600;
    color: $uni-text-color;
}

.item-bar {
    height: 8rpx;
    background: $uni-bg-color-grey;
    border-radius: 4rpx;
    overflow: hidden;
}

.item-progress {
    height: 100%;
    border-radius: 4rpx;
    transition: width 0.3s ease;
}
</style>
