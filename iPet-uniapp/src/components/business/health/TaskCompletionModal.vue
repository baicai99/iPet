<template>
    <u-popup :show="show" @close="handleClose" mode="bottom" :round="24">
        <view class="modal-content">
            <view class="modal-header">
                <text class="modal-title">确认完成{{ title }}</text>
                <view class="close-btn" @click="handleClose">
                    <u-icon name="close" color="#94a3b8" size="20"></u-icon>
                </view>
            </view>

            <!-- Time Selection -->
            <view class="time-section" @click="showTimePicker = true">
                <view class="section-label">
                    <u-icon name="clock" color="#64748b" size="20"></u-icon>
                    <text>完成时间</text>
                </view>
                <view class="section-value">
                    <text>{{ formattedTime }}</text>
                    <u-icon name="arrow-right" color="#cbd5e1" size="14"></u-icon>
                </view>
            </view>

            <!-- Dynamic Options -->
            <view v-if="formConfig && formConfig.options && formConfig.options.length > 0" class="options-section">
                <text class="section-title">{{ optionsLabel }}</text>
                <view class="tag-group">
                    <view v-for="option in formConfig.options" :key="option.value" class="tag-item"
                        :class="{ active: isSelected(option.value) }" @click="toggleOption(option.value)">
                        <text>{{ option.label }}</text>
                        <u-icon v-if="isSelected(option.value)" name="checkmark" color="#ffffff" size="12"></u-icon>
                    </view>
                </view>
            </view>

            <!-- Confirm Button -->
            <button class="confirm-btn" @click="handleConfirm">
                <u-icon name="checkmark-circle" color="#ffffff" size="20"></u-icon>
                <text class="btn-text">确认完成</text>
            </button>
        </view>

        <!-- Time Picker -->
        <u-datetime-picker :show="showTimePicker" v-model="pickerValue" mode="datetime" title="选择完成时间"
            @confirm="onTimeConfirm" @cancel="showTimePicker = false"></u-datetime-picker>
    </u-popup>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import dayjs from 'dayjs';

interface FormOption {
    label: string;
    value: string;
}

interface FormConfig {
    type: 'tags';
    multiSelect: boolean;
    options: FormOption[];
}

const props = defineProps<{
    show: boolean;
    title: string;
    formConfig?: FormConfig;
    initialSelections?: string[];
}>();

const emit = defineEmits<{
    (e: 'confirm', data: { selectedOptions: string[]; completionTime: number }): void;
    (e: 'cancel'): void;
    (e: 'update:show', value: boolean): void;
}>();

const showTimePicker = ref(false);
const completionTime = ref(Date.now());
const selectedOptions = ref<string[]>([]);
const pickerValue = ref(Date.now());

// Reset state when modal opens
watch(() => props.show, (newVal) => {
    if (newVal) {
        completionTime.value = Date.now();
        pickerValue.value = Date.now();

        // [PM Optimization] Prioritize passed initial selections (e.g., from Plan)
        if (props.initialSelections && props.initialSelections.length > 0) {
            selectedOptions.value = [...props.initialSelections];
        } else {
            selectedOptions.value = [];
            // Pre-select first option if single select
            if (props.formConfig && !props.formConfig.multiSelect && props.formConfig.options.length > 0) {
                selectedOptions.value = [props.formConfig.options[0].value];
            }
        }
    }
});

const formattedTime = computed(() => {
    return dayjs(completionTime.value).format('YYYY-MM-DD HH:mm');
});

const optionsLabel = computed(() => {
    if (props.formConfig?.multiSelect) {
        return '选择方式（可多选）';
    }
    return '选择类型';
});

const isSelected = (value: string) => {
    return selectedOptions.value.includes(value);
};

const toggleOption = (value: string) => {
    if (!props.formConfig) return;

    if (props.formConfig.multiSelect) {
        const index = selectedOptions.value.indexOf(value);
        if (index === -1) {
            selectedOptions.value.push(value);
        } else {
            selectedOptions.value.splice(index, 1);
        }
    } else {
        selectedOptions.value = [value];
    }
};

const onTimeConfirm = (e: any) => {
    completionTime.value = e.value;
    showTimePicker.value = false;
};

const handleClose = () => {
    emit('update:show', false);
    emit('cancel');
};

const handleConfirm = () => {
    emit('confirm', {
        selectedOptions: selectedOptions.value,
        completionTime: completionTime.value
    });
    emit('update:show', false);
};
</script>

<style lang="scss" scoped>
$indigo-50: #eef2ff;
$indigo-100: #e0e7ff;
$indigo-500: #6366f1;
$indigo-600: #4f46e5;
$indigo-700: #4338ca;

$slate-50: #f8fafc;
$slate-100: #f1f5f9;
$slate-200: #e2e8f0;
$slate-400: #94a3b8;
$slate-700: #334155;
$slate-800: #1e293b;
$slate-900: #0f172a;

.modal-content {
    padding: 48rpx 32rpx;
    background-color: #ffffff;
    border-top-left-radius: 48rpx;
    border-top-right-radius: 48rpx;
    display: flex;
    flex-direction: column;
    gap: 32rpx;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-title {
    font-size: 36rpx;
    font-weight: 700;
    color: $slate-900;
}

.close-btn {
    padding: 16rpx;
}

.time-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx;
    background-color: $slate-50;
    border-radius: 24rpx;
}

.section-label {
    display: flex;
    align-items: center;
    gap: 16rpx;
    font-size: 30rpx;
    font-weight: 600;
    color: $slate-700;
}

.section-value {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 30rpx;
    color: $indigo-600;
    font-weight: 600;
}

.options-section {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.section-title {
    font-size: 28rpx;
    font-weight: 700;
    color: $slate-700;
    margin-left: 8rpx;
}

.tag-group {
    display: flex;
    gap: 16rpx;
    flex-wrap: wrap;
}

.tag-item {
    background-color: $slate-50;
    color: $slate-700;
    padding: 20rpx 40rpx;
    border-radius: 24rpx;
    font-size: 30rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 12rpx;
    transition: all 0.2s;
    border: 1px solid transparent;

    &.active {
        background-color: $indigo-600;
        color: #ffffff;
        box-shadow: 0 4rpx 12rpx -2rpx rgba($indigo-500, 0.3);
    }
}

.confirm-btn {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16rpx;
    padding: 24rpx;
    border-radius: 32rpx;
    background-color: $indigo-600;
    box-shadow: 0 10rpx 20rpx -5rpx rgba($indigo-500, 0.3);
    transition: all 0.2s;
    border: none;
    margin-top: 16rpx;

    &:active {
        transform: scale(0.98);
        background-color: $indigo-700;
    }

    &::after {
        border: none;
    }
}

.btn-text {
    color: #ffffff;
    font-size: 34rpx;
    font-weight: 700;
}
</style>
