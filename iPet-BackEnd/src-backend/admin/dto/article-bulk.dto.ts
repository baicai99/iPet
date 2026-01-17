import { ArrayMinSize, IsArray, IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class BulkDeleteArticlesDto {
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    ids: string[];
}

export class BulkUpdateArticleCategoryDto {
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    ids: string[];

    @IsString()
    @IsNotEmpty()
    category: string;
}

export class BulkUpdateArticlePinDto {
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    ids: string[];

    @IsBoolean()
    sectionPinned: boolean;
}
