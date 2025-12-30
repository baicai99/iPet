import { IsOptional, IsString, IsBoolean, IsInt, Min, Max, IsArray, ArrayNotEmpty, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PaginationQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}

export class UserListQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : undefined)
    @IsBoolean()
    isGuest?: boolean;

    @IsOptional()
    @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : undefined)
    @IsBoolean()
    isBanned?: boolean;

    @IsOptional()
    @IsIn(['createdAt', 'lastActiveAt', 'petsCount'])
    sortBy?: 'createdAt' | 'lastActiveAt' | 'petsCount';

    @IsOptional()
    @Transform(({ value }) => value === 'ascend' ? 'asc' : value === 'descend' ? 'desc' : value)
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';
}

export class BanUserDto {
    @IsOptional()
    @IsString()
    reason?: string;
}

export class BatchUserActionDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    ids!: string[];

    @IsOptional()
    @IsString()
    reason?: string;
}
