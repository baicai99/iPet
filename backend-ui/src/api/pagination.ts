import type { PaginatedData, PaginationInfo } from './types';

export type RawPaginatedData<T> = {
    items: T[];
    pagination?: PaginationInfo;
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
};

export function normalizePaginatedData<T>(data: RawPaginatedData<T>): PaginatedData<T> {
    if (data.pagination) {
        return {
            items: data.items ?? [],
            pagination: data.pagination,
        };
    }

    const items = data.items ?? [];
    const limit = data.limit ?? items.length ?? 0;
    const total = data.total ?? items.length;
    const totalPages = data.totalPages ?? (limit > 0 ? Math.ceil(total / limit) : 0);

    return {
        items,
        pagination: {
            page: data.page ?? 1,
            limit,
            total,
            totalPages,
        },
    };
}
