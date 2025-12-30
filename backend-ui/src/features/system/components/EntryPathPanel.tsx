/**
 * 入口路径管理面板
 */

import React, { useEffect, useState } from 'react';
import {
    Form,
    Input,
    Button,
    Alert,
    App,
    Typography,
    Modal,
    Space,
} from 'antd';
import { ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { updateEntryPath } from '@/api/contracts/system-init';
import {
    generateRandomPath,
    isValidPathFormat,
    setEntryPath,
    useInitState,
    refreshInitState,
} from '@/core/init';
import { useNavigate } from 'react-router-dom';

const { Text, Paragraph } = Typography;

export const EntryPathPanel: React.FC = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const initState = useInitState();
    const currentPath = initState.entryPath || '';
    const [newPath, setNewPath] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');

    // 生成随机路径
    const handleGenerate = () => {
        const path = generateRandomPath();
        form.setFieldsValue({ newPath: path });
        setNewPath(path);
    };

    useEffect(() => {
        refreshInitState();
    }, []);

    // 预览新地址
    const getPreviewUrl = () => {
        if (!newPath) return '';
        const config = initState.accessConfig;
        const accessUrl = config?.url || window.location.origin;
        const port = config?.port;
        let baseUrl = accessUrl.replace(/\/$/, '');

        if (port && !baseUrl.includes(':' + port)) {
            if (port !== 80 && port !== 443) {
                baseUrl = `${baseUrl}:${port}`;
            }
        }

        return `${baseUrl}/${newPath}/login`;
    };

    // 提交更新
    const { run: submitUpdate, loading: isSubmitting } = useRequest(updateEntryPath, {
        manual: true,
        onSuccess: (data) => {
            message.success('入口路径修改成功！请使用新地址登录。');
            setEntryPath(data.newPath);
            setIsModalVisible(false);

            // 延迟跳转到新地址
            setTimeout(() => {
                navigate(`/${data.newPath}/login`, { replace: true });
                // 强制刷新以重置应用状态
                window.location.reload();
            }, 2000);
        },
        onError: (error) => {
            message.error(`修改失败: ${error.message}`);
        },
    });

    const handleConfirm = () => {
        if (!confirmPassword) {
            message.warning('请输入密码以确认操作');
            return;
        }
        submitUpdate({
            newPath,
            currentPassword: confirmPassword,
        });
    };

    const showConfirmModal = (values: { newPath: string }) => {
        if (values.newPath === currentPath) {
            message.warning('新路径不能与当前路径相同');
            return;
        }
        setNewPath(values.newPath);
        setIsModalVisible(true);
        setConfirmPassword('');
    };

    return (
        <div style={{ maxWidth: 600, padding: '24px 0' }}>
            <Alert
                title="高风险操作"
                description="修改入口路径后，所有管理员必须使用新地址才能登录。旧的入口地址将立即失效。请务必在修改后通知所有相关人员。"
                type="error"
                showIcon
                style={{ marginBottom: 24 }}
            />

            <div style={{ marginBottom: 24 }}>
                <Text type="secondary">当前入口路径：</Text>
                <Text code copyable>{currentPath}</Text>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={showConfirmModal}
            >
                <Form.Item
                    label="新入口路径"
                    name="newPath"
                    rules={[
                        { required: true, message: '请输入新入口路径' },
                        {
                            validator: (_, value) => {
                                if (!value || isValidPathFormat(value)) {
                                    return Promise.resolve();
                                }
                                return Promise.reject('路径格式不正确');
                            },
                        },
                    ]}
                >
                    <Space.Compact style={{ width: '100%' }}>
                        <Input
                            placeholder="manager"
                            onChange={(e) => setNewPath(e.target.value)}
                            size="large"
                        />
                        <Button icon={<ReloadOutlined />} onClick={handleGenerate} size="large">
                            随机生成
                        </Button>
                    </Space.Compact>
                </Form.Item>

                {newPath && isValidPathFormat(newPath) && (
                    <div style={{ marginBottom: 24, padding: '12px', background: '#f0f9ff', borderRadius: 4, border: '1px solid #bae7ff' }}>
                        <Text strong style={{ color: '#0050b3' }}>新登录地址预览：</Text>
                        <div style={{ marginTop: 4 }}>
                            <Text copyable style={{ fontSize: 16 }}>{getPreviewUrl()}</Text>
                        </div>
                    </div>
                )}

                <Form.Item>
                    <Button type="primary" htmlType="submit" danger>
                        修改入口路径
                    </Button>
                </Form.Item>
            </Form>

            <Modal
                title={
                    <Space>
                        <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                        <span style={{ color: '#ff4d4f' }}>确认修改入口路径？</span>
                    </Space>
                }
                open={isModalVisible}
                onOk={handleConfirm}
                onCancel={() => setIsModalVisible(false)}
                okText="确认修改"
                cancelText="取消"
                okButtonProps={{ danger: true, loading: isSubmitting }}
            >
                <Paragraph>
                    您正在将入口路径从 <Text code>{currentPath}</Text> 修改为 <Text code>{newPath}</Text>。
                </Paragraph>
                <Paragraph strong>
                    修改后，系统将自动跳转到新地址。请确保您已记住新地址！
                </Paragraph>

                <Form layout="vertical">
                    <Form.Item label="请输入您的密码进行确认" required>
                        <Input.Password
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="输入当前登录密码"
                            autoComplete="current-password"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
