import { computed, unref } from 'vue'
import { useUnitConverter } from '@/composables/useUnitConverter'

export const useMetricFormatter = () => {
    const { formatValueWithUnit } = useUnitConverter()

    const isEmptyMetricValue = (value: unknown) => {
        if (value === undefined || value === null) {
            return true
        }
        if (typeof value === 'string') {
            const trimmed = value.trim()
            return trimmed === '' || trimmed === '--'
        }
        if (typeof value === 'number') {
            return Number.isNaN(value)
        }
        return false
    }

    const formatMetric = (
        value: number | string | null | undefined,
        unit: string | undefined,
        baseValue?: number | string | null,
        baseUnit?: string
    ) => {
        // 1. Resolve the actual value to display (handle base value conversion if present)
        let resolvedValue = value
        let resolvedUnit = unit || ''

        if (baseValue !== null && baseValue !== undefined && baseUnit) {
            const numeric = Number(baseValue)
            if (!Number.isNaN(numeric)) {
                const converted = formatValueWithUnit(numeric, baseUnit)
                resolvedValue = converted.value
                resolvedUnit = converted.unit
            }
        }

        // 2. Check for empty state
        if (isEmptyMetricValue(resolvedValue)) {
            return {
                displayValue: '暂无数据',
                displayUnit: '',
                isValueText: true,
                rawValue: resolvedValue
            }
        }

        // 3. Format valid value
        let displayValue = resolvedValue as string | number
        if (typeof resolvedValue === 'number') {
            displayValue = Number.isInteger(resolvedValue)
                ? resolvedValue.toString()
                : resolvedValue.toFixed(1)
        }

        // 4. Check if value is text (non-numeric string)
        const isValueText = typeof resolvedValue === 'string' && Number.isNaN(Number(resolvedValue))

        // 5. Handle unit display (hide if value is empty or unit is invalid)
        let displayUnit = resolvedUnit
        if (!displayUnit || displayUnit === '--' || displayUnit === '暂无数据') {
            displayUnit = ''
        }

        return {
            displayValue,
            displayUnit,
            isValueText,
            rawValue: resolvedValue
        }
    }

    return {
        formatMetric,
        isEmptyMetricValue
    }
}
