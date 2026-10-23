<template>
    <view class="select-pet-page">
        <!-- Header -->
        <view class="page-header">
            <text class="header-title">选择宠物</text>
            <text class="header-subtitle">为哪只宠物生成防走失狗牌？</text>
        </view>

        <!-- Pet List -->
        <view class="pet-list" v-if="activePets.length > 0">
            <view class="pet-card" v-for="pet in activePets" :key="pet.id" @click="handleSelectPet(pet)">
                <view class="pet-avatar-wrapper">
                    <image class="pet-avatar" :src="pet.avatar || defaultAvatar" mode="aspectFill" />
                    <view class="pet-type-badge" :class="pet.type">
                        {{ petTypeLabel(pet.type) }}
                    </view>
                </view>
                <view class="pet-info">
                    <text class="pet-name">{{ pet.name }}</text>
                    <text class="pet-breed" v-if="pet.breed">{{ pet.breed }}</text>
                    <view class="pet-tags">
                        <view class="tag" v-if="getTagCount(pet.id) > 0">
                            <text class="iconfont tag-icon">&#xe6a9;</text>
                            <text class="tag-text">{{ getTagCount(pet.id) }}张狗牌</text>
                        </view>
                        <view class="tag new" v-else>
                            <text class="tag-text">暂无狗牌</text>
                        </view>
                    </view>
                </view>
                <view class="pet-action">
                    <text class="iconfont action-icon">&#xe619;</text>
                </view>
            </view>
        </view>

        <!-- Empty State -->
        <view class="empty-state" v-else>
            <view class="empty-icon">
                <text class="iconfont">&#xe6b3;</text>
            </view>
            <text class="empty-title">暂无宠物</text>
            <text class="empty-desc">请先添加您的宠物信息</text>
            <u-button type="primary" shape="circle" text="添加宠物" @click="goAddPet" class="empty-btn" />
        </view>

        <!-- Add Pet Entry -->
        <view class="add-pet-entry" v-if="activePets.length > 0" @click="goAddPet">
            <view class="add-icon-wrapper">
                <text class="iconfont add-icon">&#xe608;</text>
            </view>
            <text class="add-text">添加新宠物</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { usePetStore } from '@/stores/petStore'
import { useDogTagStore } from '@/stores/dogtagStore'
import { storeToRefs } from 'pinia'
import type { Pet } from '@/types/pet'

// ============================================================================
// Store Setup
// ============================================================================

const petStore = usePetStore()
const dogtagStore = useDogTagStore()

const { activePets } = storeToRefs(petStore)
const { dogTags } = storeToRefs(dogtagStore)

// ============================================================================
// Constants
// ============================================================================

const defaultAvatar = '/static/images/default-pet.png'

// ============================================================================
// Helper Functions
// ============================================================================

const petTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
        dog: '🐕',
        cat: '🐱',
        other: '🐾'
    }
    return labels[type] || '🐾'
}

const getTagCount = (petId: string) => {
    return dogTags.value.filter(tag => tag.petId === petId).length
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(async () => {
    await petStore.fetchPets()
    await dogtagStore.fetchDogTags()
})

onShow(async () => {
    await petStore.fetchPets()
    await dogtagStore.fetchDogTags()
})

// ============================================================================
// Event Handlers
// ============================================================================

const handleSelectPet = (pet: Pet) => {
    // 检查该宠物是否已有狗牌
    const existingTags = getTagCount(pet.id)

    if (existingTags > 0) {
        // 已有狗牌，询问是新建还是查看
        uni.showActionSheet({
            itemList: ['创建新狗牌', '查看现有狗牌'],
            success: (res) => {
                if (res.tapIndex === 0) {
                    createTagForPet(pet)
                } else {
                    goToTagList(pet.id)
                }
            }
        })
    } else {
        // 无狗牌，直接创建
        createTagForPet(pet)
    }
}

const createTagForPet = async (pet: Pet) => {
    uni.showLoading({ title: '生成中...' })
    try {
        const newTag = await dogtagStore.createDogTag({
            petId: pet.id,
            name: `${pet.name}的狗牌 #${getTagCount(pet.id) + 1}`
        })
        uni.hideLoading()
        if (newTag) {
            uni.navigateTo({
                url: `/pages/finddog/tag-detail?id=${newTag.id}`
            })
        }
    } catch (error) {
        uni.hideLoading()
        uni.showToast({
            title: '生成失败，请重试',
            icon: 'none'
        })
    }
}

const goToTagList = (petId: string) => {
    uni.navigateTo({
        url: `/pages/finddog/tags?petId=${petId}`
    })
}

const goAddPet = () => {
    uni.navigateTo({
        url: '/pages/my/pet/add'
    })
}
</script>

<style lang="scss">
page {
    background-color: $app-background;
}
</style>

<style lang="scss" scoped>
.select-pet-page {
    min-height: 100vh;
    padding: 32rpx;
    padding-bottom: 120rpx;
}

// Page Header
.page-header {
    margin-bottom: 32rpx;
}

.header-title {
    @include text-title-2;
    color: $app-text-primary;
    display: block;
    margin-bottom: 8rpx;
}

.header-subtitle {
    @include text-body;
    color: $app-text-muted;
}

// Pet List
.pet-list {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
}

.pet-card {
    display: flex;
    align-items: center;
    padding: 24rpx;
    background: $app-card-bg;
    border-radius: 24rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    transition: transform 0.2s ease;

    &:active {
        transform: scale(0.98);
    }
}

.pet-avatar-wrapper {
    position: relative;
    margin-right: 20rpx;
}

.pet-avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    background-color: #f3f4f6;
}

.pet-type-badge {
    position: absolute;
    bottom: -4rpx;
    right: -4rpx;
    width: 36rpx;
    height: 36rpx;
    border-radius: 50%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.pet-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.pet-name {
    @include text-headline;
    color: $app-text-primary;
    margin-bottom: 4rpx;
}

.pet-breed {
    @include text-subhead;
    color: $app-text-muted;
    margin-bottom: 8rpx;
}

.pet-tags {
    display: flex;
    gap: 12rpx;
}

.tag {
    display: flex;
    align-items: center;
    padding: 4rpx 12rpx;
    background: #e0f2fe;
    border-radius: 8rpx;

    &.new {
        background: #fef3c7;
    }
}

.tag-icon {
    font-size: 20rpx;
    color: #0284c7;
    margin-right: 4rpx;
}

.tag-text {
    @include text-caption-1;
    color: #0284c7;

    .new & {
        color: #d97706;
    }
}

.pet-action {
    padding: 12rpx;
}

.action-icon {
    font-size: 32rpx;
    color: $app-text-muted;
}

// Empty State
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80rpx 32rpx;
}

.empty-icon {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;

    .iconfont {
        font-size: 80rpx;
        color: #9ca3af;
    }
}

.empty-title {
    @include text-headline;
    color: $app-text-primary;
    margin-bottom: 8rpx;
}

.empty-desc {
    @include text-body;
    color: $app-text-muted;
    margin-bottom: 32rpx;
}

.empty-btn {
    width: 240rpx;
}

// Add Pet Entry
.add-pet-entry {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32rpx;
    margin-top: 20rpx;
    background: $app-card-bg;
    border-radius: 24rpx;
    border: 2rpx dashed #d1d5db;
    transition: border-color 0.2s ease;

    &:active {
        border-color: #3b82f6;
    }
}

.add-icon-wrapper {
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    background: #e0f2fe;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16rpx;
}

.add-icon {
    font-size: 28rpx;
    color: #0284c7;
}

.add-text {
    @include text-body;
    color: #0284c7;
}
</style>
