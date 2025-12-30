/**
 * 安全设置面板
 * @description 管理密码修改、密码策略和会话安全
 */

import React from 'react';
import {
    Form,
    Input,
    Button,
    Card,
    Switch,
    InputNumber,
    Divider,
    App,
    Typography,
} from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';

const { Paragraph } = Typography;

export const SecurityPanel: React.FC = () => {
    const [passwordForm] = Form.useForm();
    const [policyForm] = Form.useForm();
    const { message } = App.useApp();

    const { run: updatePassword, loading: isPasswordUpdating } = useRequest(
        async (values) => {
            void values;
            // TODO: 调用真实的修改密码 API
            return new Promise((resolve) => setTimeout(resolve, 1000));
        },
        {
            manual: true,
            onSuccess: () => {
                message.success('密码修改成功');
                passwordForm.resetFields();
            },
        }
    );

    const { run: updatePolicy, loading: isPolicyUpdating } = useRequest(
        async (values) => {
            void values;
            // TODO: 调用真实的更新策略 API
            return new Promise((resolve) => setTimeout(resolve, 800));
        },
        {
            manual: true,
            onSuccess: () => {
                message.success('安全策略已更新');
            },
        }
    );

    return (
        <div style={{ maxWidth: 800, padding: '24px 0' }}>
            {/* 修改密码 */}
            <Card title="修改我的密码" variant="borderless" className="shadow-sm">
                <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={updatePassword}
                    style={{ maxWidth: 500 }}
                >
                    <Form.Item
                        label="当前密码"
                        name="currentPassword"
                        rules={[{ required: true, message: '请输入当前密码' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
                    </Form.Item>

                    <Form.Item
                        label="新密码"
                        name="newPassword"
                        rules={[{ required: true, message: '请输入新密码' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
                    </Form.Item>

                    <Form.Item
                        label="确认新密码"
                        name="confirmNewPassword"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: '请确认新密码' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('两次输入的密码不一致'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={isPasswordUpdating}>
                            修改密码
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            <Divider />

            {/* 密码策略 */}
            <Card title="密码安全策略" variant="borderless" className="shadow-sm">
                <Paragraph type="secondary" style={{ marginBottom: 24 }}>
                    设置全局密码强度要求，不仅适用于管理员，也适用于普通用户。
                </Paragraph>

                <Form
                    form={policyForm}
                    layout="vertical"
                    initialValues={{
                        minLength: 8,
                        requireSpecialChar: true,
                        requireNumber: true,
                        requireUpperCase: true,
                    }}
                    onFinish={updatePolicy}
                    style={{ maxWidth: 500 }}
                >
                    <Form.Item
                        label="最小密码长度"
                        name="minLength"
                    >
                        <InputNumber min={6} max={32} />
                    </Form.Item>

                    <Form.Item
                        label="强制包含特殊字符"
                        name="requireSpecialChar"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>

                    <Form.Item
                        label="强制包含数字"
                        name="requireNumber"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>

                    <Form.Item
                        label="强制包含大写字母"
                        name="requireUpperCase"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={isPolicyUpdating}>
                            更新策略
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            <Divider />

            {/* 会话管理 */}
            <Card title="会话管理" variant="borderless" className="shadow-sm">
                <Paragraph type="secondary">
                    发现异常活动时，可以强制所有用户下线（您自己除外）。
                </Paragraph>
                <Button danger>
                    强制所有用户下线
                </Button>
            </Card>
        </div>
    );
};
