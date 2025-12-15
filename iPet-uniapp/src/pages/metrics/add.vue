<template>
    <view class="page-container">
        <AppNavbar :title="pageTitle" />
        <view class="container">
            <!-- Notification -->
            <view v-if="notification" class="notification" :class="[notification.type]">
                <u-icon :name="notification.type === 'success' ? 'checkmark-circle-fill' : 'info-circle-fill'"
                    :color="notification.type === 'success' ? '#065f46' : '#991b1b'" size="18"></u-icon>
                <text class="notification-text">{{ notification.message }}</text>
            </view>

        <view class="main-content">
            <!-- Section 1: Header -->
            <view class="header-section">
                <view class="icon-box">
                    <u-icon :name="pageIcon" color="#ffffff" size="28"></u-icon>
                </view>
                <view>
                    <text class="page-title">{{ pageTitle }}</text>
                </view>
            </view>

            <!-- Mode Switcher (Optional, if we want in-page toggle) -->
            <!-- For now, controlled by entry point, but UI could reflect it -->

            <!-- Section 2: Core Data (Value or Method) -->
            <view class="section-card">
                <!-- Method Selection for Task-mode metrics -->
                <view class="card-content">
                    <view v-if="isTaskMode" class="status-toggle-row">
                        <text class="label">状态</text>
                        <view class="toggle-group">
                            <view class="toggle-item" :class="{ active: !isDirectCompletion }"
                                @click="isDirectCompletion = false">
                                <u-icon name="clock" size="14"
                                    :color="!isDirectCompletion ? '#fff' : '#64748b'"></u-icon>
                                <text>加入待办</text>
                            </view>
                            <view class="toggle-item" :class="{ active: isDirectCompletion }"
                                @click="isDirectCompletion = true">
                                <u-icon name="checkmark" size="14"
                                    :color="isDirectCompletion ? '#fff' : '#64748b'"></u-icon>
                                <text>直接完成</text>
                            </view>
                        </view>
                    </view>

                    <view v-if="isTaskMode && formConfig && formConfig.options?.length > 0" class="form-group">
                        <text class="label">{{ formConfig.multiSelect ? '选择方式（可多选）' : '选择类型' }}</text>
                        <!-- Tips for Deworming Schedule -->
                        <view v-if="isScheduleMode && metricKey === 'deworming'" class="tips-box">
                            <u-icon name="info-circle" size="14" color="#f59e0b"></u-icon>
                            <text class="tips-text">体内和体外驱虫周期不同，请分别创建计划。</text>
                        </view>
                        <view class="tag-group">
                            <view v-for="method in formConfig.options" :key="method.value" class="tag-item"
                                :class="{ active: selectedMethods.includes(method.value) }"
                                @click="toggleMethod(method.value)">
                                <text>{{ method.label }}</text>
                                <u-icon v-if="selectedMethods.includes(method.value)" name="checkmark" color="#ffffff"
                                    size="12"></u-icon>
                            </view>
                        </view>
                    </view>

                    <!-- Stool Status Tag Selection (PRD: 7-tag single select) -->
                    <view v-if="isStatusTagMode && formConfig && formConfig.options?.length > 0" class="form-group">
                        <text class="label">排泄状态</text>
                        <view class="stool-tag-grid">
                            <view v-for="option in formConfig.options" :key="option.value" class="stool-tag-item"
                                :class="{ active: selectedStoolStatus === option.value }"
                                @click="selectStoolStatus(option.value)">
                                <text>{{ option.label }}</text>
                            </view>
                        </view>
                    </view>

                    <!-- Numeric Input for Stats -->
                    <view v-if="!isEventMetric" class="form-group">
                        <text class="label">{{ valueLabel }}</text>
                        <view class="input-container group">
                            <view class="input-icon-left">
                                <u-icon name="rmb-circle" color="#94a3b8" size="20"></u-icon>
                            </view>
                            <input type="digit" v-model="formData.value" class="input-field amount-input"
                                placeholder="0.00" />
                            <view class="input-suffix">
                                <text class="suffix-text">{{ unitLabel || 'Unit' }}</text>
                            </view>
                        </view>
                    </view>

                    <!-- Fallback/Placeholder for task-mode events without options -->
                    <view v-if="isTaskMode && (!formConfig || !formConfig.options?.length)" class="form-group">
                        <text class="label">记录一次</text>
                        <view class="tag-group">
                            <view class="tag-item active">
                                <text>{{ isScheduleMode ? '计划执行' : '完成打卡' }}</text>
                                <u-icon name="checkmark" color="#ffffff" size="12"></u-icon>
                            </view>
                        </view>
                    </view>
                </view>
            </view>

            <!-- Section 3: Timing & Reminders -->
            <view class="section-card">
                <view class="card-content" style="padding: 0;">
                    <!-- Date -->
                    <view class="form-row-item" @click="showCalendar = true">
                        <view class="row-label">
                            <u-icon name="calendar" color="#64748b" size="20"></u-icon>
                            <text>日期</text>
                        </view>
                        <view class="row-value highlight">
                            <text>{{ formData.date }}</text>
                            <u-icon name="arrow-right" color="#cbd5e1" size="14"></u-icon>
                        </view>
                    </view>

                    <!-- Time -->
                    <view class="form-row-item" @click="showTimePicker = true">
                        <view class="row-label">
                            <u-icon name="clock" color="#64748b" size="20"></u-icon>
                            <text>时间</text>
                        </view>
                        <view class="row-value highlight">
                            <text>{{ formData.time }}</text>
                            <u-icon name="arrow-right" color="#cbd5e1" size="14"></u-icon>
                        </view>
                    </view>

                    <!-- Schedule Mode: Repeat Options -->
                    <view v-if="isScheduleMode" class="form-row-item" @click="showRepeatSheet = true">
                        <view class="row-label">
                            <u-icon name="reload" color="#64748b" size="20"></u-icon>
                            <text>重复</text>
                        </view>
                        <view class="row-value highlight">
                            <text>{{ currentRepeatLabel }}</text>
                            <u-icon name="arrow-right" color="#cbd5e1" size="14"></u-icon>
                        </view>
                    </view>

                    <!-- Record Mode: Reminder Toggle -->
                    <view v-else class="form-row-item">
                        <view class="row-label">
                            <u-icon name="bell" color="#64748b" size="20"></u-icon>
                            <text>提醒</text>
                        </view>
                        <view class="reminder-btn" @click="showReminderSheet = true">
                            {{ reminderButtonText }}
                        </view>
                    </view>
                </view>
            </view>

            <!-- Section 4: Notes -->
            <view class="section-card">
                <view class="card-content">
                    <text class="label">备注</text>
                    <textarea v-model="formData.note" class="textarea-field" placeholder="添加备注信息..." />
                </view>
            </view>

            <!-- Scheduled List (Only in Schedule Mode) -->
            <view v-if="isScheduleMode && scheduledList.length > 0" class="reminder-list-section">
                <view class="section-header">
                    <text class="section-title">已预约</text>
                    <view class="badge">{{ scheduledList.length }}</view>
                </view>

                <view class="reminder-list">
                    <view v-for="item in scheduledList" :key="item.id" class="reminder-item"
                        @click="loadRecordForEdit(item)">
                        <view class="reminder-content">
                            <view class="reminder-main">
                                <u-icon name="calendar" color="#64748b" size="18"></u-icon>
                                <text class="reminder-time">{{ formatReminderTime(item) }}</text>
                            </view>
                            <text v-if="item.notes" class="reminder-note">{{ item.notes }}</text>
                            <!-- Show Repeat Label -->
                            <view v-if="item.metadata?.repeat && item.metadata.repeat !== 'none'"
                                class="repeat-tag-small">
                                <u-icon name="reload" size="12" color="#6366f1"></u-icon>
                                <text>{{ getRepeatLabel(item.metadata.repeat) }}</text>
                            </view>
                        </view>
                        <view class="delete-btn" @click.stop="handleDelete(item.id)">
                            <u-icon name="trash" color="#ef4444" size="20"></u-icon>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <!-- Footer Actions -->
        <view class="footer-actions">
            <button class="save-btn" @click="handleSubmit" :disabled="isSubmitting"
                :class="{ 'opacity-50': isSubmitting }">
                <u-loading-icon v-if="isSubmitting" color="#ffffff" size="20"></u-loading-icon>
                <view v-else class="btn-content">
                    <u-icon :name="isScheduleMode ? 'bell' : 'checkmark-circle'" color="#ffffff" size="20"></u-icon>
                    <text class="btn-text">{{ submitButtonText }}</text>
                </view>
            </button>
        </view>

        <!-- Pickers -->
        <u-datetime-picker :show="showCalendar" v-model="pickerDateValue" mode="date" @confirm="onDateConfirm"
            @cancel="showCalendar = false"></u-datetime-picker>

        <u-datetime-picker :show="showTimePicker" v-model="pickerTimeValue" mode="time" @confirm="onTimeConfirm"
            @cancel="showTimePicker = false"></u-datetime-picker>

        <!-- Reminder Sheet (Record Mode) -->
        <u-popup :show="showReminderSheet" @close="showReminderSheet = false" mode="bottom" :round="24">
            <view class="popup-content">
                <view class="popup-header">提醒设置</view>

                <view class="frequency-grid">
                    <view v-for="freq in FREQUENCY_OPTIONS" :key="freq.value" class="freq-item"
                        :class="{ active: reminderFrequency === freq.value }" @click="selectFrequency(freq.value)">
                        <text>{{ freq.label }}</text>
                    </view>
                </view>

                <!-- Custom Frequency Input -->
                <view v-if="reminderFrequency === 'custom'" class="custom-freq-input">
                    <view class="input-row">
                        <text class="prefix">每</text>
                        <input type="number" v-model="customFrequency" class="freq-num-input" />
                    </view>
                    <view class="unit-options">
                        <view v-for="unit in CUSTOM_UNIT_OPTIONS" :key="unit.value" class="unit-item"
                            :class="{ active: customFrequencyUnit === unit.value }"
                            @click="customFrequencyUnit = unit.value">
                            <text>{{ unit.label }}</text>
                        </view>
                    </view>
                </view>

                <button class="save-btn" @click="showReminderSheet = false">
                    <text class="btn-text" style="font-size: 30rpx;">确认</text>
                </button>
            </view>
        </u-popup>

        <!-- Repeat Sheet (Schedule Mode) -->
        <u-action-sheet :show="showRepeatSheet" :actions="repeatOptions" title="选择重复频率" @select="onRepeatSelect"
            @close="showRepeatSheet = false"></u-action-sheet>

        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppNavbar from '@/components/common/AppNavbar.vue'
