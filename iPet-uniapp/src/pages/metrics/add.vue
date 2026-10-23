<template>
    <view class="page-container">
        <!-- Toast Notification -->
        <transition name="toast-fade">
            <view v-if="notification" class="toast" :class="[notification.type]">
                <view class="toast-icon">
                    <u-icon :name="notification.type === 'success' ? 'checkmark-circle-fill' : 'info-circle-fill'"
                        :color="notification.type === 'success' ? '#10b981' : '#ef4444'" size="20" />
                </view>
                <text class="toast-text">{{ notification.message }}</text>
            </view>
        </transition>

        <!-- Main Content Card -->
        <view class="main-card">
            <!-- Header with Icon & Title -->
            <view class="header">
                <view class="header-icon" :style="{ background: headerGradient }">
                    <u-icon :name="pageIcon" color="#ffffff" size="24" />
                </view>
                <view class="header-info">
                    <text class="header-title">{{ pageTitle }}</text>
                    <text class="header-subtitle">{{ metricMeta.description || '记录健康数据' }}</text>
                </view>
            </view>

            <!-- Mode Toggle (Task Mode Only) -->
            <view v-if="isTaskMode" class="mode-toggle-section">
                <view class="mode-toggle">
                    <view class="mode-option" :class="{ active: !isDirectCompletion }"
                        @click="isDirectCompletion = false">
                        <view class="mode-icon">
                            <u-icon name="clock" size="16" :color="!isDirectCompletion ? '#fff' : '#94a3b8'" />
                        </view>
                        <text class="mode-label">加入待办</text>
                    </view>
                    <view class="mode-option" :class="{ active: isDirectCompletion }"
                        @click="isDirectCompletion = true">
                        <view class="mode-icon">
                            <u-icon name="checkmark" size="16" :color="isDirectCompletion ? '#fff' : '#94a3b8'" />
                        </view>
                        <text class="mode-label">直接完成</text>
                    </view>
                </view>
            </view>

            <!-- Form Sections -->
            <view class="form-sections">
                <!-- Section 1: Method/Type Selection (Task Mode) -->
                <view v-if="isTaskMode && formConfigOptions.length > 0" class="form-section">
                    <view class="section-header">
                        <text class="section-label">{{ formConfig?.multiSelect ? '选择方式（可多选）' : '选择类型'
                        }}</text>
                    </view>

                    <!-- Deworming Tips -->
                    <view v-if="isScheduleMode && metricKey === 'deworming'" class="tip-banner">
                        <u-icon name="info-circle" size="16" color="#f59e0b" />
                        <text class="tip-text">体内和体外驱虫周期不同，请分别创建计划</text>
                    </view>

                    <view class="chip-grid">
                        <view v-for="method in formConfigOptions" :key="String(method.value)" class="chip"
                            :class="{ active: selectedMethods.includes(String(method.value)) }"
                            @click="toggleMethod(String(method.value))">
                            <text class="chip-text">{{ method.label }}</text>
                            <view v-if="selectedMethods.includes(String(method.value))" class="chip-check">
                                <u-icon name="checkmark" color="#fff" size="12" />
                            </view>
                        </view>
                    </view>
                </view>

                <!-- Section 2: Stool Status Tags -->
                <view v-if="isStatusTagMode && formConfigOptions.length > 0" class="form-section">
                    <view class="section-header">
                        <text class="section-label">排泄状态</text>
                    </view>
                    <view class="status-grid">
                        <view v-for="option in formConfigOptions" :key="String(option.value)" class="status-chip"
                            :class="{ active: selectedStoolStatus === option.value }"
                            @click="selectStoolStatus(option.value as number)">
                            <text class="status-text">{{ option.label }}</text>
                        </view>
                    </view>
                </view>

                <!-- Section 3: Numeric Value Input -->
                <view v-if="!isEventMetric" class="form-section">
                    <view class="section-header">
                        <text class="section-label">{{ valueLabel }}</text>
                    </view>
                    <view class="value-input-wrapper">
                        <view class="value-input-box">
                            <input type="digit" v-model="formData.value" class="value-input" placeholder="请输入数值" />
                            <view class="value-unit">
                                <text class="unit-text">{{ unitLabel || '单位' }}</text>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- Section 4: Fallback for Task Mode without options -->
                <view v-if="isTaskMode && formConfigOptions.length === 0" class="form-section">
                    <view class="checkin-card">
                        <view class="checkin-icon">
                            <u-icon name="checkmark-circle" color="#10b981" size="32" />
                        </view>
                        <text class="checkin-text">{{ isScheduleMode ? '计划执行' : '完成打卡' }}</text>
                    </view>
                </view>

                <!-- Section 5: Date & Time -->
                <view class="form-section">
                    <view class="section-header">
                        <text class="section-label">时间设置</text>
                    </view>
                    <view class="datetime-row">
                        <view class="datetime-field" @click="showCalendar = true">
                            <view class="datetime-icon">
                                <u-icon name="calendar" color="#6366f1" size="20" />
                            </view>
                            <view class="datetime-content">
                                <text class="datetime-label">日期</text>
                                <text class="datetime-value">{{ formData.date }}</text>
                            </view>
                            <u-icon name="arrow-right" color="#cbd5e1" size="16" />
                        </view>
                        <view class="datetime-field" @click="showTimePicker = true">
                            <view class="datetime-icon">
                                <u-icon name="clock" color="#6366f1" size="20" />
                            </view>
                            <view class="datetime-content">
                                <text class="datetime-label">时间</text>
                                <text class="datetime-value">{{ formData.time }}</text>
                            </view>
                            <u-icon name="arrow-right" color="#cbd5e1" size="16" />
                        </view>
                    </view>
                </view>

                <!-- Section 6: Repeat (Schedule Mode) or Reminder (Record Mode) -->
                <view class="form-section">
                    <view class="section-header">
                        <text class="section-label">{{ isScheduleMode ? '重复设置' : '提醒设置' }}</text>
                    </view>
                    <view class="setting-field"
                        @click="isScheduleMode ? (showRepeatSheet = true) : (showReminderSheet = true)">
                        <view class="setting-icon">
                            <u-icon :name="isScheduleMode ? 'reload' : 'bell'" color="#6366f1" size="20" />
                        </view>
                        <view class="setting-content">
                            <text class="setting-value">{{ isScheduleMode ? currentRepeatLabel : reminderButtonText
                            }}</text>
                        </view>
                        <u-icon name="arrow-right" color="#cbd5e1" size="16" />
                    </view>
                </view>

                <!-- Section 7: Notes -->
                <view class="form-section">
                    <view class="section-header">
                        <text class="section-label">备注</text>
                        <text class="section-hint">选填</text>
                    </view>
                    <view class="textarea-wrapper">
                        <textarea v-model="formData.note" class="note-textarea" placeholder="添加备注信息..."
                            :maxlength="500" />
                    </view>
                </view>
            </view>

            <!-- Submit Button -->
            <view class="submit-section">
                <button class="submit-btn" :class="{ disabled: isSubmitting }" @click="handleSubmit"
                    :disabled="isSubmitting">
                    <view v-if="isSubmitting" class="btn-loading">
                        <u-loading-icon color="#ffffff" size="20" />
                    </view>
                    <view v-else class="btn-content">
                        <u-icon :name="isScheduleMode ? 'bell' : 'checkmark-circle'" color="#ffffff" size="20" />
                        <text class="btn-text">{{ submitButtonText }}</text>
                    </view>
                </button>
            </view>
        </view>

        <!-- Scheduled List (Schedule Mode Only) -->
        <view v-if="isScheduleMode && scheduledList.length > 0" class="scheduled-section">
            <view class="scheduled-header">
                <text class="scheduled-title">已预约</text>
                <view class="scheduled-badge">{{ scheduledList.length }}</view>
            </view>
            <view class="scheduled-list">
                <view v-for="item in scheduledList" :key="item.id" class="scheduled-item"
                    @click="loadRecordForEdit(item)">
                    <view class="scheduled-main">
                        <view class="scheduled-icon">
                            <u-icon name="calendar" color="#6366f1" size="18" />
                        </view>
                        <view class="scheduled-info">
                            <text class="scheduled-time">{{ formatReminderTime(item) }}</text>
                            <text v-if="item.notes" class="scheduled-note">{{ item.notes }}</text>
                            <view v-if="item.metadata?.repeat && item.metadata.repeat !== 'none'"
                                class="scheduled-repeat">
                                <u-icon name="reload" size="12" color="#6366f1" />
                                <text class="repeat-label">{{ getRepeatLabel(item.metadata.repeat) }}</text>
                            </view>
                        </view>
                    </view>
                    <view class="scheduled-delete" @click.stop="handleDelete(item.id)">
                        <u-icon name="trash" color="#ef4444" size="18" />
                    </view>
                </view>
            </view>
        </view>

        <!-- Pickers -->
        <u-datetime-picker :show="showCalendar" v-model="pickerDateValue" mode="date" @confirm="onDateConfirm"
            @cancel="showCalendar = false" />

        <u-datetime-picker :show="showTimePicker" v-model="pickerTimeValue" mode="time" @confirm="onTimeConfirm"
            @cancel="showTimePicker = false" />

        <!-- Reminder Bottom Sheet -->
        <u-popup :show="showReminderSheet" @close="showReminderSheet = false" mode="bottom" :round="24">
            <view class="sheet-content">
                <view class="sheet-header">
                    <text class="sheet-title">提醒设置</text>
                    <view class="sheet-close" @click="showReminderSheet = false">
                        <u-icon name="close" color="#94a3b8" size="24" />
                    </view>
                </view>

                <view class="freq-grid">
                    <view v-for="freq in FREQUENCY_OPTIONS" :key="freq.value" class="freq-chip"
                        :class="{ active: reminderFrequency === freq.value }" @click="selectFrequency(freq.value)">
                        <text class="freq-text">{{ freq.label }}</text>
                    </view>
                </view>

                <!-- Custom Frequency -->
                <view v-if="reminderFrequency === 'custom'" class="custom-section">
                    <view class="custom-row">
                        <text class="custom-prefix">每</text>
                        <input type="number" v-model="customFrequency" class="custom-input" />
                    </view>
                    <view class="unit-row">
                        <view v-for="unit in CUSTOM_UNIT_OPTIONS" :key="unit.value" class="unit-chip"
                            :class="{ active: customFrequencyUnit === unit.value }"
                            @click="customFrequencyUnit = unit.value">
                            <text class="unit-text">{{ unit.label }}</text>
                        </view>
                    </view>
                </view>

                <button class="sheet-confirm-btn" @click="showReminderSheet = false">
                    <text class="confirm-text">确认</text>
                </button>
            </view>
        </u-popup>

        <!-- Repeat Bottom Sheet -->
        <u-action-sheet :show="showRepeatSheet" :actions="repeatOptions" title="选择重复频率" @select="onRepeatSelect"
            @close="showRepeatSheet = false" />
    </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import { useHealthStore } from '@/stores/healthStore'
