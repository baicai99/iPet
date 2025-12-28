import React from 'react';
import { Result, Button, Space } from 'antd';

interface ErrorBoundaryState {
    hasError: boolean;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('UI crash captured by ErrorBoundary', { error, info });
    }

    handleRetry = () => {
        this.setState({ hasError: false });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <Result
                    status="error"
                    title="页面发生异常"
                    subTitle="页面渲染失败，请尝试刷新或返回首页。"
                    extra={
                        <Space>
                            <Button type="primary" onClick={this.handleRetry}>
                                重试
                            </Button>
                            <Button onClick={this.handleGoHome}>返回首页</Button>
                        </Space>
                    }
                />
            );
        }

        return this.props.children;
    }
}
