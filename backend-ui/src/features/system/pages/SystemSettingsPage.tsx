/**
 * System Settings Page - 设置页
 * @description 提供管理员基础信息与系统访问配置维护
 */

import React, { useMemo, useState } from 'react';
import { Layout, Typography, Card, Form, Input, InputNumber, Button, Alert, Space, App } from 'antd';
import { CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { useNavigate } from 'react-router-dom';
import { getSettings, updateSettings, verifyAdminPassword, type UpdateSettingsRequest } from '@/api/contracts/settings';
import { generateRandomPath, isValidPathFormat, setAccessConfig, setEntryPath, useInitState } from '@/core/init';
import { useAuth } from '@/core/auth';
import { setAdminInfo } from '@/core/auth/tokenStore';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

interface SettingsFormValues {
    username: string;
    email: string;
    password?: string;
    currentPassword?: string;
    port: number;
    entryPath: string;
}

const SystemSettingsPage: React.FC = () => {
    const [form] = Form.useForm<SettingsFormValues>();
    const { admin } = useAuth();
    const initState = useInitState();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const [initialValues, setInitialValues] = useState<SettingsFormValues | null>(null);
    const [isPasswordVerified, setIsPasswordVerified] = useState(false);
    const currentPassword = Form.useWatch('currentPassword', form);

    const { loading: isLoading, refreshAsync } = useRequest(getSettings, {
        onSuccess: (data) => {
            const values: SettingsFormValues = {
                username: data.username,
                email: data.email || '',
                port: data.port,
                entryPath: data.entryPath,
                password: '',
                currentPassword: '',
            };
            form.setFieldsValue(values);
            setInitialValues(values);
            setIsPasswordVerified(false);

            if (admin) {
                setAdminInfo({
                    ...admin,
                    username: data.username,
                    displayName: data.username,
                });
            }
        },
        onError: (error) => {
            message.error(`获取设置失败: ${error.message}`);
        },
    });

    const { run: submitUpdate, loading: isSaving } = useRequest(updateSettings, {
        manual: true,
        onSuccess: (data, params) => {
            const [payload] = params as [UpdateSettingsRequest];
            const previousEntryPath = initialValues?.entryPath;

            const nextValues: SettingsFormValues = {
                username: data.username,
                email: data.email || '',
                port: data.port,
                entryPath: data.entryPath,
                password: '',
                currentPassword: '',
            };

            form.setFieldsValue(nextValues);
            setInitialValues(nextValues);
            message.success('设置已更新');
            setIsPasswordVerified(false);

            if (admin) {
                setAdminInfo({
                    ...admin,
                    username: data.username,
                    displayName: data.username,
                });
            }

            if (initState.accessConfig?.url) {
                setAccessConfig({
                    url: initState.accessConfig.url,
                    port: data.port,
                });
            }
            setEntryPath(data.entryPath);

            if (previousEntryPath && data.entryPath !== previousEntryPath && payload.entryPath) {
                message.info('入口路径已更新，正在跳转至新登录地址…');
                setTimeout(() => {
                    navigate(`/${data.entryPath}/login`, { replace: true });
                    window.location.reload();
                }, 1500);
            }
        },
        onError: (error) => {
            message.error(`保存失败: ${error.message}`);
        },
    });

    const { run: verifyPassword, loading: isVerifying } = useRequest(verifyAdminPassword, {
        manual: true,
        onSuccess: () => {
            setIsPasswordVerified(true);
            message.success('旧密码验证通过');
        },
        onError: (error) => {
            setIsPasswordVerified(false);
            message.error(`验证失败: ${error.message}`);
        },
    });

    const handleFinish = (values: SettingsFormValues) => {
        const payload: UpdateSettingsRequest = {
            username: values.username,
            email: values.email,
            port: values.port,
            entryPath: values.entryPath,
        };
        if (values.password) {
            payload.password = values.password;
            payload.currentPassword = values.currentPassword;
        }
        submitUpdate(payload);
    };

    const handleCancel = () => {
        if (!initialValues) return;
        form.setFieldsValue({ ...initialValues, password: '', currentPassword: '' });
        setIsPasswordVerified(false);
        message.info('已取消修改');
    };

    const handleReset = async () => {
        try {
            await refreshAsync();
            setIsPasswordVerified(false);
            message.success('设置已重置为最新配置');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            message.error(`重置失败: ${errorMessage}`);
        }
    };

    const handlePasswordVerify = async () => {
        const currentPassword = form.getFieldValue('currentPassword');
        if (!currentPassword) {
            message.warning('请输入旧密码');
            return;
        }
        await verifyPassword(currentPassword);
    };

    const pathHelp = useMemo(() => '仅支持小写字母与数字，1-16 位，且需以字母开头。', []);

    return (
        <Content>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>设置</Title>
                <Paragraph type="secondary">
                    维护管理员基础信息与系统访问配置。修改入口路径后旧地址将失效，请谨慎操作。
                </Paragraph>
            </div>

            <Card variant="borderless">
                <Alert
                    title="提示"
                    description="密码为空时将保持不变。保存入口路径后将跳转到新的登录地址。"
                    type="warning"
                    showIcon
                    style={{ marginBottom: 24 }}
                />

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                    onValuesChange={(changedValues) => {
                        if ('currentPassword' in changedValues) {
                            setIsPasswordVerified(false);
                        }
                        if ('password' in changedValues && !changedValues.password) {
                            setIsPasswordVerified(false);
                        }
                    }}
                    disabled={isLoading || isSaving}
                    style={{ maxWidth: 640 }}
                >
                    <Form.Item
                        label="用户名"
                        name="username"
                        rules={[{ required: true, message: '请输入用户名' }]}
                    >
                        <Input placeholder="请输入用户名" size="large" />
                    </Form.Item>

                    <Form.Item
                        label="邮箱"
                        name="email"
                        rules={[
                            { required: true, message: '请输入邮箱' },
                            { type: 'email', message: '邮箱格式不正确' },
                        ]}
                    >
                        <Input placeholder="name@example.com" size="large" autoComplete="email" />
                    </Form.Item>

                    <Form.Item
                        label="旧密码"
                        name="currentPassword"
                        dependencies={['password']}
                        rules={[
                            {
                                validator: (_, value) => {
                                    const newPassword = form.getFieldValue('password');
                                    if (newPassword && !value) {
                                        return Promise.reject(new Error('请输入旧密码'));
                                    }
                                    return Promise.resolve();
                                },
                            },
                        ]}
                    >
                        <Space.Compact style={{ width: '100%' }}>
                            <Input.Password placeholder="修改密码时必填" size="large" autoComplete="current-password" />
                            <Button
                                onClick={handlePasswordVerify}
                                loading={isVerifying}
                                disabled={!currentPassword || isPasswordVerified || isSaving || isLoading}
                                type={isPasswordVerified ? 'default' : 'primary'}
                                icon={isPasswordVerified ? <CheckOutlined /> : undefined}
                                size="large"
                                style={{ minWidth: 96 }}
                            >
                                {isPasswordVerified ? '已验证' : '验证'}
                            </Button>
                        </Space.Compact>
                    </Form.Item>

                    <Form.Item
                        label="新密码"
                        name="password"
                        dependencies={['currentPassword']}
                        rules={[
                            {
                                validator: (_, value) => {
                                    if (!value) {
                                        return Promise.resolve();
                                    }
                                    if (!isPasswordVerified) {
                                        return Promise.reject(new Error('请先验证旧密码'));
                                    }
                                    if (value.length >= 8) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('密码至少 8 位'));
                                },
                            },
                        ]}
                    >
                        <Input.Password
                            placeholder="验证旧密码后可输入"
                            size="large"
                            autoComplete="new-password"
                            disabled={!isPasswordVerified}
                        />
                    </Form.Item>

                    <Form.Item
                        label="端口"
                        name="port"
                        rules={[{ required: true, message: '请输入端口号' }]}
                    >
                        <InputNumber
                            min={1}
                            max={65535}
                            style={{ width: '100%' }}
                            size="large"
                            placeholder="1-65535"
                        />
                    </Form.Item>

                    <Form.Item
                        label="路由前缀"
                        name="entryPath"
                        rules={[
                            { required: true, message: '请输入路由前缀' },
                            {
                                validator: (_, value) => {
                                    if (!value || isValidPathFormat(value)) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('路由前缀格式不符合要求'));
                                },
                            },
                        ]}
                        extra={<Text type="secondary">{pathHelp}</Text>}
                    >
                        <Space.Compact style={{ width: '100%' }}>
                            <Input placeholder="manager" size="large" />
                            <Button
                                icon={<ReloadOutlined />}
                                size="large"
                                onClick={() => form.setFieldsValue({ entryPath: generateRandomPath() })}
                            >
                                随机生成
                            </Button>
                        </Space.Compact>
                    </Form.Item>

                    <Form.Item>
                        <Space size="middle">
                            <Button type="primary" htmlType="submit" loading={isSaving}>
                                保存
                            </Button>
                            <Button onClick={handleCancel} disabled={isSaving}>
                                取消
                            </Button>
                            <Button onClick={handleReset} disabled={isSaving}>
                                重置
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </Content>
    );
};

export default SystemSettingsPage;
