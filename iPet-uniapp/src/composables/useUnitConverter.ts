import { computed } from 'vue'

export const useUnitConverter = () => {
    // Hardcoded to metric as the feature is removed
    const unitSystem = computed(() => 'metric')

    const convertWeight = (kg: number): number => {
        return Number(kg.toFixed(1))
    }

    const convertLength = (cm: number): number => {
        return Math.round(cm)
    }

    const formatWeight = (kg: number): string => {
        return `${kg} kg`
    }

    const formatLength = (cm: number): string => {
        return `${cm} cm`
    }

    const resolveUnitLabel = (metricLabel: string, imperialLabel?: string) => {
        return metricLabel
    }

    const convertValue = (value: number, type: 'weight' | 'length') => {
        return value
    }

    const isConvertibleUnit = (label: string) => {
        return false
    }

    const distanceUnitLabel = computed(() => 'km')

    const formatDistance = (meters: number): string => {
        return (meters / 1000).toFixed(1)
    }

    const formatValueWithUnit = (value: number, unit: string) => {
        return {
            value,
            unit
        }
    }

    const convertToBaseValue = (value: number, unit: string) => {
        return value
    }

    return {
        unitSystem,
        convertWeight,
        convertLength,
        formatWeight,
        formatLength,
        resolveUnitLabel,
        convertValue,
        isConvertibleUnit,
        formatValueWithUnit,
        distanceUnitLabel,
        formatDistance,
        convertToBaseValue
    }
}
