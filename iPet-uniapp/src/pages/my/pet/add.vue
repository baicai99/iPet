<template>
    <FormPageLayout>
        <!-- Component Form -->
        <PetProfileForm ref="petProfileFormRef" v-model="formData" />

        <view v-if="isEditMode" class="action-buttons">
            <button class="action-btn archive-btn" @click="handleArchive">
                <u-icon name="archive" size="18" color="#f97316"></u-icon>
                <text>归档</text>
            </button>
            <button class="action-btn delete-btn" @click="handleDelete">
                <u-icon name="trash" size="18" color="#ef4444"></u-icon>
                <text>删除</text>
            </button>
        </view>

        <template #footer>
            <button class="submit-btn" @click="handleSubmit" :disabled="isSubmitting">
                <u-icon name="checkmark-circle" size="20" color="#ffffff" style="margin-right: 8rpx;"></u-icon>
                <text>{{ submitButtonText }}</text>
            </button>
        </template>
    </FormPageLayout>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { usePetForm } from '@/composables/usePetForm';
import PetProfileForm from '@/components/forms/PetProfileForm.vue';
import FormPageLayout from '@/components/layout/FormPageLayout.vue';

const petProfileFormRef = ref(null);

const {
    isEditMode,
    formData,
    isSubmitting,
    submitButtonText,
    loadPetData,
    submitForm,
    handleArchive,
    handleDelete
} = usePetForm();

onLoad((options) => {
    if (options?.id) {
        isEditMode.value = true;
        const found = loadPetData(options.id);
        if (!found) {
            uni.showToast({ title: '未找到该宠物信息', icon: 'none' });
            setTimeout(() => uni.navigateBack(), 1000);
            return;
        }
        uni.setNavigationBarTitle({ title: '编辑宠物' });
    } else {
        uni.setNavigationBarTitle({ title: '添加爱宠' });
    }
});

const handleSubmit = () => {
    submitForm(() => petProfileFormRef.value?.validate());
};
</script>

<style lang="scss" scoped>
/* Layout handled by FormPageLayout */

.action-buttons {
    display: flex;
    gap: 24rpx;
    margin-top: 32rpx;
}

.action-btn {
    flex: 1;
    height: 88rpx;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    font-weight: 600;
    border: none;

    &::after {
        border: none;
    }

    &.archive-btn {
        background-color: #fff7ed;
        color: #f97316;
        border: 2rpx solid rgba(0, 0, 0, 0.05);
    }

    &.delete-btn {
        background-color: #fef2f2;
        color: #ef4444;
        border: 2rpx solid rgba(0, 0, 0, 0.05);
    }

    text {
        margin-left: 8rpx;
    }

    &:active {
        transform: scale(0.98);
        opacity: 0.9;
    }
}

.submit-btn {
    width: 100%;
    height: 100rpx;
    background: linear-gradient(to right, #f97316, #f59e0b);
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 32rpx;
    font-weight: bold;
    box-shadow: 0 8rpx 20rpx rgba(249, 115, 22, 0.25);
    border: none;

    &:active {
        transform: scale(0.98);
    }

    &[disabled] {
        opacity: 0.7;
        filter: grayscale(0.5);
    }
}
</style>
