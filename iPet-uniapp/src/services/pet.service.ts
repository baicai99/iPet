import request from '@/utils/common/request'
import type { Pet } from '@/types/pet'
import type { CreatePetDto, UpdatePetDto } from '@/types/dto/pet'

export const petService = {
    async getPets(): Promise<Pet[]> {
        return request({
            url: '/pets',
            method: 'GET'
        })
    },

    async createPet(data: CreatePetDto): Promise<Pet> {
        return request({
            url: '/pets',
            method: 'POST',
            data
        })
    },

    async updatePet(id: string, data: UpdatePetDto): Promise<Pet> {
        return request({
            url: `/pets/${id}`,
            method: 'PATCH' as any,
            data
        })
    },

    async deletePet(id: string): Promise<void> {
        return request({
            url: `/pets/${id}`,
            method: 'DELETE'
        })
    }
}
