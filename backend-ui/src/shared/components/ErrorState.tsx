import React from 'react';
import { Result, Button } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

interface ErrorStateProps {
    status?: '403' | '404' | '500' | 'error' | 403 | 404 | 500;
    title?: string;
    subTitle?: string;
    onRetry?: () => void;
    onBackHome?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
    status = 'error',
    title = '出错了',
    subTitle = '抱歉，系统暂时无法响应，请稍后再试。',
    onRetry,
    onBackHome,
}) => {
    return (
        <Result
            status={status}
            title={title}
            subTitle={subTitle}
            extra={[
                onRetry && (
                    <Button type="primary" key="retry" icon={<ReloadOutlined />} onClick={onRetry}>
                        重试
                    </Button>
                ),
                onBackHome && (
                    <Button key="home" icon={<HomeOutlined />} onClick={onBackHome}>
                        返回首页
                    </Button>
                ),
            ]}
        />
    );
};
