import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// 每个测试后自动清理
afterEach(() => {
    cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin = '';
    readonly thresholds: ReadonlyArray<number> = [];

    constructor() { }

    disconnect(): void { }
    observe(target: Element): void {
        void target;
    }
    takeRecords(): IntersectionObserverEntry[] {
        return [];
    }
    unobserve(target: Element): void {
        void target;
    }
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock ResizeObserver
class MockResizeObserver implements ResizeObserver {
    constructor() { }

    disconnect(): void { }
    observe(target: Element, options?: ResizeObserverOptions): void {
        void target;
        void options;
    }
    unobserve(target: Element): void {
        void target;
    }
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
