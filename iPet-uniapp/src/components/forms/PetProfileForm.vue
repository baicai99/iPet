<template>
    <view class="pet-profile-form">
        <u-form ref="petFormRef" :model="modelValue" :rules="rules" label-position="top" :label-width="0"
            error-type="toast" :border-bottom="false">
            <view class="form-content">
                <!-- Avatar Section -->
                <AvatarUploader v-model="modelValue.avatar" :showGlow="true" placeholderIcon="camera-fill" />

                <view class="card-section">

                    <!-- Name -->
                    <u-form-item prop="name">
                        <view class="input-group">
                            <text class="label">爱宠名字 <text class="required">*</text></text>
                            <input type="text" :value="modelValue.name"
                                @input="updateField('name', $event.detail.value)" placeholder="例如：旺财、咪咪"
                                class="custom-input" placeholder-class="input-placeholder" />
                        </view>
                    </u-form-item>

                    <!-- Species -->
                    <u-form-item prop="type">
                        <view class="input-group">
                            <text class="label">宠物种类 <text class="required">*</text></text>
                            <view class="species-grid">
                                <view class="species-card" :class="{ 'selected': modelValue.type === 'dog' }"
                                    @click="updateType('dog')">
                                    <image v-if="SPECIES_ASSETS.dog" class="species-image"
                                        :src="SPECIES_ASSETS.dog" mode="aspectFit"></image>
                                    <text class="species-name">狗狗</text>
                                </view>
                                <view class="species-card" :class="{ 'selected': modelValue.type === 'cat' }"
                                    @click="updateType('cat')">
                                    <image v-if="SPECIES_ASSETS.cat" class="species-image"
                                        :src="SPECIES_ASSETS.cat" mode="aspectFit"></image>
                                    <text class="species-name">猫猫</text>
                                </view>
                            </view>
                        </view>
                    </u-form-item>

                    <!-- Breed -->
                    <u-form-item prop="breed">
                        <view class="input-group" @click="openBreedPopup">
                            <text class="label">品种 <text class="required">*</text></text>
                            <view class="custom-select">
                                <text v-if="modelValue.breed" class="select-value">{{ modelValue.breed }}</text>
                                <text v-else class="select-placeholder">请选择品种</text>
                                <u-icon name="arrow-down" size="16" color="#9ca3af"></u-icon>
                            </view>
                        </view>
                    </u-form-item>

                    <!-- Gender -->
                    <view class="input-group">
                        <text class="label">性别 <text class="required">*</text></text>
                        <view class="gender-switch">
                            <view class="gender-option" :class="{ 'active male': modelValue.gender === 'male' }"
                                @click="updateField('gender', 'male')">
                                <text>弟弟 ♂</text>
                            </view>
                            <view class="gender-option" :class="{ 'active female': modelValue.gender === 'female' }"
                                @click="updateField('gender', 'female')">
                                <text>妹妹 ♀</text>
                            </view>
                        </view>
                    </view>

                    <!-- Weight & Birthday -->
                    <view class="row-2-col">
                        <u-form-item prop="weight" class="col-item">
                            <view class="input-group">
                        <text class="label">体重 (kg)</text>
                                <view class="input-wrapper">
                                    <input type="digit" :value="modelValue.weight"
                                        @input="updateField('weight', $event.detail.value)" placeholder="0.0"
                                        class="custom-input" />
                                </view>
                            </view>
                        </u-form-item>

                        <u-form-item prop="birthday" class="col-item">
                            <view class="input-group">
                                <text class="label">生日</text>
                                <view class="custom-input" @click="openBirthdayPicker">
                                    <text v-if="modelValue.birthday">{{ modelValue.birthday }}</text>
                                    <text v-else class="input-placeholder">选择日期</text>
                                </view>
                            </view>
                        </u-form-item>
                    </view>

                    <!-- Height & Arrival Date -->
                    <view class="row-2-col">
                        <u-form-item prop="height" class="col-item">
                            <view class="input-group">
                                <text class="label">肩高 (cm)</text>
                                <input type="number" :value="modelValue.height"
                                    @input="updateField('height', $event.detail.value)" placeholder="选填"
                                    class="custom-input" />
                            </view>
                        </u-form-item>

                        <u-form-item prop="arrivalDate" class="col-item">
                            <view class="input-group">
                                <text class="label">到家日期</text>
                                <view class="custom-input" @click="openArrivalDatePicker">
                                    <text v-if="modelValue.arrivalDate">{{ modelValue.arrivalDate }}</text>
                                    <text v-else class="input-placeholder">选择日期</text>
                                </view>
                            </view>
                        </u-form-item>
                    </view>
                </view>

                <!-- 选填信息 -->
                <view class="card-section">

                    <!-- Chip ID -->
                    <view class="input-group">
                        <view class="label-row">
                            <u-icon name="scan" size="14" color="#6b7280"></u-icon>
                            <text class="label-text">芯片号</text>
                        </view>
                        <input type="text" :value="modelValue.chipId"
                            @input="updateField('chipId', $event.detail.value)" placeholder="请输入芯片号码"
                            class="custom-input" />
                    </view>

                    <!-- Vaccine Date -->
                    <view class="input-group">
                        <view class="label-row">
                            <u-icon name="plus-circle" size="14" color="#6b7280"></u-icon>
                            <text class="label-text">上次疫苗时间</text>
                        </view>
                        <view class="custom-input" @click="openVaccinePicker">
                            <text v-if="modelValue.vaccineDate">{{ modelValue.vaccineDate }}</text>
                            <text v-else class="input-placeholder">选择日期</text>
                        </view>
                    </view>

                    <!-- Personality Tags -->
                    <view class="input-group">
                        <view class="label-row">
                            <u-icon name="tags" size="14" color="#6b7280"></u-icon>
                            <text class="label-text">个性标签</text>
                        </view>
                        <view class="tags-container">
                            <view v-for="tag in PERSONALITY_TAGS" :key="tag" class="tag-item"
                                :class="{ 'active': (modelValue.personality || []).includes(tag) }"
                                @click="togglePersonality(tag)">
                                <text>{{ tag }}</text>
                            </view>
                        </view>
                    </view>

                    <!-- Toys -->
                    <view class="input-group">
                        <view class="label-row">
                            <u-icon name="gift" size="14" color="#6b7280"></u-icon>
                            <text class="label-text">喜欢的玩具</text>
                        </view>
                        <input type="text" :value="modelValue.toys" @input="updateField('toys', $event.detail.value)"
                            placeholder="例如：网球、逗猫棒" class="custom-input" />
                    </view>

                    <!-- Allergens -->
                    <view class="input-group">
                        <view class="label-row">
                            <u-icon name="info-circle" size="14" color="#6b7280"></u-icon>
                            <text class="label-text">过敏原</text>
                        </view>
                        <textarea :value="modelValue.allergens" @input="updateField('allergens', $event.detail.value)"
                            placeholder="例如：鸡肉、特定花粉" class="custom-textarea" auto-height />
                    </view>

                    <!-- Notes / Description -->
                    <view class="input-group">
                        <view class="label-row">
                            <u-icon name="edit-pen" size="14" color="#6b7280"></u-icon>
                            <text class="label-text">备注 / 描述</text>
                        </view>
                        <textarea :value="modelValue.description"
                            @input="updateField('description', $event.detail.value)" placeholder="写点什么..."
                            class="custom-textarea" auto-height />
                    </view>
                </view>
            </view>
        </u-form>

        <!-- Breed Popup -->
        <u-popup :show="showBreedPopup" @close="closeBreedPopup" mode="bottom" :round="24">
            <view class="popup-container">
                <view class="popup-header">
                    <text class="popup-title">选择品种</text>
                    <view class="close-btn" @click="closeBreedPopup">
                        <u-icon name="close" size="20" color="#9ca3af"></u-icon>
                    </view>
                </view>
                <view class="search-box">
                    <u-search placeholder="搜索品种" v-model="searchQuery" :show-action="false" shape="round"
                        bg-color="#f3f4f6"></u-search>
                </view>
                <scroll-view scroll-y class="breed-list">
                    <view v-for="(breed, index) in filteredBreeds" :key="index" class="breed-item"
                        @click="selectBreed(breed)">
                        <text class="breed-name" :class="{ 'selected-breed': modelValue.breed === breed }">{{ breed
                            }}</text>
                        <u-icon v-if="modelValue.breed === breed" name="checkmark" size="18" color="#f97316"></u-icon>
                    </view>
                    <view v-if="filteredBreeds.length === 0" class="empty-result">
                        <text>未找到相关品种</text>
                    </view>
                </scroll-view>
            </view>
        </u-popup>

        <!-- Date Pickers -->
        <u-datetime-picker :show="showBirthdayPicker" v-model="birthdayValue" mode="date" :maxDate="maxDate"
            @confirm="confirmBirthday" @cancel="showBirthdayPicker = false"></u-datetime-picker>

        <u-datetime-picker :show="showVaccinePicker" v-model="vaccineValue" mode="date" :maxDate="maxDate"
            @confirm="confirmVaccine" @cancel="showVaccinePicker = false"></u-datetime-picker>

        <u-datetime-picker :key="arrivalPickerKey" :show="showArrivalPicker" v-model="arrivalValue" mode="date"
            :maxDate="maxDate" @confirm="confirmArrivalDate" @cancel="showArrivalPicker = false"></u-datetime-picker>
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { DOG_BREEDS, CAT_BREEDS, OTHER_BREEDS } from '@/config/petBreeds'
import PinyinMatch from 'pinyin-match'
import AvatarUploader from './AvatarUploader.vue'
import { getLocalDayKey } from '@/utils/common/timeKey'
interface PetProfile {
    avatar: string;
    name: string;
    type: 'dog' | 'cat' | 'other';
    breed: string;
    gender: 'male' | 'female';
    weight: string;
    height?: string; // Optional
    birthday: string;
    arrivalDate: string;  // ✅ Date pet arrived home
    chipId: string;
    vaccineDate: string;
    personality: string[];
    toys: string;
    allergens: string;
    description: string;
}

