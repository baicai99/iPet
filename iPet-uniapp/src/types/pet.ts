/**
 * Pet form related type definitions
 * Note: Base Pet type is defined in @shared/types/pet.ts
 */

/**
 * Form data for creating/editing pets
 * All fields are required strings for form binding
 */
export interface PetFormData {
    avatar: string;
    name: string;
    type: 'dog' | 'cat' | 'other';
    breed: string;
    gender: 'male' | 'female';
    weight: string;
    height?: string;
    birthday: string;
    chipId: string;
    vaccineDate: string;
    personality: string[];
    toys: string;
    allergens: string;
    description: string;
}

// Re-export shared Pet type for convenience
export type { Pet } from '@shared/types/pet'
