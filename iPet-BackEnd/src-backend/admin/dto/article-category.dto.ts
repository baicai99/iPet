import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateArticleCategoryDto {
    @IsString()
    @IsNotEmpty()
    key: string;

    @IsString()
    @IsNotEmpty()
    label: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    order?: number;
}

export class UpdateArticleCategoryDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    label?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    order?: number;
}
