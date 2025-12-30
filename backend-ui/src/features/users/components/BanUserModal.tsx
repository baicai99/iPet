/**
 * BanUserModal - 封禁用户弹窗
 * @description 使用 Modal + Form 替代 window.prompt，提供输入验证和更好的用户体验
 */

import React, { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import type { User } from '@/api/types';

interface BanUserModalProps {
    /** 是否显示弹窗 */
    open: boolean;
    /** 要封禁的用户 */
    user: User | null;
    /** 取消回调 */
    onCancel: () => void;
    /** 确认封禁回调 */
    onConfirm: (reason: string) => Promise<void>;
    /** 是否正在提交 */
    loading?: boolean;
}

export const BanUserModal: React.FC<BanUserModalProps> = ({
    open,
    user,
    onCancel,
    onConfirm,
    loading = false,
}) => {
    const [form] = Form.useForm();

    // 弹窗打开时重置表单
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
            // 表单验证失败，不关闭弹窗
            console.error('Form validation failed:', error);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title={`封禁用户: ${user?.displayName || ''}`}
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
