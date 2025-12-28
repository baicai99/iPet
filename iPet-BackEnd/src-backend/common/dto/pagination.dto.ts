import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Standard pagination DTO with sensible limits
 */
export class PaginationDto {
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

    get skip(): number {
        return ((this.page || 1) - 1) * (this.limit || 20);
    }

    get take(): number {
        return this.limit || 20;
    }
}

/**
 * Maximum allowed page depth to prevent performance issues
 */
export const MAX_PAGE_DEPTH = 500;

/**
 * Pagination helper to build pagination result
 */
export function buildPaginationResult(
    page: number = 1,
    limit: number = 20,
): { page: number; limit: number; skip: number; take: number } {
    const normalizedPage = Math.min(Math.max(1, page), MAX_PAGE_DEPTH);
    const normalizedLimit = Math.min(Math.max(1, limit), 100);

    return {
        page: normalizedPage,
        limit: normalizedLimit,
        skip: (normalizedPage - 1) * normalizedLimit,
        take: normalizedLimit,
    };
}

/**
 * Build paginated response data
 */
export function buildPaginatedData<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
) {
    return {
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
