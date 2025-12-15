<template>
    <view class="pinned-metrics-widget">
        <template v-for="item in processedMetrics" :key="item.key">
            <slot name="item" :item="item">
                <MetricItemCard :config="item" @click="emit('metric-click', item.key)" />
            </slot>
        </template>
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

const emit = defineEmits(['metric-click'])
</script>

<style scoped>
.pinned-metrics-widget {
    display: flex;
    flex-direction: column;
    gap: 16rpx; /* 使用 gap 代替 margin-bottom */
}
</style>
