import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { notify } from '@/core/notify';

// 缓存配置常量
const DEFAULT_STALE_TIME = 5 * 60 * 1000;  // 5分钟（数据新鲜度）
const DEFAULT_GC_TIME = 10 * 60 * 1000;    // 10分钟（垃圾回收时间）

const queryCache = new QueryCache({
    onError: (error) => {
        notify.error(error, '请求失败，请稍后重试');
    },
});

const mutationCache = new MutationCache({
    onError: (error) => {
        notify.error(error, '操作失败，请稍后重试');
    },
});

export const queryClient = new QueryClient({
    queryCache,
    mutationCache,
    defaultOptions: {
        queries: {
            staleTime: DEFAULT_STALE_TIME,
            gcTime: DEFAULT_GC_TIME,
            retry: (failureCount, error) => {
                // 智能重试策略
                const errorStatus = (error as { status?: number })?.status;

                // 401/403 不重试（认证/权限问题）
                if (errorStatus === 401 || errorStatus === 403) {
                    return false;
                }

                // 最多重试2次
                return failureCount < 2;
            },
            refetchOnWindowFocus: false,
        },
    },
});
