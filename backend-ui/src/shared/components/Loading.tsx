import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingProps {
    tip?: string;
    fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ tip = '加载中...', fullScreen = false }) => {
    const content = <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} tip={tip} />;

    if (fullScreen) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    width: '100vw',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    zIndex: 9999,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                }}
            >
                {content}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px', width: '100%' }}>
            {content}
        </div>
    );
};
