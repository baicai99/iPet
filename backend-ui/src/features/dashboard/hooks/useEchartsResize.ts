import { useLayoutEffect, type RefObject } from 'react';
import type ReactECharts from 'echarts-for-react';

export const useEchartsResize = (
    chartRef: RefObject<ReactECharts | null>,
    containerRef: RefObject<HTMLElement | null>,
    deps: readonly unknown[] = []
) => {
    useLayoutEffect(() => {
        const container = containerRef.current;
        const chart = chartRef.current;

        if (!container || !chart) {
            return;
        }

        const instance = chart.getEchartsInstance();
        let rafId: number | null = null;

        const resize = () => {
            if (instance && !instance.isDisposed()) {
                instance.resize();
            }
        };

        const scheduleResize = () => {
            if (rafId !== null) return;
            rafId = window.requestAnimationFrame(() => {
                rafId = null;
                resize();
            });
        };

        const observer = new ResizeObserver(() => {
            scheduleResize();
        });

        observer.observe(container);
        scheduleResize();

        return () => {
            observer.disconnect();
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
            }
        };
    }, [chartRef, containerRef, deps]);
};
