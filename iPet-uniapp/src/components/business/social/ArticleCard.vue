<template>
    <view class="article-card" @click="goToDetail">
        <image :src="cover" class="cover-image" mode="aspectFill" lazy-load="true"></image>
        <view class="info">
            <text class="title">{{ title }}</text>
            <text class="summary">{{ summary }}</text>
        </view>
    </view>
</template>

<script setup>
const props = defineProps({
    id: { type: [String, Number], required: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    cover: { type: String, default: '' },
    category: { type: String, default: 'education' },
    navigateToDetail: { type: Boolean, default: true }
})

const goToDetail = () => {
    if (!props.navigateToDetail) {
        return
    }
    const isRecipe = props.category === 'recipe'
    const page = isRecipe ? 'recipe-detail' : 'detail'
    uni.navigateTo({
        url: `/pages/articles/${page}?id=${props.id}`
    })
}
</script>

<style scoped>
.article-card {
    border-radius: 24rpx;
    overflow: hidden;
    background-color: #ffffff;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.cover-image {
    width: 100%;
    height: 360rpx;
}

.info {
    padding: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
}

.summary {
    font-size: 28rpx;
    color: #999;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    text-overflow: ellipsis;
    overflow: hidden;
}
</style>
