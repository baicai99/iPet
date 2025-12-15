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
  width: 0;
  /* Force equal flex distribution */
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--app-card-bg);
  border: 1px solid var(--app-border-color);
  box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.03);
  padding: 20rpx 0;
  border-radius: 20rpx;
  transition: all 0.3s;
  /* ✅ 小程序兼容: 使用 margin 替代父级 gap */
  margin: 0 12rpx;

  &::after {
    border: none;
  }
}

.button-hover {
  background-color: var(--app-active-bg);
  transform: scale(0.95);
}
</style>
