<template>
    <view class="page-container">
        <view class="emergency-card-page">
            <view class="hero">
                <text class="hero-title">急救档案</text>
                <text class="hero-subtitle">一键出示血型、过敏史与主治医生联系方式，守护关键时刻。</text>
            </view>
            <view class="medical-card">
                <view class="medical-card__header">
                    <view class="pet-meta">
                        <text class="pet-name">{{ petName }}</text>
                        <text class="pet-detail">{{ petBreedInfo }}</text>
                    </view>
                    <image :src="petAvatar" class="pet-avatar" mode="aspectFill" />
                </view>
                <view class="medical-card__body">
                    <view class="info-row" v-for="item in summaryRows" :key="item.label">
                        <text class="info-label">{{ item.label }}</text>
                        <text class="info-value">{{ item.value }}</text>
                    </view>
                    <view class="divider"></view>
                    <view class="info-row">
                        <text class="info-label">过敏史</text>
                        <text class="info-value multi-line">{{ medicalProfile.allergies }}</text>
                    </view>
                    <view class="info-row">
                        <text class="info-label">慢性病史</text>
                        <text class="info-value multi-line">{{ medicalProfile.chronicConditions }}</text>
                    </view>
                </view>
            </view>

            <view class="section">
                <view class="section-title">急救联系人</view>
                <view class="contact-card">
                    <view class="contact-main">
                        <view class="contact-name">
                            <text class="contact-role">主治医生</text>
                            <text class="contact-value">{{ vetContact.doctor }}</text>
                        </view>
                        <view class="contact-clinic">{{ vetContact.clinic }}</view>
                        <view class="contact-phone">{{ vetContact.phone }}</view>
                    </view>
                    <view class="contact-actions">
                        <view class="contact-btn" @click="handleCopyContact">复制电话</view>
                        <view class="contact-btn ghost" @click="handleCall">拨打</view>
                    </view>
                </view>
            </view>

            <view class="section">
                <view class="section-title">快速操作</view>
                <view class="action-grid">
                    <view class="action-card" @click="handleShareCard">
                        <u-icon name="share" color="#2563eb" size="34"></u-icon>
                        <text class="action-title">分享医疗卡</text>
                        <text class="action-desc">发送给家人或医生</text>
                    </view>
                    <view class="action-card" @click="handleExportCard('pdf')">
                        <u-icon name="file-text" color="#dc2626" size="34"></u-icon>
                        <text class="action-title">导出 PDF</text>
                        <text class="action-desc">支持打印与归档</text>
                    </view>
                    <view class="action-card" @click="handleExportCard('image')">
                        <u-icon name="photo" color="#0ea5e9" size="34"></u-icon>
                        <text class="action-title">保存图片</text>
                        <text class="action-desc">相册快速查找</text>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePetStore } from '@/stores/petStore'
import { formatPetAge } from '@/utils/common/formatHelper'

const petStore = usePetStore()
const { currentPet } = storeToRefs(petStore)

