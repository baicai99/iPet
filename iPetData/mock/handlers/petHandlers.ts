import { RequestConfig } from '../types/common'
import { pets } from '../pet.js'
import { getMockStorage } from '../utils/mockStorage'

const PETS_STORAGE_KEY = 'mock_pets'
const storage = getMockStorage()

// Initialize from storage if available
try {
    const storedPets = storage.get(PETS_STORAGE_KEY)
    if (Array.isArray(storedPets)) {
        pets.length = 0
        pets.push(...storedPets)
    }
} catch (e) {
    console.error('Failed to load mock pets from storage', e)
}

const savePetsToStorage = () => {
    try {
        storage.set(PETS_STORAGE_KEY, pets)
    } catch (e) {
        console.error('Failed to save mock pets to storage', e)
    }
}

export const getPetsMock = (config: RequestConfig) => {
    return pets
}

export const createPetMock = (config: RequestConfig) => {
    const newPet = {
        id: Math.random().toString(36).substr(2, 9),
        ...config.data as any,
        createdAt: new Date().toISOString()
    }
    pets.push(newPet)
    savePetsToStorage()
    return newPet
}

export const updatePetMock = (config: RequestConfig) => {
    const match = config.url.match(/\/pets\/([^\/]+)/)
    const id = match ? match[1] : null
    const updateData = config.data as any

    if (!id) throw new Error('Invalid ID')

    const index = pets.findIndex((p) => p.id === id)
    if (index === -1) throw new Error('Pet not found')

    pets[index] = {
        ...pets[index],
        ...updateData,
        updatedAt: new Date().toISOString()
    }
    savePetsToStorage()
    return pets[index]
}

export const deletePetMock = (config: RequestConfig) => {
    const match = config.url.match(/\/pets\/([^\/]+)/)
    const id = match ? match[1] : null

    if (!id) throw new Error('Invalid ID')

    const index = pets.findIndex((p) => p.id === id)
    if (index === -1) throw new Error('Pet not found')

    pets.splice(index, 1)
    savePetsToStorage()
    return { success: true }
}
