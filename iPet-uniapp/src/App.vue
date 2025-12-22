<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { initAuth }from '@/services/initAuth'

onLaunch(() => {
    initAuth()
})
</script>

<style lang="scss">
@import 'uview-plus/index.scss';
@import '@/styles/theme-variables.scss';
@import '@/styles/iconfont/iconfont.css';

/* ⚠️ 保留兼容性：.dark-theme class 仍然有效，但优先使用 [data-theme="dark"] */
.dark-theme {
    color: $app-text-primary;
    background-color: $app-background;
}

page {
    background-color: $app-background;
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
