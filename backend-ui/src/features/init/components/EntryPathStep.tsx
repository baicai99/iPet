/**
 * 入口路径配置步骤
 */

import React, { useState } from 'react';
import {
    Form,
    Input,
    Button,
    Typography,
    Space,
    Tooltip,
    App,
    InputNumber,
    Radio,
    Collapse,
    Tag,
} from 'antd';
import {
    ReloadOutlined,
    CheckCircleOutlined,
    QuestionCircleOutlined,
} from '@ant-design/icons';
import { generateRandomPath, isValidPathFormat } from '@/core/init';
import { buildLoginUrl } from '../utils';

const { Text, Paragraph } = Typography;

interface EntryPathStepProps {
    value?: string;
    onChange?: (value: string) => void;
    baseOrigin: string;
    port?: number;
    onPortChange?: (value?: number) => void;
}

/**
 * 入口路径配置步骤组件
 * - 随机生成路径（可指定长度 1-16）
 * - 手动输入框（验证路径格式）
 * - 可选端口（可随机）
 * - 实时预览最终后台访问地址
 */
export const EntryPathStep: React.FC<EntryPathStepProps> = ({
    value,
    onChange,
    baseOrigin,
    port,
    onPortChange,
}) => {
    const { message } = App.useApp();
    const entryPath = value || '';
    const isValid = entryPath ? isValidPathFormat(entryPath) : false;
    const loginUrl = isValid ? buildLoginUrl(baseOrigin, entryPath, port) : '';
    const [randomLength, setRandomLength] = useState<number>(8);
    const [mode, setMode] = useState<'auto' | 'manual'>('auto');

    const strengthLength = mode === 'manual' ? entryPath.length : randomLength;
    const strengthLabel = strengthLength >= 12 ? '高' : strengthLength >= 8 ? '中' : '低';
    const strengthColor = strengthLength >= 12 ? 'green' : strengthLength >= 8 ? 'blue' : 'orange';

    const handleChange = (path: string) => {
        onChange?.(path);
    };

    const handleGenerate = () => {
        onChange?.(generateRandomPath(randomLength));
    };

    const handleCopy = async () => {
        if (!loginUrl) return;
        try {
            await navigator.clipboard.writeText(loginUrl);
            message.success('登录地址已复制');
        } catch {
            message.error('复制失败，请手动复制');
        }
    };

    const handleRandomPort = () => {
        const randomPort = Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024;
        onPortChange?.(randomPort);
    };

    return (
        <div>
            <Paragraph>
                入口路径是后台的专属入口，建议使用随机生成以提升安全性。
                <Tooltip
                    title="入口路径类似密钥，只有知道该路径的人才能进入后台登录页。"
                >
                    <QuestionCircleOutlined style={{ marginLeft: 6 }} />
                </Tooltip>
            </Paragraph>

            <Form layout="vertical">
                <Form.Item label="设置方式" style={{ marginBottom: 12 }}>
                    <Radio.Group
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        optionType="button"
                        buttonStyle="solid"
                    >
                        <Radio.Button value="auto">自动生成安全入口（推荐）</Radio.Button>
                        <Radio.Button value="manual">手动填写入口路径</Radio.Button>
                    </Radio.Group>
                </Form.Item>

                {mode === 'auto' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Text>生成长度：{randomLength} 位</Text>
                            <Tag color={strengthColor}>安全性：{strengthLabel}</Tag>
                        </div>
                        <Form.Item label="当前入口路径" style={{ marginBottom: 0 }}>
                            <Input
                                value={entryPath}
                                readOnly
                                size="large"
                                prefix={
                                    entryPath && isValid ? (
                                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                    ) : undefined
                                }
                            />
                        </Form.Item>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleGenerate}
                            size="large"
                            type="primary"
                            style={{ alignSelf: 'flex-start' }}
                        >
                            生成入口
                        </Button>
                    </div>
                ) : (
                    <Form.Item
                        label={(
                            <span>
                                手动输入入口路径
                                <Tooltip title="1–16 位，仅小写字母/数字，以字母开头">
                                    <QuestionCircleOutlined style={{ marginLeft: 6 }} />
                                </Tooltip>
                            </span>
                        )}
                        required
                        validateStatus={entryPath && !isValid ? 'error' : undefined}
                        help={
                            entryPath && !isValid
                                ? '路径格式不正确，请检查规则'
                                : '1–16 位，小写字母/数字，以字母开头'
                        }
                    >
                        <Input
                            placeholder="manager"
                            value={entryPath}
                            onChange={(e) => handleChange(e.target.value)}
                            size="large"
                            prefix={
                                entryPath && isValid ? (
                                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                ) : undefined
                            }
                        />
                    </Form.Item>
                )}

                <div style={{ marginTop: 12 }}>
                    <Collapse
                        items={[
                            {
                                key: 'advanced',
                                label: '高级设置（可选）',
                                children: (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {mode === 'auto' ? (
                                            <Form.Item label="生成长度（1-16位）" style={{ marginBottom: 0 }}>
                                                <InputNumber
                                                    min={1}
                                                    max={16}
                                                    value={randomLength}
                                                    onChange={(val) => setRandomLength(val || 1)}
                                                    size="large"
                                                    style={{ width: '100%' }}
                                                />
                                            </Form.Item>
                                        ) : null}
                                        <Form.Item label="端口号（可选）" tooltip="非标准端口才需要填写" style={{ marginBottom: 0 }}>
                                            <Space.Compact style={{ width: '100%' }}>
                                                <InputNumber
                                                    placeholder="例如: 8080"
                                                    value={port}
                                                    onChange={(val) => onPortChange?.(val || undefined)}
                                                    min={1}
                                                    max={65535}
                                                    size="large"
                                                    style={{ width: '100%' }}
                                                />
                                                <Button
                                                    icon={<ReloadOutlined />}
                                                    onClick={handleRandomPort}
                                                    size="large"
                                                >
                                                    随机端口
                                                </Button>
                                            </Space.Compact>
                                        </Form.Item>
                                    </div>
                                ),
                            },
                        ]}
                    />
                </div>

                <div style={{ marginTop: 12 }}>
                    <Text type="secondary">最终后台登录地址</Text>
                    <div
                        style={{
                            marginTop: 8,
                            padding: '12px 12px',
                            borderRadius: 8,
                            border: '1px solid #e6e6e6',
                            background: '#f7fbff',
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                        }}
                    >
                        {loginUrl ? (
                            <>
                                <Text strong style={{ fontSize: 15 }}>
                                    <Typography.Link
                                        href={loginUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {loginUrl}
                                    </Typography.Link>
                                </Text>
                                <Button onClick={handleCopy} type="primary">
                                    复制地址
                                </Button>
                            </>
                        ) : (
                            <Text type="secondary">请先完成入口路径设置</Text>
                        )}
                    </div>
                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                        请保存该地址，初始化完成后只通过此地址访问后台。
                    </Text>
                </div>
            </Form>
        </div>
    );
};
