<template>
    <view class="app-navbar-wrapper">
        <up-navbar
            :title="title"
            :bgColor="computedBgColor"
            :fixed="fixed"
            :border="border"
            :placeholder="placeholder"
            :autoBack="autoBack"
            :leftText="leftText"
            :rightText="rightText"
            :leftIcon="leftIcon"
            :rightIcon="rightIcon"
            :safeAreaInsetTop="safeAreaInsetTop"
            :titleStyle="titleStyle"
            @leftClick="handleLeftClick"
            @rightClick="handleRightClick"
        >
            <!-- 左侧插槽 -->
            <template v-if="$slots.left" #left>
                <slot name="left"></slot>
            </template>
            
            <!-- 中间插槽 -->
            <template v-if="$slots.center" #center>
                <slot name="center"></slot>
            </template>
            
            <!-- 右侧插槽 -->
            <template v-if="$slots.right" #right>
                <slot name="right"></slot>
            </template>
        </up-navbar>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    title?: string              // 导航栏标题
    bgColor?: string           // 背景颜色
    fixed?: boolean            // 是否固定在顶部
    border?: boolean           // 是否显示底部边框
    placeholder?: boolean      // 固定时是否生成占位元素
    autoBack?: boolean         // 是否自动返回
    leftText?: string          // 左侧文字
    rightText?: string         // 右侧文字
    leftIcon?: string          // 左侧图标
    rightIcon?: string         // 右侧图标
    safeAreaInsetTop?: boolean // 是否开启顶部安全区适配
    titleStyle?: string | object // 标题样式
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    bgColor: '#ffffff',
    fixed: true,
    border: false,
    placeholder: false,
    autoBack: true,
    leftText: '',
    rightText: '',
    leftIcon: 'arrow-left',
    rightIcon: '',
    safeAreaInsetTop: true,
    titleStyle: ''
})

// Emit events
const emit = defineEmits<{
    leftClick: []
    rightClick: []
}>()

const computedBgColor = computed(() => props.bgColor)

const handleLeftClick = () => {
    emit('leftClick')
}

const handleRightClick = () => {
    emit('rightClick')
}
</script>

<style lang="scss" scoped>
.app-navbar-wrapper {
    // Wrapper for potential future customization
}
</style>
