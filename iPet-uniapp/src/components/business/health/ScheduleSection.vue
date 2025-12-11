<template>
    <view class="schedule-section">
        <!-- 预约列表 -->
        <view class="deworming-list" v-if="activeSchedules.length > 0">
            <MetricScheduleCard v-for="schedule in activeSchedules" :key="schedule.id" :title="metricMetadata.title"
                :date="schedule.metadata?.targetDate || schedule.date" @complete="onCompleteSchedule(schedule)"
                @delete="onDeleteSchedule(schedule)" />
        </view>
        <u-empty v-else-if="latestMetricDisplay.isPlaceholder" mode="list"
            icon="http://cdn.uviewui.com/uview/empty/list.png" :text="`当前没有预约${metricMetadata.title}，请在底部添加`">
        </u-empty>

        <!-- 预约按钮 -->
        <view class="section-card" @click="onSchedule">
            <view class="action-btn-content">
                <text class="action-btn-text">预约{{ metricMetadata.title }}</text>
                <u-icon name="arrow-right" color="#94a3b8" size="16"></u-icon>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { useMetricDetailContext } from '@/composables/useMetricDetail'
import MetricScheduleCard from '@/components/business/health/MetricScheduleCard.vue'

const {
    metricKey,
    metricMetadata,
    activeSchedules,
    latestMetricDisplay,
    onCompleteSchedule,
    onDeleteSchedule
} = useMetricDetailContext()

const onSchedule = () => {
    uni.navigateTo({
        url: `/pages/metrics/add?key=${metricKey.value}&mode=schedule`
    })
}
</script>

<style lang="scss" scoped>
.schedule-section {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.deworming-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.section-card {
    background: #fff;
    border-radius: 24rpx;
    padding: 32rpx;
}

.action-btn-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.action-btn-text {
    font-size: 30rpx;
    color: #1e293b;
    font-weight: 500;
}
</style>