const props = defineProps<{
    modelValue: PetProfile
}>()

const emit = defineEmits(['update:modelValue'])

const petFormRef = ref<any>(null)
const PERSONALITY_TAGS = ['粘人', '高冷', '贪吃', '活泼', '胆小', '护主', '温顺', '拆家']
const SPECIES_ASSETS = {
    dog: '/static/images/onboarding/bianmu.webp',
    cat: '/static/images/onboarding/xianluomao.webp'
}
const maxDate = Number(new Date())

// State
const showBreedPopup = ref(false)
const searchQuery = ref('')
const showBirthdayPicker = ref(false)
const birthdayValue = ref(Number(new Date()))
const showVaccinePicker = ref(false)
const vaccineValue = ref(Number(new Date()))
const showArrivalPicker = ref(false)
const arrivalValue = ref(Number(new Date()))

/**
 * ✅ FIX: Dynamic key to force picker rebuild
 * Prevents state pollution when birthday changes
 */
const arrivalPickerKey = computed(() => `arrival-picker-${props.modelValue.birthday || 'empty'}`)

// Validation Rules
const rules = {
    name: [{ required: true, message: '请输入宠物名字', trigger: ['blur', 'change'] }],
    type: [{ required: true, message: '请选择宠物种类', trigger: ['change'] }],
    breed: [{ required: true, message: '请选择品种', trigger: ['change'] }],
    arrivalDate: [
        {
            validator: (rule: any, value: any, callback: any) => {
                if (!value) return callback()  // Optional field

                const birthday = props.modelValue.birthday
                if (birthday && value < birthday) {
                    return callback(new Error('到家日期不能早于出生日期'))
                }

                const today = getLocalDayKey(Date.now())
                if (value > today) {
                    return callback(new Error('到家日期不能是未来时间'))
                }

                callback()
            },
            trigger: ['change']
        }
    ]
}

