import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class TogglePinDto {
    @IsString()
    @IsNotEmpty()
    petId: string;

    @IsString()
    @IsNotEmpty()
    metricKey: string;

    @IsBoolean()
    isPinned: boolean;
}
