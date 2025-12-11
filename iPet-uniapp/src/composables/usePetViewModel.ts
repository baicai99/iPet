import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { usePetStore } from '@/stores/petStore'
import { useUserStore } from '@/stores/userStore'

export const usePetViewModel = () => {
    const petStore = usePetStore()
    const userStore = useUserStore()
    const { activePets, currentPet, selectedPetId, loading } = storeToRefs(petStore)
    const hydrated = ref(false)

    const ensureHydrated = () => {
        if (hydrated.value) {
            return
        }
        if (userStore.isLoggedIn) {
            petStore.fetchPets()
        }
        hydrated.value = true
    }

    const refresh = () => {
        if (userStore.isLoggedIn) {
            petStore.fetchPets()
        }
    }

    const hasPets = computed(() => activePets.value.length > 0)
    const isLoading = computed(() => loading.value)
    const isSyncing = computed(() => loading.value) // Map syncing to loading for compatibility

    const selectPet = (petId: string) => {
        petStore.selectPet(petId)
    }

    const getPetById = (id: string) => petStore.pets.find(pet => pet.id === id)

    return {
        activePets,

        currentPet,
        selectedPetId,
        hasPets,
        isLoading,
        isSyncing,
        ensureHydrated,
        refresh,
        selectPet,
        getPetById
    }
}
