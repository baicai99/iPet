<template>
  <view class="styled-input-container" :class="{ 'is-focused': isFocused }">
    <view class="icon-wrapper" :class="{ 'is-focused': isFocused }">
      <u-icon :name="icon" size="20" :color="isFocused ? '#6366f1' : '#94a3b8'"></u-icon>
    </view>

    <view class="input-wrapper">
      <text class="label" :class="{ 'is-focused': isFocused }">{{ placeholder }}</text>
      <input class="input" :type="inputType" :value="modelValue"
        @input="$emit('update:modelValue', $event.detail.value)" @focus="isFocused = true" @blur="isFocused = false" />
    </view>

    <view v-if="isPassword" class="toggle-password" @click="togglePassword">
      <u-icon :name="showPassword ? 'eye' : 'eye-off'" size="18" color="#cbd5e1"></u-icon>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  icon: { type: String, required: true },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  modelValue: { type: String, default: '' },
  isPassword: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const isFocused = ref(false);
const showPassword = ref(false);

const inputType = computed(() => {
  if (props.isPassword) {
    return showPassword.value ? 'text' : 'password';
  }
  return props.type;
});

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};
</script>

<style lang="scss" scoped>
.styled-input-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  border: 1px solid var(--app-border-color);
  background-color: var(--app-card-bg);
  transition: all 0.3s;
  box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.03);

  &.is-focused {
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow: 0 8rpx 40rpx rgba(99, 102, 241, 0.1);
    transform: translateY(-2rpx);
  }
}

.icon-wrapper {
  padding: 12rpx;
  border-radius: 16rpx;
  background-color: var(--app-active-bg);
  transition: all 0.3s;

  &.is-focused {
    background-color: #eef2ff;
  }
}

.input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}

.label {
  @include text-caption-2;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--app-text-muted);
  margin-bottom: 2rpx;
  transition: color 0.3s;

  &.is-focused {
    color: #6366f1;
  }
}

.input {
  width: 100%;
  background-color: transparent;
  @include text-body;
  font-weight: bold;
  color: var(--app-text-primary);
}

.toggle-password {
  padding: 12rpx;
}
</style>
