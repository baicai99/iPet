import { useEffect, useState } from 'react';

/**
 * 防抖 Hook - 延迟更新值直到输入停止
 * 
 * @template T 值的类型
 * @param value 原始值
 * @param delay 防抖延迟（毫秒），默认 500ms
 * @returns 防抖后的值
 * 
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebouncedValue(search, 500);
 * 
 * // debouncedSearch 仅在用户停止输入 500ms 后更新
 * useEffect(() => {
 *   fetchData(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebouncedValue<T>(value: T, delay = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // 设置定时器：在 delay ms 后更新 debouncedValue
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // 清理函数：value 变化时清除上一个定时器
        // 这确保了只有最后一次输入后的 delay ms 才会触发更新
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}
