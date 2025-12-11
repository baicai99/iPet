<template>
  <button class="social-button" hover-class="button-hover">
    <u-icon :name="icon" size="24" :color="color"></u-icon>
  </button>
</template>

<script setup>
defineProps({
  icon: { type: String, required: true },
  color: { type: String, default: '#333' }
});
</script>

<style lang="scss" scoped>
.social-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  background-color: #ffffff;
  border: 1px solid #f1f5f9;
  box-shadow: 0 8rpx 40rpx rgba(0,0,0,0.03);
  padding: 20rpx 0;
  border-radius: 20rpx;
  transition: all 0.3s;

  &::after {
    border: none;
  }
}

.button-hover {
  background-color: #f8fafc;
  transform: scale(0.95);
}
</style>
