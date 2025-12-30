import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

/**
 * 404 页面
 * @description 当用户访问不存在的路由时显示
 */
export const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#f0f2f5',
        }}>
            <Result
                status="404"
                title="404"
                subTitle="抱歉，您访问的页面不存在"
                extra={[
                    <Button type="primary" key="home" onClick={() => navigate('/')}>
                        返回首页
                    </Button>,
                    <Button key="back" onClick={() => navigate(-1)}>
                        返回上一页
                    </Button>,
                ]}
            />
        </div>
    );
};

export default NotFoundPage;
