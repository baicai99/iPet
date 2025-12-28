import React from 'react';
import { Empty, type EmptyProps } from 'antd';

interface EmptyStateProps extends EmptyProps {
    description?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ description = '暂无数据', ...props }) => {
    return (
        <div style={{ padding: '32px 0' }}>
            <Empty description={description} {...props} />
        </div>
    );
};
