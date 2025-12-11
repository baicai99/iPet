<template>
    <view class="pinned-metrics-widget">
        <template v-if="processedMetrics.length > 0">
            <template v-for="item in processedMetrics" :key="item.key">
                <slot name="item" :item="item">
                    <MetricItemCard class="mb" :config="item" @click="emit('metric-click', item.key)" />
                </slot>
            </template>
        </template>
        <view v-else class="empty-placeholder" @click="goToAdd">
            <view class="add-icon-circle">
                <u-icon name="plus" color="#9ca3af" size="24"></u-icon>
            </view>
            <text class="add-text">添加需关注的健康指标</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MetricItemCard from '../business/health/MetricItemCard.vue'
import type { MetricCardConfig } from '@/types/ui'
import { useMetricProcessor } from '@/composables/useMetricProcessor'

const props = defineProps({
    metricKeys: {
        type: Array as () => string[],
        default: () => []
    },
    // Keep data prop for backward compatibility if needed, but we aim to replace it
    data: {
        type: Object,
        default: () => ({ metrics: [] })
    },
    emptyDescription: {
        type: String,
        default: '暂无置顶数据'
    }
})

const { getMetricUIConfig } = useMetricProcessor()

const processedMetrics = computed(() => {
    // Prefer metricKeys if available
    const keys: string[] = props.metricKeys.length > 0
        ? props.metricKeys
        : (props.data?.metrics?.map((m: { key: string }) => m.key) || [])

    return keys
        .map((key: string) => getMetricUIConfig(key))
        .filter((item): item is NonNullable<typeof item> => item !== null)
})

const emit = defineEmits(['add', 'metric-click'])

const goToAdd = () => {
    emit('add')
}
</script>

<style scoped>
.mb {
    margin-bottom: 16rpx;
}

.empty-placeholder {
    background-color: #ffffff;
    border: 2rpx dashed #e5e7eb;
    border-radius: 24rpx;
    height: 160rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
}

.add-icon-circle {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    background-color: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
}

.add-text {
    font-size: 24rpx;
    color: #9ca3af;
}
</style>
