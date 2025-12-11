<template>
    <TextHistory :data="data.rawEvents || []" />
</template>

<script setup>
import TextHistory from '@/components/business/health/history/TextHistory.vue'

defineProps({
    data: {
        type: Object,
        required: true,
        default: () => ({ rawEvents: [] })
    },
    options: {
        type: Object,
        default: () => ({})
    }
})
</script>
