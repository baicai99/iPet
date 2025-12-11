import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class CreateHealthRecordDto {
    @IsString()
    petId: string;

    @IsString()
    type: string;

    @IsNumber()
    value: number;

    @IsString()
    unit: string;

    @IsString()
    date: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    source?: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
