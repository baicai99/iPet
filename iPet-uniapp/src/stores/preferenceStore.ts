import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/utils/common/request'

export type ThemeMode = 'light' | 'dark'

interface PreferenceState {
    theme: ThemeMode;
    metricConfig: Record<string, any>;
}

export const usePreferenceStore = defineStore('preferences', () => {
    // State
    const theme = ref<ThemeMode>('light')
    const metricConfig = ref<Record<string, any>>({})

    // Getters
    const isDarkMode = computed(() => theme.value === 'dark')

    // Actions
    function setTheme(newTheme: ThemeMode) {
        theme.value = newTheme
    }

    function toggleTheme() {
        theme.value = theme.value === 'dark' ? 'light' : 'dark'
    }

    async function fetchMetricConfig() {
        try {
            const config = await request({
                url: '/config/metrics',
                method: 'GET'
            })
            metricConfig.value = config || {}
        } catch (error) {
            console.error('Failed to fetch metric config', error)
        }
    }

    // Custom $reset for Setup Store compatibility if needed
    function $reset() {
        theme.value = 'light'
        metricConfig.value = {}
    }

    return {
        theme,
        metricConfig,
        isDarkMode,
        setTheme,
        toggleTheme,
        fetchMetricConfig,
        $reset
    }
}, {
    persist: {
        paths: ['theme', 'metricConfig']
    } as any
})

