<template>
    <view class="page-container">
        <view class="articles-list-page">
            <!-- Tabs -->
            <view class="tabs-container">
                <u-tabs :list="tabList" :current="currentTab" @click="handleTabClick"
                    :activeStyle="{ color: '#3c9cff' }" lineColor="#3c9cff"></u-tabs>
            </view>

            <!-- Content -->
            <u-pull-refresh class="content-refresh" :refreshing="isPullRefreshing" @refresh="handlePullRefresh">
                <view class="content">
                    <!-- Actual Content -->
                    <view class="articles-list">
                        <ArticleCard v-for="article in filteredArticles" :key="article.id" :id="article.id"
                            :title="article.title" :summary="article.summary" :cover="article.cover"
                            :category="article.category" :views="article.views" />
                    </view>
                    <u-empty v-if="!loading && filteredArticles.length === 0" mode="data" text="暂无相关文章"></u-empty>
                </view>
            </u-pull-refresh>
        </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import ArticleCard from '@/components/business/social/ArticleCard.vue'
import { useArticleStore } from '@/modules/articles/store/articleStore'
import { storeToRefs } from 'pinia'
import { onLoad } from '@dcloudio/uni-app'

const articleStore = useArticleStore()
const { manifest, categories } = storeToRefs(articleStore)

const loading = ref(true)
const isPullRefreshing = ref(false)

onLoad(() => {
    loadArticles()
})

const loadArticles = async () => {
    loading.value = true
    try {
        await articleStore.fetchArticles(tabList.value[currentTab.value]?.value || 'all')
    } catch (error) {
        console.error('Failed to load articles', error)
        uni.showToast({
            title: '加载文章失败',
            icon: 'none'
        })
    } finally {
        loading.value = false
    }
}

const currentTab = ref(0)

const tabList = computed(() => {
    const base = [{ name: '全部', value: 'all' }]
    const dynamic = (categories.value || []).map(category => ({
        name: category.label,
        value: category.key
    }))
    return [...base, ...dynamic]
})

const filteredArticles = computed(() => {
    const activeValue = tabList.value[currentTab.value]?.value || 'all'
    const articles = manifest.value || []
    if (activeValue === 'all') {
        return articles
    }
    return articles.filter(article => article.category === activeValue)
})

const handleTabClick = (item) => {
    currentTab.value = item.index
    loadArticles()
}

const handlePullRefresh = async () => {
    isPullRefreshing.value = true
    try {
        await loadArticles()
    } finally {
        isPullRefreshing.value = false
    }
}

</script>

<style scoped>
.articles-list-page {
    height: 100vh;
    background-color: #f8f8f8;
    display: flex;
    flex-direction: column;
}

.tabs-container {
    background-color: #fff;
    border-bottom: 1rpx solid #eee;
}

.content-refresh {
    flex: 1;
    height: 0;
}

.content {
    padding: 24rpx;
}

.articles-list {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}
</style>
