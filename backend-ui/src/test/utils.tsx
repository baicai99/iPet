/* eslint-disable react-refresh/only-export-components */
import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';

// 创建测试用的 QueryClient
export function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });
}

interface AllTheProvidersProps {
    children: React.ReactNode;
}

// 所有 Provider 包装
function AllTheProviders({ children }: AllTheProvidersProps) {
    const queryClient = createTestQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <ConfigProvider>
                    {children}
                </ConfigProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

// 自定义 render
export function renderWithProviders(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    return render(ui, { wrapper: AllTheProviders, ...options });
}

// 重新导出所有 testing-library 工具
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
