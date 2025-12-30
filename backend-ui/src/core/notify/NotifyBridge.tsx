import { useEffect } from 'react';
import { App } from 'antd';
import { setNotifyApp } from './notifyStore';

export const NotifyBridge: React.FC = () => {
    const app = App.useApp();

    useEffect(() => {
        setNotifyApp(app);
        return () => setNotifyApp(null);
    }, [app]);

    return null;
};
