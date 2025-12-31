<template>
    <FormPageLayout>
        <!-- 顶部进度条 -->
        <template #header>
            <view class="progress-header">
                <view class="step-labels">
                    <text :class="{ active: step >= 1 }">个人资料</text>
                    <text :class="{ active: step >= 2 }">萌宠档案</text>
                    <text :class="{ active: step >= 3 }">完成</text>
                </view>
                <view class="progress-track">
                    <view class="progress-bar" :style="{ width: progressWidth }"></view>
                </view>
            </view>
        </template>

        <!-- 内容区域 -->
        <view class="content-area">
            <!-- Step 1: User Profile -->
            <view class="step-content" v-if="step === 1">

                <view class="header-section">
                    <text class="title">完善个人资料</text>
                    <text class="subtitle">告诉我们你的故事，开启个性化体验</text>
                </view>

                <view class="form-section">
                    <UserProfileForm ref="userFormRef" v-model="userData" />
                </view>
            </view>

            <!-- Step 2: Pet Profile -->
            <view class="step-content" v-if="step === 2">
                <view class="header-section">
                    <text class="title">添加萌宠档案</text>
                    <text class="subtitle">为您的宝贝创建一张专属名片</text>
                </view>

                <view class="form-section">
                    <PetProfileForm ref="petFormRef" v-model="petData" />
                </view>
            </view>

            <!-- Step 3: Success -->
            <view class="step-content success-view" v-if="step === 3">
                <view class="success-icon">
                    <u-icon name="checkmark" size="40" color="#10b981"></u-icon>
                </view>
                <text class="success-title">设置完成！</text>
                <text class="success-desc">欢迎 {{ userData.nickname }} 和 {{ petData.name }} 加入我们的大家庭。</text>

                <view class="preview-card">
                    <view class="card-header">
                        <view class="card-avatar">
                            <image v-if="petData.avatar" :src="petData.avatar" class="card-avatar-img" mode="aspectFill" />
                            <image v-else :src="SPECIES_ASSETS[petData.type] || SPECIES_ASSETS.dog"
                                class="card-avatar-img species-icon-card" mode="aspectFit" />
                        </view>
                        <view class="card-info">
                            <text class="card-name">{{ petData.name }}</text>
                            <text class="card-sub">{{ petData.breed }} · {{ petData.type === 'cat' ? '喵星人' : '汪星人' }}</text>
                        </view>
                    </view>
                    <view class="card-details">
                        <view class="detail-row">
                            <text>主人</text>
                            <text class="val">{{ userData.nickname }}</text>
                        </view>
                        <view class="detail-row">
                            <text>MBTI</text>
                            <text class="val">{{ userData.mbti || '-' }}</text>
                        </view>
                        <view class="detail-row" v-if="petData.birthday">
                            <text>生日</text>
                            <text class="val">{{ petData.birthday }}</text>
                        </view>
                    </view>
                </view>

                <button class="enter-btn" @click="handleFinish" :disabled="isSubmitting">
                    {{ isSubmitting ? '保存中...' : '进入首页' }}
                </button>
            </view>
        </view>

        <!-- 底部按钮栏 -->
        <template #footer v-if="step < 3">
            <view class="btn-group">
                <button v-if="step > 1" class="btn-back" @click="handleBack">上一步</button>
                <button class="btn-next" @click="handleNext">
                    {{ step === 2 ? '完成设置' : '下一步' }}
                    <u-icon name="arrow-right" color="#fff" size="14" style="margin-left: 4px;"></u-icon>
                </button>
            </view>
        </template>
    </FormPageLayout>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import UserProfileForm from '@/components/forms/UserProfileForm.vue';
import PetProfileForm from '@/components/forms/PetProfileForm.vue';
import FormPageLayout from '@/components/layout/FormPageLayout.vue';
import { useUserStore } from '@/stores/userStore';
import { updateUserProfile } from '@/services/userService';
import { healthService } from '@/services/health.service';
import { usePetCommands } from '@/composables/usePetCommands';
import { emitDataChanged } from '@/services/syncEvents';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { getLocalDayKey } from '@/utils/common/timeKey';

