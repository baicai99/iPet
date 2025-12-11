import { computed, type Ref, type ComputedRef } from 'vue'

export type ThemeMode = 'light' | 'dark'

export interface ThemeStyles {
    isDark: ComputedRef<boolean>
    themeClass: ComputedRef<string>
    textClass: ComputedRef<string>
    subTextClass: ComputedRef<string>
    cardBg: ComputedRef<string>
    borderColor: ComputedRef<string>
}

/**
 * Composable for theme-related computed styles
 * Provides consistent theming across components
 */
export function useThemeStyles(theme: Ref<ThemeMode> | ComputedRef<ThemeMode>): ThemeStyles {
    const isDark = computed(() => theme.value === 'dark')

    const themeClass = computed(() => isDark.value ? 'theme-dark' : 'theme-light')

    const textClass = computed(() => isDark.value ? 'text-white' : 'text-gray-900')

    const subTextClass = computed(() => 'text-gray-400')

    const cardBg = computed(() => isDark.value ? '#1C1C1E' : '#ffffff')

    const borderColor = computed(() =>
        isDark.value ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'
    )

    return {
        isDark,
        themeClass,
        textClass,
        subTextClass,
        cardBg,
        borderColor
    }
}

/**
 * Extended theme styles for components with more complex theming needs
 */
export interface ExtendedThemeStyles extends ThemeStyles {
    iconWrapperClass: ComputedRef<string>
    iconColor: ComputedRef<string>
    btnClass: ComputedRef<string>
    btnTextClass: ComputedRef<string>
    btnIconColor: ComputedRef<string>
    avatarRingClass: ComputedRef<string>
    tagPrimaryClass: ComputedRef<string>
    tagSecondaryClass: ComputedRef<string>
}

export function useExtendedThemeStyles(theme: Ref<ThemeMode> | ComputedRef<ThemeMode>): ExtendedThemeStyles {
    const baseStyles = useThemeStyles(theme)
    const { isDark } = baseStyles

    const iconWrapperClass = computed(() =>
        isDark.value ? 'bg-orange-900-20' : 'bg-orange-50'
    )

    const iconColor = computed(() => '#fdba74')

    const btnClass = computed(() => isDark.value ? 'btn-dark' : 'btn-light')

    const btnTextClass = computed(() => isDark.value ? 'text-gray-900' : 'text-white')

    const btnIconColor = computed(() => isDark.value ? '#111827' : '#ffffff')

    const avatarRingClass = computed(() => isDark.value ? 'ring-dark' : 'ring-light')

    const tagPrimaryClass = computed(() =>
        isDark.value ? 'tag-primary-dark' : 'tag-primary-light'
    )

    const tagSecondaryClass = computed(() =>
        isDark.value ? 'tag-secondary-dark' : 'tag-secondary-light'
    )

    return {
        ...baseStyles,
        iconWrapperClass,
        iconColor,
        btnClass,
        btnTextClass,
        btnIconColor,
        avatarRingClass,
        tagPrimaryClass,
        tagSecondaryClass
    }
}
