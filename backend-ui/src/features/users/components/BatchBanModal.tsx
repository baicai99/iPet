/**
 * BatchBanModal - 批量封禁弹窗
 */

import React, { useEffect } from 'react';
import { Modal, Form, Input, Typography } from 'antd';

interface BatchBanModalProps {
    open: boolean;
    count: number;
    onCancel: () => void;
    onConfirm: (reason: string) => Promise<void>;
    loading?: boolean;
}

export const BatchBanModal: React.FC<BatchBanModalProps> = ({
    open,
    count,
    onCancel,
    onConfirm,
    loading = false,
}) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (open) {
            form.resetFields();
        }
    }, [open, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            await onConfirm(values.reason.trim());
            form.resetFields();
        } catch (error) {
            // Validation errors should not close the modal.
            console.error('Form validation failed:', error);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title="批量封禁用户"
            open={open}
            onCancel={handleCancel}
            onOk={handleOk}
            confirmLoading={loading}
            okText="确认封禁"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            maskClosable={!loading}
            keyboard={!loading}
        >
            <Typography.Paragraph type="secondary">
                将对已选择的 {count} 位用户执行封禁操作
            </Typography.Paragraph>
            <Form
                form={form}
                layout="vertical"
                initialValues={{ reason: '违反社区规范' }}
            >
                <Form.Item
                    name="reason"
                    label="封禁原因"
                    rules={[
                        { required: true, message: '请输入封禁原因' },
                        { max: 200, message: '封禁原因不能超过 200 字' },
                        { whitespace: true, message: '封禁原因不能为空白字符' },
                        {
                            min: 2,
                            message: '封禁原因至少 2 个字符',
                        },
                    ]}
                >
                    <Input.TextArea
                        rows={4}
                        placeholder="请输入封禁原因，如：发布违规内容、恶意刷屏、侮辱他人等"
                        maxLength={200}
                        showCount
                        autoFocus
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};
