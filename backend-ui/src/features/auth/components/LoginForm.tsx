import React from 'react';
import { Form, Input, Button, Checkbox, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useLogin, type LoginFormValues } from '../hooks/useLogin';

interface LoginFormProps {
    onSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
    const { login, loading, error } = useLogin(onSuccess);

    const onFinish = (values: LoginFormValues) => {
        login(values);
    };

    return (
        <div style={{ maxWidth: 360, margin: '0 auto' }}>
            {error && (
                <Alert
                    message="Login Failed"
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
                    rules={[{ required: true, message: 'Please input your Username!' }]}
                >
                    <Input
                        prefix={<UserOutlined />}
                        placeholder="Username"
                    />
                </Form.Item>
                <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Please input your Password!' }]}
                >
                    <Input
                        prefix={<LockOutlined />}
                        type="password"
                        placeholder="Password"
                    />
                </Form.Item>
                <Form.Item>
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                        <Checkbox>Remember me</Checkbox>
                    </Form.Item>
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" className="login-form-button" loading={loading} block>
                        Log in
                    </Button>
                </Form.Item>
            </Form>
            <div style={{ textAlign: 'center', color: '#888', fontSize: '12px' }}>
                请使用管理员账号登录
            </div>
        </div>
    );
};
