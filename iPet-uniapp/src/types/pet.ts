/**
 * Pet form related type definitions.
 */

export interface Pet {
    id: string;
    updatedAt: number;
    deleted?: boolean;
    name: string;
    breed?: string | null;
    age?: number | null;
    weight?: number | null;
    gender?: 'male' | 'female' | null;
    avatar?: string | null;
    birthday?: string | null;
    birthTimestamp?: number | null;
    arrivalDate?: string | null;  // Date pet arrived home (ISO format YYYY-MM-DD)
    arrivalTimestamp?: number | null;  // Timestamp for arrival date
    ownerId?: string | null;

    type: 'dog' | 'cat' | 'other';
    isArchived?: boolean | null;
    isSterilized?: boolean | null;
    chipId?: string | null;
    toys?: string | null;
    personality?: string[] | null;
    allergens?: string | null;
    vaccineDate?: string | null;

    [key: string]: any;
}

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