import dayjs from 'dayjs'
import { useHealthStore } from '@/stores/healthStore'
import { usePetStore } from '@/stores/petStore'
import { emitDataChanged } from '@/services/syncEvents'
import { getMetricMetadata, type MetricMetadata } from '@/data/metricMetadata'
import { useUnitConverter } from '@/composables/useUnitConverter'

// Setup Stores & Utils
const healthStore = useHealthStore()
const petStore = usePetStore()
const { convertToBaseValue } = useUnitConverter()

// State
const metricKey = ref('weight')
const currentMode = ref<'record' | 'schedule'>('record') // 'record' or 'schedule'
const isSubmitting = ref(false)
const notification = ref<{ message: string, type: 'success' | 'error' } | null>(null)
const editingRecordId = ref<string | null>(null) // If editing an existing schedule
// [PM Optimization] New status control
const isDirectCompletion = ref(false)

const formData = ref({
    value: '',
    date: dayjs().format('YYYY-MM-DD'),
    time: dayjs().format('HH:mm'),
    note: '',
    repeat: 'none' // For schedule mode
})

const showCalendar = ref(false)
const showTimePicker = ref(false)
const showReminderSheet = ref(false)
const showRepeatSheet = ref(false)

const pickerDateValue = ref(Number(new Date()))
const pickerTimeValue = ref(dayjs().format('HH:mm'))

