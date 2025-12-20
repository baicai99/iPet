<template>
    <view class="page-container">
        <view class="recipe-detail-page">
            <u-loading-page :loading="loading"></u-loading-page>

            <view v-if="article" class="content-wrapper">
                <image v-if="article.cover" :src="resolveArticleCoverUrl(article.cover)" class="cover-image"
                    mode="aspectFill"></image>
                <view class="article-header">
                    <text class="title">{{ article.title }}</text>
                    <view class="meta">
                        <text class="author">{{ article.author || 'iPet' }}</text>
                        <text class="date">{{ formatDate(article.updateTime, 'YYYY年MM月DD日') }}</text>
                    </view>
                </view>

                <view class="article-body">
                    <ArticleContentRenderer v-if="article.content" :markdown-text="article.content" />
                    <view v-else class="content-loading">内容加载中...</view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getArticleDetail } from '@/services/articleService'
import { formatDate } from '@/utils/common/formatHelper'
import ArticleContentRenderer from '@/modules/articles/ui/ArticleContentRenderer.vue'
import type { ArticleWithContent } from '@/modules/articles/domain/types'
import { resolveArticleCoverUrl } from '@/modules/articles/services/resolveArticleCoverUrl'

const loading = ref(true)
const article = ref<ArticleWithContent | null>(null)

const fetchArticle = async (id: string) => {
    loading.value = true
    try {
        article.value = await getArticleDetail(id)
    } catch (error) {
        console.error('Failed to load recipe', error)
        article.value = null
        uni.showToast({
            title: '加载失败',
            icon: 'none'
        })
    } finally {
        loading.value = false
    }
}

onLoad((options) => {
    if (options?.id) {
        fetchArticle(options.id)
    } else {
        loading.value = false
        uni.showToast({
            title: '缺少文章ID',
            icon: 'none'
        })
    }
})
</script>

<style lang="scss" scoped>
.recipe-detail-page {
    min-height: 100vh;
    background: #fff;
    padding-bottom: 40rpx;
}

.cover-image {
    width: 100%;
    height: 400rpx;
}

.article-header {
    padding: 32rpx;
}

.title {
    font-size: 40rpx;
    font-weight: 700;
    color: #111827;
    line-height: 1.4;
    margin-bottom: 16rpx;
    display: block;
}

.meta {
    display: flex;
    gap: 16rpx;
    font-size: 24rpx;
    color: #6b7280;
}

.article-body {
    padding: 0 32rpx;
    font-size: 30rpx;
    line-height: 1.8;
    color: #374151;

    .content-loading {
        text-align: center;
        color: #9ca3af;
        padding: 40rpx 0;
    }
}
</style>
