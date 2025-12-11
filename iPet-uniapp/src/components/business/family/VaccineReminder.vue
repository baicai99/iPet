<template>
    <view class="vaccine-card">
        <u-icon name="plus-circle-fill" size="40rpx" color="#ef4444" style="margin-top: 4rpx;"></u-icon>
        <view class="vaccine-content">
            <text class="vaccine-title">疫苗接种提醒</text>
            <text class="vaccine-desc">
                “{{ petName }}”的{{ vaccineName }}将在 <text class="bold">{{ daysLeft }} 天后</text> 到期，请及时预约宠物医院。
            </text>
        </view>
    </view>
</template>

<script setup>
defineProps({
    petName: { type: String, default: '旺财' },
    vaccineName: { type: String, default: '疫苗加强针' },
    daysLeft: { type: Number, default: 7 }
})
</script>

<style lang="scss" scoped>
.vaccine-card {
    background: #fef2f2;
    border-radius: 32rpx;
    border: 2rpx solid #fee2e2;
    padding: 32rpx;
    display: flex;
    align-items: flex-start;
    gap: 24rpx;
}

.vaccine-content {
    display: flex;
    flex-direction: column;
}

.vaccine-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #991b1b;
}

.vaccine-desc {
    font-size: 24rpx;
    color: #b91c1c;
    margin-top: 8rpx;
    line-height: 1.5;
}

.bold {
    font-weight: 700;
}
</style>
