import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Result } from 'antd';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * 全局错误边界组件
 * @description 捕获子组件渲染错误，显示友好错误页面
 */
class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f0f2f5',
                }}>
                    <Result
                        status="error"
                        title="页面出错了"
                        subTitle={
                            import.meta.env.DEV
                                ? this.state.error?.message
                                : '抱歉，页面发生了错误，请刷新重试'
                        }
                        extra={[
                            <Button type="primary" key="reload" onClick={this.handleReload}>
                                刷新页面
                            </Button>,
                            <Button key="home" onClick={this.handleGoHome}>
                                返回首页
                            </Button>,
                        ]}
                    />
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
