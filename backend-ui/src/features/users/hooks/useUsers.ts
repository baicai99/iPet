import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PaginationInfo } from '@/api/types';
import { getUsers, type UserListParams } from '@/api/contracts/users';

const DEFAULT_PAGINATION: PaginationInfo = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
};

export const useUsers = () => {
    const [params, setParams] = useState<UserListParams>({
        page: DEFAULT_PAGINATION.page,
        limit: DEFAULT_PAGINATION.limit,
    });

    const queryKey = useMemo(() => ['users', params], [params]);

    const query = useQuery({
        queryKey,
        queryFn: () => getUsers(params),
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });

    const users = query.data?.items ?? [];
    const pagination = query.data?.pagination ?? DEFAULT_PAGINATION;

    return {
        users,
        pagination,
        params,
        setParams,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        refetch: query.refetch,
    };
};
