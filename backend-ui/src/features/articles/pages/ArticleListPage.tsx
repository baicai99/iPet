import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Select, Tag, Space, Modal, App, Typography, Grid, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
    getArticles,
    deleteArticle,
    bulkDeleteArticles,
    bulkUpdateArticleCategory,
    bulkUpdateArticlePinned,
} from '@/api/contracts/articles';
import type { Article, ArticleCategory } from '@/api/types';
import { DataTable } from '@/shared/components/DataTable';
import { FilterBar } from '@/shared/components/FilterBar';
import { usePermission } from '@/core/auth';
import { ROUTES } from '@/router/routes';
import { useDebouncedValue } from '@/shared/hooks';
import { useArticleCategories } from '../hooks/useArticleCategories';
import { getErrorMessage } from '@/shared/utils/errorMessage';
// import { AdminRoleContext } from '@/core/auth/context';

const { Title } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const ArticleListPage: React.FC = () => {
    const navigate = useNavigate();
    const { entryPath } = useParams();
    const basePath = entryPath ? `/${entryPath}` : '';
    const { message } = App.useApp();
    const { categories } = useArticleCategories();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<Article[]>([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkCategory, setBulkCategory] = useState<ArticleCategory | undefined>();
    const [bulkCategoryOpen, setBulkCategoryOpen] = useState(false);
    const [bulkCategorySubmitting, setBulkCategorySubmitting] = useState(false);
    const screens = useBreakpoint();
    const isMobile = !screens.sm;
    const selectedKeysRef = useRef<React.Key[]>([]);

    // 搜索和筛选状态
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<ArticleCategory | undefined>();
    const [pinnedFilter, setPinnedFilter] = useState<'all' | 'pinned' | 'unPinned'>('all');

    // 防抖搜索关键词（500ms）
    const debouncedSearch = useDebouncedValue(search, 500);

    const { can } = usePermission();
    const canDelete = can('article:delete');

    const fetchData = useCallback(async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
            const res = await getArticles({
                page,
                limit: pageSize,
                search: debouncedSearch || undefined,
                category,
                pinned: pinnedFilter === 'all' ? undefined : pinnedFilter === 'pinned',
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
            message.error(getErrorMessage(error, '获取文章列表失败'));
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, category, pinnedFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!category) return;
        if (!categories.some(item => item.key === category)) {
            setCategory(undefined);
            message.warning('当前分类已被删除，已清空筛选条件');
        }
    }, [categories, category, message]);

    useEffect(() => {
        selectedKeysRef.current = selectedRowKeys;
    }, [selectedRowKeys]);

    useEffect(() => {
        if (selectedKeysRef.current.length === 0) return;
        setSelectedRowKeys([]);
        message.info('筛选条件已变更，已清空已选记录');
    }, [debouncedSearch, category, pinnedFilter, message]);

    const handleSearch = (value: string) => {
        setSearch(value);
        // fetchData 会自动通过 useEffect 触发（当 debouncedSearch 更新时）
    };

    const handleCategoryChange = (value: ArticleCategory) => {
        setCategory(value);
        // fetchData 会自动通过 useEffect 触发
    };

    const handlePinnedFilterChange = (value: 'all' | 'pinned' | 'unPinned') => {
        setPinnedFilter(value);
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
                } catch (error) {
                    message.error(getErrorMessage(error, '删除失败'));
                }
            },
        });
    };

    const handleBulkDelete = () => {
        if (!canDelete) return;
        if (selectedRowKeys.length === 0) return;
        Modal.confirm({
            title: `确认删除 ${selectedRowKeys.length} 篇文章？`,
            content: '删除后无法恢复',
            okText: '确认删除',
            okType: 'danger',
            cancelText: '取消',
            onOk: async () => {
                const targets = selectedRowKeys.map((key) => String(key));
                try {
                    const result = await bulkDeleteArticles(targets);
                    const successCount = result.successIds.length;

                    if (successCount > 0) {
                        message.success(`已删除 ${successCount} 篇文章`);
                    }

                    if (result.failed.length > 0) {
                        const recordMap = new Map(data.map((item) => [item.id, item]));
                        const failedLabel = result.failed
                            .map((item) => {
                                const title = recordMap.get(item.id)?.title;
                                const label = title ? `${title} (${item.id})` : item.id;
                                return item.reason ? `${label} - ${item.reason}` : label;
                            })
                            .join('\n');
                        Modal.info({
                            title: `有 ${result.failed.length} 篇文章删除失败`,
                            content: (
                                <div style={{ whiteSpace: 'pre-line' }}>
                                    {failedLabel}
                                </div>
                            ),
                        });
                    }

                    const remainingTotal = Math.max(0, pagination.total - successCount);
                    const nextPage = Math.min(
                        pagination.current,
                        Math.max(1, Math.ceil(remainingTotal / pagination.pageSize))
                    );
                    await fetchData(nextPage, pagination.pageSize);
                    setSelectedRowKeys(result.failed.map((item) => item.id));
                } catch (error) {
                    message.error(getErrorMessage(error, '批量删除失败'));
                }
            },
        });
    };

    const handleBulkCategoryOpen = () => {
        if (selectedRowKeys.length === 0) return;
        setBulkCategoryOpen(true);
    };

    const handleBulkCategoryConfirm = async () => {
        if (!bulkCategory) {
            message.warning('请选择目标分类');
            return;
        }
        if (selectedRowKeys.length === 0) {
            message.warning('请先选择要修改的文章');
            return;
        }

        setBulkCategorySubmitting(true);
        const targets = selectedRowKeys.map((key) => String(key));
        try {
            const result = await bulkUpdateArticleCategory(targets, bulkCategory);
            const successCount = result.successIds.length;

            if (successCount > 0) {
                message.success(`已更新 ${successCount} 篇文章分类`);
            }

            if (result.failed.length > 0) {
                const recordMap = new Map(data.map((item) => [item.id, item]));
                const failedLabel = result.failed
                    .map((item) => {
                        const title = recordMap.get(item.id)?.title;
                        const label = title ? `${title} (${item.id})` : item.id;
                        return item.reason ? `${label} - ${item.reason}` : label;
                    })
                    .join('\n');
                Modal.info({
                    title: `有 ${result.failed.length} 篇文章更新失败`,
                    content: (
                        <div style={{ whiteSpace: 'pre-line' }}>
                            {failedLabel}
                        </div>
                    ),
                });
            }

            const removeFromList = category && bulkCategory !== category;
            const remainingTotal = removeFromList
                ? Math.max(0, pagination.total - successCount)
                : pagination.total;
            const nextPage = Math.min(
                pagination.current,
                Math.max(1, Math.ceil(remainingTotal / pagination.pageSize))
            );

            await fetchData(nextPage, pagination.pageSize);
            setSelectedRowKeys(result.failed.map((item) => item.id));
            setBulkCategoryOpen(false);
        } catch (error) {
            message.error(getErrorMessage(error, '批量改分类失败'));
        } finally {
            setBulkCategorySubmitting(false);
        }
    };

    const handleBulkSectionPin = (nextPinned: boolean) => {
        if (selectedRowKeys.length === 0) return;
        const actionLabel = nextPinned ? '置顶' : '取消置顶';
        Modal.confirm({
            title: `确认批量${actionLabel} ${selectedRowKeys.length} 篇文章？`,
            okText: `确认${actionLabel}`,
            cancelText: '取消',
            onOk: async () => {
                const targets = selectedRowKeys.map((key) => String(key));
                try {
                    const result = await bulkUpdateArticlePinned(targets, nextPinned);
                    const successCount = result.successIds.length;

                    if (successCount > 0) {
                        message.success(`已${actionLabel} ${successCount} 篇文章`);
                    }

                    if (result.failed.length > 0) {
                        const recordMap = new Map(data.map((item) => [item.id, item]));
                        const failedLabel = result.failed
                            .map((item) => {
                                const title = recordMap.get(item.id)?.title;
                                const label = title ? `${title} (${item.id})` : item.id;
                                return item.reason ? `${label} - ${item.reason}` : label;
                            })
                            .join('\n');
                        Modal.info({
                            title: `有 ${result.failed.length} 篇文章${actionLabel}失败`,
                            content: (
                                <div style={{ whiteSpace: 'pre-line' }}>
                                    {failedLabel}
                                </div>
                            ),
                        });
                    }

                    const removeFromList = pinnedFilter === 'pinned' ? !nextPinned : pinnedFilter === 'unPinned' ? nextPinned : false;
                    const remainingTotal = removeFromList
                        ? Math.max(0, pagination.total - successCount)
                        : pagination.total;
                    const nextPage = Math.min(
                        pagination.current,
                        Math.max(1, Math.ceil(remainingTotal / pagination.pageSize))
                    );
                    await fetchData(nextPage, pagination.pageSize);
                    setSelectedRowKeys(result.failed.map((item) => item.id));
                } catch (error) {
                    message.error(getErrorMessage(error, `批量${actionLabel}失败`));
                }
            },
        });
    };

    const rowSelection = useMemo(() => {
        if (isMobile && !bulkMode) return undefined;
        return {
            selectedRowKeys,
            onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
        };
    }, [bulkMode, isMobile, selectedRowKeys]);

    const handleBulkModeChange = (checked: boolean) => {
        setBulkMode(checked);
        if (!checked && selectedRowKeys.length > 0) {
            setSelectedRowKeys([]);
        }
    };

    const showBulkBar = selectedRowKeys.length > 0 || (isMobile && bulkMode);

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
                const label = categories.find(item => item.key === category)?.label || category;
                return <Tag>{label}</Tag>;
            },
        },
        {
            title: '标签',
            dataIndex: 'tags',
            key: 'tags',
            width: 200,
            render: (tags: string[]) => (
                <Space wrap>
                    {tags?.length ? tags.map(tag => <Tag key={tag}>{tag}</Tag>) : <Tag>未配置</Tag>}
                </Space>
            ),
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
            title: '置顶',
            key: 'pinned',
            width: 120,
            render: (_value: unknown, record: Article) => (
                <Space>
                    {record.sectionPinned && <Tag color="gold">列表置顶</Tag>}
                    {record.pinnedMetrics?.length ? <Tag color="blue">类目置顶</Tag> : null}
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
                    {canDelete && (
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
                {isMobile && (
                    <Space>
                        <span style={{ fontSize: 12, color: '#64748b' }}>批量模式</span>
                        <Switch checked={bulkMode} onChange={handleBulkModeChange} />
                    </Space>
                )}
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
                    {categories.map(({ key, label }) => (
                        <Option key={key} value={key}>{label}</Option>
                    ))}
                </Select>
                <Select
                    value={pinnedFilter}
                    style={{ width: 140 }}
                    onChange={handlePinnedFilterChange}
                    options={[
                        { value: 'all', label: '置顶状态' },
                        { value: 'pinned', label: '列表置顶' },
                        { value: 'unPinned', label: '未置顶' },
                    ]}
                />
            </FilterBar>

            {showBulkBar && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        background: '#f8fafc',
                        marginBottom: 12,
                    }}
                >
                    <span style={{ color: '#0f172a' }}>
                        已选 {selectedRowKeys.length} 项
                    </span>
                    <Space>
                        {canDelete && (
                            <Button
                                danger
                                onClick={handleBulkDelete}
                                disabled={selectedRowKeys.length === 0}
                            >
                                批量删除
                            </Button>
                        )}
                        <Button onClick={handleBulkCategoryOpen} disabled={selectedRowKeys.length === 0}>
                            批量改分类
                        </Button>
                        <Button onClick={() => handleBulkSectionPin(true)} disabled={selectedRowKeys.length === 0}>
                            批量置顶
                        </Button>
                        <Button onClick={() => handleBulkSectionPin(false)} disabled={selectedRowKeys.length === 0}>
                            取消置顶
                        </Button>
                        <Button onClick={() => setSelectedRowKeys([])} disabled={selectedRowKeys.length === 0}>
                            清空选择
                        </Button>
                    </Space>
                </div>
            )}

            <DataTable<Article>
                columns={columns}
                dataSource={data}
                loading={loading}
                rowSelection={rowSelection}
                enableDrawerDetails={!bulkMode}
                disableMobileMore={bulkMode}
                pagination={{
                    ...pagination,
                    onChange: (page, pageSize) => fetchData(page, pageSize),
                }}
            />

            <Modal
                title="批量改分类"
                open={bulkCategoryOpen}
                okText="确认更新"
                cancelText="取消"
                okButtonProps={{ loading: bulkCategorySubmitting }}
                onOk={handleBulkCategoryConfirm}
                onCancel={() => setBulkCategoryOpen(false)}
            >
                <div style={{ marginBottom: 8, color: '#475569' }}>
                    仅对已选 {selectedRowKeys.length} 项生效
                </div>
                <Select
                    placeholder="选择目标分类"
                    value={bulkCategory}
                    onChange={(value: ArticleCategory) => setBulkCategory(value)}
                    style={{ width: '100%' }}
                    options={categories.map((item) => ({
                        label: item.label,
                        value: item.key,
                    }))}
                />
            </Modal>
        </div>
    );
};

export default ArticleListPage;
