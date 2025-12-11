<template>
  <svg width="100%" height="100%" :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none" class="overflow-visible opacity-30">
    <path 
      :d="`M0,${height} L${points} L${width},${height}`" 
      :fill="`url(#grad-header-${color})`" 
      stroke="none" 
    />
    <polyline
      fill="none"
      :stroke="color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      :points="points"
    />
    <defs>
      <linearGradient :id="`grad-header-${color}`" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.4" />
        <stop offset="100%" :stop-color="color" stop-opacity="0" />
      </linearGradient>
    </defs>
  </svg>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  color: {
    type: String,
    default: '#6366f1'
  }
});

const data = [10, 15, 12, 25, 18, 30, 25, 40, 35, 20, 10];
const height = 40;
const width = 200; 
const max = Math.max(...data);
const min = Math.min(...data);
const range = max - min || 1;

const points = computed(() => {
  return data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
});
</script>

<style scoped>
.overflow-visible {
  overflow: visible;
}
.opacity-30 {
  opacity: 0.3;
}
</style>
