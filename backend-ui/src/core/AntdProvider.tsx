import React, { type ReactNode } from 'react';
import { ConfigProvider, App } from 'antd';
import zhCN from 'antd/locale/zh_CN';

interface AntdProviderProps {
    children: ReactNode;
}

/**
 * Ant Design 配置提供者
 * @description 配置中文本地化、主题、表单验证消息等
 */
const AntdProvider: React.FC<AntdProviderProps> = ({ children }) => {
    return (
        <ConfigProvider
            locale={zhCN}
            theme={{
                token: {
                    colorPrimary: '#1890ff',
                    borderRadius: 6,
                },
            }}
        >
            <App>{children}</App>
        </ConfigProvider>
    );
};

export default AntdProvider;