// Computed Metadata
const metricMeta = computed<MetricMetadata>(() => getMetricMetadata(metricKey.value) || {
    key: metricKey.value,
    title: metricKey.value,
    category: 'otherData',
    valueType: 'number'
})
const isScheduleMode = computed(() => currentMode.value === 'schedule')

const metricTitle = computed(() => metricMeta.value.title || '记录数据')
const pageTitle = computed(() => isScheduleMode.value ? `预约${metricTitle.value}` : `记录${metricTitle.value}`)
const pageIcon = computed(() => isScheduleMode.value ? 'clock' : 'edit-pen')
const valueLabel = computed(() => metricMeta.value.title || '数值')
const unitLabel = computed(() => metricMeta.value.displayUnit || metricMeta.value.unit || '')
const metricBaseUnit = computed(() => metricMeta.value.unit || '')

const submitButtonText = computed(() => {
    if (isScheduleMode.value) {
        return editingRecordId.value ? '保存修改' : '确认预约'
    }
    return '保存记录'
})

// Generic Task Mode detection
const isTaskMode = computed(() => {
    // Robust check: Trust metadata, but fallback to known keys if metadata is loading or incomplete
    if (['deworming', 'vaccine', 'bathing', 'tooth_brushing'].includes(metricKey.value)) {
        return true
    }
    return metricMeta.value.interactionMode === 'task' ||
        (metricMeta.value.features?.schedulable &&
            metricMeta.value.valueType !== 'number')
})

const formConfig = computed(() => metricMeta.value.formConfig)

// Stool status tag mode detection
const isStatusTagMode = computed(() => {
    return metricMeta.value.interactionMode === 'status_tag'
})

// Metrics that don't require value input (Events)
// Note: stool uses status_tag mode, not isEventMetric
const isEventMetric = computed(() => {
    if (isStatusTagMode.value) return true // status_tag has its own input
    return isTaskMode.value || ['bathing', 'vaccine', 'vomiting'].includes(metricKey.value)
})

