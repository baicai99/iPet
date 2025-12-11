import { computed } from 'vue'
import type { Pet } from '@shared/types/pet'
import { usePetStore } from '@/stores/petStore'

export const usePetCommands = () => {
    const petStore = usePetStore()

    const addPet = async (pet: Pet) => {
        return petStore.addPet(pet)
    }

    const updatePet = async (petId: string, patch: Partial<Pet>) => {
        return petStore.updatePet(petId, patch)
    }

    const archivePet = async (petId: string) => {
        return petStore.archivePet(petId)
    }



    const deletePet = async (petId: string) => {
        return petStore.deletePetFully(petId)
    }

    const pendingCommandCount = computed(() => 0) // No more pending queue

    return {
        addPet,
        updatePet,
        archivePet,

        deletePet,
        pendingCommandCount
    }
}
