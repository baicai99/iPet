<template>
    <view class="schedule-card" :class="{ 'is-completed': isCompleted }">
        <view class="content">
            <!-- Left Info Area -->
            <view class="info-section">
                <view class="header-row">
                    <text class="title" :class="{ 'text-green': isCompleted }">{{ title }}</text>

                    <!-- Tags -->
                    <view v-if="tags && tags.length" class="tags-group">
                        <view v-for="tag in tags" :key="tag" class="mini-tag" :class="getTagClass(tag)">
                            {{ getTagName(tag) }}
                        </view>
                    </view>
                </view>

                <view class="meta-row">
                    <u-icon name="clock" size="14" color="#94a3b8"></u-icon>
                    <text class="date-text">{{ formattedDate }}</text>

                    <!-- Recurrence Info -->
                    <view v-if="repeatLabel" class="repeat-info">
                        <u-icon name="reload" size="12" color="#94a3b8"></u-icon>
                        <text class="repeat-text">{{ repeatLabel }}</text>
                    </view>

                    <text v-if="!isCompleted && isOverdue" class="status-label overdue">
                        已逾期 {{ overdueDays }} 天
                    </text>
                    <text v-if="isCompleted" class="status-label completed">已完成</text>
                </view>
            </view>

            <!-- Right Action Button -->
            <view class="action-section">
                <!-- If completed, we show 'Undo' style (Green) or just status? 
                     React design had a button for both states. 
                     We will stick to a button that toggles or just "Completed" text if no undo logic exists yet.
                     For now, let's keep the emit('complete') logic but style it as the black button.
                -->
                <view v-if="!isCompleted" class="action-buttons">
                    <view class="action-btn btn-outline" @click.stop="onDelete">
                        <u-icon name="trash" color="#ef4444" size="16"></u-icon>
                        <text class="btn-text ml-1">删除</text>
                    </view>
                    <view class="action-btn btn-black" @click.stop="onComplete">
                        <text class="btn-text">完成</text>
                    </view>
                </view>
                <view v-else class="action-btn btn-green" @click.stop="onComplete">
                    <!-- Usually we don't support undo yet, but let's visually match the design -->
                    <u-icon name="checkmark" color="#fff" size="12"></u-icon>
                    <text class="btn-text ml-1">已完成</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

const props = defineProps({
    title: { type: String, default: '任务' },
    date: { type: [String, Number], required: true },
    isCompleted: { type: Boolean, default: false },
    tags: { type: Array as () => string[], default: () => [] },
    repeat: { type: String, default: 'none' },
    customRule: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['complete', 'delete']);

const onComplete = () => {
    emit('complete');
};

const onDelete = () => {
    emit('delete');
};

const targetDate = computed(() => dayjs(props.date));
const formattedDate = computed(() => {
    const d = targetDate.value
    if (d.isSame(dayjs(), 'day')) {
        return `今天${d.format('HH:mm')}`
    }
    return d.format('YYYY/MM/DD')
});

const repeatLabel = computed(() => {
    if (!props.repeat || props.repeat === 'none') return ''

    if (props.repeat === 'custom' && props.customRule) {
        const val = props.customRule.value || 1
        const unit = props.customRule.unit || 'day'
        const unitMap: Record<string, string> = {
            'hour': '小时', 'day': '天', 'week': '周', 'month': '月', 'year': '年'
        }
        return `每${val}${unitMap[unit] || unit}`
    }

    const map: Record<string, string> = {
        'hour': '每小时',
        'day': '每天',
        'weekdays': '工作日',
        'weekends': '周末',
        'week': '每周',
        'biweek': '每两周',
        'month': '每月',
        'month_3': '每3个月',
        'month_6': '每半年',
        'year': '每年'
    }
    return map[props.repeat] || ''
})

const isOverdue = computed(() => {
    if (props.isCompleted) return false;
    return targetDate.value.startOf('day').isBefore(dayjs().startOf('day'));
});

const overdueDays = computed(() => {
    return dayjs().startOf('day').diff(targetDate.value.startOf('day'), 'day');
});

const getTagName = (val: string) => {
    const map: Record<string, string> = {
        'internal': '体内',
        'external': '体外',
        'rabies': '狂犬疫苗',
        'combo': '多联疫苗（基础病）',
        'six_in_one': '六联疫苗',
        'eight_in_one': '八联疫苗',
        'home': '在家洗',
        'shop': '宠物店'
    };
    return map[val] || val;
};

const getTagClass = (val: string) => {
    if (val === 'internal') return 'tag-blue';
    if (val === 'external') return 'tag-purple';
    if (val === 'rabies') return 'tag-red';
    if (val === 'combo') return 'tag-indigo';
    if (val === 'six_in_one') return 'tag-indigo';
    if (val === 'eight_in_one') return 'tag-purple';
    if (val === 'home') return 'tag-cyan';
    if (val === 'shop') return 'tag-orange';
    return 'tag-gray';
};
</script>

<style lang="scss" scoped>
// Variables based on React Design
$gray-900: #111827; // Slate-900 like
$green-600: #16a34a;
$green-700: #15803d;

.schedule-card {
    background-color: #ffffff;
    border-radius: 24rpx; // rounded-xl
    box-shadow: 0 4rpx 6rpx -1rpx rgba(0, 0, 0, 0.1), 0 2rpx 4rpx -1rpx rgba(0, 0, 0, 0.06); // shadow-md
    padding: 32rpx;
    margin-bottom: 24rpx;
    border: 1px solid #f3f4f6; // gray-100
    transition: all 0.3s ease;

    &.is-completed {
        background-color: #f9fafb; // gray-50
        opacity: 0.9;
    }
}

.content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 32rpx;
}

