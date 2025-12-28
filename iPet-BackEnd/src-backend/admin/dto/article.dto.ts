import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateArticleDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    summary: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsString()
    @IsOptional()
    cover?: string;

    @IsString()
    @IsOptional()
    author?: string;
}

export class UpdateArticleDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    summary?: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    cover?: string;

    @IsString()
    @IsOptional()
    author?: string;
}
