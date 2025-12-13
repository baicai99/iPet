<template>
    <view class="section-card articles-section" v-if="articles.length > 0">
        <view class="section-header">
            <text class="section-title">相关科普</text>
        </view>
        <view class="articles-list">
            <ArticleCard v-for="(article, index) in articles" :key="article.id" :id="article.id" :title="article.title"
                :summary="article.summary" :cover="article.cover" :category="article.category" :isNew="index === 0"
                :updateTime="article.updateTime" />
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useArticleStore } from '@/stores/articleStore'
import ArticleCard from '@/components/business/social/ArticleCard.vue'
import type { Article } from '@/types/article'

interface Props {
    /** 当前指标键 */
    metricKey: string
    /** 关联指标键列表 */
    relatedMetrics?: string[]
}

const props = defineProps<Props>()
const articleStore = useArticleStore()

/**
 * ✅ 推荐文章计算逻辑（带记忆化）
 * 
 * 优化点：
 * 1. 使用 computed 自动缓存结果
 * 2. 只在 metricKey 或 relatedMetrics 变化时重算
 * 3. 避免父组件 re-render 时重复执行
 * 
 * 逻辑：
 * - F-04 强制置顶：优先展示 article.id === metricKey 的文章
 * - F-05 模糊匹配：按 tags 交集匹配度排序
 */
const articles = computed<Article[]>(() => {
    const allArticles = articleStore.articles
    if (!allArticles?.length || !props.metricKey) {
        return []
    }

    // F-04: 强制置顶 - 查找 ID 与 metricKey 匹配的文章
    const pinnedArticle = allArticles.find(a => a.id === props.metricKey)

    // F-05: 模糊匹配 - 按 tags 交集排序
    const relatedArticles = allArticles
        .filter(a => a.id !== props.metricKey) // 排除置顶文章
        .map(article => ({
            article,
            matchCount: (article.tags || []).filter(tag =>
                tag === props.metricKey || (props.relatedMetrics || []).includes(tag)
            ).length
        }))
        .filter(item => item.matchCount > 0)
        .sort((a, b) => b.matchCount - a.matchCount)
        .slice(0, 2) // 取前2篇相关文章
        .map(item => item.article)

    // 组合结果：置顶 + 相关
    return pinnedArticle
        ? [pinnedArticle, ...relatedArticles]
        : relatedArticles
})
</script>

<style lang="scss" scoped>
.articles-section {
    background-color: #ffffff;
    border-radius: 24rpx;
    padding: 32rpx;

    .section-header {
        margin-bottom: 24rpx;
    }

    .section-title {
        font-size: 32rpx;
        font-weight: 600;
        color: #1e293b;
    }

    .articles-list {
        display: flex;
        flex-direction: column;
        gap: 24rpx;
    }
}
</style>
