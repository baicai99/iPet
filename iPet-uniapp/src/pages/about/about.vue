<template>
  <view class="about-page">
    <view class="logo-section">
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <text class="app-name">iPet</text>
      <text class="version">Version 0.0.1</text>
    </view>

    <view class="menu-group">
      <u-cell-group :border="false">
        <u-cell title="用户协议" is-link url="/pages/about/agreement"></u-cell>
        <u-cell title="隐私政策" is-link url="/pages/about/privacy-policy"></u-cell>
        <u-cell title="去评分" is-link @click="handleRate"></u-cell>
      </u-cell-group>
    </view>

    <view class="copyright">
      <text>Copyright © 2023 iPet Team. All Rights Reserved.</text>
    </view>
  </view>
</template>

<script setup>
const handleRate = () => {
  // In a real app, this would open the app store
  uni.showToast({
    title: '感谢您的支持！',
    icon: 'none',
  });
};
</script>

<style lang="scss" scoped>
.about-page {
  min-height: 100vh;
  background-color: $uni-bg-color-grey;
  padding: 40rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
  margin-top: 60rpx;

  .logo {
    width: 160rpx;
    height: 160rpx;
    border-radius: 32rpx;
    margin-bottom: 20rpx;
    background-color: #fff; // Placeholder if image missing
  }

  .app-name {
    font-size: 36rpx;
    font-weight: bold;
    color: $uni-text-color;
    margin-bottom: 10rpx;
  }

  .version {
    font-size: 24rpx;
    color: $uni-text-color-grey;
  }
}

.menu-group {
  width: 100%;
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: auto;
}

.copyright {
  margin-top: 40rpx;
  margin-bottom: 20rpx;
  
  text {
    font-size: 20rpx;
    color: $uni-text-color-grey;
  }
}
</style>