.info-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    min-width: 0; // Prevent flex overflow
}

.header-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.title {
    font-size: 32rpx; // text-base
    font-weight: 700; // font-bold
    color: $gray-900;
    transition: color 0.3s;

    &.text-green {
        color: $green-700;
    }
}

.meta-row {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.date-text {
    font-size: 24rpx; // text-xs
    color: #6b7280; // gray-500
    font-weight: 500;
}

.status-label {
    font-size: 20rpx;
    font-weight: 600;
    margin-left: 8rpx;

    &.overdue {
        color: #ef4444;
    }

    &.completed {
        color: $green-600;
    }
}

// Action Buttons
.action-section {
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

.action-buttons {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12rpx 32rpx; // px-3 py-1.5 approx
    border-radius: 16rpx; // rounded-lg
    border: none;
    line-height: 1;
    transition: all 0.2s;

    &.btn-black {
        background-color: $gray-900;
        color: #ffffff;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

        &:active {
            background-color: #1f2937; // gray-800
        }
    }

    &.btn-green {
        background-color: $green-600;
        color: #ffffff;

        &:active {
            background-color: $green-700;
        }
    }

    &.btn-outline {
        background-color: #f8fafc;
        color: #475569;
        border: 1px solid #e2e8f0;

        &:active {
            background-color: #e2e8f0;
        }
    }
}

.btn-text {
    font-size: 24rpx; // text-xs
    font-weight: 700; // font-bold
}

.ml-1 {
    margin-left: 8rpx;
}

// Tags
.tags-group {
    display: flex;
    gap: 8rpx;
}

.mini-tag {
    padding: 4rpx 12rpx; // px-1.5 py-0.5
    border-radius: 8rpx; // rounded
    font-size: 20rpx; // text-[10px]
    font-weight: 500;
    border-width: 1px;
    border-style: solid;
    line-height: 1.2;

    &.tag-blue {
        background-color: #eff6ff; // blue-50
        color: #2563eb; // blue-600
        border-color: #dbeafe; // blue-100
    }

    &.tag-purple {
        background-color: #faf5ff; // purple-50
        color: #9333ea; // purple-600
        border-color: #f3e8ff; // purple-100
    }

    &.tag-gray {
        background-color: #f3f4f6;
        color: #4b5563;
        border-color: #e5e7eb;
    }

    &.tag-red {
        background-color: #fef2f2;
        color: #dc2626;
        border-color: #fee2e2;
    }

    &.tag-indigo {
        background-color: #eef2ff;
        color: #4f46e5;
        border-color: #e0e7ff;
    }

    &.tag-cyan {
        background-color: #ecfeff;
        color: #0891b2;
        border-color: #cffafe;
    }

    &.tag-orange {
        background-color: #fff7ed;
        color: #ea580c;
        border-color: #ffedd5;
    }
}

.repeat-info {
    display: flex;
    align-items: center;
    gap: 4rpx;
    background-color: #f8fafc;
    padding: 2rpx 8rpx;
    border-radius: 8rpx;
    margin-left: 12rpx;
}

.repeat-text {
    font-size: 22rpx;
    color: #94a3b8;
    font-weight: 500;
}
</style>
