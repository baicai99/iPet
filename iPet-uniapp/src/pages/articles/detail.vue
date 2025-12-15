<template>
    <view class="page-container">
        <AppNavbar title="文章详情" />
        <view class="article-detail-page">
            <!-- 显式使用 v-if 控制加载蒙层 -->
            <u-loading-page v-if="loading" :loading="loading"></u-loading-page>

            <view v-else-if="article" class="content-wrapper">
                <image v-if="article.cover" :src="article.cover" class="cover-image" mode="aspectFill"></image>
                <view class="article-header">
                    <text class="category-tag">{{ resolveCategoryLabel(article.category) }}</text>
                    <text class="title">{{ article.title }}</text>
                    <view class="meta">
                        <text class="author">{{ article.author || 'iPet' }}</text>
                        <text class="date">{{ formatDate(article.updateTime, 'YYYY年MM月DD日') }}</text>
                    </view>
                    <text v-if="article.summary" class="summary">{{ article.summary }}</text>
                </view>
                <view class="article-body">
                    <ArticleContentRenderer v-if="article.content" :markdown-text="article.content" />
                    <view v-else class="content-loading">加载内容中...</view>
                </view>
            </view>

            <u-empty v-else mode="news" text="没有找到对应文章"></u-empty>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppNavbar from '@/components/common/AppNavbar.vue'
import { getArticleDetail } from '@/services/articleService'
import { formatDate } from '@/utils/common/formatHelper'
import ArticleContentRenderer from '@/modules/articles/ui/ArticleContentRenderer.vue'
import type { ArticleWithContent } from '@/modules/articles/domain/types'

const loading = ref(true)
const article = ref<ArticleWithContent | null>(null)

const fetchArticle = async (id: string) => {
    loading.value = true
    try {
        // ✅ 触发懒加载 Content
        article.value = await getArticleDetail(id)
        console.log('[ArticleDetail] Content loaded:', {
            id,
            hasContent: !!article.value?.content,
            contentLength: article.value?.content?.length || 0
        })
    } catch (error) {
        console.error('Failed to load article', error)
        article.value = null
        uni.showToast({
            title: '加载文章失败',
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

const resolveCategoryLabel = (category?: string) => {
    switch (category) {
        case 'education':
            return '科普'
        case 'recipe':
            return '狗饭'
        case 'mythbust':
            return '辟谣'
        default:
            return '资讯'
    }
}
</script>

<style lang="scss" scoped>
.article-detail-page {
    min-height: 100vh;
    background-color: #fff;
    padding-bottom: 40rpx;
}

.content-wrapper {
    padding-bottom: 40rpx;
}

.cover-image {
    width: 100%;
    height: 420rpx;
}

.article-header {
    padding: 32rpx;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.category-tag {
    align-self: flex-start;
    padding: 4rpx 16rpx;
    border-radius: 999rpx;
    background-color: #e0f2ff;
    color: #0f6ae0;
    font-size: 24rpx;
}

.title {
    font-size: 40rpx;
    font-weight: 700;
    color: #111827;
    line-height: 1.4;
}

.meta {
    display: flex;
    gap: 16rpx;
    font-size: 24rpx;
    color: #6b7280;
}

.summary {
    font-size: 28rpx;
    color: #4b5563;
    line-height: 1.6;
}

.article-body {
    padding: 0 32rpx;
    font-size: 30rpx;
    line-height: 1.8;
    color: #374151;
}
</style>