import { usePetStore } from '@/stores/petStore'
import { emitDataChanged } from '@/services/syncEvents'
import { getMetricMetadata, type MetricMetadata, type MetricEnumOption, type MetricKey } from '@/data/metricMetadata'
import { useUnitConverter } from '@/composables/useUnitConverter'

// ============================================================================
// Setup Stores & Utils
// ============================================================================

const healthStore = useHealthStore()
const petStore = usePetStore()
const { convertToBaseValue } = useUnitConverter()

// ============================================================================
// State
// ============================================================================

const metricKey = ref('weight')
const currentMode = ref<'record' | 'schedule'>('record')
const isSubmitting = ref(false)
const notification = ref<{ message: string, type: 'success' | 'error' } | null>(null)
const editingRecordId = ref<string | null>(null)
const isDirectCompletion = ref(false)

const formData = ref({
    value: '',
    date: dayjs().format('YYYY-MM-DD'),
    time: dayjs().format('HH:mm'),
    note: '',
    repeat: 'none'
})

// Picker States
const showCalendar = ref(false)
const showTimePicker = ref(false)
const showReminderSheet = ref(false)
const showRepeatSheet = ref(false)
const pickerDateValue = ref(Number(new Date()))
const pickerTimeValue = ref(dayjs().format('HH:mm'))

