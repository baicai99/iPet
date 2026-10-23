import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import { Input, Select, Button, Form, Typography, Tag, Space, type FormProps } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { FilterBar } from '@/shared/components/FilterBar';
import type { UserListParams } from '@/api/contracts/users';

interface UserFilterProps {
    onFilterChange: (values: UserListParams) => void;
    loading?: boolean;
    resetSignal?: number;
}

export const UserFilter: React.FC<UserFilterProps> = ({ onFilterChange, loading, resetSignal }) => {
    type FilterFormValues = {
        search?: string;
        role?: 'all' | 'user' | 'guest';
        status?: 'all' | 'active' | 'banned';
    };

    const [form] = Form.useForm();
    const watchedValues = Form.useWatch([], form) as FilterFormValues | undefined;
    const resetSignalRef = useRef(resetSignal);

    const handleValuesChange: FormProps<FilterFormValues>['onValuesChange'] = (_, allValues) => {
        // Convert 'all' to undefined for API logic if needed, or handle in the parent
        const filters: UserListParams = {
            search: allValues.search,
            isGuest: allValues.role === 'all' ? undefined : allValues.role === 'guest',
            isBanned: allValues.status === 'all' ? undefined : allValues.status === 'banned',
        };
        onFilterChange(filters);
    };

    const handleReset = useCallback(() => {
        form.resetFields();
        onFilterChange({});
    }, [form, onFilterChange]);

    useEffect(() => {
        if (resetSignal === undefined) return;
        if (resetSignalRef.current === resetSignal) return;
        resetSignalRef.current = resetSignal;
        handleReset();
    }, [handleReset, resetSignal]);

    const activeFilters = useMemo(() => {
        const filters: string[] = [];
        if (!watchedValues) return filters;
        if (watchedValues.search) {
            filters.push(`关键词=${watchedValues.search}`);
        }
        if (watchedValues.role && watchedValues.role !== 'all') {
            filters.push(`角色=${watchedValues.role === 'guest' ? '游客' : '注册用户'}`);
        }
        if (watchedValues.status && watchedValues.status !== 'all') {
            filters.push(`状态=${watchedValues.status === 'banned' ? '封禁' : '正常'}`);
        }
        return filters;
    }, [watchedValues]);

    return (
        <FilterBar>
            {activeFilters.length > 0 && (
                <Space size={8} wrap>
                    <Typography.Text type="secondary">已筛选：</Typography.Text>
                    {activeFilters.map((filter) => (
                        <Tag key={filter} color="default">
                            {filter}
                        </Tag>
                    ))}
                    <Button type="link" onClick={handleReset}>
                        清除
                    </Button>
                </Space>
            )}
            <Form
                form={form}
                onValuesChange={handleValuesChange}
                initialValues={{ role: 'all', status: 'all' }}
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    width: '100%',
                }}
            >
                <Form.Item
                    name="search"
                    style={{
                        flex: '1 1 260px',
                        minWidth: 220,
                        marginBottom: 0,
                    }}
                >
                    <Input
                        placeholder="搜索：用户名/邮箱/用户ID"
                        prefix={<SearchOutlined />}
                        allowClear
                        style={{ width: '100%' }}
                    />
                </Form.Item>
                <Form.Item
                    name="role"
                    style={{
                        flex: '0 1 160px',
                        minWidth: 140,
                        marginBottom: 0,
                    }}
                >
                    <Select style={{ width: '100%' }}>
                        <Select.Option value="all">全部角色</Select.Option>
                        <Select.Option value="user">注册用户</Select.Option>
                        <Select.Option value="guest">游客</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item
                    name="status"
                    style={{
                        flex: '0 1 160px',
                        minWidth: 140,
                        marginBottom: 0,
                    }}
                >
                    <Select style={{ width: '100%' }}>
                        <Select.Option value="all">全部状态</Select.Option>
                        <Select.Option value="active">正常</Select.Option>
                        <Select.Option value="banned">封禁</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item style={{ marginBottom: 0, flex: '0 0 auto' }}>
                    <Button icon={<ReloadOutlined />} onClick={handleReset} loading={loading}>
                        重置
                    </Button>
                </Form.Item>
            </Form>
        </FilterBar>
    );
};