const selectedMethods = ref<string[]>([]) // Dynamic methods based on formConfig
const selectedStoolStatus = ref<number | null>(null) // For stool status tag selection

// Reminder Config (Record Mode)
// Reminder Config (Record Mode)
const reminderFrequency = ref('never')
const customFrequency = ref(1)
const customFrequencyUnit = ref('day')

const FREQUENCY_OPTIONS = [
    { label: '永不', value: 'never' },
    { label: '每小时', value: 'hour' },
    { label: '每天', value: 'day' },
    { label: '工作日', value: 'weekdays' },
    { label: '周末', value: 'weekends' },
    { label: '每周', value: 'week' },
    { label: '每两周', value: 'biweek' },
    { label: '每月', value: 'month' },
    { label: '每3个月', value: 'quarter' },
    { label: '每6个月', value: 'halfYear' },
    { label: '每年', value: 'year' },
    { label: '自定义', value: 'custom' },
]

const CUSTOM_UNIT_OPTIONS = [
    { label: '小时', value: 'hour' },
    { label: '天', value: 'day' },
    { label: '周', value: 'week' },
    { label: '月', value: 'month' },
    { label: '年', value: 'year' },
]

const reminderButtonText = computed(() => {
    if (reminderFrequency.value === 'never') return '不提醒'
    if (reminderFrequency.value === 'custom') {
        const unitLabel = CUSTOM_UNIT_OPTIONS.find(u => u.value === customFrequencyUnit.value)?.label
        return `提醒: 每 ${customFrequency.value} ${unitLabel}`
    }
    const freq = FREQUENCY_OPTIONS.find(f => f.value === reminderFrequency.value)
    return freq ? `提醒: ${freq.label}` : '已开启提醒'
})

// Repeat Config (Schedule Mode)
const repeatOptions = [
    { name: '不重复', value: 'none' },
    { name: '每天', value: 'day' },
    { name: '每周', value: 'week' },
    { name: '每月', value: 'month' },
    { name: '每3个月', value: 'month_3' },
    { name: '每半年', value: 'month_6' },
    { name: '每年', value: 'year' }
]

const currentRepeatLabel = computed(() => {
    const opt = repeatOptions.find(o => o.value === formData.value.repeat)
    return opt ? opt.name : '不重复'
})

const getRepeatLabel = (val: string) => {
    const opt = repeatOptions.find(o => o.value === val)
    return opt ? opt.name : ''
}

const toggleMethod = (value: string) => {
    if (!formConfig.value) return

    console.log('[toggleMethod] Clicked:', value, {
        metric: metricKey.value,
        multiSelect: formConfig.value.multiSelect,
        currentSelection: selectedMethods.value
    })

    // Allow multi-select if config says so OR if it's deworming (hard override for safety)
    if (formConfig.value.multiSelect || metricKey.value === 'deworming') {
        const index = selectedMethods.value.indexOf(value)
        if (index === -1) {
            selectedMethods.value.push(value)
        } else {
            selectedMethods.value.splice(index, 1)
        }
    } else {
        // Single select mode
        selectedMethods.value = [value]

        // [PM Optimization] Smart Cycle Recommendation (only triggered on selection in single mode or maybe we should trigger on last selected?)
        // Let's keep it for single selection actions for now as it sets default repeat
        if (metricKey.value === 'deworming') {
            if (value === 'external') {
                formData.value.repeat = 'month'
                if (!isDirectCompletion.value) showNotification('已推荐：每月重复', 'success')
            } else if (value === 'internal') {
                formData.value.repeat = 'month_3'
                if (!isDirectCompletion.value) showNotification('已推荐：每3个月重复', 'success')
            }
        }
    }
}

const selectFrequency = (value: string) => {
    reminderFrequency.value = value
}

// Handle stool status tag selection
const selectStoolStatus = (value: number) => {
    selectedStoolStatus.value = value
}

// Lifecycle
onLoad(async (options: any) => {
    if (options?.key) {
        metricKey.value = options.key
    }
    if (options?.mode === 'schedule') {
        currentMode.value = 'schedule'
        // Default to tomorrow 9am for scheduling
        formData.value.date = dayjs().add(1, 'day').format('YYYY-MM-DD')
        formData.value.time = '09:00'

        // Fetch existing appointments if any
        if (petStore.selectedPetId) {
            await (healthStore as any).fetchHealthRecords(petStore.selectedPetId)
        }
    }
})

// Action Handlers
const showNotification = (message: string, type: 'success' | 'error') => {
    notification.value = { message, type }
    setTimeout(() => {
        notification.value = null
    }, 3000)
}

const onDateConfirm = (e: any) => {
    const timestamp = e.value
    formData.value.date = dayjs(timestamp).format('YYYY-MM-DD')
    showCalendar.value = false
}