// Logic
const updateField = (field: keyof PetProfile, value: any) => {
    emit('update:modelValue', { ...props.modelValue, [field]: value })
}

const updateType = (type: string) => {
    if (props.modelValue.type !== type) {
        emit('update:modelValue', { ...props.modelValue, type, breed: '' })
    }
}


// Breeds
const filteredBreeds = computed(() => {
    let breeds = []
    if (props.modelValue.type === 'dog') breeds = DOG_BREEDS
    else if (props.modelValue.type === 'cat') breeds = CAT_BREEDS
    else breeds = OTHER_BREEDS

    if (!searchQuery.value) return breeds
    return breeds.filter(breed => PinyinMatch.match(breed, searchQuery.value))
})

const openBreedPopup = () => { showBreedPopup.value = true }
const closeBreedPopup = () => { showBreedPopup.value = false; searchQuery.value = '' }

const selectBreed = (breed: string) => {
    updateField('breed', breed)
    closeBreedPopup()
}

// Dates
const openBirthdayPicker = () => {
    birthdayValue.value = props.modelValue.birthday ? Number(new Date(props.modelValue.birthday)) : Number(new Date())
    showBirthdayPicker.value = true
}

const confirmBirthday = (e: any) => {
    const date = new Date(e.value)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    updateField('birthday', `${y}-${m}-${d}`)
    showBirthdayPicker.value = false
}