const petName = computed(() => currentPet.value?.name ?? '未命名宠物')
const petAvatar = computed(() => currentPet.value?.avatar ?? 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=200')
const petBreedInfo = computed(() => {
    const breed = currentPet.value?.breed || '爱宠'
    const age = currentPet.value?.birthTimestamp ? formatPetAge(currentPet.value.birthTimestamp) : '年龄未知'
    return `${breed} · ${age}`
})

const medicalProfile = computed(() => {
    const pet = currentPet.value as Record<string, unknown> | null ?? {}
    return {
        bloodType: (pet.bloodType as string) || '未填写',
        allergies: Array.isArray(pet.allergies) ? (pet.allergies as string[]).join('、') : (pet.allergies as string) || '无已知过敏史',
        chronicConditions: Array.isArray(pet.chronicConditions)
            ? (pet.chronicConditions as string[]).join('、')
            : (pet.chronicConditions as string) || '无慢性疾病记录',
        microchipId: (pet.chipId as string) || '未录入',
        emergencyNote: (pet.emergencyNote as string) || '建议填写注意事项，方便医生了解病史。'
    }
})

const summaryRows = computed(() => ([
    { label: '血型', value: medicalProfile.value.bloodType },
    { label: '芯片编号', value: medicalProfile.value.microchipId },
    { label: '紧急提示', value: medicalProfile.value.emergencyNote }
]))

const vetContact = computed(() => {
    const pet = currentPet.value as Record<string, unknown> | null ?? {}
    const vet = (pet.vetContact as Record<string, string>) || {}
    return {
        clinic: vet.clinic || '星辰动物医院（24h）',
        phone: vet.phone || '400-888-1234',
        doctor: vet.doctor || '李安然医生'
    }
})

const handleShareCard = () => {
    if (typeof uni !== 'undefined') {
        if (typeof uni.share === 'function') {
            uni.share({
                provider: 'weixin',
                type: 0,
                href: '/pages/emergency/card',
                title: '宠物急救档案',
                summary: `${petName.value} 的关键信息，方便紧急就医。`
            })
            return
        }
        if (typeof uni.showToast === 'function') {
            uni.showToast({
                title: '已准备分享内容',
                icon: 'success'
            })
            return
        }
    }
    console.log('分享入口：', petName.value)
}

const handleExportCard = (format: 'pdf' | 'image') => {
    const label = format === 'pdf' ? 'PDF' : '图片'
    if (typeof uni !== 'undefined' && typeof uni.showLoading === 'function') {
        uni.showLoading({
            title: `正在生成${label}`
        })
    }
    setTimeout(() => {
        if (typeof uni !== 'undefined') {
            if (typeof uni.hideLoading === 'function') {
                uni.hideLoading()
            }
            if (typeof uni.showToast === 'function') {
                uni.showToast({
                    title: `${label}已保存`,
                    icon: 'success'
                })
                return
            }
        }
        console.log(`${label} 已保存`)
    }, 1000)
}

const handleCopyContact = () => {
    const phone = vetContact.value.phone
    if (typeof uni !== 'undefined' && typeof uni.setClipboardData === 'function') {
        uni.setClipboardData({
            data: phone,
            success: () => {
                if (typeof uni !== 'undefined' && typeof uni.showToast === 'function') {
                    uni.showToast({
                        title: '电话已复制',
                        icon: 'none'
                    })
                }
            }
        })
        return
    }
    if (typeof uni !== 'undefined' && typeof uni.showToast === 'function') {
        uni.showToast({
            title: phone,
            icon: 'none'
        })
    } else {
        console.log('宠物医院电话：', phone)
    }
}

const handleCall = () => {
    const phone = vetContact.value.phone
    if (typeof uni !== 'undefined' && typeof uni.makePhoneCall === 'function') {
        uni.makePhoneCall({ phoneNumber: phone })
        return
    }
    if (typeof uni !== 'undefined' && typeof uni.showToast === 'function') {
        uni.showToast({
            title: `请拨打 ${phone}`,
            icon: 'none'
        })
    } else {
        console.log('请拨打：', phone)
    }
}
</script>

<style lang="scss" scoped>
.emergency-card-page {
    min-height: 100vh;
    padding: 32rpx;
    background: #f2f2f6;
    box-sizing: border-box;
}

.hero {
    margin-bottom: 24rpx;
}

.hero-title {
    font-size: 40rpx;
    font-weight: 700;
    color: #111827;
}

.hero-subtitle {
    margin-top: 8rpx;
    font-size: 26rpx;
    color: #6b7280;
    line-height: 1.4;
}

.medical-card {
    background: #111827;
    border-radius: 32rpx;
    padding: 32rpx;
    color: #fff;
    box-shadow: 0 20rpx 40rpx rgba(15, 23, 42, 0.25);
}

.medical-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32rpx;
}

.pet-meta {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.pet-name {
    font-size: 42rpx;
    font-weight: 700;
}

.pet-detail {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.7);
}

.pet-avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 28rpx;
    border: 4rpx solid rgba(255, 255, 255, 0.2);
    object-fit: cover;
}

.medical-card__body {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
}

.info-row {
    display: flex;
    justify-content: space-between;
    gap: 24rpx;
}

.info-label {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.7);
}

.info-value {
    font-size: 28rpx;
    font-weight: 600;
    text-align: right;
}

.info-value.multi-line {
    max-width: 400rpx;
    line-height: 1.4;
}

.divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.12);
}

.section {
    margin-top: 32rpx;
}

.section-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #111827;
    margin-bottom: 16rpx;
}

.contact-card {
    display: flex;
    gap: 20rpx;
    background: #fff;
    border-radius: 24rpx;
    padding: 24rpx;
    box-shadow: 0 12rpx 24rpx rgba(15, 23, 42, 0.08);
}

.contact-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10rpx;
}

.contact-role {
    font-size: 22rpx;
    color: #94a3b8;
}

.contact-value {
    font-size: 34rpx;
    font-weight: 700;
    color: #0f172a;
}

.contact-clinic {
    font-size: 26rpx;
    color: #475569;
}

.contact-phone {
    font-size: 28rpx;
    color: #dc2626;
    font-weight: 600;
}

.contact-actions {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.contact-btn {
    padding: 10rpx 28rpx;
    border-radius: 999rpx;
    background: #dc2626;
    color: #fff;
    font-size: 24rpx;
    text-align: center;
}

.contact-btn.ghost {
    background: #fff5f5;
    color: #dc2626;
    border: 2rpx solid rgba(220, 38, 38, 0.3);
}

.action-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200rpx, 1fr));
    gap: 16rpx;
}

.action-card {
    background: #fff;
    border-radius: 24rpx;
    padding: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    box-shadow: 0 10rpx 20rpx rgba(15, 23, 42, 0.06);
}

.action-title {
    font-size: 26rpx;
    font-weight: 600;
    color: #111827;
}

.action-desc {
    font-size: 24rpx;
    color: #6b7280;
}
</style>
