/**
 * Init Wizard Page - 系统初始化向导页
 * @description 引导用户完成系统初始化配置
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
    Steps,
    Button,
    Card,
    Tag,
    Alert,
    Form,
    Descriptions,
    Typography,
    App,
    Result,
    Grid,
    Input,
} from 'antd';
import { ApiOutlined, KeyOutlined, UserAddOutlined, ProfileOutlined } from '@ant-design/icons';
import { EntryPathStep } from '../components/EntryPathStep';
import { SuperAdminStep } from '../components/SuperAdminStep';
import { resetHttpClient } from '@/api/client';
import { checkAdminExists, initializeSystem } from '@/api/contracts/system-init';
import {
    completeInitialization,
    isValidPathFormat,
    generateRandomPath,
    refreshInitState,
    useInitState,
} from '@/core/init';
import { buildLoginUrl } from '../utils';
import { useRequest } from 'ahooks';
import { useRuntimeConfig, updateRuntimeConfig } from '@/core/config/runtimeConfig';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

const InitWizardPage: React.FC = () => {
    const screens = useBreakpoint();
    const navigate = useNavigate();
    const initState = useInitState();
    const { message } = App.useApp();
    const [currentStep, setCurrentStep] = useState(0);
    const baseOrigin = window.location.origin;
    const [port, setPort] = useState<number | undefined>(
        window.location.port ? parseInt(window.location.port) : undefined
    );
    const [entryPath, setEntryPath] = useState<string>(generateRandomPath(8));
    const [adminAccount, setAdminAccount] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [initSuccess, setInitSuccess] = useState(false);

    const loginUrl = isValidPathFormat(entryPath)
        ? buildLoginUrl(baseOrigin, entryPath, port)
        : '';
    const isMobile = !screens.md;
    const runtimeConfig = useRuntimeConfig();
    const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
    const [backendError, setBackendError] = useState<string | null>(null);
    const [customApiBaseUrl, setCustomApiBaseUrl] = useState<string>('');

    const { run: submitInit, loading } = useRequest(initializeSystem, {
        manual: true,
        onSuccess: () => {
            message.success('系统初始化成功！');
            setInitSuccess(true);
            completeInitialization({
                entryPath,
                accessConfig: {
                    url: baseOrigin,
                    port,
                },
            });
        },
        onError: (error: Error) => {
            message.error(`初始化失败: ${error.message}`);
        },
    });

    const { run: checkBackend, runAsync: checkBackendAsync, loading: checkingBackend } = useRequest(checkAdminExists, {
        manual: true,
        onSuccess: () => {
            setBackendStatus('connected');
            setBackendError(null);
        },
        onError: (error: Error) => {
            setBackendStatus('disconnected');
            setBackendError(error.message);
        },
    });

    const applyApiBaseUrl = () => {
        const newUrl = customApiBaseUrl.trim() || 'http://localhost:3000/api';
        updateRuntimeConfig({ apiBaseUrl: newUrl });
        resetHttpClient();
        message.info(`API 地址已更新为: ${newUrl}`);
        return newUrl;
    };

    const handleUpdateApiBaseUrl = () => {
        applyApiBaseUrl();
        checkBackend();
    };

    const handleCopyAll = async () => {
        const lines = [
            `入口路径：${entryPath || '未设置'}`,
            `登录地址：${loginUrl || '未生成'}`,
            `访问域名：${baseOrigin}`,
            `端口：${port ? String(port) : '默认'}`,
            `API 基址：${runtimeConfig.apiBaseUrl}`,
            `Mock 状态：${runtimeConfig.mockEnabled ? '已开启' : '未开启'}`,
            `管理员用户名：${adminAccount.username || '未填写'}`,
            `管理员邮箱：${adminAccount.email || '未填写'}`,
            '管理员 ID：初始化后生成',
        ];
        try {
            await navigator.clipboard.writeText(lines.join('\n'));
            message.success('已复制全部信息');
        } catch {
            message.error('复制失败，请手动复制');
        }
    };

    useEffect(() => {
        checkBackend();
    }, [checkBackend]);

    useEffect(() => {
        refreshInitState();
    }, []);

    useEffect(() => {
        if (initState.loading) return;
        if (initState.isInitialized && initState.entryPath) {
            navigate(`/${initState.entryPath}/login`, { replace: true });
        }
    }, [initState.loading, initState.isInitialized, initState.entryPath, navigate]);

    const steps = [
        {
            title: '连接后端',
            summary: '检测后端连通性并保存 API 地址',
            icon: <ApiOutlined />,
            content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <Text strong>连接检测</Text>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {backendStatus === 'checking' && <Tag color="processing">检测中</Tag>}
                            {backendStatus === 'connected' && <Tag color="success">已连接</Tag>}
                            {backendStatus === 'disconnected' && <Tag color="error">未连接</Tag>}
                        </div>
                    </div>

                    <Form layout="vertical">
                        <Form.Item
                            label="API 基础地址"
                            help="不填写将使用默认值"
                            style={{ marginBottom: 12 }}
                        >
                            <Input
                                placeholder="默认: http://localhost:3000/api"
                                value={customApiBaseUrl}
                                onChange={(e) => setCustomApiBaseUrl(e.target.value)}
                                onPressEnter={handleUpdateApiBaseUrl}
                                size="large"
                            />
                        </Form.Item>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Button onClick={checkBackend} loading={checkingBackend} size="large">
                                刷新检测
                            </Button>
                        </div>
                    </Form>

                    <div style={{ display: 'grid', gap: 8 }}>
                        <Text strong>当前生效信息</Text>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>当前 API 地址（已生效）</Text>
                            <Text>{runtimeConfig.apiBaseUrl}</Text>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>Mock 状态</Text>
                            <Text>{runtimeConfig.mockEnabled ? '已开启' : '未开启'}</Text>
                        </div>
                    </div>

                    {backendStatus === 'disconnected' ? (
                        <Alert
                            type="warning"
                            showIcon
                            title="未检测到后端服务"
                            description={(
                                <div>
                                    <div style={{ marginBottom: 8 }}>请先配置后端连接后再继续。</div>
                                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                                        <li>部署环境注入 `public/config.json`，填写 `apiBaseUrl` 与 `mockEnabled`。</li>
                                        <li>本地开发可设置 `VITE_API_BASE_URL`，或临时使用 `VITE_MOCK=true`。</li>
                                    </ul>
                                    {backendError ? (
                                        <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                                            错误信息：{backendError}
                                        </Paragraph>
                                    ) : null}
                                </div>
                            )}
                        />
                    ) : null}
                </div>
            ),
            helper: (
                <div>
                    <Text type="secondary">本步说明</Text>
                    <Paragraph style={{ marginTop: 4 }}>
                        确认后端已启动并可访问，保存 API 地址后即可继续后续配置。
                    </Paragraph>
                </div>
            ),
        },
        {
            title: '入口路径',
            summary: '设置后台登录入口路径',
            icon: <KeyOutlined />,
            content: (
                <EntryPathStep
                    value={entryPath}
                    onChange={setEntryPath}
                    baseOrigin={baseOrigin}
                    port={port}
                    onPortChange={setPort}
                />
            ),
            helper: (
                <div>
                    <Text type="secondary">
                        入口路径是安全入口，建议随机生成并妥善保存。
                    </Text>
                    <div style={{ marginTop: 12 }}>
                        <Text type="secondary">状态反馈</Text>
                        <Paragraph style={{ marginTop: 4 }}>
                            {entryPath
                                ? (isValidPathFormat(entryPath) ? '入口路径合法，最终地址已更新。' : '入口路径不符合规则。')
                                : '请设置入口路径后继续。'}
                        </Paragraph>
                    </div>
                </div>
            ),
        },
        {
            title: '创建管理员',
            summary: '创建首个管理员账号',
            icon: <UserAddOutlined />,
            content: (
                <SuperAdminStep
                    value={adminAccount}
                    onChange={setAdminAccount}
                />
            ),
            helper: (
                <div>
                    <Text type="secondary">
                        管理员用于首次登录并管理系统，请保存账户信息。
                    </Text>
                    <div style={{ marginTop: 12 }}>
                        <Text type="secondary">提示</Text>
                        <Paragraph style={{ marginTop: 4 }}>
                            密码建议至少 8 位，包含大小写与数字。
                        </Paragraph>
                    </div>
                </div>
            ),
        },
        {
            title: '确认信息',
            summary: '确认关键参数并保存备份',
            icon: <ProfileOutlined />,
            content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Descriptions
                        bordered
                        size="small"
                        column={1}
                        items={[
                            { key: 'entryPath', label: '入口路径', children: entryPath || '未设置' },
                            { key: 'loginUrl', label: '登录地址', children: loginUrl || '未生成' },
                            { key: 'accessUrl', label: '访问域名', children: baseOrigin },
                            { key: 'port', label: '端口', children: port ? String(port) : '默认' },
                            { key: 'apiBase', label: 'API 基址', children: runtimeConfig.apiBaseUrl },
                            { key: 'mock', label: 'Mock 状态', children: runtimeConfig.mockEnabled ? '已开启' : '未开启' },
                            { key: 'username', label: '管理员用户名', children: adminAccount.username || '未填写' },
                            { key: 'email', label: '管理员邮箱', children: adminAccount.email || '未填写' },
                            { key: 'adminId', label: '管理员 ID', children: '初始化后生成' },
                        ]}
                    />
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Button type="primary" onClick={handleCopyAll}>
                            复制全部
                        </Button>
                        <Text type="secondary">建议截图保存或粘贴到备忘录，避免丢失。</Text>
                    </div>
                </div>
            ),
            helper: (
                <div>
                    <Text type="secondary">注意事项</Text>
                    <Paragraph style={{ marginTop: 4 }}>
                        请确认入口路径与登录地址已保存，初始化完成后将作为唯一访问入口。
                    </Paragraph>
                </div>
            ),
        },
    ];

    const isStepValid = useMemo(() => {
        const hasLowercase = /[a-z]/.test(adminAccount.password);
        const hasUppercase = /[A-Z]/.test(adminAccount.password);
        const hasNumber = /[0-9]/.test(adminAccount.password);
        const hasSymbol = /[^a-zA-Z0-9]/.test(adminAccount.password);
        const hasAllRules =
            hasLowercase && hasUppercase && hasNumber && hasSymbol;
        const isAdminValid = (
            !!adminAccount.username &&
            adminAccount.username.length >= 3 &&
            !!adminAccount.email &&
            !!adminAccount.password &&
            adminAccount.password.length >= 8 &&
            hasAllRules &&
            adminAccount.password === adminAccount.confirmPassword
        );

        switch (currentStep) {
            case 0:
                return true;
            case 1:
                return !!entryPath && isValidPathFormat(entryPath);
            case 2:
                return isAdminValid;
            case 3:
                return isAdminValid;
            default:
                return true;
        }
    }, [currentStep, entryPath, adminAccount]);

    const isBackendReady = backendStatus === 'connected';
    const canProceed = currentStep === 0 ? isStepValid : (isStepValid && isBackendReady);

    const next = async () => {
        if (currentStep === 0) {
            applyApiBaseUrl();
            setBackendStatus('checking');
            try {
                await checkBackendAsync();
            } catch {
                message.warning('未检测到后端服务，请先配置后端连接');
                return;
            }
        } else if (!isBackendReady) {
            message.warning('未检测到后端服务，请先配置后端连接');
            return;
        }
        if (!isStepValid) {
            message.warning('请完善当前步骤的信息');
            return;
        }
        setCurrentStep(currentStep + 1);
    };

    const prev = () => {
        setCurrentStep(currentStep - 1);
    };

    const submit = () => {
        if (!isBackendReady) {
            message.warning('未检测到后端服务，请先配置后端连接');
            return;
        }
        if (!isStepValid) {
            message.warning('请完善当前步骤的信息');
            return;
        }
        setInitSuccess(false);
        submitInit({
            accessUrl: baseOrigin,
            port,
            entryPath,
            admin: {
                username: adminAccount.username,
                email: adminAccount.email,
                password: adminAccount.password,
            },
        });
    };

    const handleCopyLoginUrl = async () => {
        if (!loginUrl) return;
        try {
            await navigator.clipboard.writeText(loginUrl);
            message.success('登录地址已复制');
        } catch {
            message.error('复制失败，请手动复制');
        }
    };

    if (loading || initSuccess || currentStep === steps.length) {
        const status = initSuccess ? 'success' : 'info';
        const title = initSuccess ? '初始化完成' : '正在完成初始化...';
        const subTitle = initSuccess
            ? '请保存登录地址，可复制或手动前往登录页。'
            : '请稍候，系统正在保存配置并创建管理员账户。';
        return (
            <div style={{ maxWidth: 980, margin: '40px auto', padding: '0 20px' }}>
                <Card variant="borderless">
                    <Result
                        status={status}
                        title={title}
                        subTitle={subTitle}
                        extra={[
                            initSuccess ? (
                                <Button type="primary" key="copy" onClick={handleCopyLoginUrl}>
                                    复制登录地址
                                </Button>
                            ) : (
                                <Button type="primary" key="processing" loading>
                                    处理中...
                                </Button>
                            ),
                            initSuccess && loginUrl ? (
                                <Button
                                    key="open-login"
                                    href={loginUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    打开登录页
                                </Button>
                            ) : null,
                        ]}
                    />
                    {initSuccess && loginUrl ? (
                        <Paragraph style={{ marginTop: 16, textAlign: 'center' }}>
                            <Text type="secondary">登录地址：</Text>
                            <Typography.Link
                                href={loginUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {loginUrl}
                            </Typography.Link>
                        </Paragraph>
                    ) : null}
                </Card>
            </div>
        );
    }

    return (
        <div
            style={{
                maxWidth: 980,
                margin: '40px auto',
                padding: isMobile ? '0 16px 32px' : '0 24px 40px',
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <Title level={2}>系统初始化</Title>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    3 分钟内完成初始化并拿到可保存的后台登录地址
                </Paragraph>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    完成后你将获得后台登录地址与首个管理员账号
                </Paragraph>
            </div>

            <Card
                variant="borderless"
                style={{
                    boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
                    borderRadius: 16,
                }}
            >
                <Steps
                    current={currentStep}
                    items={steps.map((step) => ({
                        title: step.title,
                        icon: step.icon,
                    }))}
                    style={{ marginBottom: 12 }}
                />

                <div style={{ marginBottom: 24 }}>
                    <Text type="secondary">当前：{steps[currentStep].summary}</Text>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr',
                        gap: 24,
                        alignItems: 'start',
                    }}
                >
                    <div style={{ minHeight: 320 }}>
                        <Title level={4} style={{ marginTop: 0 }}>
                            步骤 {currentStep + 1}/{steps.length}：{steps[currentStep].title}
                        </Title>
                        {steps[currentStep].content}
                    </div>
                    <div
                        style={{
                            padding: 16,
                            borderRadius: 12,
                            border: '1px solid #f0f0f0',
                        }}
                    >
                        <Text strong>辅助说明</Text>
                        <div style={{ marginTop: 12 }}>{steps[currentStep].helper}</div>
                    </div>
                </div>

                <div
                    style={{
                        marginTop: 24,
                        paddingTop: 16,
                        borderTop: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                    }}
                >
                    <Button onClick={prev} disabled={currentStep === 0}>
                        上一步
                    </Button>
                    {currentStep < steps.length - 1 ? (
                        <Button type="primary" onClick={next} disabled={!canProceed}>
                            保存并下一步
                        </Button>
                    ) : (
                        <Button type="primary" onClick={submit} loading={loading} disabled={!canProceed}>
                            完成初始化
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default InitWizardPage;
