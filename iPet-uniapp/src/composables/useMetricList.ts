import { computed } from 'vue'
import { useHealthStore } from '@/stores/healthStore'
import { getAllMetricKeys } from '@/data/metricMetadata'
import { useMetricProcessor } from '@/composables/useMetricProcessor'
import { SECTION_META, determineTimeSection } from '@/utils/common/timeGrouper'

export function useMetricList() {
    const healthStore = useHealthStore()
    const { getMetricUIConfig } = useMetricProcessor()

    const groupedSections = computed(() => {
        const now = new Date()
        // Trigger dependency on healthStore.ids to ensure reactivity when records change
        // eslint-disable-next-line no-unused-vars
        const _trigger = healthStore.ids

        // Define section group type
        type SectionGroup = { title: string; key: string; items: ReturnType<typeof getMetricUIConfig>[] }

        // Initialize groups based on SECTION_META
        const groups: Record<string, SectionGroup> = {}
        Object.keys(SECTION_META).forEach(key => {
            const meta = SECTION_META[key as keyof typeof SECTION_META]
            groups[key] = { ...meta, items: [] }
        })

        const allMetricKeys = getAllMetricKeys()

        allMetricKeys.forEach((key) => {
            const config = getMetricUIConfig(key)
            if (!config) return

            const latestTimestamp = config.timestamp
            const latestDate = latestTimestamp ? new Date(latestTimestamp) : null
            const sectionKey = determineTimeSection(latestDate, now)

            if (groups[sectionKey]) {
                groups[sectionKey].items.push(config)
            }
        })

        // Sort items within groups
        Object.values(groups).forEach((group) => {
            group.items.sort((a, b) => {
                return ((b?.timestamp ?? 0) - (a?.timestamp ?? 0))
            })
        })

        return Object.keys(SECTION_META)
            .map(key => groups[key])
            .filter((group) => group.items.length > 0)
    })

    return {
        groupedSections,
        refresh: () => { } // No-op as computed updates automatically
    }
}

