import { defineStore } from 'pinia'
import type { Pet } from '@shared/types/pet'
import { petService } from '@/services/pet.service'
import { useUserStore } from './userStore'

interface PetState {
    pets: Pet[];
    selectedPetId: string | null;
    loading: boolean;
    error: string | null;
}

export const usePetStore = defineStore('pet', {
    state: (): PetState => ({
        pets: [],
        selectedPetId: null,
        loading: false,
        error: null
    }),
    getters: {
        activePets: (state): Pet[] => {
            return state.pets.filter(pet => !pet.deleted && !pet.isArchived)
        },
        currentPet(state): Pet | undefined {
            const active = this.activePets
            if (state.selectedPetId) {
                const selectedActive = active.find(pet => pet.id === state.selectedPetId)
                if (selectedActive) {
                    return selectedActive
                }
            }
            return active[0]
        }
    },
    actions: {
        ensureSelectedPet() {
            if (this.selectedPetId && this.activePets.some(pet => pet.id === this.selectedPetId)) {
                return
            }
            this.selectedPetId = this.activePets[0]?.id ?? null
        },

        async fetchPets() {
            const userStore = useUserStore()
            if (!userStore.isLoggedIn) {
                this.pets = []
                return
            }

            this.loading = true
            this.error = null
            try {
                const pets = await petService.getPets()
                this.pets = pets
                this.ensureSelectedPet()
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to fetch pets'
                this.error = message
                console.error('Fetch pets error:', err)
            } finally {
                this.loading = false
            }
        },

        async addPet(petData: Partial<Pet>) {
            this.loading = true
            try {
                const newPet = await petService.createPet(petData)
                this.pets.push(newPet)
                this.ensureSelectedPet()
                return newPet
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to add pet'
                this.error = message
                throw err
            } finally {
                this.loading = false
            }
        },

        async updatePet(id: string, data: Partial<Pet>) {
            this.loading = true
            try {
                const updatedPet = await petService.updatePet(id, data)
                const index = this.pets.findIndex(p => p.id === id)
                if (index !== -1) {
                    this.pets[index] = updatedPet
                }
                return updatedPet
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to update pet'
                this.error = message
                throw err
            } finally {
                this.loading = false
            }
        },

        async archivePet(id: string) {
            return this.updatePet(id, { isArchived: true })
        },



        async deletePetFully(id: string) {
            this.loading = true
            try {
                await petService.deletePet(id)
                this.pets = this.pets.filter(p => p.id !== id)
                this.ensureSelectedPet()
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to delete pet'
                this.error = message
                throw err
            } finally {
                this.loading = false
            }
        },



        selectPet(id: string) {
            if (!id) return
            const isActive = this.activePets.some(pet => pet.id === id)
            if (!isActive) {
                this.ensureSelectedPet()
                return
            }
            this.selectedPetId = id
        }
    },
    persist: true
})
