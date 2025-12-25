<template>
    <view class="section-card insight-wrapper">
        <InsightBubble>
            {{ insightText }}
        </InsightBubble>
    </view>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import InsightBubble from '@/components/widgets/InsightBubble.vue'
import { insightService } from '@/services/insight.service'
import { buildInsightBubble } from '@/utils/business/insightBubble'
import { STRINGS } from '@/locale/zh-Hans'

const props = defineProps<{
    metricKey: string
    metricMetadata: any
    currentData: any
    metricUnitLabel: string
}>()

const insightText = ref('')
const metricStrings = STRINGS.METRICS.DETAIL



const fetchInsight = async () => {
    let remoteSuggestion = ''
    try {
        const insight = await insightService.getInsight(props.metricKey)
        remoteSuggestion = insight?.content || ''
    } catch (err) {
        console.warn('Failed to fetch remote insight', err)
    }
    await updateInsightText(remoteSuggestion)
}

const updateInsightText = async (remoteSuggestion = '') => {
    await nextTick()
    const { headline, advice } = buildInsightBubble({
        metricTitle: props.metricMetadata.title || '',
        category: props.metricMetadata.category || 'default',
        values: props.currentData.values,
        avg: props.currentData.avg,
        trend: props.currentData.trend,
        unit: props.metricUnitLabel
    })

    // 优先使用本地 headline，远程仅作为 advice 的补充/替代
    const finalAdvice = remoteSuggestion || advice

    if (finalAdvice) {
        insightText.value = `${headline}，${finalAdvice}`
    } else {
        insightText.value = headline || metricStrings.INSIGHT_PLACEHOLDER
    }
}

// Watch for data changes to update insight
watch(() => [props.currentData, props.metricKey], async () => {
    if (props.metricKey && props.currentData) {
        await fetchInsight()
    }
}, { immediate: true, deep: true })
</script>

<style lang="scss" scoped>
.section-card {
    width: 100%;
    background-color: #ffffff;
    border-radius: 32rpx;
    padding: 24rpx 32rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.02);
    border: 1rpx solid #f1f5f9;
    box-sizing: border-box;

    &.insight-wrapper {
        background: transparent;
        border: none;
        box-shadow: none;
        padding: 0;
    }
}
</style>
