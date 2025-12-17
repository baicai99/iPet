<template>
  <button class="social-button" hover-class="button-hover">
    <u-icon :name="icon" size="20" :color="color"></u-icon>
    <text v-if="label" class="button-label">{{ label }}</text>
  </button>
</template>

<script setup>
defineProps({
  icon: { type: String, required: true },
  label: { type: String, default: '' },
  color: { type: String, default: '#333' }
});
</script>

<style lang="scss" scoped>
.social-button {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  background-color: #ffffff;
  border: 2rpx solid #e2e8f0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  transition: all 0.2s ease;

  &::after {
    display: none;
  }
}

.button-hover {
  background-color: #f8fafc;
  border-color: #cbd5e1;
}

.button-label {
  font-size: 28rpx;
  font-weight: 500;
  color: #64748b;
}
</style>
