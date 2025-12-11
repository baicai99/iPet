import { IsString, IsOptional, IsNumber, IsEnum, IsArray, IsBoolean } from 'class-validator';

export class CreatePetDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    breed?: string;

    @IsOptional()
    @IsNumber()
    age?: number;

    @IsOptional()
    @IsNumber()
    weight?: number;

    @IsOptional()
    @IsString()
    gender?: string;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsString()
    birthday?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    personality?: string[];

    @IsOptional()
    @IsBoolean()
    isSterilized?: boolean;

    @IsOptional()
    @IsString()
    chipId?: string;

    @IsOptional()
    @IsString()
    toys?: string;

    @IsOptional()
    @IsString()
    allergens?: string;

    @IsOptional()
    @IsString()
    vaccineDate?: string;

    @IsOptional()
    @IsString()
    description?: string;
}
