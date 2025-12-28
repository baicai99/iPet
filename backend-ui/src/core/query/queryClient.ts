import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { notify } from '@/core/notify';

const DEFAULT_STALE_TIME = 30 * 1000;
const DEFAULT_RETRY = 1;

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
            retry: DEFAULT_RETRY,
            refetchOnWindowFocus: false,
        },
    },
});
