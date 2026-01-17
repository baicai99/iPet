<template>
    <!-- ✅ 使用 Section 结构，与 Summary View 保持一致，避免"卡片嵌套卡片" -->
    <view class="articles-section" v-if="articles.length > 0">
        <view class="section-header">
            <text class="section-title">相关科普</text>
        </view>
        <view class="articles-list">
            <ArticleCard v-for="(article, index) in articles" :key="article.id" :id="article.id" :title="article.title"
                :summary="article.summary" :cover="article.cover" :category="article.category" :isNew="index === 0"
                :updateTime="article.updateTime" :views="article.views" />
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ArticleCard from '@/components/business/social/ArticleCard.vue'
import { useArticleStore } from '@/modules/articles/store/articleStore'
import { recommendByMetric, recommendByTags } from '@/modules/articles/domain/recommendationService'
import type { ArticleManifestItem } from '@/modules/articles/domain/types'

interface Props {
    /** 当前指标键 */
    metricKey: string
    /** 关联指标键列表 */
    relatedMetrics?: string[]
}

const props = defineProps<Props>()
const articleStore = useArticleStore()
articleStore.ensureLoaded().catch(err => console.error('[ArticleRecommendations] Failed to load articles', err))

/**
 * ✅ 推荐文章计算逻辑（带记忆化）
 * 
 * 优化点：
 * 1. 使用 computed 自动缓存结果
 * 2. 只在 metricKey 或 relatedMetrics 变化时重算
 * 3. 避免父组件 re-render 时重复执行
 * 
 * 逻辑：
 * - F-04 类目置顶：优先展示 pinnedMetrics 含当前指标的文章
 * - F-05 模糊匹配：按 tags 交集匹配度排序
 */
const articles = computed<ArticleManifestItem[]>(() => {
    const manifest = articleStore.manifest
    if (!manifest.length || !props.metricKey) return []

    const relatedTags = [props.metricKey, ...(props.relatedMetrics || [])]
    const pinnedArticles = manifest
        .filter(article => article.pinnedMetrics?.includes(props.metricKey))
        .sort((a, b) => (b.sectionPinnedAt || b.updateTime).localeCompare(a.sectionPinnedAt || a.updateTime))
    const pinnedIds = new Set(pinnedArticles.map(article => article.id))
    const metricMatches = recommendByMetric(manifest, props.metricKey, undefined, 2)
        .filter(article => !pinnedIds.has(article.id))
    const tagMatches = recommendByTags(manifest, relatedTags, undefined, 2)
        .filter(article => !pinnedIds.has(article.id) && !metricMatches.some(item => item.id === article.id))
    const combined = [...metricMatches, ...tagMatches]

    return pinnedArticles.length ? [...pinnedArticles, ...combined] : combined
})
</script>

<style lang="scss" scoped>
.articles-section {
    /* ✅ Section 结构：无卡片外观，直接承载文章列表 */
    display: flex;
    flex-direction: column;
    gap: 16rpx;

    .section-header {
        margin-bottom: 8rpx;
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