// Selection States
const selectedMethods = ref<string[]>([])
const selectedStoolStatus = ref<number | null>(null)

// Reminder Config
const reminderFrequency = ref('never')
const customFrequency = ref(1)
const customFrequencyUnit = ref('day')

// ============================================================================
// Constants
// ============================================================================

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

const repeatOptions = [
    { name: '不重复', value: 'none' },
    { name: '每天', value: 'day' },
    { name: '每周', value: 'week' },
    { name: '每月', value: 'month' },
    { name: '每3个月', value: 'month_3' },
    { name: '每半年', value: 'month_6' },
    { name: '每年', value: 'year' }
]

// ============================================================================
// Computed Properties
// ============================================================================

const metricMeta = computed<MetricMetadata>(() => getMetricMetadata(metricKey.value) || {
    key: metricKey.value as MetricKey,
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

// Dynamic header gradient based on category
const headerGradient = computed(() => {
    const category = metricMeta.value.category
    const gradients: Record<string, string> = {
        bodyMeasurement: 'linear-gradient(135deg, #3b82f6, #6366f1)',
        vitalSigns: 'linear-gradient(135deg, #ef4444, #f97316)',
        nutritionIntake: 'linear-gradient(135deg, #10b981, #059669)',
        activity: 'linear-gradient(135deg, #f59e0b, #eab308)',
        medication: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
        mentalHealth: 'linear-gradient(135deg, #ec4899, #f472b6)',
        excretion: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        otherData: 'linear-gradient(135deg, #64748b, #94a3b8)'
    }
    return gradients[category] || gradients.otherData
})

const submitButtonText = computed(() => {
    if (isScheduleMode.value) {
        return editingRecordId.value ? '保存修改' : '确认预约'
    }
    return '保存记录'
})

const isTaskMode = computed(() => {
    if (['deworming', 'vaccine', 'bathing', 'tooth_brushing'].includes(metricKey.value)) {
        return true
    }
    return metricMeta.value.interactionMode === 'task' ||
        (metricMeta.value.features?.schedulable && metricMeta.value.valueType !== 'number')
})

const formConfig = computed(() => metricMeta.value.formConfig)

const formConfigOptions = computed<MetricEnumOption[]>(() => {
    const config = formConfig.value
    if (!config || !config.options) return []
    return config.options as MetricEnumOption[]
})

const isStatusTagMode = computed(() => metricMeta.value.interactionMode === 'status_tag')

const isEventMetric = computed(() => {
    if (isStatusTagMode.value) return true
    return isTaskMode.value || ['bathing', 'vaccine', 'vomiting'].includes(metricKey.value)
})

const reminderButtonText = computed(() => {
    if (reminderFrequency.value === 'never') return '不提醒'
    if (reminderFrequency.value === 'custom') {
        const unitLabelText = CUSTOM_UNIT_OPTIONS.find(u => u.value === customFrequencyUnit.value)?.label
        return `提醒: 每 ${customFrequency.value} ${unitLabelText}`
    }
    const freq = FREQUENCY_OPTIONS.find(f => f.value === reminderFrequency.value)
    return freq ? `提醒: ${freq.label}` : '已开启提醒'
})

const currentRepeatLabel = computed(() => {
    const opt = repeatOptions.find(o => o.value === formData.value.repeat)
    return opt ? opt.name : '不重复'
})

const getRepeatLabel = (val: string) => {
    const opt = repeatOptions.find(o => o.value === val)
    return opt ? opt.name : ''
}

// ============================================================================
// Scheduled List
// ============================================================================

const scheduledList = computed(() => {
    if (!petStore.selectedPetId) return []
    const history = healthStore.metricHistory(metricKey.value)
    const now = dayjs()

    return history
        .filter((record: any) => {
            const isFuture = dayjs(record.date).isAfter(now)
            const isScheduled = record.metadata?.isScheduled === true || record.source === 'schedule'
            return (isFuture && isScheduled) || (isFuture && record.metadata?.targetDate)
        })
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
})

const formatReminderTime = (item: any) => {
    return dayjs(item.date).format('YYYY年M月D日 HH:mm')
}

// ============================================================================
// Lifecycle
// ============================================================================

onLoad(async (options: any) => {
    if (options?.key) {
        metricKey.value = options.key
    }
    if (options?.mode === 'schedule') {
        currentMode.value = 'schedule'
        formData.value.date = dayjs().add(1, 'day').format('YYYY-MM-DD')
        formData.value.time = '09:00'

        if (petStore.selectedPetId) {
            await (healthStore as any).fetchHealthRecords(petStore.selectedPetId)
        }
    }
})

// ============================================================================
// Methods
// ============================================================================

const showNotification = (message: string, type: 'success' | 'error') => {
    notification.value = { message, type }
    setTimeout(() => {
        notification.value = null
    }, 3000)
}

const toggleMethod = (value: string) => {
    if (!formConfig.value) return

    if (formConfig.value.multiSelect || metricKey.value === 'deworming') {
        const index = selectedMethods.value.indexOf(value)
        if (index === -1) {
            selectedMethods.value.push(value)
        } else {
            selectedMethods.value.splice(index, 1)
        }
    } else {
        selectedMethods.value = [value]
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

const selectStoolStatus = (value: number) => {
    selectedStoolStatus.value = value
}

const onDateConfirm = (e: any) => {
    formData.value.date = dayjs(e.value).format('YYYY-MM-DD')
    showCalendar.value = false
}

const onTimeConfirm = (e: any) => {
    formData.value.time = e.value
    showTimePicker.value = false
}

const onRepeatSelect = (e: any) => {
    formData.value.repeat = e.value
    showRepeatSheet.value = false
}

const handleSubmit = async () => {
    // Validation
    if (isStatusTagMode.value && selectedStoolStatus.value === null) {
        showNotification('请选择排泄状态', 'error')
        return
    }

    if (!isEventMetric.value && !isScheduleMode.value && !isStatusTagMode.value) {
        if (!formData.value.value) {
            showNotification('请输入数值', 'error')
            return
        }
        if (Number.isNaN(Number(formData.value.value))) {
            showNotification('请输入正确的数值', 'error')
            return
        }
    }

    const petId = petStore.selectedPetId || petStore.currentPet?.id
    if (!petId) {
        showNotification('请先选择宠物', 'error')
        return
    }

    if (isScheduleMode.value && metricKey.value === 'deworming' && selectedMethods.value.length === 0) {
        showNotification('请选择驱虫类型', 'error')
        return
    }

    isSubmitting.value = true

    try {
        const fullDateTimeStr = `${formData.value.date} ${formData.value.time}`
        const dateObj = dayjs(fullDateTimeStr, 'YYYY-MM-DD HH:mm')
        const isoDate = dateObj.toISOString()
        const timestamp = dateObj.valueOf()

        const isTask = isTaskMode.value
        const isDirect = isDirectCompletion.value
        const isFuture = dateObj.isAfter(dayjs(), 'minute')
        const shouldSchedule = isTask ? !isDirect : (isScheduleMode.value || isFuture)

        let valueForStorage = 1
        let finalUnit = unitLabel.value

        if (isStatusTagMode.value && selectedStoolStatus.value !== null) {
            valueForStorage = selectedStoolStatus.value
            finalUnit = 'status'
        } else if (!isEventMetric.value && !isScheduleMode.value && !shouldSchedule) {
            const numericValue = Number(formData.value.value)
            const metricUnit = metricBaseUnit.value || metricMeta.value.displayUnit || ''
            valueForStorage = metricUnit ? convertToBaseValue(numericValue, metricUnit) : numericValue
        } else {
            valueForStorage = 1
            finalUnit = 'count'
        }

        const metadata: any = {}

        if (selectedMethods.value.length > 0) {
            metadata.selectedOptions = selectedMethods.value
        }

        if (shouldSchedule) {
            metadata.isScheduled = true
            metadata.targetDate = timestamp

            let finalRepeat = formData.value.repeat || 'none'
            if (finalRepeat === 'none' && reminderFrequency.value !== 'never') {
                const map: Record<string, string> = {
                    'hour': 'hour', 'day': 'day', 'weekdays': 'weekdays', 'weekends': 'weekends',
                    'week': 'week', 'biweek': 'biweek', 'month': 'month', 'quarter': 'month_3',
                    'halfYear': 'month_6', 'year': 'year', 'custom': 'custom'
                }
                if (map[reminderFrequency.value]) {
                    finalRepeat = map[reminderFrequency.value]
                }
            }
            metadata.repeat = finalRepeat

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
            source: shouldSchedule ? 'schedule' : 'manual',
            metadata: metadata,
            updatedAt: Date.now()
        }

        if (editingRecordId.value) {
            await (healthStore as any).updateRecord(editingRecordId.value, payload)
            showNotification('修改成功', 'success')
            editingRecordId.value = null
        } else {
            await (healthStore as any).addRecord(payload)
            const successMsg = shouldSchedule ? '预约成功' : '记录已保存'
            showNotification(successMsg, 'success')
        }

        emitDataChanged({ reason: 'metrics:record-added' })
        uni.$emit('metric-history-updated', { key: metricKey.value })

        // Reset form
        formData.value.value = ''
        formData.value.note = ''
        if (isScheduleMode.value) {
            formData.value.repeat = 'none'
        }

    } catch (error: any) {
        console.error('Failed to save record', error)
        showNotification(error.message || '保存失败，请重试', 'error')
    } finally {
        isSubmitting.value = false
    }
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
// ============================================================================
// Design Tokens
// ============================================================================

$primary: #6366f1;
$primary-light: #eef2ff;
$success: #10b981;
$success-light: #d1fae5;
$error: #ef4444;
$error-light: #fee2e2;
$warning: #f59e0b;
$warning-light: #fef3c7;

$gray-50: #f9fafb;
$gray-100: #f3f4f6;
$gray-200: #e5e7eb;
$gray-300: #d1d5db;
$gray-400: #9ca3af;
$gray-500: #6b7280;
$gray-600: #4b5563;
$gray-700: #374151;
$gray-800: #1f2937;
$gray-900: #111827;

$radius-sm: 12rpx;
$radius-md: 16rpx;
$radius-lg: 24rpx;
$radius-xl: 32rpx;
$radius-full: 9999rpx;

// ============================================================================
// Page Container
// ============================================================================

.page-container {
    min-height: 100vh;
    background: linear-gradient(180deg, #f0f4ff 0%, $gray-50 100%);
    padding: 24rpx;
    padding-bottom: 48rpx;
}

// ============================================================================
// Toast Notification
// ============================================================================

.toast {
    position: fixed;
    top: 48rpx;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 24rpx 32rpx;
    border-radius: $radius-full;
    z-index: 9999;
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);

    &.success {
        background: $success-light;
        border: 2rpx solid rgba($success, 0.3);
    }

    &.error {
        background: $error-light;
        border: 2rpx solid rgba($error, 0.3);
    }
}

.toast-icon {
    display: flex;
    align-items: center;
    justify-content: center;
}

.toast-text {
    font-size: 28rpx;
    font-weight: 600;
    color: $gray-800;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
    transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-20rpx);
}

// ============================================================================
// Main Card
// ============================================================================

.main-card {
    background: #fff;
    border-radius: $radius-xl;
    padding: 40rpx 32rpx;
    box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.06);
}

// ============================================================================
// Header
// ============================================================================

.header {
    display: flex;
    align-items: center;
    gap: 24rpx;
    margin-bottom: 32rpx;
}

.header-icon {
    width: 96rpx;
    height: 96rpx;
    border-radius: $radius-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 24rpx rgba($primary, 0.3);
}

.header-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.header-title {
    font-size: 40rpx;
    font-weight: 700;
    color: $gray-900;
    letter-spacing: -0.5rpx;
}

.header-subtitle {
    font-size: 26rpx;
    color: $gray-500;
    line-height: 1.4;
}

// ============================================================================
// Mode Toggle
// ============================================================================

.mode-toggle-section {
    margin-bottom: 32rpx;
}

.mode-toggle {
    display: flex;
    background: $gray-100;
    border-radius: $radius-md;
    padding: 8rpx;
}

.mode-option {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    padding: 20rpx 24rpx;
    border-radius: $radius-sm;
    transition: all 0.3s ease;

    &.active {
        background: $primary;
        box-shadow: 0 4rpx 16rpx rgba($primary, 0.3);

        .mode-label {
            color: #fff;
        }
    }
}

.mode-icon {
    display: flex;
}

.mode-label {
    font-size: 28rpx;
    font-weight: 600;
    color: $gray-500;
}

// ============================================================================
// Form Sections
// ============================================================================

.form-sections {
    display: flex;
    flex-direction: column;
    gap: 32rpx;
}

.form-section {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.section-label {
    font-size: 28rpx;
    font-weight: 700;
    color: $gray-700;
}

.section-hint {
    font-size: 24rpx;
    color: $gray-400;
}

// ============================================================================
// Tip Banner
// ============================================================================

.tip-banner {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 20rpx 24rpx;
    background: $warning-light;
    border-radius: $radius-md;
    margin-bottom: 8rpx;
}

.tip-text {
    font-size: 24rpx;
    color: #b45309;
    flex: 1;
}

// ============================================================================
// Chip Grid (Method Selection)
// ============================================================================

.chip-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.chip {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 20rpx 32rpx;
    background: $gray-100;
    border-radius: $radius-lg;
    border: 2rpx solid transparent;
    transition: all 0.25s ease;

    &.active {
        background: $primary;
        border-color: $primary;
        box-shadow: 0 4rpx 16rpx rgba($primary, 0.25);

        .chip-text {
            color: #fff;
        }
    }

    &:active {
        transform: scale(0.96);
    }
}

.chip-text {
    font-size: 28rpx;
    font-weight: 600;
    color: $gray-700;
}

.chip-check {
    width: 28rpx;
    height: 28rpx;
    background: rgba(#fff, 0.3);
    border-radius: $radius-full;
    display: flex;
    align-items: center;
    justify-content: center;
}

// ============================================================================
// Status Grid (Stool Status)
// ============================================================================

.status-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16rpx;
}

.status-chip {
    padding: 24rpx 16rpx;
    background: $gray-100;
    border-radius: $radius-md;
    text-align: center;
    border: 2rpx solid transparent;
    transition: all 0.25s ease;

    &.active {
        background: $primary;
        border-color: $primary;

        .status-text {
            color: #fff;
        }
    }

    &:active {
        transform: scale(0.96);
    }
}

.status-text {
    font-size: 26rpx;
    font-weight: 600;
    color: $gray-700;
}

// ============================================================================
// Value Input
// ============================================================================

.value-input-wrapper {
    display: flex;
}

.value-input-box {
    flex: 1;
    display: flex;
    align-items: center;
    background: $gray-50;
    border: 2rpx solid $gray-200;
    border-radius: $radius-lg;
    padding: 24rpx 28rpx;
    transition: all 0.25s ease;

    &:focus-within {
        border-color: $primary;
        box-shadow: 0 0 0 6rpx rgba($primary, 0.1);
    }
}

.value-input {
    flex: 1;
    font-size: 36rpx;
    font-weight: 700;
    color: $gray-900;
    background: transparent;
    border: none;
}

.value-unit {
    padding: 12rpx 20rpx;
    background: $primary-light;
    border-radius: $radius-sm;
}

.unit-text {
    font-size: 24rpx;
    font-weight: 700;
    color: $primary;
}

// ============================================================================
// Checkin Card (Task Mode Fallback)
// ============================================================================

.checkin-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;
    padding: 48rpx;
    background: $success-light;
    border-radius: $radius-lg;
}

.checkin-icon {
    width: 80rpx;
    height: 80rpx;
    background: #fff;
    border-radius: $radius-full;
    display: flex;
    align-items: center;
    justify-content: center;
}

.checkin-text {
    font-size: 30rpx;
    font-weight: 700;
    color: #065f46;
}

// ============================================================================
// DateTime Row
// ============================================================================

.datetime-row {
    display: flex;
    gap: 16rpx;
}

.datetime-field {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 24rpx 20rpx;
    background: $gray-50;
    border: 2rpx solid $gray-200;
    border-radius: $radius-lg;
    transition: all 0.25s ease;

    &:active {
        background: $gray-100;
    }
}

.datetime-icon {
    width: 48rpx;
    height: 48rpx;
    background: $primary-light;
    border-radius: $radius-sm;
    display: flex;
    align-items: center;
    justify-content: center;
}

.datetime-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
}

.datetime-label {
    font-size: 22rpx;
    color: $gray-500;
}

.datetime-value {
    font-size: 28rpx;
    font-weight: 600;
    color: $gray-900;
}

// ============================================================================
// Setting Field
// ============================================================================

.setting-field {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 24rpx 20rpx;
    background: $gray-50;
    border: 2rpx solid $gray-200;
    border-radius: $radius-lg;
    transition: all 0.25s ease;

    &:active {
        background: $gray-100;
    }
}

.setting-icon {
    width: 48rpx;
    height: 48rpx;
    background: $primary-light;
    border-radius: $radius-sm;
    display: flex;
    align-items: center;
    justify-content: center;
}

.setting-content {
    flex: 1;
}

.setting-value {
    font-size: 28rpx;
    font-weight: 600;
    color: $gray-900;
}

// ============================================================================
// Textarea
// ============================================================================

.textarea-wrapper {
    background: $gray-50;
    border: 2rpx solid $gray-200;
    border-radius: $radius-lg;
    padding: 24rpx;
    transition: all 0.25s ease;

    &:focus-within {
        border-color: $primary;
        box-shadow: 0 0 0 6rpx rgba($primary, 0.1);
    }
}

.note-textarea {
    width: 100%;
    min-height: 160rpx;
    font-size: 28rpx;
    color: $gray-900;
    background: transparent;
    border: none;
    resize: none;
}

// ============================================================================
// Submit Section
// ============================================================================

.submit-section {
    margin-top: 40rpx;
}

.submit-btn {
    width: 100%;
    height: 104rpx;
    background: linear-gradient(135deg, $primary 0%, #818cf8 100%);
    border-radius: $radius-lg;
    border: none;
    box-shadow: 0 12rpx 32rpx rgba($primary, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s ease;

    &:active:not(.disabled) {
        transform: scale(0.98);
        box-shadow: 0 8rpx 24rpx rgba($primary, 0.3);
    }

    &.disabled {
        opacity: 0.6;
    }
}

.btn-loading,
.btn-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
}

.btn-text {
    font-size: 32rpx;
    font-weight: 700;
    color: #fff;
}

// ============================================================================
// Scheduled Section
// ============================================================================

.scheduled-section {
    margin-top: 32rpx;
    background: #fff;
    border-radius: $radius-xl;
    padding: 32rpx;
    box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.06);
}

.scheduled-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 24rpx;
}

.scheduled-title {
    font-size: 32rpx;
    font-weight: 700;
    color: $gray-900;
}

.scheduled-badge {
    padding: 6rpx 16rpx;
    background: $primary-light;
    color: $primary;
    font-size: 24rpx;
    font-weight: 700;
    border-radius: $radius-full;
}

.scheduled-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.scheduled-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx;
    background: $gray-50;
    border-radius: $radius-lg;
    transition: all 0.25s ease;

    &:active {
        background: $gray-100;
    }
}

