/**
 * 管理员创建步骤
 */

import React from 'react';
import { Form, Input, Typography } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

interface AdminFormData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface AdminStepProps {
    value?: AdminFormData;
    onChange?: (value: AdminFormData) => void;
}

/**
 * 管理员创建步骤组件
 * - 用户名输入
 * - 邮箱输入（EMAIL 格式验证）
 * - 密码输入（强度验证、确认密码）
 */
export const SuperAdminStep: React.FC<AdminStepProps> = ({ value, onChange }) => {
    const formData = value || {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    };

    const handleChange = (field: keyof AdminFormData, val: string) => {
        const newData = { ...formData, [field]: val };
        onChange?.(newData);
    };

    // 邮箱格式验证
    const isEmailValid = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // 密码匹配验证
    const isPasswordMatch = formData.password === formData.confirmPassword;
    const hasLowercase = /[a-z]/.test(formData.password);
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(formData.password);
    const hasAllRules =
        hasLowercase && hasUppercase && hasNumber && hasSymbol;
    const passwordTooShort =
        formData.password.length > 0 && formData.password.length < 8;
    const showPasswordError =
        formData.password.length > 0 && (passwordTooShort || !hasAllRules);
    const passwordHelp = showPasswordError ? (
        passwordTooShort ? (
            '密码至少需要 8 个字符'
        ) : (
            '需包含大小写字母、数字与符号'
        )
    ) : (
        <Text type="secondary">
            规则：至少 8 位，包含大小写字母、数字与符号
        </Text>
    );
    const showChecklist = formData.password.length > 0;
    const getRuleColor = (passed: boolean): string => {
        if (!showChecklist) return '#bfbfbf';
        return passed ? '#52c41a' : '#ff4d4f';
    };


    return (
        <div>
            <Paragraph>创建首个管理员账户，用于管理系统与配置。</Paragraph>
            <Text type="secondary">
                密码需包含大小写字母、数字与符号，建议至少 8 位。
            </Text>

            <Form layout="vertical" style={{ marginTop: 16 }}>
                <Form.Item
                    label="用户名"
                    required
                    validateStatus={formData.username.length >= 3 ? 'success' : undefined}
                    help={
                        formData.username && formData.username.length < 3
                            ? '用户名至少需要3个字符'
                            : undefined
                    }
                >
                    <Input
                        prefix={<UserOutlined />}
                        placeholder="输入用户名（至少3个字符）"
                        value={formData.username}
                        onChange={(e) => handleChange('username', e.target.value)}
                        size="large"
                    />
                </Form.Item>

                <Form.Item
                    label="邮箱"
                    required
                    validateStatus={
                        formData.email && !isEmailValid(formData.email) ? 'error' : undefined
                    }
                    help={
                        formData.email && !isEmailValid(formData.email)
                            ? '请输入有效的邮箱地址'
                            : undefined
                    }
                >
                    <Input
                        prefix={<MailOutlined />}
                        placeholder="admin@example.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        size="large"
                        type="email"
                        autoComplete="username"
                    />
                </Form.Item>

                <Form.Item
                    label="密码"
                    required
                    validateStatus={showPasswordError ? 'error' : undefined}
                    help={passwordHelp}
                >
                    <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="至少 8 个字符"
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        size="large"
                        autoComplete="new-password"
                    />
                    <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                            密码规则清单
                        </Text>
                        <div style={{ display: 'grid', gap: 4 }}>
                            <Text style={{ color: getRuleColor(formData.password.length >= 8) }}>
                                • 至少 8 个字符
                            </Text>
                            <Text style={{ color: getRuleColor(hasLowercase) }}>
                                • 包含小写字母
                            </Text>
                            <Text style={{ color: getRuleColor(hasUppercase) }}>
                                • 包含大写字母
                            </Text>
                            <Text style={{ color: getRuleColor(hasNumber) }}>
                                • 包含数字
                            </Text>
                            <Text style={{ color: getRuleColor(hasSymbol) }}>
                                • 包含符号
                            </Text>
                        </div>
                    </div>
                </Form.Item>

                <Form.Item
                    label="确认密码"
                    required
                    validateStatus={
                        formData.confirmPassword && !isPasswordMatch ? 'error' : undefined
                    }
                    help={
                        formData.confirmPassword && !isPasswordMatch
                            ? '两次输入不一致，请重新确认'
                            : undefined
                    }
                >
                    <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="再次输入密码"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        size="large"
                        autoComplete="new-password"
                    />
                </Form.Item>
            </Form>
        </div>
    );
};
