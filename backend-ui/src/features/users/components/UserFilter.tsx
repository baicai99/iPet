import React from 'react';
import { Input, Select, Button, Form, type FormProps } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { FilterBar } from '@/shared/components/FilterBar';
import type { UserListParams } from '@/api/contracts/users';

interface UserFilterProps {
    onFilterChange: (values: UserListParams) => void;
    loading?: boolean;
}

export const UserFilter: React.FC<UserFilterProps> = ({ onFilterChange, loading }) => {
    const [form] = Form.useForm();

    type FilterFormValues = {
        search?: string;
        role?: 'all' | 'user' | 'guest';
        status?: 'all' | 'active' | 'banned';
    };

    const handleValuesChange: FormProps<FilterFormValues>['onValuesChange'] = (_, allValues) => {
        // Convert 'all' to undefined for API logic if needed, or handle in the parent
        const filters: UserListParams = {
            search: allValues.search,
            isGuest: allValues.role === 'all' ? undefined : allValues.role === 'guest',
            isBanned: allValues.status === 'all' ? undefined : allValues.status === 'banned',
        };
        onFilterChange(filters);
    };

    const handleReset = () => {
        form.resetFields();
        onFilterChange({});
    };

    return (
        <FilterBar>
            <Form
                form={form}
                layout="inline"
                onValuesChange={handleValuesChange}
                initialValues={{ role: 'all', status: 'all' }}
                style={{ display: 'flex', flexWrap: 'nowrap', gap: 12, alignItems: 'center', width: '100%' }}
            >
                <Form.Item name="search" style={{ flex: '1 1 260px', minWidth: 240, marginBottom: 0 }}>
                    <Input
                        placeholder="搜索用户..."
                        prefix={<SearchOutlined />}
                        allowClear
                        style={{ width: '100%' }}
                    />
                </Form.Item>
                <Form.Item name="role" style={{ flex: '0 0 150px', marginBottom: 0 }}>
                    <Select style={{ width: 150 }}>
                        <Select.Option value="all">全部角色</Select.Option>
                        <Select.Option value="user">注册用户</Select.Option>
                        <Select.Option value="guest">游客</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item name="status" style={{ flex: '0 0 150px', marginBottom: 0 }}>
                    <Select style={{ width: 150 }}>
                        <Select.Option value="all">全部状态</Select.Option>
                        <Select.Option value="active">正常</Select.Option>
                        <Select.Option value="banned">封禁</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                    <Button icon={<ReloadOutlined />} onClick={handleReset} loading={loading}>
                        重置
                    </Button>
                </Form.Item>
            </Form>
        </FilterBar>
    );
};
