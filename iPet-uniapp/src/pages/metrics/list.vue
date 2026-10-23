<template>
    <view class="page-container">
        <u-pull-refresh class="pull-refresh" :refreshing="isPullRefreshing" @refresh="handlePullRefresh">
            <view class="content">
                <view class="search-bar-container">
                    <u-search v-model="searchQuery" placeholder="搜索健康指标" :show-action="false" shape="round"
                        bg-color="#ffffff"></u-search>
                </view>
                <template v-if="filteredSections.length > 0">
                    <view v-for="section in filteredSections" :key="section.title" class="section-container">
                        <text class="section-title">{{ section.title }}</text>
                        <view class="cards-grid">
                            <MetricItemCard v-for="item in section.items" :key="item.key" :config="item"
                                @select="handleSelect(item.key)" />
                        </view>
                    </view>
                </template>
                <u-empty v-else mode="search" text="未找到相关指标" marginTop="100"></u-empty>
            </view>
        </u-pull-refresh>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import MetricItemCard from '@/components/business/health/MetricItemCard.vue'
import { useMetricList } from './composables/useMetricList'
import PinyinMatch from 'pinyin-match'
import { useHealthStore } from '@/stores/healthStore'
import { usePetViewModel } from '@/composables/usePetViewModel'

const { groupedSections, refresh } = useMetricList()
const searchQuery = ref('')
const isPullRefreshing = ref(false)
const healthStore = useHealthStore()
const { selectedPetId } = usePetViewModel()

const filteredSections = computed(() => {
    if (!searchQuery.value) return groupedSections.value

    const query = searchQuery.value.toLowerCase()
    return groupedSections.value.map(section => {
        const filteredItems = section.items.filter(item => {
            // Support Pinyin fuzzy search for title
            const titleMatch = item.title && PinyinMatch.match(item.title, query)
            // Standard inclusion check for key (English ID)
            const keyMatch = item.key && item.key.toLowerCase().includes(query)

            return titleMatch || keyMatch
        })
        return {
            ...section,
            items: filteredItems
        }
    }).filter(section => section.items.length > 0)
})

onLoad(() => {
    refresh()
    if (selectedPetId.value) {
        healthStore.ensureDataLoaded(selectedPetId.value)
    }
})

const handlePullRefresh = async () => {
    isPullRefreshing.value = true
    try {
        if (selectedPetId.value) {
            await healthStore.ensureDataLoaded(selectedPetId.value)
        }
    } finally {
        isPullRefreshing.value = false
    }
}

const handleSelect = (metricKey) => {
    uni.navigateTo({ url: `/pages/metrics/detail?key=${metricKey}` })
}
</script>

<style scoped>
.pull-refresh {
    height: 100vh;
}

.content {
    padding: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 32rpx;
}

/* .search-bar-container {
    padding: 24rpx 32rpx;
    background-color: #f5f5f5;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
} */

.section-container {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    padding-left: 8rpx;
}

.cards-grid {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}
</style>
