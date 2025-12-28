import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface ConfirmOptions {
    title: string;
    content?: string;
    onConfirm: () => Promise<void> | void;
    okText?: string;
    cancelText?: string;
    danger?: boolean;
}

export const ConfirmDialog = (options: ConfirmOptions) => {
    const { title, content, onConfirm, okText = '确定', cancelText = '取消', danger = false } = options;

    Modal.confirm({
        title,
        icon: <ExclamationCircleOutlined />,
        content,
        okText,
        cancelText,
        okType: danger ? 'danger' : 'primary',
        onOk: async () => {
            await onConfirm();
        },
    });
};