const onTimeConfirm = (e: any) => {
    const timeVal = e.value
    formData.value.time = timeVal
    showTimePicker.value = false
}

const onRepeatSelect = (e: any) => {
    formData.value.repeat = e.value
    showRepeatSheet.value = false
}

const handleSubmit = async () => {
    // Validation: Stool status tag must be selected
    if (isStatusTagMode.value && selectedStoolStatus.value === null) {
        showNotification('请选择排泄状态', 'error')
        return
    }

    // Validation: Other metrics
    if (!isEventMetric.value && !isScheduleMode.value && !isStatusTagMode.value) {
        if (!formData.value.value) {
            showNotification('请输入金额/数值', 'error')
            return
        }
        const numericValue = Number(formData.value.value)
        if (Number.isNaN(numericValue)) {
            showNotification('请输入正确的数值', 'error')
            return
        }
    }

    const petId = petStore.selectedPetId || petStore.currentPet?.id
    if (!petId) {
        showNotification('请先选择宠物', 'error')
        return
    }

    // 驱虫预约模式下的强校验
    if (isScheduleMode.value && metricKey.value === 'deworming' && selectedMethods.value.length === 0) {
        showNotification('请选择驱虫类型（体内或体外）', 'error')
        return
    }

    isSubmitting.value = true

    try {
        const fullDateTimeStr = `${formData.value.date} ${formData.value.time}`
        // For scheduling, this is the Target Date
        // For recording, this is the Record Date
        const dateObj = dayjs(fullDateTimeStr, 'YYYY-MM-DD HH:mm')
        const isoDate = dateObj.toISOString()
        const timestamp = dateObj.valueOf()

        // [PM Optimization] Core logic correction with Debugging
        const isTask = isTaskMode.value
        const isDirect = isDirectCompletion.value
        // If Schedule Mode or Explicit Future Date -> It's a "Plan" (unless user force completed via direct checkmark?)
        // Task Mode logic: User Intent (Toggle) trumps Date.
        const isFuture = dateObj.isAfter(dayjs(), 'minute')

        const shouldSchedule = isTask ? !isDirect : (isScheduleMode.value || isFuture)

        console.log('[AddMetric] Scheduling Decision:', {
            metric: metricKey.value,
            isTask,
            isDirect,
            isScheduleMode: isScheduleMode.value,
            isFuture,
            result: shouldSchedule
        })

        let valueForStorage = 1
        let finalUnit = unitLabel.value

        // Handle stool status tag mode
        if (isStatusTagMode.value && selectedStoolStatus.value !== null) {
            valueForStorage = selectedStoolStatus.value
            finalUnit = 'status'
        } else if (!isEventMetric.value && !isScheduleMode.value && !shouldSchedule) {
            const numericValue = Number(formData.value.value)
            const metricUnit = metricBaseUnit.value || metricMeta.value.displayUnit || ''
            valueForStorage = metricUnit ? convertToBaseValue(numericValue, metricUnit) : numericValue
        } else {
            // Task/Event mode or Scheduling
            valueForStorage = 1
            finalUnit = 'count'
        }

        // Prepare Metadata
        const metadata: any = {}

        // Method selection (e.g., Internal/External)
        if (selectedMethods.value.length > 0) {
            metadata.selectedOptions = selectedMethods.value
        }

        if (shouldSchedule) {
            metadata.isScheduled = true
            metadata.targetDate = timestamp

            // [PM Optimization] Auto-map Reminder to Repeat (if user set reminder but touched repeat)
            let finalRepeat = formData.value.repeat || 'none'
            if (finalRepeat === 'none' && reminderFrequency.value !== 'never') {
                const map: Record<string, string> = {
                    'hour': 'hour',
                    'day': 'day',
                    'weekdays': 'weekdays',
                    'weekends': 'weekends',
                    'week': 'week',
                    'biweek': 'biweek',
                    'month': 'month',
                    'quarter': 'month_3',
                    'halfYear': 'month_6',
                    'year': 'year',
                    'custom': 'custom'
                }
                if (map[reminderFrequency.value]) {
                    finalRepeat = map[reminderFrequency.value]
                }
            }
            metadata.repeat = finalRepeat

            // Always save reminder settings for scheduled tasks too (so they get push notifs)
            if (reminderFrequency.value !== 'never') {
                const isCustom = reminderFrequency.value === 'custom'
                metadata.reminder = {
                    enabled: true,
                    frequency: reminderFrequency.value,
                    customRule: isCustom ? {
                        value: Number(customFrequency.value),
                        unit: customFrequencyUnit.value
                    } : undefined
                }
            }
        } else {
            // Record Mode Reminders
            if (isTaskMode.value && reminderFrequency.value !== 'never') {
                const isCustom = reminderFrequency.value === 'custom'
                metadata.reminder = {
                    enabled: true,
                    frequency: reminderFrequency.value,
                    customRule: isCustom ? {
                        value: Number(customFrequency.value),
                        unit: customFrequencyUnit.value
                    } : undefined
                }
            }
        }

        const payload = {
            id: editingRecordId.value || undefined,
            petId,
            type: metricKey.value,
            value: valueForStorage,
            unit: finalUnit,
            date: isoDate,
            notes: formData.value.note,
            source: (shouldSchedule) ? 'schedule' : 'manual',
            metadata: metadata,
            updatedAt: Date.now()
        }

        if (editingRecordId.value) {
            await (healthStore as any).updateRecord(editingRecordId.value, payload)
            showNotification('修改成功', 'success')
            editingRecordId.value = null // Exit edit mode
        } else {
            await (healthStore as any).addRecord(payload)
            // Show different message for auto-schedule to reassure user
            const successMsg = (shouldSchedule) ? '预约成功' : '记录已保存'
            showNotification(successMsg, 'success')
        }


        emitDataChanged({ reason: 'metrics:record-added' })
        uni.$emit('metric-history-updated', { key: metricKey.value })

        // Reset
        formData.value.value = ''
        formData.value.note = ''
        if (isScheduleMode.value) {
            // Keep date/time nearby for consecutive adds? Or reset?
            // Let's reset to defaults
            formData.value.repeat = 'none'
        }

    } catch (error: any) {
        console.error('Failed to save record', error)
        showNotification(error.message || '保存失败，请重试', 'error')
    } finally {
        isSubmitting.value = false
    }
}

