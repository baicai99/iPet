/**
 * Pet-related types for iPet-BackEnd.
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