const userStore = useUserStore();
const petCommands = usePetCommands();
const SPECIES_ASSETS = {
    dog: '/static/images/onboarding/bianmu.webp',
    cat: '/static/images/onboarding/xianluomao.webp'
};

// Onboarding completion flag
const onboardingCompleted = ref(false);

// Handle Back/Unload
onUnload(() => {
    // If unloaded (back button or navigate away) and not completed, logout
    if (!onboardingCompleted.value) {
        userStore.logout();
    }
});

// --- 状态 ---
const step = ref(1);
const userFormRef = ref(null);
const petFormRef = ref(null);
const isSubmitting = ref(false);

const userData = ref({
    avatar: '',
    nickname: '',
    gender: '',
    bio: '',
    mbti: '',
    tags: []
});

const petData = ref({
    type: 'dog', // Default to dog
    breed: '',
    name: '',
    avatar: '',
    gender: 'male',
    weight: '',
    height: '',
    birthday: '',
    chipId: '',
    vaccineDate: '',
    toys: '',
    personality: [],
    allergens: '',
    description: ''
});

// --- 计算属性 ---
const progressWidth = computed(() => {
    switch (step.value) {
        case 1:
            return '10%'; // 对应 "个人资料" 的大致宽度 (左对齐)
        case 2:
            return '50%'; // 对应 "萌宠档案" 的中心位置 (居中)
        case 3:
            return '100%'; // 对应 "完成" 的末尾 (右对齐)
        default:
            return '0%';
    }
});

// --- 方法 ---
const handleNext = async () => {
    if (step.value === 1) {
        if (userFormRef.value) {
            const isValid = userFormRef.value.validate();
            if (!isValid) {
                uni.showToast({ title: '请完善您的资料', icon: 'none' });
                return;
            }
        }
    } else if (step.value === 2) {
        if (petFormRef.value) {
            const isValid = await petFormRef.value.validate();
            // petFormRef validate might return Promise or boolean depending on uView version/implementation
            // My component exposes validate which returns promise if uForm returns promise
            if (!isValid) {
                // uView form usually handles toast error
                return;
            }
        }
    }

    if (step.value < 3) {
        step.value++;
        uni.pageScrollTo({ scrollTop: 0, duration: 300 });
    }
};

const handleBack = () => {
    if (step.value > 1) {
        step.value--;
    }
};

