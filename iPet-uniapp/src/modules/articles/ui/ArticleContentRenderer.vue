<template>
    <view class="article-content-renderer">
        <up-markdown :content="markdownText" :theme="theme" :show-line-number="showLineNumber"
            :preview-img="previewImg"></up-markdown>
    </view>
</template>

<script setup lang="ts">
interface Props {
    markdownText?: string
    theme?: 'light' | 'dark'
    showLineNumber?: boolean
    previewImg?: boolean
}

withDefaults(defineProps<Props>(), {
    markdownText: '',
    theme: 'light',
    showLineNumber: false,
    previewImg: true
})
</script>

<style lang="scss" scoped>
.article-content-renderer {
    width: 100%;

    :deep(.u-markdown) {
        font-size: 30rpx;
        line-height: 1.8;
        color: #374151;

        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
            margin-top: 32rpx;
            margin-bottom: 16rpx;
            font-weight: 600;
            line-height: 1.4;
        }

        h1 {
            font-size: 44rpx;
            color: #111827;
        }

        h2 {
            font-size: 38rpx;
            color: #1f2937;
        }

        h3 {
            font-size: 34rpx;
            color: #374151;
        }

        p {
            margin-bottom: 24rpx;
        }

        ul,
        ol {
            margin-bottom: 24rpx;
            padding-left: 32rpx;
        }

        li {
            margin-bottom: 8rpx;
        }

        blockquote {
            margin: 24rpx 0;
            padding: 16rpx 24rpx;
            border-left: 8rpx solid #e0f2ff;
            background-color: #f9fafb;
            color: #4b5563;
        }

        pre {
            margin: 24rpx 0;
            padding: 24rpx;
            border-radius: 12rpx;
            background-color: #1f2937;
            overflow-x: auto;
        }

        code {
            font-family: 'Courier New', Courier, monospace;
            font-size: 28rpx;
        }

        p code,
        li code {
            padding: 4rpx 8rpx;
            border-radius: 6rpx;
            background-color: #f3f4f6;
            color: #ef4444;
            font-size: 28rpx;
        }

        a {
            color: #0f6ae0;
            text-decoration: none;
        }

        img {
            max-width: 100%;
            border-radius: 12rpx;
            margin: 24rpx 0;
        }

        hr {
            margin: 32rpx 0;
            border: none;
            border-top: 2rpx solid #e5e7eb;
        }

        table {
            width: 100%;
            margin: 24rpx 0;
            border-collapse: collapse;
        }

        th,
        td {
            padding: 12rpx;
            border: 2rpx solid #e5e7eb;
            text-align: left;
        }

        th {
            background-color: #f9fafb;
            font-weight: 600;
        }
    }
}
</style>

