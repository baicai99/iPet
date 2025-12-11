<template>
    <view class="history-page">
        <view v-if="historyData.length" class="history-list">
            <up-swipe-action>
                <up-swipe-action-item v-for="item in historyData" :key="item.id" :options="swipeOptions"
                    @click="(e) => handleSwipeClick(e, item)">
                    <view class="history-row up-border-bottom" :class="{ 'scheduled-item': item.isScheduled }">
                        <view class="value-wrapper">
                            <text class="value-text">{{ item.value }}</text>
                            <text class="value-unit" v-if="item.unit">{{ item.unit }}</text>
                            <view v-if="item.tags && item.tags.length" class="history-tags">
                                <text v-for="tag in item.tags" :key="tag" class="history-tag">
                                    {{ getTagName(tag) }}
                                </text>
                            </view>
                            <view class="tag-scheduled" v-if="item.isScheduled">待办</view>
                        </view>
                        <text class="history-time">{{ formatDate(item.timestamp) }}</text>
                    </view>
                </up-swipe-action-item>
            </up-swipe-action>
        </view>

        <view v-if="!loading && historyData.length === 0" class="empty-wrap">
            <u-empty mode="history" text="暂无记录"></u-empty>
        </view>

        <view class="loading-more" v-if="loading">
            <u-loading-icon mode="circle"></u-loading-icon>
        </view>
        <view class="no-more" v-if="!loading && !hasMore && historyData.length > 0">
            <text>没有更多了</text>
        </view>
    </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad, onReachBottom } from '@dcloudio/uni-app'
import { useHealthStore } from '@/stores/healthStore'
import { getMetricMetadata } from '@/data/metricMetadata'
import { usePetViewModel } from '@/composables/usePetViewModel'
import { sortRecordsByTime, parseTimestamp } from '@/utils/business/healthDataHelper'

const metricKey = ref('')
const historyData = ref([])
const loading = ref(false)
const metadata = ref({})
const page = ref(1)
const hasMore = ref(true)
const pageSize = 20

const petViewModel = usePetViewModel()
const { selectedPetId } = petViewModel

onLoad(async (options) => {
    if (options.key) {
        metricKey.value = options.key
        metadata.value = getMetricMetadata(options.key) || {}
        await refreshData()
    }
})

onReachBottom(() => {
    if (hasMore.value && !loading.value) {
        loadMore()
    }
})

const healthStore = useHealthStore()

const refreshData = async () => {
    page.value = 1
    hasMore.value = true
    historyData.value = []
    await fetchData()
}

const loadMore = async () => {
    page.value++
    await fetchData()
}

const fetchData = async () => {
    if (!selectedPetId.value || !metricKey.value) return

    loading.value = true
    try {
        const res = await healthStore.fetchHistoryRecords(
            selectedPetId.value,
            metricKey.value,
            page.value,
            pageSize
        )

        if (res && res.length > 0) {
            // Ensure data is sorted by date descending (though backend should handle it)
            // Filter out scheduled plans, as they are shown in Detail page's schedule section
            const newRecords = sortRecordsByTime(res, 'desc').filter(r => r.metadata?.isScheduled !== true)

            // Map to display format
            const mappedRecords = newRecords.map(r => ({
                id: r.id,
                value: r.value,
                unit: metadata.value.displayUnit || metadata.value.unit || '',
                timestamp: parseTimestamp(r),
                isScheduled: r.metadata?.isScheduled,
                tags: r.metadata?.selectedOptions || []
            }))

            if (page.value === 1) {
                historyData.value = mappedRecords
            } else {
                historyData.value = [...historyData.value, ...mappedRecords]
            }

            if (res.length < pageSize) {
                hasMore.value = false
            }
        } else {
            hasMore.value = false
        }
    } catch (e) {
        console.error('Failed to fetch history:', e)
        // If error on first page, maybe show error state
        if (page.value > 1) {
            page.value-- // Revert page increment on error
        }
    } finally {
        loading.value = false
    }
}

const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getTagName = (val) => {
    const map = {
        'internal': '体内',
        'external': '体外',
        'rabies': '狂犬',
        'combo': '多联（基础病）',
        'six_in_one': '六联',
        'eight_in_one': '八联'
    }
    return map[val] || val
}

const swipeOptions = reactive([
    {
        text: '删除',
        style: {
            backgroundColor: '#ef4444'
        }
    }
])

const handleSwipeClick = (e, item) => {
    if (e.index === 0) {
        handleDelete(item)
    }
}

const handleDelete = (item) => {
    uni.showModal({
        title: '确认删除',
        content: '确定要删除这条记录吗？',
        success: async (res) => {
            if (res.confirm) {
                try {
                    uni.showLoading({ title: '删除中...' })

                    // 1. Call Store delete
                    await healthStore.deleteRecord(item.id)

                    // 2. Notify Detail page
                    if (metricKey.value) {
                        uni.$emit('metric-history-updated', { key: metricKey.value })
                    }

                    // 3. Remove locally for immediate feedback
                    const index = historyData.value.findIndex(i => i.id === item.id)
                    if (index > -1) {
                        historyData.value.splice(index, 1)
                    }

                    // 4. Handle empty state
                    if (historyData.value.length === 0) {
                        hasMore.value = false
                    }

                    uni.hideLoading()
                    uni.showToast({ title: '删除成功', icon: 'success' })

                } catch (error) {
                    uni.hideLoading()
                    uni.showToast({ title: '删除失败', icon: 'none' })
                    console.error(error)
                }
            }
        }
    })
}

</script>

<style lang="scss" scoped>
.history-page {
    min-height: 100vh;
    padding: 24rpx;
    background-color: #f5f6fa;
}

.history-list {
    background-color: #fff;
    border-radius: 24rpx;
    overflow: hidden;
}

.history-row {
    padding: 28rpx 32rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fff;
}

.value-wrapper {
    display: flex;
    align-items: baseline;
    gap: 12rpx;
}

.value-text {
    font-size: 32rpx;
    color: #1e1e1e;
}

.value-unit {
    font-size: 26rpx;
    color: #8c8c8c;
}

.history-time {
    font-size: 24rpx;
    color: #9ba1a6;
}

.empty-wrap {
    padding: 80rpx 0;
    display: flex;
    justify-content: center;
}

.loading-more {
    padding: 32rpx 0;
    display: flex;
    justify-content: center;
}

.no-more {
    padding: 32rpx 0;
    text-align: center;

    text {
        font-size: 24rpx;
        color: #cbd5e1;
    }
}

.scheduled-item {
    background-color: #fffaf0; // orange-50 equivalent

    .history-time {
        color: #f59e0b; // amber-500
        font-weight: 500;
    }
}

.tag-scheduled {
    font-size: 20rpx;
    color: #f97316; // orange-500
    background-color: rgba(249, 115, 22, 0.1);
    padding: 2rpx 8rpx;
    border-radius: 8rpx;
    margin-left: 12rpx;
    border: 1rpx solid rgba(249, 115, 22, 0.2);
}

.history-tags {
    display: flex;
    gap: 8rpx;
    margin-left: 12rpx;
}

.history-tag {
    font-size: 20rpx;
    color: #64748b;
    background-color: #f1f5f9;
    padding: 2rpx 8rpx;
    border-radius: 6rpx;
}
</style>