// Scheduled List Logic
const scheduledList = computed(() => {
    if (!petStore.selectedPetId) return []
    const history = healthStore.metricHistory(metricKey.value)
    const now = dayjs()

    return history
        .filter((record: any) => {
            // Must be future AND explicitly marked as scheduled (or implied by context, but we use strict checks or future date)
            const isFuture = dayjs(record.date).isAfter(now)
            // Or use metadata flag if we strictly separate
            // For compatibility with old schedule.vue logic which just checked future date
            // We can check metadata.isScheduled specific flag too if available
            const isScheduled = record.metadata?.isScheduled === true || record.source === 'schedule'

            // To be robust with previous schedule.vue which might not have set isScheduled but set targetDate
            // Let's rely on date > now if it's a "planning" view, but ideally we only show strictly scheduled items
            return (isFuture && isScheduled) || (isFuture && record.metadata?.targetDate)
        })
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
})

const formatReminderTime = (item: any) => {
    return dayjs(item.date).format('YYYY年M月D日 HH:mm')
}

const handleDelete = (id: string) => {
    uni.showModal({
        title: '确认删除',
        content: '确定要删除这个预约吗？',
        success: async (res) => {
            if (res.confirm) {
                try {
                    await (healthStore as any).deleteRecord(id)
                    showNotification('删除成功', 'success')
                    if (editingRecordId.value === id) {
                        editingRecordId.value = null
                        // reset form
                        formData.value.repeat = 'none'
                        formData.value.note = ''
                    }
                } catch (e: any) {
                    showNotification('删除失败', 'error')
                }
            }
        }
    })
}

const loadRecordForEdit = (item: any) => {
    editingRecordId.value = item.id
    formData.value.date = dayjs(item.date).format('YYYY-MM-DD')
    formData.value.time = dayjs(item.date).format('HH:mm')
    formData.value.note = item.notes || ''
    formData.value.repeat = item.metadata?.repeat || 'none'

    if (item.metadata?.selectedOptions) {
        selectedMethods.value = item.metadata.selectedOptions
    }

    uni.pageScrollTo({ scrollTop: 0, duration: 300 })
    showNotification('进入编辑模式', 'success')
}

</script>

<style lang="scss" scoped>
// Variables
$indigo-50: #eef2ff;
$indigo-100: #e0e7ff;
$indigo-200: #c7d2fe;
$indigo-500: #6366f1;
$indigo-600: #4f46e5;
$indigo-700: #4338ca;

$slate-50: #f8fafc;
$slate-100: #f1f5f9;
$slate-200: #e2e8f0;
$slate-300: #cbd5e1;
$slate-400: #94a3b8;
$slate-500: #64748b;
$slate-700: #334155;
$slate-800: #1e293b;
$slate-900: #0f172a;

$emerald-100: #d1fae5;
$emerald-200: #a7f3d0;
$emerald-800: #065f46;

$red-100: #fee2e2;
$red-200: #fecaca;
$red-800: #991b1b;

