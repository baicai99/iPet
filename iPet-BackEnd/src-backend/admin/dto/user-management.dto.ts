import { IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';
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
}

export class BanUserDto {
    @IsOptional()
    @IsString()
    reason?: string;
}