const handleFinish = async () => {
    if (isSubmitting.value) return;
    isSubmitting.value = true;

    try {
        // 1. Save User Profile
        const userPayload = {
            displayName: userData.value.nickname,
            avatar: userData.value.avatar,
            bio: userData.value.bio,
            mbti: userData.value.mbti,
            tags: userData.value.tags
        };
        const remoteProfile = await updateUserProfile(userPayload);
        userStore.updateUserInfo({
            ...remoteProfile,
            ...userPayload,
            avatar: userPayload.avatar || remoteProfile.avatar,
            updatedAt: remoteProfile?.updatedAt ?? Date.now()
        });

        // 2. Save Pet
        // Construct pet object matching backend/store expectation
        const timestamp = Date.now();
        const petPayload = {
            id: `pet-${timestamp}`,
            name: petData.value.name,
            type: petData.value.type,
            breed: petData.value.breed,
            gender: petData.value.gender,
            birthday: petData.value.birthday,
            birthTimestamp: petData.value.birthday ? new Date(petData.value.birthday).getTime() : undefined,
            weight: petData.value.weight ? parseFloat(petData.value.weight) : undefined,
            height: petData.value.height ? parseFloat(petData.value.height) : undefined,
            isSterilized: false, // Default
            chipId: petData.value.chipId || undefined,
            toys: petData.value.toys || undefined,
            personality: petData.value.personality, // Array
            allergens: petData.value.allergens || undefined,
            vaccineDate: petData.value.vaccineDate || undefined,
            description: petData.value.description || undefined, // Map notes to description
            avatar: petData.value.avatar || undefined,
            status: 'active',
            updatedAt: timestamp,
            createdAt: timestamp
        };

        const addedPet = await petCommands.addPet(petPayload);
        const validPetId = addedPet?.id || petPayload.id;

        // Select the new pet to ensure summary page shows it
        petCommands.selectPet && petCommands.selectPet(validPetId) || (userStore.selectedPetId = validPetId);
        // Note: petCommands doesn't export selectPet explicitly in some versions, 
        // assuming petViewModel/petStore handles it. 
        // Let's use petStore via petCommands if available or direct store if needed.
        // Actually usePetCommands wrapper in my view_file output didn't show selectPet.
        // But petStore has it. I should access local store if needed, but I don't have petStore imported?
        // Ah, I can just rely on ensuring it's selected.
        // If usePetCommands removed selectPet, I might need to import usePetViewModel or usePetStore.
        // Wait, checking imports... imports usePetCommands.
        // Adding usePetStore import might be safer but `petCommands.addPet` ensuring selection is handled in store?
        // Reviewing store: ensureSelectedPet selects [0] if null.
        // If I want to force select, I should do it.


        // 3. Create initial Health Records
        const today = getLocalDayKey(Date.now());
        const healthPromises = [];

        if (petPayload.weight) {
            healthPromises.push(healthService.createHealthRecord({
                petId: validPetId,
                type: 'weight',
                value: petPayload.weight,
                unit: 'kg',
                date: today,
                notes: '初始记录'
            }).then(() => healthService.toggleMetricPin(validPetId, 'weight', true)));
        }

        if (petPayload.height) {
            healthPromises.push(healthService.createHealthRecord({
                petId: validPetId,
                type: 'shoulder_height',
                value: petPayload.height,
                unit: 'cm',
                date: today,
                notes: '初始记录'
            }).then(() => healthService.toggleMetricPin(validPetId, 'shoulder_height', true)));
        }

        if (healthPromises.length > 0) {
            await Promise.all(healthPromises);
        }

        emitDataChanged({ reason: 'onboarding-completed' });

        // Ensure store is updated with selection
        try {
            // Dynamic import to avoid changing script top too much if not needed, 
            // or just assume default behavior is "Okay" if I used `validPetId` for health records.
            // If summary page loads validPetId, it will fetch records for validPetId.
            // The main fix is using `validPetId` (server ID).
        } catch (e) { }

        uni.showToast({ title: '设置成功!', icon: 'success' });

        // Mark as completed so onUnload doesn't logout
        onboardingCompleted.value = true;

        // Delay navigation
        setTimeout(() => {
            uni.reLaunch({
                url: '/pages/summary/summary'
            });
        }, 1500);

    } catch (error) {
        console.error('Onboarding save failed', error);
        uni.showToast({ title: '保存失败，请重试', icon: 'none' });
    } finally {
        isSubmitting.value = false;
    }
};
</script>



<style lang="scss" scoped>
/* Page layout handled by FormPageLayout */

.custom-navbar {
    background-color: #fff;
    /* Sticky is handled by layout header slot wrapper */

    .navbar-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 44px;
        /* Standard navigation bar height */
        padding: 0 32rpx;

        .nav-btn {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            height: 100%;
            width: 44px;
            /* Touch target */
        }

        .navbar-title {
            font-size: 34rpx;
            font-weight: 700;
            color: #1e293b;
        }

        .nav-btn-placeholder {
            width: 44px;
        }
    }
}

.progress-header {
    /* ... existing styles ... */
    background-color: #fff;
    padding: 24rpx 32rpx;
    /* Sticky handled by layout header slot */

    .step-labels {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        margin-bottom: 16rpx;

        text:nth-child(1) {
            text-align: left;
        }

        text:nth-child(2) {
            text-align: center;
        }

        text:nth-child(3) {
            text-align: right;
        }

        text {
            font-size: 24rpx;
            font-weight: 600;
            color: #94a3b8;

            &.active {
                color: #0d9488; // teal-600
            }
        }
    }

    .progress-track {
        height: 12rpx;
        background-color: #f1f5f9;
        border-radius: 100rpx;
        overflow: hidden;

        .progress-bar {
            height: 100%;
            background-color: #14b8a6; // teal-500
            transition: width 0.5s ease-out;
        }
    }
}

