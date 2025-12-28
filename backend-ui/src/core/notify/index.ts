import { message, notification } from 'antd';
import { isAppError } from '../errors';

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
    success: (text: string) => message.success(text),
    info: (text: string) => message.info(text),
    warning: (text: string) => message.warning(text),
    error: (error: unknown, fallback = '操作失败，请稍后重试') => {
        const { message: text, requestId } = formatErrorMessage(error, fallback);
        notification.error({
            message: text,
            description: requestId ? `RequestId: ${requestId}` : undefined,
        });
    },
};
