/**
 * 访问配置管理面板
 */

import React, { useState } from 'react';
import { Form, Input, InputNumber, Button, Alert, App, Typography } from 'antd';
import { useRequest } from 'ahooks';
import { getSystemSettings, updateAccessConfig } from '@/api/contracts/system-init';
import { setAccessConfig, type AccessConfig } from '@/core/init';

const { Text } = Typography;

export const AccessConfigPanel: React.FC = () => {
    const [form] = Form.useForm();
    const [previewUrl, setPreviewUrl] = useState('');
    const { message } = App.useApp();

    // 加载当前配置
    const { loading: isLoading } = useRequest(getSystemSettings, {
        onSuccess: (data) => {
            const config = {
                url: data.accessUrl,
                port: data.port,
            };
            form.setFieldsValue(config);
            updatePreview(config);

            // 同步到内存状态，供运行期使用
            setAccessConfig(config as AccessConfig);
        },
    });

    // 更新配置请求
    const { run: submitUpdate, loading: isSubmitting } = useRequest(updateAccessConfig, {
        manual: true,
        onSuccess: (_, params) => {
            message.success('访问配置已更新');
            const newConfig = params[0] as AccessConfig;
            setAccessConfig(newConfig);
        },
        onError: (error) => {
            message.error(`更新失败: ${error.message}`);
        },
    });

    const updatePreview = (values: Partial<AccessConfig>) => {
        let url = values.url || '';
        url = url.replace(/\/$/, '');

        const port = values.port;
        if (port && !url.includes(':' + port)) {
            const hasPort = /:\d+/.test(url);
            if (!hasPort && port !== 80 && port !== 443) {
                url = `${url}:${port}`;
            }
        }
        setPreviewUrl(url);
    };

    const handleValuesChange = (_: unknown, allValues: AccessConfig) => {
        updatePreview(allValues);
    };

    const handleFinish = (values: AccessConfig) => {
        submitUpdate(values);
    };

    return (
        <div style={{ maxWidth: 600, padding: '24px 0' }}>
            <Alert
                title="注意"
                description="修改访问地址配置不会自动改变服务器的监听地址，仅用于生成系统内的访问链接。请确保填写的地址是真实可访问的。"
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
            />

            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                onValuesChange={handleValuesChange}
                disabled={isLoading}
            >
                <Form.Item
                    label="访问地址"
                    name="url"
                    rules={[{ required: true, message: '请输入访问地址' }]}
                    tooltip="填写您的域名或 IP 地址，例如: https://example.com"
                >
                    <Input placeholder="https://example.com" size="large" />
                </Form.Item>

                <Form.Item
                    label="端口号"
                    name="port"
                    tooltip="如果使用非标准端口，请填写"
                >
                    <InputNumber
                        placeholder="例如: 8080"
                        min={1}
                        max={65535}
                        size="large"
                        style={{ width: '100%' }}
                    />
                </Form.Item>

                <div style={{ marginBottom: 24, padding: '12px', background: '#f5f5f5', borderRadius: 4 }}>
                    <Text type="secondary">预览地址：</Text>
                    <Text strong copyable>{previewUrl || '-'}</Text>
                </div>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isSubmitting}>
                        保存更改
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};
