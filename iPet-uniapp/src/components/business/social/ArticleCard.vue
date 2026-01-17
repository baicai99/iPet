<template>
    <view class="article-card" @click="goToDetail">
        <view class="cover-wrapper">
            <u-image :src="resolvedCover" class="cover-image" mode="aspectFill" width="100%" height="360rpx"
                :lazy-load="true"></u-image>
            <view v-if="isNew" class="new-badge">最新</view>
        </view>
        <view class="info">
            <text class="title">{{ title }}</text>
            <text class="summary">{{ summary }}</text>
            <text v-if="updateTime" class="update-time">{{ formatUpdateTime(updateTime) }}</text>
            <text v-if="views !== undefined" class="views">阅读 {{ views }}</text>
        </view>
    </view>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { resolveArticleCoverUrl } from '@/modules/articles/services/resolveArticleCoverUrl'
import UImage from 'uview-plus/components/u-image/u-image.vue'

const loggedCovers = new Set()
let loggedPngCheck = false

const props = defineProps({
    id: { type: [String, Number], required: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    cover: { type: String, default: '' },
    category: { type: String, default: 'education' },
    navigateToDetail: { type: Boolean, default: true },
    /** 是否显示"最新"标识 */
    isNew: { type: Boolean, default: false },
    /** 文章更新时间，格式 YYYY-MM-DD */
    updateTime: { type: String, default: '' },
    /** 阅读量 */
    views: { type: Number, default: undefined }
})

const resolvedCover = computed(() => resolveArticleCoverUrl(props.cover))

onMounted(() => {
    const cover = resolvedCover.value
    if (!cover || loggedCovers.has(cover)) return
    loggedCovers.add(cover)
    console.info('[ArticleCover] resolved', {
        id: props.id,
        cover: props.cover,
        resolved: cover
    })
    // #ifdef MP-WEIXIN
    if (typeof uni !== 'undefined' && typeof uni.getImageInfo === 'function') {
        uni.getImageInfo({
            src: cover,
            success: (res) => {
                console.info('[ArticleCover] wx.getImageInfo ok', { src: cover, res })
            },
            fail: (err) => {
                console.warn('[ArticleCover] wx.getImageInfo fail', { src: cover, err })
            }
        })
        if (!loggedPngCheck) {
            loggedPngCheck = true
            const pngProbe = '/static/tabs/like.png'
            uni.getImageInfo({
                src: pngProbe,
                success: (res) => {
                    console.info('[ArticleCover] png probe ok', { src: pngProbe, res })
                },
                fail: (err) => {
                    console.warn('[ArticleCover] png probe fail', { src: pngProbe, err })
                }
            })
        }
    }
    // #endif
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

/**
 * 格式化更新时间显示
 */
const formatUpdateTime = (dateStr) => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length === 3) {
        return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`
    }
    return dateStr
}
</script>

<style scoped>
.article-card {
    border-radius: 24rpx;
    overflow: hidden;
    background-color: #ffffff;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.cover-wrapper {
    position: relative;
}

.cover-image {
    width: 100%;
    height: 360rpx;
}

.new-badge {
    position: absolute;
    top: 16rpx;
    right: 16rpx;
    background: linear-gradient(135deg, #ff6b6b, #ff453a);
    color: #ffffff;
    font-size: 22rpx;
    font-weight: 600;
    padding: 6rpx 16rpx;
    border-radius: 20rpx;
    box-shadow: 0 4rpx 12rpx rgba(255, 69, 58, 0.3);
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

.update-time {
    font-size: 24rpx;
    color: #b0b0b0;
    margin-top: 4rpx;
}

.views {
    font-size: 24rpx;
    color: #94a3b8;
}
</style>
