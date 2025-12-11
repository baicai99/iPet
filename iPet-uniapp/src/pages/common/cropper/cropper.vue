<template>
    <view class="u-cropper-wrap">
        <UCropper ref="uCropper" :src="src" :theme-color="themeColor" :export-width="destWidth"
            :export-height="destHeight" :area-width="300" :area-height="300" :max-zoom="3" @confirm="onCropConfirm">
        </UCropper>
        <view class="u-cropper-buttons">
            <view class="u-cropper-button cancel" @tap="cancel">取消</view>
            <view class="u-cropper-button confirm" @tap="confirm">确认</view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { onLoad, onReady } from '@dcloudio/uni-app';
import { ref, nextTick } from 'vue';
import UCropper from 'uview-plus/components/u-cropper/u-cropper.vue';

const src = ref('');
const uCropper = ref<any>(null);
const themeColor = ref('#007aff');
const destWidth = ref('200px'); // Output width (increased for better quality)
const destHeight = ref('200px'); // Output height

// Load parameters passed from the previous page
// Load parameters passed from the previous page
onLoad((options) => {
    if (options && options.src) {
        src.value = decodeURIComponent(options.src);
    }
});

onReady(() => {
    // 使用 nextTick 确保组件已挂载
    nextTick(() => {
        if (src.value) {
            initCropperImage(src.value);
        }
    });
});

const initCropperImage = (msgSrc: string) => {
    if (!uCropper.value) return;

    uni.showLoading({ title: '加载图片中...' });

    uni.getImageInfo({
        src: msgSrc,
        success: (res) => {
            const cropper = uCropper.value;
            // Inject state that u-cropper expects after chooseImage
            cropper.imgPath = msgSrc;
            cropper.imgWidth = res.width + 'px';
            cropper.imgHeight = res.height + 'px';
            cropper.path = msgSrc;
            cropper.imgSrc.imgSrc = msgSrc;

            // Initialize drawing
            // We force a nice crop box size relative to screen if needed, 
            // but u-cropper defaults (300rpx) are usually okay. 
            // We can ensure the crop box logic runs by calling drawInit(true).
            cropper.drawInit(true);

            uni.hideLoading();
        },
        fail: (err) => {
            console.error('Failed to load image info', err);
            uni.hideLoading();
            uni.showToast({
                title: '图片加载失败',
                icon: 'none'
            });
        }
    });
};

const cancel = () => {
    uni.navigateBack();
};

const confirm = () => {
    if (!uCropper.value) return;

    // Use the component's internal confirm/generate logic
    // u-cropper's confirm method usually emits 'confirm' event or we can call specific method.
    // Based on source, calling confirm() on component triggers canvas generation and emits event.
    // However, we want to intercept the result here?
    // actually checking source: confirm() method in u-cropper finishes by this.$emit("confirm", ...)
    // So we should bind @confirm in template instead of manual button calling cropper internals if possible?
    // But the UI has custom buttons outside the component.
    // So we call uCropper.confirm() which will trigger the emit.

    // We can listen to the event, OR if we call confirm(), we rely on the component to emit.
    // Let's attach the event listener in template or just hack it if needed.
    // Better: call component confirm, and handle the emitted event.
    uCropper.value.confirm();
};

const onCropConfirm = (e: any) => {
    // e.path is the result
    const path = e.path;
    if (!path) return;

    const eventChannel = (getCurrentPages() as any).pop().getOpenerEventChannel();
    eventChannel.emit('acceptDataFromOpenedPage', {
        path: path
    });
    uni.navigateBack();
};
</script>

<style lang="scss" scoped>
.u-cropper-wrap {
    height: 100vh;
    width: 100vw;
    background-color: #000;
    display: flex;
    flex-direction: column;
}

.u-cropper-buttons {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 40rpx;
    box-sizing: border-box;
    z-index: 999;
    background-color: rgba(0, 0, 0, 0.5);
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
}

.u-cropper-button {
    color: #ffffff;
    font-size: 32rpx;
    padding: 20rpx;
}
</style>
