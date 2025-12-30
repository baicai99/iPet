import { useEffect, useState, type RefObject } from 'react';

interface UseContainerHeightOptions {
    /** 最小高度 */
    minHeight?: number;
    /** 最大高度 */
    maxHeight?: number;
    /** 底部预留空间 */
    bottomOffset?: number;
}

/**
 * 计算容器可用高度
 * 
 * @param containerRef 容器引用
 * @param options 配置选项
 * @returns 计算后的高度（undefined 表示尚未计算）
 * 
 * @example
 * ```tsx
 * const tableRef = useRef<HTMLDivElement>(null);
 * const height = useContainerHeight(tableRef, {
 *   minHeight: 300,
 *   maxHeight: 800,
 *   bottomOffset: 100,
 * });
 * ```
 */
export function useContainerHeight(
    containerRef: RefObject<HTMLElement | null>,
    options: UseContainerHeightOptions = {}
): number | undefined {
    const {
        minHeight = 300,
        maxHeight = 800,
        bottomOffset = 100,
    } = options;

    const [height, setHeight] = useState<number>();

    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const availableHeight = window.innerHeight - rect.top - bottomOffset;
                const constrainedHeight = Math.max(minHeight, Math.min(availableHeight, maxHeight));
                setHeight(constrainedHeight);
            }
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, [containerRef, minHeight, maxHeight, bottomOffset]);

    return height;
}
