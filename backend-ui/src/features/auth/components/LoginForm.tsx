import React from 'react';
import { Form, Input, Button, Checkbox, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useLogin, type LoginFormValues } from '../hooks/useLogin';
import { useRuntimeConfig } from '@/core/config/runtimeConfig';

interface LoginFormProps {
    onSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
    const { login, loading, error } = useLogin(onSuccess);
    const { mockEnabled } = useRuntimeConfig();

    const onFinish = (values: LoginFormValues) => {
        login(values);
    };

    const handleMockLogin = () => {
        login({
            username: 'admin',
            password: 'mock',
        });
    };

    return (
        <div style={{ maxWidth: 360, margin: '0 auto' }}>
            {error && (
                <Alert
                    title="登录失败"
                    description={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
            )}
            <Form
                name="login_form"
                className="login-form"
                initialValues={{ remember: true }}
                onFinish={onFinish}
                size="large"
            >
                <Form.Item
                    name="username"
                    rules={[{ required: true, message: '请输入用户名' }]}
                >
                    <Input
                        prefix={<UserOutlined />}
                        placeholder="用户名"
                        autoComplete="username"
                    />
                </Form.Item>
                <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                >
                    <Input
                        prefix={<LockOutlined />}
                        type="password"
                        placeholder="密码"
                        autoComplete="current-password"
                    />
                </Form.Item>
                <Form.Item>
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                        <Checkbox>记住我</Checkbox>
                    </Form.Item>
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" className="login-form-button" loading={loading} block>
                        登录
                    </Button>
                </Form.Item>
            </Form>
            {mockEnabled && (
                <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Mock 快捷登录</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button onClick={handleMockLogin} block>
                            一键管理员
                        </Button>
                    </div>
                </div>
            )}
            <div style={{ textAlign: 'center', color: '#888', fontSize: '12px' }}>
                请使用管理员账号登录
            </div>
        </div>
    );
};
