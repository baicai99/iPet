<template>
    <view class="task-card">
        <!-- 自定义 Tabs -->
        <view class="chart-tabs-wrapper">
            <view class="chart-tabs">
                <view v-for="tab in tabs" :key="tab.id" class="tab-item" :class="{ active: activeTab === tab.id }"
                    @click="setActiveTab(tab.id)">
                    <text class="tab-text">{{ tab.label }}</text>
                </view>
            </view>
        </view>

        <!-- 列表展示 -->
        <view class="deworming-list">
            <MetricScheduleCard v-for="schedule in taskList" :key="schedule.id" :title="getScheduleTitle(schedule)"
                :date="schedule.metadata?.targetDate || schedule.date || schedule.updatedAt"
                :tags="schedule.metadata?.selectedOptions" :repeat="schedule.metadata?.repeat"
                :custom-rule="schedule.metadata?.reminder?.customRule" :is-completed="false"
                @complete="onCompleteSchedule(schedule)" @delete="onDeleteSchedule(schedule)" />

            <u-empty v-if="taskList.length === 0" mode="list" icon="http://cdn.uviewui.com/uview/empty/list.png"
                :text="emptyText">
            </u-empty>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMetricDetailContext } from '@/composables/useMetricDetail'
import MetricScheduleCard from '@/components/business/health/MetricScheduleCard.vue'

const {
    tabs,
    activeTab,
    taskList,
    metricMetadata,
    setActiveTab,
    onCompleteSchedule,
    onDeleteSchedule
} = useMetricDetailContext()

const emptyText = computed(() => {
    if (activeTab.value === 'today') return '今天没有待办'
    if (activeTab.value === 'week') return '本周没有待办'
    return '当前没有待办任务'
})

const getScheduleTitle = (schedule: any) => {
    return metricMetadata.value.title || '任务'
}
</script>

<style lang="scss" scoped>
.task-card {
    background: #fff;
    border-radius: 24rpx;
    padding: 32rpx;
    margin: 0 24rpx 24rpx;
}

.chart-tabs-wrapper {
    margin-bottom: 24rpx;
}

.chart-tabs {
    display: flex;
    gap: 16rpx;
    background: #f1f5f9;
    border-radius: 16rpx;
    padding: 8rpx;
}

.tab-item {
    flex: 1;
    text-align: center;
    padding: 16rpx 0;
    border-radius: 12rpx;
    transition: all 0.2s ease;

    &.active {
        background: #fff;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
    }
}

.tab-text {
    font-size: 26rpx;
    color: #64748b;

    .active & {
        color: #1e293b;
        font-weight: 500;
    }
}

.deworming-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}
</style>
