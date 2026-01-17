/**
 * Pet request DTOs aligned with iPet-BackEnd.
 */
export interface CreatePetDto {
    id?: string;
    name: string;
    type?: string;
    breed?: string;
    age?: number;
    weight?: number;
    gender?: string;
    height?: number;
    avatar?: string;
    birthday?: string;
    birthTimestamp?: number;
    arrivalDate?: string;
    personality?: string[];
    isSterilized?: boolean;
    chipId?: string;
    toys?: string;
    allergens?: string;
    vaccineDate?: string;
    description?: string;
    status?: string;
    createdAt?: number;
    updatedAt?: number;
}

export type UpdatePetDto = Partial<CreatePetDto>;
