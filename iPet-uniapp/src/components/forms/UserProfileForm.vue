<template>
    <view class="user-profile-form">
        <!-- 头像区域 -->
        <AvatarUploader v-model="modelValue.avatar" placeholderIcon="account" />

        <!-- 基础表单 -->
        <view class="section">
            <view class="form-card">
                <!-- 昵称 -->
                <view class="form-item">
                    <text class="form-label">昵称 <text class="required">*</text></text>
                    <view class="input-wrapper-box" :class="{ 'error-border': nicknameError }">
                        <input :value="modelValue.nickname" class="form-input" placeholder="请输入昵称"
                            @input="updateNickname" />
                    </view>
                    <text v-if="nicknameError" class="error-text">{{ nicknameError }}</text>
                </view>

                <!-- 性别 (Added for Onboarding consistency) -->
                <view class="form-item">
                    <text class="form-label">性别</text>
                    <view class="picker-view" @click="showGenderPopup = true">
                        <text :class="modelValue.gender ? 'picker-text' : 'picker-placeholder'">
                            {{ modelValue.gender || '选择性别' }}
                        </text>
                        <u-icon name="arrow-down" size="16" color="#9ca3af"></u-icon>
                    </view>
                    <text class="gender-hint">就是一种彩蛋，不必在意</text>
                </view>

                <!-- 个性签名 -->
                <view class="form-item">
                    <text class="form-label">个性签名</text>
                    <view class="input-wrapper-box">
                        <textarea :value="modelValue.bio" class="form-textarea" placeholder="介绍一下你自己..."
                            :maxlength="100" auto-height @input="updateBio" />
                    </view>
                </view>

                <!-- MBTI -->
                <view class="form-item">
                    <text class="form-label">MBTI 人格</text>
                    <view class="picker-view" @click="showMbtiPopup = true">
                        <text :class="modelValue.mbti ? 'picker-text' : 'picker-placeholder'">
                            {{ modelValue.mbti || '选择你的类型' }}
                        </text>
                        <u-icon name="arrow-down" size="16" color="#9ca3af"></u-icon>
                    </view>
                </view>
            </view>
        </view>

        <!-- 兴趣标签 -->
        <view class="section">
            <view class="tags-card">
                <view class="tags-header">
                    <text class="form-label">兴趣标签</text>
                    <text class="tags-count">{{ (modelValue.tags || []).length }}/5</text>
                </view>
                <view class="tags-grid">
                    <view v-for="tag in interestTags" :key="tag" class="tag-item"
                        :class="{ 'tag-selected': (modelValue.tags || []).includes(tag) }" @click="toggleTag(tag)">
                        {{ tag }}
                    </view>
                </view>
            </view>
        </view>
    </view>

    <!-- Gender Popup -->
    <u-popup :show="showGenderPopup" @close="showGenderPopup = false" mode="bottom" :round="24">
        <view class="popup-container">
            <view class="popup-header">
                <text class="popup-title">选择性别</text>
                <view class="close-btn" @click="showGenderPopup = false">
                    <u-icon name="close" size="20" color="#9ca3af"></u-icon>
                </view>
            </view>
            <view class="search-box">
                <u-search placeholder="搜索性别" v-model="genderSearchQuery" :show-action="false" shape="round"
                    bg-color="#f3f4f6"></u-search>
            </view>
            <scroll-view scroll-y class="list-scroll">
                <view v-for="(item, index) in filteredGenders" :key="index" class="list-item"
                    @click="selectGender(item)">
                    <text class="list-text" :class="{ 'selected-text': modelValue.gender === item }">{{ item
                    }}</text>
                    <u-icon v-if="modelValue.gender === item" name="checkmark" size="18" color="#f97316"></u-icon>
                </view>
                <view v-if="filteredGenders.length === 0" class="empty-result">
                    <text>未找到相关结果</text>
                </view>
            </scroll-view>
        </view>
    </u-popup>

    <!-- MBTI Popup -->
    <u-popup :show="showMbtiPopup" @close="showMbtiPopup = false" mode="bottom" :round="24">
        <view class="popup-container">
            <view class="popup-header">
                <text class="popup-title">选择 MBTI</text>
                <view class="close-btn" @click="showMbtiPopup = false">
                    <u-icon name="close" size="20" color="#9ca3af"></u-icon>
                </view>
            </view>
            <view class="search-box">
                <u-search placeholder="搜索 MBTI" v-model="mbtiSearchQuery" :show-action="false" shape="round"
                    bg-color="#f3f4f6"></u-search>
            </view>
            <scroll-view scroll-y class="list-scroll">
                <view v-for="(item, index) in filteredMbtis" :key="index" class="list-item" @click="selectMbti(item)">
                    <text class="list-text" :class="{ 'selected-text': modelValue.mbti === item }">{{ item
                    }}</text>
                    <u-icon v-if="modelValue.mbti === item" name="checkmark" size="18" color="#f97316"></u-icon>
                </view>
                <view v-if="filteredMbtis.length === 0" class="empty-result">
                    <text>未找到相关结果</text>
                </view>
            </scroll-view>
        </view>
    </u-popup>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PinyinMatch from 'pinyin-match'
import AvatarUploader from './AvatarUploader.vue'
import { containsSensitiveWord } from '@/config/sensitiveWords'

