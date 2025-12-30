import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class AdminDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(32)
    username: string;

    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;
}

export class InitSystemDto {
    @IsString()
    @IsNotEmpty()
    accessUrl: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(65535)
    port?: number;

    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-z][a-z0-9]{0,15}$/)
    entryPath: string;

    @ValidateNested()
    @Type(() => AdminDto)
    admin: AdminDto;
}