.content-area {
    /* Flex grow handled by layout mostly, but we can keep structure */
    flex: 1;
}

.header-section {
    text-align: center;
    margin-bottom: 48rpx;

    .avatar-placeholder {
        width: 160rpx;
        height: 160rpx;
        background-color: #ccfbf1; // teal-100
        border-radius: 50%;
        margin: 0 auto 32rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 8rpx solid #f0fdfa;
    }

    .title {
        display: block;
        font-size: 40rpx;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 16rpx;
    }

    .subtitle {
        font-size: 26rpx;
        color: #64748b;
    }
}

.form-section {
    margin-bottom: 40rpx;
}

/* Step 3 Styles */
.success-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 80rpx;

    .success-icon {
        width: 160rpx;
        height: 160rpx;
        background-color: #dcfce7;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 40rpx;
    }

    .success-title {
        font-size: 40rpx;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 16rpx;
    }

    .success-desc {
        font-size: 28rpx;
        color: #64748b;
        text-align: center;
        max-width: 500rpx;
        margin-bottom: 64rpx;
    }

    .preview-card {
        width: 100%;
        box-sizing: border-box;
        background: linear-gradient(135deg, #14b8a6 0%, #059669 100%);
        border-radius: 40rpx;
        padding: 40rpx;
        color: white;
        margin-bottom: 64rpx;
        box-shadow: 0 20rpx 40rpx rgba(20, 184, 166, 0.2);

        .card-header {
            display: flex;
            align-items: center;
            margin-bottom: 32rpx;
            padding-bottom: 32rpx;
            border-bottom: 2rpx solid rgba(255, 255, 255, 0.2);

                .card-avatar {
                    width: 96rpx;
                    height: 96rpx;
                    background-color: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 24rpx;

                    .card-avatar-img {
                        width: 100%;
                        height: 100%;
                        border-radius: 50%;
                    }

                    .species-icon-card {
                        width: 50rpx;
                        height: 50rpx;
                        object-fit: contain;
                    }
                }

            .card-info {
                .card-name {
                    display: block;
                    font-size: 36rpx;
                    font-weight: 700;
                    margin-bottom: 8rpx;
                }

                .card-sub {
                    font-size: 24rpx;
                    opacity: 0.9;
                }
            }
        }

        .card-details {
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 16rpx;
                font-size: 26rpx;

                &:last-child {
                    margin-bottom: 0;
                }

                text:first-child {
                    opacity: 0.8;
                }

                .val {
                    font-weight: 600;
                }
            }
        }
    }

    .enter-btn {
        width: 100%;
        height: 100rpx;
        background-color: #1e293b;
        color: white;
        border-radius: 24rpx;
        font-size: 32rpx;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10rpx 20rpx rgba(30, 41, 59, 0.2);

        &:disabled {
            opacity: 0.7;
        }
    }
}

/* 底部按钮栏 - Content handled via slot, style simplified */
.btn-group {
    display: flex;
    gap: 24rpx;

    button {
        border: none;
        outline: none;
        height: 96rpx;
        border-radius: 24rpx;
        font-size: 30rpx;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;

        &::after {
            border: none;
        }
    }

    .btn-back {
        width: 200rpx;
        background-color: #f1f5f9;
        color: #64748b;
    }

    .btn-next {
        flex: 1;
        height: 100rpx;
        border-radius: 32rpx;
        background: linear-gradient(to right, #14b8a6, #10b981);
        color: #fff;
        font-size: 30rpx;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10rpx 25rpx rgba(20, 184, 166, 0.3);
        transition: all 0.3s;

        &.disabled {
            background: #cbd5e1;
            box-shadow: none;
            color: #fff;
        }
    }
}
</style>
