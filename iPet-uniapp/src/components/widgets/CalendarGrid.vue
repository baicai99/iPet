<template>
    <view class="calendar-grid">
        <!-- 星期标题 -->
        <view class="weekdays">
            <view v-for="day in weekdays" :key="day" class="weekday">
                {{ day }}
            </view>
        </view>

        <!-- 日期网格 -->
        <view class="dates">
            <view v-for="(date, index) in calendarDates" :key="index" class="date-cell" :class="{
                'other-month': !date.isCurrentMonth,
                'today': date.isToday,
                'selected': date.isSelected,
                'has-event': date.hasEvent
            }" @click="handleDateClick(date)">
                <view class="date-number">{{ date.day }}</view>
                <view v-if="date.hasEvent" class="event-dot"></view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    year: {
        type: Number,
        required: true
    },
    month: {
        type: Number,
        required: true
    },
    selectedDate: {
        type: String,
        default: null
    },
    eventDates: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['select-date'])

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

/**
 * 生成日历日期数据
 */
const calendarDates = computed(() => {
    const dates = []
    const today = new Date()
    const currentYear = props.year
    const currentMonth = props.month

    // 当月第一天
    const firstDay = new Date(currentYear, currentMonth - 1, 1)
    const firstDayWeek = firstDay.getDay()

    // 当月最后一天
    const lastDay = new Date(currentYear, currentMonth, 0)
    const lastDate = lastDay.getDate()

    // 上月最后一天
    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0)
    const prevMonthLastDate = prevMonthLastDay.getDate()

    // 填充上月日期
    for (let i = firstDayWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDate - i
        const dateStr = formatDate(currentYear, currentMonth - 1, day)

        dates.push({
            day,
            dateStr,
            isCurrentMonth: false,
            isToday: false,
            isSelected: false,
            hasEvent: false
        })
    }

    // 填充当月日期
    for (let day = 1; day <= lastDate; day++) {
        const dateStr = formatDate(currentYear, currentMonth, day)
        const isToday =
            today.getFullYear() === currentYear &&
            today.getMonth() + 1 === currentMonth &&
            today.getDate() === day

        dates.push({
            day,
            dateStr,
            isCurrentMonth: true,
            isToday,
            isSelected: dateStr === props.selectedDate,
            hasEvent: props.eventDates.includes(dateStr)
        })
    }

    // 填充下月日期，补齐6行
    const remainingCells = 42 - dates.length
    for (let day = 1; day <= remainingCells; day++) {
        const dateStr = formatDate(currentYear, currentMonth + 1, day)

        dates.push({
            day,
            dateStr,
            isCurrentMonth: false,
            isToday: false,
            isSelected: false,
            hasEvent: false
        })
    }

    return dates
})

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(year, month, day) {
    // 处理月份越界
    if (month < 1) {
        year -= 1
        month = 12
    } else if (month > 12) {
        year += 1
        month = 1
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * 处理日期点击
 */
function handleDateClick(date) {
    if (!date.isCurrentMonth) return

    emit('select-date', date.dateStr)
}
</script>

<style lang="scss" scoped>
.calendar-grid {
    background: $uni-bg-color;
    border-radius: 24rpx;
    padding: 32rpx;
}

.weekdays {
    @include flex-between;
    margin-bottom: 24rpx;
}

.weekday {
    width: 80rpx;
    text-align: center;
    @include text-subhead;
    color: $uni-text-color-grey;
}

.dates {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 16rpx;
}

.date-cell {
    aspect-ratio: 1;
    @include flex-center;
    flex-direction: column;
    position: relative;
    border-radius: 16rpx;
    transition: all 0.2s ease;

    &.other-month {
        opacity: 0.3;
    }

    &.today {
        background: rgba($uni-color-primary, 0.1);

        .date-number {
            color: $uni-color-primary;
            font-weight: 600;
        }
    }

    &.selected {
        background: $uni-color-primary;

        .date-number {
            color: #FFFFFF;
            font-weight: 600;
        }

        .event-dot {
            background: #FFFFFF;
        }
    }

    &.has-event:not(.selected) {
        .event-dot {
            background: $uni-color-primary;
        }
    }

    &:active {
        transform: scale(0.95);
    }
}

.date-number {
    @include text-body;
    color: $uni-text-color;
}

.event-dot {
    width: 8rpx;
    height: 8rpx;
    border-radius: 50%;
    margin-top: 4rpx;
}
</style>
