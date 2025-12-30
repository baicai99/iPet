import React, { useCallback, useEffect, useState } from 'react';
import { Button, Input, Select, Tag, Space, Modal, App, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getArticles, deleteArticle } from '@/api/contracts/articles';
import type { Article, ArticleCategory } from '@/api/types';
import { DataTable } from '@/shared/components/DataTable';
import { FilterBar } from '@/shared/components/FilterBar';
import { usePermission } from '@/core/auth';
import { ROUTES } from '@/router/routes';
import { useDebouncedValue } from '@/shared/hooks';
// import { AdminRoleContext } from '@/core/auth/context';

const { Title } = Typography;
const { Option } = Select;

const CATEGORY_MAP: Record<string, { text: string; color: string }> = {
    education: { text: '教育科普', color: 'blue' },
    health: { text: '健康医疗', color: 'green' },
    care: { text: '日常护理', color: 'orange' },
    nutrition: { text: '营养饮食', color: 'purple' },
};

const ArticleListPage: React.FC = () => {
    const navigate = useNavigate();
    const { entryPath } = useParams();
    const basePath = entryPath ? `/${entryPath}` : '';
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<Article[]>([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    // 搜索和筛选状态
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<ArticleCategory | undefined>();

    // 防抖搜索关键词（500ms）
    const debouncedSearch = useDebouncedValue(search, 500);

    const { can } = usePermission();

    const fetchData = useCallback(async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
            const res = await getArticles({
                page,
                limit: pageSize,
                search: debouncedSearch || undefined,
                category,
            });
            setData(res.items);
            setPagination({
                current: res.pagination.page,
                pageSize: res.pagination.limit,
                total: res.pagination.total,
            });
        } catch (error) {
            console.error('[ArticleList] Fetch failed', {
                page,
                pageSize,
                search: debouncedSearch || undefined,
                category,
                error,
            });
            message.error('获取文章列表失败');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, category]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = (value: string) => {
        setSearch(value);
        // fetchData 会自动通过 useEffect 触发（当 debouncedSearch 更新时）
    };

    const handleCategoryChange = (value: ArticleCategory) => {
        setCategory(value);
        // fetchData 会自动通过 useEffect 触发
    };

    const handleDelete = (id: string) => {
        if (!can('article:delete')) return;
        Modal.confirm({
            title: '确认删除文章？',
            content: '删除后无法恢复',
            okText: '确认删除',
            okType: 'danger',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await deleteArticle(id);
                    message.success('删除成功');
                    fetchData(pagination.current, pagination.pageSize);
                } catch {
                    message.error('删除失败');
                }
            },
        });
    };

    const columns = [
        {
            title: '标题',
            dataIndex: 'title',
            key: 'title',
            primary: true, // Show on mobile
            render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
        },
        {
            title: '分类',
            dataIndex: 'category',
            key: 'category',
            width: 120,
            render: (category: string) => {
                const config = CATEGORY_MAP[category] || { text: category, color: 'default' };
                return <Tag color={config.color}>{config.text}</Tag>;
            },
        },
        {
            title: '浏览/点赞',
            key: 'stats',
            width: 150,
            render: (_value: unknown, record: Article) => (
                <Space separator="|">
                    <span>👁 {record.views}</span>
                    <span>👍 {record.likes}</span>
                </Space>
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            render: (_value: unknown, record: Article) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`${basePath}/articles/${record.id}/edit`)}
                    >
                        编辑
                    </Button>
                    {can('article:delete') && (
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record.id)}
                        >
                            删除
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>文章管理</Title>
            </div>

            <FilterBar
                actions={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`${basePath}/${ROUTES.ARTICLES_NEW}`)}>
                        发布文章
                    </Button>
                }
            >
                <Input.Search
                    placeholder="搜索标题"
                    onSearch={handleSearch}
                    style={{ width: 200 }}
                    allowClear
                />
                <Select
                    placeholder="全部分类"
                    style={{ width: 150 }}
                    allowClear
                    onChange={handleCategoryChange}
                >
                    {Object.entries(CATEGORY_MAP).map(([key, { text }]) => (
                        <Option key={key} value={key}>{text}</Option>
                    ))}
                </Select>
            </FilterBar>

            <DataTable<Article>
                columns={columns}
                dataSource={data}
                loading={loading}
                pagination={{
                    ...pagination,
                    onChange: (page, pageSize) => fetchData(page, pageSize),
                }}
            />
        </div>
    );
};

export default ArticleListPage;
