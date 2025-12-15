<template>
  <view class="page-container">
    <view class="faq-page">
      <u-collapse accordion>
        <u-collapse-item v-for="(item, index) in faqList" :key="index" :title="item.question">
          <text class="answer-text">{{ item.answer }}</text>
        </u-collapse-item>
      </u-collapse>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const faqList = ref([
  {
    question: '如何添加宠物？',
    answer: '在“我的”页面点击“添加宠物”按钮，或者在宠物管理列表中点击右上角的“+”号即可添加新的宠物信息。',
  },
  {
    question: '如何记录宠物的体重？',
    answer: '进入“健康报告”页面，点击“体重”卡片，然后点击“记录”按钮即可输入当天的体重数据。',
  },
  {
    question: '数据可以导出吗？',
    answer: '目前支持在“健康报告”页面生成图片分享，完整的数据导出功能正在开发中，敬请期待。',
  },
  {
    question: '如何联系客服？',
    answer: '您可以直接发送邮件至 support@ipet.com 进行反馈。',
  },
]);
</script>

<style lang="scss" scoped>
.faq-page {
  min-height: 100vh;
  background-color: #fff;
  padding: 20rpx;
}

.answer-text {
  font-size: 28rpx;
  color: $uni-text-color-grey;
  line-height: 1.6;
  padding: 10rpx 0;
}
</style>
