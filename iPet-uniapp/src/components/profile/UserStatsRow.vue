<template>
    <view class="user-stats-row">
        <view class="stat-item">
            <text class="stat-value">{{ stats.daysWithPet }}</text>
            <text class="stat-label">养宠天数</text>
        </view>
        <view class="stat-item">
            <text class="stat-value">{{ stats.recordCount }}</text>
            <text class="stat-label">记录条数</text>
        </view>
        <view class="stat-item">
            <text class="stat-value">{{ displayWalkDistance }}</text>
            <text class="stat-label">遛狗里程 ({{ distanceUnitLabel }})</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UserStats } from '@/types/user'
import { useUnitConverter } from '@/composables/useUnitConverter'

const props = defineProps<{
    stats: UserStats
}>()

const { distanceUnitLabel, formatDistance } = useUnitConverter()

const displayWalkDistance = computed(() => formatDistance(props.stats?.walkDistance ?? 0))
</script>

<style lang="scss" scoped>
.user-stats-row {
    background: $app-card-bg;
    border-radius: 24rpx;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32rpx 0;
    flex: 1;
    transition: background-color 0.2s ease;
}

.stat-item+.stat-item {
    border-left: 1px solid $app-border-color;
}

.stat-value {
    font-size: 28rpx;
    font-weight: 700;
    color: $app-text-primary;
    margin-bottom: 8rpx;
}

.stat-label {
    font-size: 20rpx;
    color: $app-text-muted;
}
</style>