.scheduled-main {
    display: flex;
    align-items: flex-start;
    gap: 16rpx;
    flex: 1;
}

.scheduled-icon {
    width: 48rpx;
    height: 48rpx;
    background: $primary-light;
    border-radius: $radius-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.scheduled-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.scheduled-time {
    font-size: 28rpx;
    font-weight: 600;
    color: $gray-900;
}

.scheduled-note {
    font-size: 24rpx;
    color: $gray-500;
}

.scheduled-repeat {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.repeat-label {
    font-size: 22rpx;
    color: $primary;
    font-weight: 500;
}

.scheduled-delete {
    width: 56rpx;
    height: 56rpx;
    background: $error-light;
    border-radius: $radius-full;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

// ============================================================================
// Bottom Sheet
// ============================================================================

.sheet-content {
    padding: 32rpx 32rpx 48rpx;
    background: #fff;
    border-radius: $radius-xl $radius-xl 0 0;
}

.sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32rpx;
}

.sheet-title {
    font-size: 36rpx;
    font-weight: 700;
    color: $gray-900;
}

.sheet-close {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.freq-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16rpx;
    margin-bottom: 32rpx;
}

.freq-chip {
    padding: 28rpx 20rpx;
    background: $gray-100;
    border-radius: $radius-md;
    text-align: center;
    border: 2rpx solid transparent;
    transition: all 0.25s ease;

    &.active {
        background: $primary-light;
        border-color: $primary;
    }
}

.freq-text {
    font-size: 26rpx;
    font-weight: 600;
    color: $gray-700;

    .freq-chip.active & {
        color: $primary;
    }
}

.custom-section {
    padding: 24rpx;
    background: $gray-50;
    border-radius: $radius-lg;
    margin-bottom: 32rpx;
}

.custom-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 20rpx;
}

.custom-prefix {
    font-size: 30rpx;
    font-weight: 600;
    color: $gray-700;
}

.custom-input {
    width: 120rpx;
    height: 72rpx;
    background: #fff;
    border: 2rpx solid $gray-200;
    border-radius: $radius-sm;
    text-align: center;
    font-size: 32rpx;
    font-weight: 700;
    color: $gray-900;
}

.unit-row {
    display: flex;
    gap: 12rpx;
    flex-wrap: wrap;
}

.unit-chip {
    padding: 16rpx 24rpx;
    background: #fff;
    border: 2rpx solid $gray-200;
    border-radius: $radius-sm;
    transition: all 0.25s ease;

    &.active {
        background: $primary;
        border-color: $primary;

        .unit-text {
            color: #fff;
        }
    }
}

.unit-chip .unit-text {
    font-size: 24rpx;
    font-weight: 600;
    color: $gray-700;
}

.sheet-confirm-btn {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, $primary 0%, #818cf8 100%);
    border-radius: $radius-lg;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
}

.confirm-text {
    font-size: 30rpx;
    font-weight: 700;
    color: #fff;
}
</style>
