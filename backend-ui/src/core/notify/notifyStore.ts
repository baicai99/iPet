import type { useAppProps } from 'antd/es/app/context';

let appInstance: useAppProps | null = null;

export const setNotifyApp = (app: useAppProps | null): void => {
    appInstance = app;
};

export const getNotifyApp = (): useAppProps | null => appInstance;
