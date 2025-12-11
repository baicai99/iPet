import { reactive, ref, computed, watch } from 'vue';
import { uploadService } from '@/services/uploadService';
import { usePetViewModel } from '@/composables/usePetViewModel';
import { usePetCommands } from '@/composables/usePetCommands';
import { PetType, PetGender } from '@/config/constants';
import { DOG_BREEDS, CAT_BREEDS, OTHER_BREEDS } from '@/config/petBreeds';

import PinyinMatch from 'pinyin-match';

export function usePetForm() {
    const petViewModel = usePetViewModel();
    const petCommands = usePetCommands();
    petViewModel.ensureHydrated();

    const isEditMode = ref(false);
    const petId = ref<string | null>(null);
    const isSubmitting = ref(false);
    const isUploadingAvatar = ref(false);
    const imagePreview = ref<string | null>(null);
    const showBreedPopup = ref(false);
    const searchQuery = ref('');

    const formData = ref({
        name: '',
        type: PetType.Dog,
        breed: '',
        gender: PetGender.Male,
        birthday: '',
        weight: '',
        isSterilized: false,
        chipId: '',
        toys: '',
        personality: [] as string[],
        allergens: '',
        vaccineDate: '',
        description: '',
        avatar: ''
    });

    const petFormRules = {
        name: [{ required: true, message: '请输入宠物名字', trigger: ['blur', 'change'] }],
        type: [{ required: true, message: '请选择宠物种类', trigger: ['change'] }],
        breed: [{ required: true, message: '请选择品种', trigger: ['change'] }],
        birthday: [{ required: true, message: '请选择生日', trigger: ['change'] }],
        weight: [{ required: true, message: '请输入体重', trigger: ['blur', 'change'] }]
    };

    const pageTitle = computed(() => isEditMode.value ? '编辑宠物' : '添加爱宠');
    const submitButtonText = computed(() => isEditMode.value ? '保存修改' : '完成添加');

    const filteredBreeds = computed(() => {
        let breeds = [];
        if (formData.value.type === PetType.Dog) {
            breeds = DOG_BREEDS;
        } else if (formData.value.type === PetType.Cat) {
            breeds = CAT_BREEDS;
        } else {
            breeds = OTHER_BREEDS;
        }

        if (!searchQuery.value) {
            return breeds;
        }

        return breeds.filter(breed => PinyinMatch.match(breed, searchQuery.value));
    });

    const loadPetData = (id: string) => {
        if (!id) return false;

        let pet = petViewModel.getPetById(id);
        if (!pet) {
            petViewModel.refresh();
            pet = petViewModel.getPetById(id);
        }

        if (pet) {
            petId.value = pet.id;
            formData.value.name = pet.name;
            formData.value.type = pet.type as PetType;
            formData.value.breed = pet.breed || '';
            formData.value.gender = (pet.gender || PetGender.Male) as PetGender;
            formData.value.birthday = pet.birthday || '';
            formData.value.weight = pet.weight ? String(pet.weight) : '';
            formData.value.isSterilized = !!pet.isSterilized;
            formData.value.chipId = pet.chipId || '';
            formData.value.toys = pet.toys || '';
            // Handle personality migration (string -> array)
            if (Array.isArray(pet.personality)) {
                formData.value.personality = pet.personality;
            } else if (typeof pet.personality === 'string' && pet.personality) {
                formData.value.personality = [pet.personality];
            } else {
                formData.value.personality = [];
            }
            formData.value.allergens = pet.allergens || '';
            formData.value.vaccineDate = pet.vaccineDate || '';
            formData.value.description = pet.description || '';
            formData.value.avatar = pet.avatar || '';
            imagePreview.value = formData.value.avatar || null;
            return true;
        }
        return false;
    };

    const triggerHaptic = () => {
        if (typeof uni !== 'undefined' && typeof uni.vibrateShort === 'function') {
            uni.vibrateShort()
        }
    };

    const chooseImage = () => {
        if (isUploadingAvatar.value) return;

        uni.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: async (res) => {
                const filePath = res.tempFilePaths?.[0];
                if (!filePath) return;

                imagePreview.value = filePath;
                isUploadingAvatar.value = true;

                try {
                    const remoteUrl = await uploadService.uploadImage(filePath, { type: 'avatar' });
                    formData.value.avatar = remoteUrl;
                    imagePreview.value = remoteUrl;
                    uni.showToast({
                        title: '头像上传成功',
                        icon: 'success'
                    });
                } catch (error) {
                    console.error('Failed to upload pet avatar', error);
                    uni.showToast({
                        title: '上传失败，请重试',
                        icon: 'none'
                    });
                    imagePreview.value = formData.value.avatar || null;
                } finally {
                    isUploadingAvatar.value = false;
                }
            }
        });
    };

    const submitForm = async (validateFunc?: () => Promise<void>) => {
        if (isSubmitting.value) return;

        try {
            if (validateFunc) {
                await validateFunc();
            }
        } catch (error) {
            return;
        }

        triggerHaptic();
        isSubmitting.value = true;

        try {
            const timestamp = Date.now();
            const petData = {
                id: isEditMode.value && petId.value ? petId.value : `pet-${timestamp}`,
                name: formData.value.name,
                type: formData.value.type as 'dog' | 'cat' | 'other',
                breed: formData.value.breed,
                gender: formData.value.gender as 'male' | 'female',
                birthday: formData.value.birthday,
                birthTimestamp: formData.value.birthday ? new Date(formData.value.birthday).getTime() : undefined,
                weight: formData.value.weight ? parseFloat(formData.value.weight) : undefined,
                isSterilized: formData.value.isSterilized,
                chipId: formData.value.chipId || undefined,
                toys: formData.value.toys || undefined,
                personality: formData.value.personality,
                allergens: formData.value.allergens || undefined,
                vaccineDate: formData.value.vaccineDate || undefined,
                description: formData.value.description || undefined,
                avatar: formData.value.avatar || undefined,
                status: 'active' as const,
                updatedAt: timestamp,
                createdAt: isEditMode.value ? undefined : timestamp
            };

            if (isEditMode.value && petId.value) {
                petCommands.updatePet(petId.value, petData);
            } else {
                petCommands.addPet(petData);
            }

            triggerHaptic();

            uni.showToast({
                title: isEditMode.value ? `${formData.value.name} 的信息已更新 ✨` : `太棒了！${formData.value.name} 已加入 iPet 大家庭 🏠`,
                icon: 'none',
                duration: 2000
            });

            setTimeout(() => {
                uni.navigateBack();
            }, 1200);
        } catch (error) {
            console.error('Failed to save pet:', error);
            uni.showToast({
                title: '保存失败，请重试',
                icon: 'none'
            });
        } finally {
            isSubmitting.value = false;
        }
    };

    const handleArchive = () => {
        const id = petId.value;
        if (!id) return;

        uni.showModal({
            title: '归档确认',
            content: '归档后，该宠物将不再显示在列表中，但数据会被保留。确定要归档吗？',
            confirmColor: '#f97316',
            success: async (res) => {
                if (res.confirm) {
                    try {
                        await petCommands.archivePet(id);
                        uni.showToast({ title: '已归档', icon: 'success' });
                        setTimeout(() => uni.navigateBack(), 1000);
                    } catch (error) {
                        uni.showToast({ title: '归档失败', icon: 'none' });
                    }
                }
            }
        });
    };

    const handleDelete = () => {
        const id = petId.value;
        if (!id) return;

        uni.showModal({
            title: '删除确认',
            content: '删除后无法恢复，确定要删除该宠物吗？',
            confirmColor: '#ef4444',
            success: async (res) => {
                if (res.confirm) {
                    try {
                        await petCommands.deletePet(id);
                        uni.showToast({ title: '已删除', icon: 'success' });
                        setTimeout(() => uni.navigateBack(), 1000);
                    } catch (error) {
                        uni.showToast({ title: '删除失败', icon: 'none' });
                    }
                }
            }
        });
    };

    return {
        isEditMode,
        petId,
        formData,
        petFormRules,
        imagePreview,
        isUploadingAvatar,
        isSubmitting,
        showBreedPopup,
        searchQuery,
        pageTitle,
        submitButtonText,
        filteredBreeds,
        loadPetData,
        chooseImage,
        submitForm,
        handleArchive,
        handleDelete,
        triggerHaptic
    };
}
