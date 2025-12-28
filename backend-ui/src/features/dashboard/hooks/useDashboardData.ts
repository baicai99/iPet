import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DashboardStats, TrendPoint } from '@/api/types';
import { getDashboardStats, getRecordsTrend, getUsersTrend } from '@/api/contracts/stats';

const RANGE_TO_DAYS: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90
};

export const useDashboardData = () => {
    const [userRange, setUserRange] = useState<string>('7d');
    const [recordRange, setRecordRange] = useState<string>('7d');

    const statsQuery = useQuery<DashboardStats>({
        queryKey: ['dashboard', 'stats'],
        queryFn: () => getDashboardStats(),
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });

    const userTrendQuery = useQuery<TrendPoint[]>({
        queryKey: ['dashboard', 'users-trend', userRange],
        queryFn: () => getUsersTrend({ days: RANGE_TO_DAYS[userRange] || 30 }),
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });

    const recordTrendQuery = useQuery<TrendPoint[]>({
        queryKey: ['dashboard', 'records-trend', recordRange],
        queryFn: () => getRecordsTrend({ days: RANGE_TO_DAYS[recordRange] || 30 }),
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });

    const refreshAll = useCallback(async () => {
        await Promise.all([
            statsQuery.refetch(),
            userTrendQuery.refetch(),
            recordTrendQuery.refetch(),
        ]);
    }, [statsQuery, userTrendQuery, recordTrendQuery]);

    const errorMessage = useMemo(() => {
        const error = statsQuery.error || userTrendQuery.error || recordTrendQuery.error;
        if (!error) return null;
        return error instanceof Error ? error.message : '数据加载失败，请稍后重试';
    }, [recordTrendQuery.error, statsQuery.error, userTrendQuery.error]);

    return {
        stats: statsQuery.data ?? null,
        userTrend: userTrendQuery.data ?? [],
        recordTrend: recordTrendQuery.data ?? [],
        userRange,
        setUserRange,
        recordRange,
        setRecordRange,
        loadingStats: statsQuery.isFetching,
        loadingUserTrend: userTrendQuery.isFetching,
        loadingRecordTrend: recordTrendQuery.isFetching,
        refreshing: statsQuery.isFetching || userTrendQuery.isFetching || recordTrendQuery.isFetching,
        error: errorMessage,
        refreshAll
    };
};