const openVaccinePicker = () => {
    vaccineValue.value = props.modelValue.vaccineDate ? Number(new Date(props.modelValue.vaccineDate)) : Number(new Date())
    showVaccinePicker.value = true
}

const confirmVaccine = (e: any) => {
    const date = new Date(e.value)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    updateField('vaccineDate', `${y}-${m}-${d}`)
    showVaccinePicker.value = false
}

const openArrivalDatePicker = () => {
    arrivalValue.value = props.modelValue.arrivalDate ? Number(new Date(props.modelValue.arrivalDate)) : Number(new Date())
    showArrivalPicker.value = true
}

const confirmArrivalDate = (e: any) => {
    const date = new Date(e.value)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    updateField('arrivalDate', `${y}-${m}-${d}`)
    showArrivalPicker.value = false
}

// Tags
const togglePersonality = (tag: string) => {
    const tags = [...(props.modelValue.personality || [])]
    const idx = tags.indexOf(tag)
    if (idx > -1) tags.splice(idx, 1)
    else tags.push(tag)
    updateField('personality', tags)
}

// Expose validate
defineExpose({
    validate: () => {
        return petFormRef.value?.validate ? petFormRef.value.validate() : Promise.resolve(true)
    }
})
</script>

<style lang="scss" scoped>
.form-content {
    display: flex;
    flex-direction: column;
    gap: 32rpx;
}

.card-section {
    background-color: #ffffff;
    border-radius: 32rpx;
    padding: 40rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.02);
    border: 1rpx solid #f3f4f6;
}

.input-group {
    width: 100%;
    margin-bottom: 32rpx;
}

.label {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #374151;
    margin-bottom: 12rpx;
}

.required {
    color: #ef4444;
    margin-left: 4rpx;
}

.custom-input,
.custom-select,
.custom-textarea {
    min-height: 96rpx;
    background-color: #f9fafb;
    border-radius: 24rpx;
    padding: 24rpx 32rpx;
    font-size: 30rpx;
    color: #1f2937;
    border: 2rpx solid #e5e7eb;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    width: 100%;
}

.custom-textarea {
    min-height: 120rpx;
    display: block;
    line-height: 1.5;
    width: 100%;
}

.custom-select {
    justify-content: space-between;
}

.input-placeholder,
.select-placeholder {
    color: #9ca3af;
}

.species-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24rpx;
}

.species-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24rpx 0;
    gap: 12rpx;
    background-color: #ffffff;
    border: 2rpx solid #e5e7eb;
    border-radius: 24rpx;
    min-height: 150rpx;

    &.selected {
        background-color: #fff7ed;
        border-color: #f97316;

        .species-name {
            color: #f97316;
            font-weight: bold;
        }
    }
}
.species-name {
    margin-top: 12rpx;
    font-size: 26rpx;
    color: #6b7280;
}

.species-image {
    width: 96rpx;
    height: 96rpx;
}

.gender-switch {
    display: flex;
    background-color: #f3f4f6;
    padding: 8rpx;
    border-radius: 24rpx;
}

.gender-option {
    flex: 1;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    font-size: 28rpx;
    font-weight: 500;
    color: #6b7280;

    &.active {
        background-color: #ffffff;
        font-weight: bold;

        &.male {
            color: #3b82f6;
        }

        //.male
        &.female {
            color: #ec4899;
        }

        //.female
    }
}

.row-2-col {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 32rpx;
}

.col-item {
    min-width: 0;
}

.input-wrapper {
    width: 100%;
}

.tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.tag-item {
    padding: 12rpx 24rpx;
    background-color: #ffffff;
    border: 2rpx solid #e5e7eb;
    border-radius: 999rpx;
    font-size: 24rpx;
    color: #6b7280;

    &.active {
        background-color: #fff7ed;
        border-color: #fdba74;
        color: #c2410c;
    }
}

.label-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 12rpx;
}

.label-text {
    font-size: 28rpx;
    color: #4b5563;
}

/* Popup */
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
}

.search-box {
    margin-bottom: 24rpx;
}

.breed-list {
    flex: 1;
    overflow-y: auto;
}

.breed-item {
    padding: 24rpx 0;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    justify-content: space-between;
}

.selected-breed {
    color: #f97316;
    font-weight: bold;
}

.empty-result {
    padding: 40rpx;
    text-align: center;
    color: #9ca3af;
}
</style>