.container {
    padding-bottom: 200rpx;
    background-color: #f9fafb;
    min-height: 100vh;
}

// Notification
.notification {
    position: fixed;
    top: 32rpx;
    left: 50%;
    transform: translateX(-50%);
    padding: 24rpx 48rpx;
    border-radius: 9999rpx;
    display: flex;
    align-items: center;
    gap: 16rpx;
    z-index: 999;
    box-shadow: 0 10rpx 15rpx -3rpx rgba(0, 0, 0, 0.1);

    &.success {
        background-color: $emerald-100;
        color: $emerald-800;
        border: 1px solid $emerald-200;
    }

    &.error {
        background-color: $red-100;
        color: $red-800;
        border: 1px solid $red-200;
    }

    .notification-text {
        font-size: 28rpx;
        font-weight: 500;
    }
}

.main-content {
    padding: 32rpx;
    display: flex;
    flex-direction: column;
    gap: 32rpx;
}

// Header
.header-section {
    display: flex;
    align-items: center;
    gap: 32rpx;
    padding: 16rpx 8rpx;

    .icon-box {
        background-color: $indigo-600;
        padding: 24rpx;
        border-radius: 32rpx;
        box-shadow: 0 10rpx 15rpx -3rpx $indigo-200;
        transform: rotate(3deg);
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .page-title {
        font-size: 40rpx;
        font-weight: 800;
        color: $slate-900;
        letter-spacing: -0.025em;
    }
}

// Cards
.section-card {
    background-color: #ffffff;
    border-radius: 40rpx;
    box-shadow: 0 4rpx 6rpx -1rpx rgba(0, 0, 0, 0.05);
    border: 1px solid $slate-100;
    overflow: hidden;

    .card-content {
        padding: 32rpx;
        display: flex;
        flex-direction: column;
        gap: 32rpx;
    }
}

// Form Elements
.form-group {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.label {
    font-size: 28rpx;
    font-weight: 700;
    color: $slate-700;
    margin-left: 8rpx;
}

.input-container {
    position: relative;
    background-color: $slate-50;
    border-radius: 32rpx;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

    .input-icon-left {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        padding-left: 32rpx;
        display: flex;
        align-items: center;
        color: $slate-400;
    }

    .input-field {
        width: 100%;
        padding: 32rpx 32rpx 32rpx 96rpx;
        border: none;
        background: transparent;
        font-size: 32rpx;
        height: 110rpx;
    }

    .input-suffix {
        position: absolute;
        right: 32rpx;
        top: 0;
        bottom: 0;
        display: flex;
        align-items: center;

        .suffix-text {
            background-color: $indigo-50;
            color: $indigo-600;
            padding: 8rpx 16rpx;
            border-radius: 16rpx;
            font-size: 24rpx;
            font-weight: 700;
        }
    }
}

// Row Items
.form-row-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx 32rpx; // Added horizontal padding to match card content
    border-bottom: 1px solid $slate-50;

    &:last-child {
        border-bottom: none;
    }

    .row-label {
        font-size: 30rpx;
        font-weight: 600;
        color: $slate-700;
        display: flex;
        align-items: center;
        gap: 16rpx;
    }

    .row-value {
        font-size: 30rpx;
        color: $slate-500;
        display: flex;
        align-items: center;
        gap: 8rpx;

        &.highlight {
            color: $indigo-600;
            font-weight: 600;
        }
    }
}

.reminder-btn {
    background-color: $indigo-50;
    color: $indigo-600;
    padding: 12rpx 24rpx;
    border-radius: 16rpx;
    font-size: 26rpx;
    font-weight: 600;
}

// TextArea
.textarea-field {
    width: 100%;
    height: 200rpx;
    padding: 24rpx;
    background-color: $slate-50;
    border-radius: 24rpx;
    font-size: 28rpx;
}

// Footer
.footer-actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 48rpx 32rpx;
    background-color: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    z-index: 100;
}

.save-btn {
    width: 100%;
    padding: 24rpx;
    background-color: $indigo-600;
    border-radius: 32rpx;
    border: none;
    box-shadow: 0 10rpx 20rpx -5rpx $indigo-200;

    .btn-content {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12rpx;
    }

    .btn-text {
        color: #fff;
        font-size: 34rpx;
        font-weight: 700;
    }
}

// Tags
.tag-group {
    display: flex;
    gap: 16rpx;
    flex-wrap: wrap;
}

// Stool Status Tag Grid (7-tag single select)
.stool-tag-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16rpx;
}

.stool-tag-item {
    padding: 20rpx 16rpx;
    background-color: $slate-50;
    border-radius: 16rpx;
    text-align: center;
    font-size: 26rpx;
    color: $slate-700;
    transition: all 0.2s ease;

    &.active {
        background-color: $indigo-600;
        color: #ffffff;
        font-weight: 600;
    }

    &:active {
        transform: scale(0.95);
    }
}

