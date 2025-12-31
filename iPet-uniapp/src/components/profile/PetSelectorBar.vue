<template>
    <view v-if="showSelector" class="compact-pet-selector">
        <scroll-view class="scroll-container" :scroll-x="true" :scroll-into-view="scrollIntoViewId"
            :show-scrollbar="false" scroll-with-animation>
            <view class="scroll-content-wrapper">
                <template v-if="pets.length === 0">
                    <view :class="['scroll-item', scrollItemClass, 'empty-card']">
                        <view class="icon-wrapper" :class="themeStyles.iconWrapperClass">
                            <text class="iconfont" :style="{ fontSize: '24px', color: themeStyles.iconColor }">
                                {{ ICONFONT_UNICODE.petDefault }}
                            </text>
                        </view>
                        <view class="text-content">
                            <text class="empty-title" :class="themeStyles.textClass">还没有宠物</text>
                            <text class="empty-subtitle" :class="themeStyles.subTextClass">添加第一只毛孩子吧</text>
                        </view>
                        <view class="add-btn" :class="themeStyles.btnClass" @click="handleAdd">
                            <u-icon name="plus" size="16" :color="themeStyles.btnIconColor"></u-icon>
                            <text class="add-btn-text" :class="themeStyles.btnTextClass">添加</text>
                        </view>
                    </view>
                </template>
                <template v-else>
                    <view v-for="pet in pets" :key="pet.id" :id="`pet-${pet.id}`"
                        :class="['scroll-item', scrollItemClass, 'pet-card', { 'pet-card-selected': isSelected(pet.id) }]"
                        @click="handlePetClick(pet.id)">

                        <view class="avatar-wrapper">
                            <view :class="['avatar-ring', themeStyles.avatarRingClass]">
                                <image v-if="pet.avatar" :src="getAvatar(pet.avatar)" class="avatar-image"
                                    mode="aspectFill" lazy-load="true" />
                                <view v-else class="avatar-placeholder">
                                    <text class="iconfont" style="font-size: 24px; color: #9ca3af;">
                                        {{ ICONFONT_UNICODE.petDefault }}
                                    </text>
                                </view>
                            </view>
                        </view>
                        <view class="info-section">
                            <view class="name-row">
                                <text :class="['pet-name', themeStyles.textClass]">
                                    {{ pet.name }}
                                </text>
                            </view>
                            <view class="tags-row">
                                <text :class="['tag', 'breed-tag', themeStyles.breedTagClass]">
                                    {{ pet.breed || '未知品种' }}
                                </text>
                                <text :class="['tag', 'age-tag', themeStyles.ageTagClass]">
                                    {{ formatAge(pet.birthTimestamp ?? pet.birthday ?? undefined) }}
                                </text>
                            </view>
                        </view>
                    </view>
                    <view :class="['scroll-item', scrollItemClass, 'add-button', themeStyles.addButtonClass]"
                        @click="handleAdd">
                        <u-icon name="plus" size="24" :color="themeStyles.addButtonIconColor"></u-icon>
                        <text class="add-text" :class="themeStyles.subTextClass">添加</text>
                    </view>
                </template>
            </view>
        </scroll-view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { formatPetAge } from '@/utils/common/formatHelper'
import { useImageCacheStore } from '@/stores/imageCacheStore'
import type { Pet } from '@/types/pet'
import { ICONFONT_UNICODE } from '@/utils/ui/iconfont'

type SelectorMode = 'edit' | 'select'

const props = withDefaults(defineProps<{
    pets: Pet[];
    mode?: SelectorMode;
}>(), {
    pets: () => [],
    mode: 'edit'
})

const emit = defineEmits<{
    click: [petId: string];
    add: [];
}>()

const imageCache = useImageCacheStore()

const selectedId = ref('')
const scrollIntoViewId = ref('')

// Helper 函数供 template 调用，解析宠物头像路径
const getAvatar = (remoteUrl?: string | null): string => {
    return imageCache.resolve(remoteUrl)
}

// Theme classes
const themeStyles = {
    iconWrapperClass: 'bg-orange-50',
    iconColor: '#fdba74',
    btnClass: 'btn-light',
    btnTextClass: 'text-white',
    btnIconColor: '#ffffff',
    avatarRingClass: 'ring-light',
    breedTagClass: 'tag-breed-light',
    ageTagClass: 'tag-age-light',
    addButtonClass: 'add-btn-light', 
    addButtonIconColor: '#9ca3af',
    textClass: 'text-gray-900',
    subTextClass: 'text-gray-400'
}

// Helper: check if pet is selected
const isSelected = (petId: string): boolean => {
    return props.mode === 'select' && selectedId.value === petId
}

const initSelection = () => {
    if (props.mode === 'select' && props.pets.length > 0) {
        if (!selectedId.value || !props.pets.find(p => p.id === selectedId.value)) {
            selectedId.value = props.pets[0].id
        }
        if (selectedId.value !== props.pets[0].id) {
            scrollIntoViewId.value = `pet-${selectedId.value}`
        } else {
            scrollIntoViewId.value = ''
        }
    } else {
        scrollIntoViewId.value = ''
    }
}

