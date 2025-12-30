import { message as staticMessage, notification as staticNotification } from 'antd';
import { isAppError } from '../errors';
import { getNotifyApp } from './notifyStore';

const formatErrorMessage = (error: unknown, fallback: string) => {
    if (isAppError(error)) {
        return {
            message: error.message || fallback,
            requestId: error.requestId,
        };
    }

    if (error instanceof Error) {
        return { message: error.message || fallback };
    }

    return { message: fallback };
};

export const notify = {
    success: (text: string) => {
        const app = getNotifyApp();
        (app?.message ?? staticMessage).success(text);
    },
    info: (text: string) => {
        const app = getNotifyApp();
        (app?.message ?? staticMessage).info(text);
    },
    warning: (text: string) => {
        const app = getNotifyApp();
        (app?.message ?? staticMessage).warning(text);
    },
    error: (error: unknown, fallback = '操作失败，请稍后重试') => {
        const { message: text, requestId } = formatErrorMessage(error, fallback);
        const app = getNotifyApp();
        (app?.notification ?? staticNotification).error({
            title: text,
            description: requestId ? `RequestId: ${requestId}` : undefined,
        });
    },
};
