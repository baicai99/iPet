<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useAppTheme } from '@/composables/useAppTheme'
import { initAuth } from '@/services/initAuth'
import '@/static/icon/iconfont.js'

useAppTheme()

onLaunch(() => {
    initAuth()
})
</script>

<style lang="scss">
@import 'uview-plus/index.scss';

:root {
    --app-background: #f5f5f5;
    --app-card-bg: #ffffff;
    --app-border-color: #f3f4f6;
    --app-text-primary: #1f2937;
    --app-text-secondary: #4b5563;
    --app-text-muted: #9ca3af;

    /* Global Color Tokens */
    --uni-color-primary: #007aff;
    --uni-color-success: #4cd964;
    --uni-color-warning: #f0ad4e;
    --uni-color-error: #dd524d;
    --uni-color-primary-orange: #f97316;
    --uni-color-orange-light: #fb923c;
    --uni-text-color-dark: #1f2937;
    --uni-text-color-gray-light: #9ca3af;
    --uni-border-color-light: #d1d5db;
    --uni-text-color-placeholder: #808080;
    --uni-text-color-disable: #c0c0c0;
    --uni-bg-color-card: #fbfbfb;
    --uni-bg-color-hover: #f1f1f1;
    --uni-bg-color-mask: rgba(0, 0, 0, 0.4);
}

.dark-theme {
    --app-background: #0f172a;
    --app-card-bg: #1f2937;
    --app-border-color: rgba(255, 255, 255, 0.08);
    --app-text-primary: #f8fafc;
    --app-text-secondary: #e5e7eb;
    --app-text-muted: #94a3b8;
    color: var(--app-text-primary);
    background-color: var(--app-background);
}

page {
    background-color: var(--app-background);
    min-height: 100%;
    height: auto;
}

/* 针对 H5 的滚动优化 */
/* 仅对页面主体内容设置滚动优化，而不是整个 html/body */
uni-page-body {
    min-height: 100%;
    height: auto;
    /* 允许垂直手势 */
    touch-action: pan-y;
    /* iOS 惯性滚动 */
    -webkit-overflow-scrolling: touch;
}

/* 如果确实需要防止横向溢出，建议只加在最外层容器，或者单独处理 */
body {
    /* 移除 overflow-x: hidden 试试，通常它是手机端滑动失效的元凶 */
    /* overflow-x: hidden; */
    width: 100%;
}

.icon {
    width: 1em;
    height: 1em;
    vertical-align: -0.15em;
    fill: currentColor;
    overflow: hidden;
}
</style>