onMounted(() => {
    initSelection()
})

watch(() => props.pets, () => {
    initSelection()
}, { deep: true })

const handlePetClick = (petId: string) => {
    if (props.mode === 'select') {
        selectedId.value = petId
        scrollIntoViewId.value = `pet-${petId}`
    }
    emit('click', petId)
}

const handleAdd = () => {
    emit('add')
}

const formatAge = (birthTimestamp?: number | string): string => {
    return formatPetAge(birthTimestamp)
}

// Stable scroll item class (removed random suffix for SSR compatibility)
const scrollItemClass = 'scroll-item-styled'
const showSelector = computed(() => true)
</script>

<style lang="scss" scoped>
.compact-pet-selector {
    width: 100%;
    border-radius: 24rpx;
    overflow: visible;
}

.scroll-container {
    width: 100%;
    white-space: nowrap;
    font-size: 0;

    &::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
        background: transparent;
    }

    -ms-overflow-style: none;
    scrollbar-width: none;
}

.scroll-item {
    display: inline-flex;
    vertical-align: middle;
    white-space: normal;
}

.scroll-item:last-child {
    margin-right: 0;
}

.pet-card {
    position: relative;
    padding: 24rpx;
    border-radius: 32rpx;
    transition: all 0.2s ease;
    border: 4rpx solid transparent;
    align-items: center;
    gap: 24rpx;
    flex-shrink: 0;
    background: white;
}

.pet-card:active {
    opacity: 0.8;
}

.pet-card-selected {
    background: #1f2937 !important;
    border-color: #fb923c !important;

    // Cascade selectors for selected state
    .pet-name {
        color: white !important;
    }

    .breed-tag {
        background: rgba(255, 255, 255, 0.2) !important;
        color: #fed7aa !important;
    }

    .age-tag {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #9ca3af !important;
    }

    .avatar-ring {
        background: linear-gradient(to top right, #fb923c, #fbbf24) !important;
    }
}

.avatar-wrapper {
    flex-shrink: 0;
}

.avatar-ring {
    width: 76rpx;
    height: 76rpx;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f3f4f6;
}


.avatar-image {
    width: 68rpx;
    height: 68rpx;
    border-radius: 50%;
    border: 4rpx solid white;
    display: block;
    box-sizing: border-box;
}

.avatar-placeholder {
    width: 68rpx;
    height: 68rpx;
    border-radius: 50%;
    background-color: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4rpx solid white;
    box-sizing: border-box;
}

.info-section {
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.name-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.pet-name {
    font-size: 26rpx;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200rpx;
}



.tags-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-top: 8rpx;
    transform: translate(-12rpx);
}

.tag {
    font-size: 16rpx;
    padding: 4rpx 12rpx;
    border-radius: 12rpx;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.breed-tag {
    max-width: 160rpx;
}

.tag-breed-light {
    background: #fff7ed;
    color: #ea580c;
}

.tag-age-light {
    background: #f3f4f6;
    color: #6b7280;
}


.add-button {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 128rpx;
    height: 130rpx;
    border-radius: 32rpx;
    border: 4rpx dashed #d1d5db;
    gap: 8rpx;
    transition: all 0.2s ease;
    background: transparent;
    flex-shrink: 0;

    &:active {
        border-color: #fdba74;
        background: #fff7ed;
    }
}

.add-text {
    font-size: 16rpx;
    font-weight: 500;
}

.empty-card {
    min-width: 100%;
    height: 150rpx;
    border-radius: 32rpx;
    padding: 0 48rpx;
    align-items: center;
    gap: 32rpx;
    box-sizing: border-box;
    flex-shrink: 0;
    background: white;
}

.icon-wrapper {
    flex-shrink: 0;
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.bg-orange-50 {
    background-color: #fff7ed;
}

.bg-orange-900-20 {
    background-color: rgba(124, 45, 18, 0.2);
}

.text-content {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.empty-title {
    font-size: 26rpx;
    font-weight: 700;
}

.empty-subtitle {
    font-size: 20rpx;
    margin-top: 4rpx;
}

.add-btn {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
    padding: 16rpx 32rpx;
    border-radius: 16rpx;
    font-weight: 700;
    font-size: 20rpx;
    box-shadow: 0 8rpx 12rpx -2rpx rgba(249, 115, 22, 0.1);
    transition: all 0.2s ease;
    background-color: #111827;
    color: white;
}

.add-btn:active {
    transform: scale(0.95);
}

.text-white {
    color: white;
}

.text-gray-900 {
    color: #1f2937;
}

.text-gray-400 {
    color: #9ca3af;
}

.scroll-content-wrapper {
    display: inline-flex;
    min-width: 100%;
    padding: 0 32rpx;
    gap: 20rpx;
    box-sizing: border-box;
}
</style>
