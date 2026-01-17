import { ArrayMinSize, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    tags: string[];

    @IsString()
    @IsOptional()
    cover?: string;

    @IsString()
    @IsOptional()
    author?: string;

    @IsOptional()
    @IsBoolean()
    sectionPinned?: boolean;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    pinnedMetrics?: string[];
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

    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    tags?: string[];

    @IsString()
    @IsOptional()
    cover?: string;

    @IsString()
    @IsOptional()
    author?: string;

    @IsOptional()
    @IsBoolean()
    sectionPinned?: boolean;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    pinnedMetrics?: string[];
}