.tag-item {
    padding: 20rpx 40rpx;
    background-color: $slate-50;
    border-radius: 24rpx;

    &.active {
        background-color: $indigo-600;
        color: #ffffff;

        .u-icon {
            color: #ffffff !important;
        }
    }
}

// Status Toggle
.status-toggle-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    padding-bottom: 24rpx;
    border-bottom: 1rpx solid #f1f5f9;
}

.toggle-group {
    display: flex;
    background-color: #f1f5f9;
    border-radius: 16rpx;
    padding: 4rpx;
}

.toggle-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 10rpx 24rpx;
    border-radius: 12rpx;
    font-size: 24rpx;
    color: #64748b;
    transition: all 0.3s ease;

    &.active {
        background-color: #3b82f6;
        /* indigo-500 or blue */
        color: white;
        font-weight: 600;
        box-shadow: 0 2rpx 8rpx rgba(59, 130, 246, 0.2);
    }
}

// Tag Group
.tag-group {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.tag-item {
    padding: 16rpx 32rpx;
    border-radius: 20rpx;
    background-color: $slate-100;
    color: $slate-700;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 12rpx;
    border: 1px solid transparent;

    &.active {
        background-color: $indigo-600;
        color: #fff;
        box-shadow: 0 4rpx 12rpx -2rpx $indigo-200;
    }
}

// Popups
.popup-content {
    padding: 48rpx 32rpx;
    background: #fff;
    border-radius: 48rpx 48rpx 0 0;
    gap: 48rpx;
    display: flex;
    flex-direction: column;
}

.popup-header {
    text-align: center;
    font-size: 36rpx;
    font-weight: 700;
    color: $slate-900;
}

.reminder-switch-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.frequency-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24rpx;
}

.freq-item {
    background: $slate-50;
    padding: 24rpx;
    border-radius: 24rpx;
    text-align: center;
    font-weight: 600;

    &.active {
        background: $indigo-50;
        color: $indigo-600;
        border: 1px solid $indigo-500;
    }
}

.custom-freq-input {
    margin-top: 24rpx;
    padding: 24rpx;
    background: $slate-50;
    border-radius: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 24rpx;

    .input-row {
        display: flex;
        align-items: center;
        gap: 16rpx;
        font-size: 32rpx;
        font-weight: 600;
        color: $slate-700;

        .freq-num-input {
            width: 120rpx;
            height: 80rpx;
            background: #fff;
            border-radius: 12rpx;
            text-align: center;
            font-size: 36rpx;
            border: 1px solid $slate-200;
        }
    }

    .unit-options {
        display: flex;
        gap: 16rpx;
        overflow-x: auto;
        padding-bottom: 8rpx;

        .unit-item {
            padding: 12rpx 24rpx;
            background: #fff;
            border-radius: 12rpx;
            border: 1px solid $slate-200;
            font-size: 26rpx;
            white-space: nowrap;

            &.active {
                background: $indigo-600;
                color: #fff;
                border-color: $indigo-600;
            }
        }
    }
}

// Scheduled List
.reminder-list-section {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
    margin-top: 16rpx;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 16rpx;

    .section-title {
        font-size: 32rpx;
        font-weight: 700;
    }

    .badge {
        background: $indigo-100;
        color: $indigo-700;
        padding: 4rpx 16rpx;
        border-radius: 999rpx;
        font-size: 24rpx;
        font-weight: 700;
    }
}

.reminder-list {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.reminder-item {
    background: #fff;
    border-radius: 32rpx;
    padding: 24rpx 32rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4rpx 6rpx -1rpx rgba(0, 0, 0, 0.05);
    border: 1px solid $slate-100;

    .reminder-content {
        display: flex;
        flex-direction: column;
        gap: 8rpx;
    }

    .reminder-main {
        display: flex;
        align-items: center;
        gap: 12rpx;
    }

    .reminder-time {
        font-size: 30rpx;
        font-weight: 600;
        color: $slate-700;
    }

    .reminder-note {
        font-size: 24rpx;
        color: $slate-400;
        padding-left: 48rpx;
    }

    .repeat-tag-small {
        display: flex;
        align-items: center;
        gap: 8rpx;
        font-size: 22rpx;
        color: $indigo-500;
        padding-left: 48rpx;
    }

    .delete-btn {
        padding: 16rpx;
        border-radius: 50%;
        background: $red-100;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}

.tips-box {
    background-color: #fffbeb;
    padding: 16rpx;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 16rpx;

    .tips-text {
        font-size: 24rpx;
        color: #d97706;
    }
}
</style>
