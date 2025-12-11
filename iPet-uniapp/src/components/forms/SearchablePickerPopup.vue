<template>
    <u-popup :show="show" @close="handleClose" mode="bottom" :round="24">
        <view class="popup-container">
            <view class="popup-header">
                <text class="popup-title">{{ title }}</text>
                <view class="close-btn" @click="handleClose">
                    <u-icon name="close" size="20" color="#9ca3af"></u-icon>
                </view>
            </view>
            <view class="search-box">
                <u-search :placeholder="searchPlaceholder" v-model="searchQuery" :show-action="false" shape="round"
                    bg-color="#f3f4f6"></u-search>
            </view>
            <scroll-view scroll-y class="list-scroll">
                <view v-for="(item, index) in filteredItems" :key="index" class="list-item" @click="handleSelect(item)">
                    <text class="list-text" :class="{ 'selected-text': modelValue === item }">{{ item }}</text>
                    <u-icon v-if="modelValue === item" name="checkmark" size="18" color="#f97316"></u-icon>
                </view>
                <view v-if="filteredItems.length === 0" class="empty-result">
                    <text>{{ emptyText }}</text>
                </view>
            </scroll-view>
        </view>
    </u-popup>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import PinyinMatch from 'pinyin-match'

const props = withDefaults(defineProps<{
    show: boolean;
    title: string;
    items: string[];
    modelValue?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    enablePinyin?: boolean;
}>(), {
    searchPlaceholder: '搜索',
    emptyText: '未找到相关结果',
    enablePinyin: true
})

const emit = defineEmits<{
    'update:show': [value: boolean];
    'update:modelValue': [value: string];
    select: [value: string];
    close: [];
}>()

const searchQuery = ref('')

// Reset search query when popup opens
watch(() => props.show, (newVal) => {
    if (newVal) {
        searchQuery.value = ''
    }
})

const filteredItems = computed(() => {
    if (!searchQuery.value) return props.items

    if (props.enablePinyin) {
        return props.items.filter(item => PinyinMatch.match(item, searchQuery.value))
    }

    return props.items.filter(item =>
        item.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
})

const handleClose = () => {
    emit('update:show', false)
    emit('close')
    searchQuery.value = ''
}

const handleSelect = (item: string) => {
    emit('update:modelValue', item)
    emit('select', item)
    handleClose()
}
</script>

<style lang="scss" scoped>
.popup-container {
    padding: 32rpx;
    height: 60vh;
    display: flex;
    flex-direction: column;
}

.popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
}

.popup-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #1f2937;
}

.close-btn {
    padding: 8rpx;
    cursor: pointer;
}

.search-box {
    margin-bottom: 24rpx;
}

.list-scroll {
    flex: 1;
    overflow-y: auto;
}

.list-item {
    padding: 24rpx 0;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.list-text {
    font-size: 28rpx;
    color: #374151;
}

.selected-text {
    color: #f97316;
    font-weight: bold;
}

.empty-result {
    padding: 40rpx;
    text-align: center;
    color: #9ca3af;
    font-size: 26rpx;
}
</style>
