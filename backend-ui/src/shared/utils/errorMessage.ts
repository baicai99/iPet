export const getErrorMessage = (error: unknown, fallback = '操作失败'): string => {
    if (error instanceof Error) {
        return error.message || fallback;
    }
    if (typeof error === 'string') {
        return error || fallback;
    }
    return fallback;
};
