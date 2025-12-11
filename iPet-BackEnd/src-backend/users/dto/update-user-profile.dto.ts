import { IsString, IsOptional, IsArray, MaxLength } from 'class-validator';

export class UpdateUserProfileDto {
    @IsOptional()
    @IsString()
    @MaxLength(50)
    displayName?: string;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    bio?: string;

    @IsOptional()
    @IsString()
    mbti?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
}
