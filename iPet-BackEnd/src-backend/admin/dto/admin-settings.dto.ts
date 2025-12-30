import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';

export class UpdateEntryPathDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-z][a-z0-9]{0,15}$/)
    newPath: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    currentPassword: string;
}

export class UpdateAccessConfigDto {
    @IsString()
    @IsNotEmpty()
    url: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(65535)
    port?: number;
}

export class UpdateAdminSettingsDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(32)
    username: string;

    @IsEmail()
    email: string;

    @IsInt()
    @Min(1)
    @Max(65535)
    port: number;

    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-z][a-z0-9]{0,15}$/)
    entryPath: string;

    @IsOptional()
    @IsString()
    @MinLength(8)
    password?: string;

    @ValidateIf((o) => o.password !== undefined)
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    currentPassword?: string;
}

export class VerifyAdminPasswordDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    currentPassword: string;
}
