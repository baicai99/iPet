<template>
  <view class="input-group">
    <text class="input-label">{{ label }}</text>
    <view class="input-container" :class="{ 'is-focused': isFocused }">
      <view class="icon-wrapper">
        <u-icon 
          :name="icon" 
          size="20" 
          :color="isFocused ? '#6366f1' : '#94a3b8'"
        ></u-icon>
      </view>

      <input
        class="input-field"
        type="text"
        :password="passwordMode"
        :value="modelValue"
        :placeholder="placeholder"
        placeholder-class="input-placeholder"
        @input="$emit('update:modelValue', $event.detail.value)"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />

      <view v-if="isPassword" class="toggle-password" @click="togglePassword">
        <u-icon 
          :name="showPassword ? 'eye-off' : 'eye'" 
          size="20" 
          color="#94a3b8"
        ></u-icon>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  placeholder: { type: String, default: '' },
  modelValue: { type: String, default: '' },
  isPassword: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const isFocused = ref(false);
const showPassword = ref(false);

const passwordMode = computed(() => {
  return props.isPassword && !showPassword.value;
});

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};
</script>

<style lang="scss" scoped>
.input-group {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.input-label {
  font-size: 24rpx;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 2rpx;
  margin-left: 8rpx;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  border: 2rpx solid #e2e8f0;
  background-color: #f8fafc;
  transition: all 0.2s ease;

  &.is-focused {
    border-color: #6366f1;
    background-color: #ffffff;
    box-shadow: 0 0 0 6rpx rgba(99, 102, 241, 0.1);
  }
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.input-field {
  flex: 1;
  font-size: 28rpx;
  color: #0f172a;
  background-color: transparent;
}

.input-placeholder {
  color: #94a3b8;
}

.toggle-password {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rpx;
  flex-shrink: 0;
}
</style>
