import { useCallback, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { DashboardStats, TrendPoint } from '@/api/types';
import { getDashboardStats, getRecordsTrend, getUsersTrend } from '@/api/contracts/stats';
import { queryKeys } from '@/api/queryKeys';

const RANGE_TO_DAYS: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90
};

export const useDashboardData = () => {
    const [userRange, setUserRange] = useState<string>('7d');
    const [recordRange, setRecordRange] = useState<string>('7d');

    // 使用 useQueries 并行请求所有数据
    const queries = useQueries({
        queries: [
            {
                queryKey: queryKeys.dashboard.stats(),
                queryFn: () => getDashboardStats(),
            },
            {
                queryKey: queryKeys.dashboard.usersTrend(userRange),
                queryFn: () => getUsersTrend({ days: RANGE_TO_DAYS[userRange] || 30 }),
                placeholderData: (previousData: TrendPoint[] | undefined) => previousData,
            },
            {
                queryKey: queryKeys.dashboard.recordsTrend(recordRange),
                queryFn: () => getRecordsTrend({ days: RANGE_TO_DAYS[recordRange] || 30 }),
                placeholderData: (previousData: TrendPoint[] | undefined) => previousData,
            },
        ],
    });

    const [statsQuery, userTrendQuery, recordTrendQuery] = queries;

    const refreshAll = useCallback(async () => {
        await Promise.all([
            statsQuery.refetch(),
            userTrendQuery.refetch(),
            recordTrendQuery.refetch(),
        ]);
    }, [statsQuery, userTrendQuery, recordTrendQuery]);

    // 计算错误信息
    const errorMessage = (() => {
        const error = statsQuery.error || userTrendQuery.error || recordTrendQuery.error;
        if (!error) return null;
        return error instanceof Error ? error.message : '数据加载失败，请稍后重试';
    })();

    return {
        stats: statsQuery.data as DashboardStats | undefined ?? null,
        userTrend: userTrendQuery.data as TrendPoint[] | undefined ?? [],
        recordTrend: recordTrendQuery.data as TrendPoint[] | undefined ?? [],
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
