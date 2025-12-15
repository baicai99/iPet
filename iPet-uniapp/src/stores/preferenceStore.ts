import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/common/request'

export const usePreferenceStore = defineStore('preferences', () => {
    // State
    const metricConfig = ref<Record<string, any>>({})

    // Actions
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
        metricConfig.value = {}
    }

    return {
        metricConfig,
        fetchMetricConfig,
        $reset
    }
}, {
    persist: {
        paths: ['metricConfig']
    } as any
})