// 定义 Props 类型
interface UserProfile {
    avatar: string | null;
    nickname: string;
    gender?: string; // Optional as backend might not have it yet
    bio: string;
    mbti: string;
    tags: string[];
}

const props = defineProps<{
    modelValue: UserProfile
}>()

const emit = defineEmits(['update:modelValue'])

// Constants
// Gender (Updated to use extensive list)
import { GENDER_OPTIONS } from '@/config/genderOptions'

const mbtiTypes = [
    "INTJ", "INTP", "ENTJ", "ENTP",
    "INFJ", "INFP", "ENFJ", "ENFP",
    "ISTJ", "ISFJ", "ESTJ", "ESFJ",
    "ISTP", "ISFP", "ESTP", "ESFP"
]

const interestTags = [
    "科技控", "二次元", "健身达人", "铲屎官",
    "摄影", "美食家", "旅行", "编程",
    "阅读", "电影", "音乐", "滑板",
    "户外", "露营", "飞盘", "徒步", "宅家", "游戏" // Merged from onboarding
]


// State
const nicknameError = ref('')

// Popup States
const showGenderPopup = ref(false)
const genderSearchQuery = ref('')
const showMbtiPopup = ref(false)
const mbtiSearchQuery = ref('')


// Validation
const validateNickname = (val: string) => {
    if (!val.trim()) return "昵称不能为空"
    if (val.length > 12) return "昵称不能超过12个字符"
    if (containsSensitiveWord(val)) return "包含敏感词,请重新输入"
    return ""
}

// Update Methods
const updateNickname = (e: any) => {
    const val = e.detail.value
    nicknameError.value = validateNickname(val)
    emit('update:modelValue', { ...props.modelValue, nickname: val })
}

// Gender Logic
const filteredGenders = computed(() => {
    if (!genderSearchQuery.value) return GENDER_OPTIONS
    return GENDER_OPTIONS.filter(g => PinyinMatch.match(g, genderSearchQuery.value))
})

const selectGender = (val: string) => {
    emit('update:modelValue', { ...props.modelValue, gender: val })
    showGenderPopup.value = false
    genderSearchQuery.value = ''
}

// MBTI Logic
const filteredMbtis = computed(() => {
    if (!mbtiSearchQuery.value) return mbtiTypes
    return mbtiTypes.filter(m => PinyinMatch.match(m, mbtiSearchQuery.value))
})

const selectMbti = (val: string) => {
    emit('update:modelValue', { ...props.modelValue, mbti: val })
    showMbtiPopup.value = false
    mbtiSearchQuery.value = ''
}

const updateBio = (e: any) => {
    emit('update:modelValue', { ...props.modelValue, bio: e.detail.value })
}



const toggleTag = (tag: string) => {
    const tags = [...(props.modelValue.tags || [])]
    const index = tags.indexOf(tag)

    if (index > -1) {
        tags.splice(index, 1)
    } else {
        if (tags.length >= 5) {
            uni.showToast({
                title: '最多选择5个标签',
                icon: 'none'
            })
            return
        }
        tags.push(tag)
    }
    emit('update:modelValue', { ...props.modelValue, tags })
}

// Expose validation for parent
defineExpose({
    validate: () => {
        const error = validateNickname(props.modelValue.nickname)
        nicknameError.value = error
        return !error
    }
})
</script>

<style lang="scss" scoped>
.user-profile-form {
    display: flex;
    flex-direction: column;
    gap: 30rpx;
}

/* Avatar Styles Handled by Component */

/* Sections */
.section {
    border-radius: 30rpx;
    background: #fff;
}


.form-card,
.tags-card {
    background: white;
    border-radius: 24rpx;
    overflow: hidden;
}

.form-item {
    padding: 32rpx;
    border-bottom: 1px solid #f3f4f6;
}

.form-item:last-child {
    border-bottom: none;
}

.form-label {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #374151;
    margin-bottom: 16rpx;

    .required {
        color: #ef4444;
        margin-left: 4rpx;
    }
}

.form-input {
    width: 100%;
    font-size: 28rpx;
    color: #1f2937;
    background: transparent;
}

.input-wrapper-box {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 16rpx;
    padding: 24rpx;
}

.error-border {
    border-color: #ef4444;
}

.input-error {
    color: #ef4444;
}

.error-text {
    display: block;
    font-size: 20rpx;
    color: #ef4444;
    margin-top: 8rpx;
}

.form-textarea {
    width: 100%;
    font-size: 28rpx;
    color: #6b7280;
    background: transparent;
    padding: 0;
}

/* Gender Options - Removed */

/* Picker */
.picker-view {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 32rpx;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 16rpx;
}

.picker-text {
    font-size: 28rpx;
    color: #374151;
}

.picker-placeholder {
    font-size: 28rpx;
    color: #9ca3af;
}

.gender-hint {
    font-size: 22rpx;
    color: #9ca3af;
    margin-top: 12rpx;
    display: block;
}

/* Tags */
.tags-card {
    padding: 32rpx;
}

.tags-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;
}

.tags-count {
    font-size: 20rpx;
    color: #9ca3af;
}

.tags-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.tag-item {
    padding: 12rpx 24rpx;
    border-radius: 48rpx;
    font-size: 24rpx;
    background: #f3f4f6;
    color: #6b7280;
    transition: all 0.2s;
}

.tag-selected {
    background: #dbeafe;
    color: #2563eb;
    font-weight: 600;
}

/* Popup Styles */
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
