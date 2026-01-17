import React, { useMemo, useState } from 'react';
import { App, Button, Form, Input, InputNumber, Modal, Select, Space, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { DataTable } from '@/shared/components/DataTable';
import { usePermission } from '@/core/auth';
import { useArticleCategories } from '../hooks/useArticleCategories';
import {
    createArticleCategory,
    updateArticleCategory,
    deleteArticleCategory,
    type CreateArticleCategoryRequest,
} from '@/api/contracts/articles';
import type { ArticleCategoryOption } from '@/api/types';
import { getErrorMessage } from '@/shared/utils/errorMessage';

const { Title } = Typography;

const ArticleCategoryListPage: React.FC = () => {
    const { message } = App.useApp();
    const { categories, refresh, loading } = useArticleCategories();
    const { can } = usePermission();
    const canManageCategories = can('article:category:manage');

    const [form] = Form.useForm<CreateArticleCategoryRequest>();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ArticleCategoryOption | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteCategory, setDeleteCategory] = useState<ArticleCategoryOption | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | undefined>();
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    const [orderSubmitting, setOrderSubmitting] = useState(false);

    const notifyCategoryRefresh = () => {
        if (typeof window === 'undefined') return;
        window.dispatchEvent(new Event('article-categories-updated'));
    };

    const openCreateModal = () => {
        setEditingCategory(null);
        form.resetFields();
        setModalOpen(true);
    };

    const openEditModal = (record: ArticleCategoryOption) => {
        setEditingCategory(record);
        form.setFieldsValue({
            key: record.key,
            label: record.label,
            order: record.order,
        });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                key: values.key?.trim(),
                label: values.label?.trim(),
                order: typeof values.order === 'number' ? values.order : undefined,
            };
            setSubmitting(true);
            if (editingCategory) {
                await updateArticleCategory(editingCategory.key, {
                    label: payload.label,
                    order: payload.order,
                });
                message.success('分类已更新');
            } else {
                await createArticleCategory(payload);
                message.success('分类已创建');
            }
            await refresh();
            notifyCategoryRefresh();
            setModalOpen(false);
        } catch (error) {
            if ((error as { errorFields?: unknown[] })?.errorFields) return;
            message.error(getErrorMessage(error, '保存失败'));
        } finally {
            setSubmitting(false);
        }
    };

    const openDeleteModal = (record: ArticleCategoryOption) => {
        setDeleteCategory(record);
        setDeleteTarget(undefined);
        setDeleteOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteCategory) return;
        if ((deleteCategory.count ?? 0) > 0 && !deleteTarget) {
            message.warning('请选择迁移目标分类');
            return;
        }
        setDeleteSubmitting(true);
        try {
            const result = await deleteArticleCategory(
                deleteCategory.key,
                (deleteCategory.count ?? 0) > 0 ? deleteTarget : undefined
            );
            const migratedCount = result.migrated || 0;
            if (migratedCount > 0) {
                message.success(`已删除分类并迁移 ${migratedCount} 篇文章`);
            } else {
                message.success('分类已删除');
            }
            await refresh();
            notifyCategoryRefresh();
            setDeleteOpen(false);
        } catch (error) {
            message.error(getErrorMessage(error, '删除失败'));
        } finally {
            setDeleteSubmitting(false);
        }
    };

    const handleMoveCategory = async (record: ArticleCategoryOption, direction: 'up' | 'down') => {
        const currentIndex = categories.findIndex(item => item.key === record.key);
        if (currentIndex < 0) return;
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= categories.length) return;

        const target = categories[targetIndex];
        setOrderSubmitting(true);
        try {
            await Promise.all([
                updateArticleCategory(record.key, { order: target.order }),
                updateArticleCategory(target.key, { order: record.order }),
            ]);
            message.success('分类排序已更新');
            await refresh();
            notifyCategoryRefresh();
        } catch (error) {
            message.error(getErrorMessage(error, '排序更新失败'));
        } finally {
            setOrderSubmitting(false);
        }
    };

    const columns = useMemo(() => [
        {
            title: '分类名称',
            dataIndex: 'label',
            key: 'label',
            primary: true,
            render: (label: string) => <span style={{ fontWeight: 500 }}>{label}</span>,
        },
        {
            title: 'Key',
            dataIndex: 'key',
            key: 'key',
            width: 160,
            render: (key: string) => <Tag>{key}</Tag>,
        },
        {
            title: '排序',
            dataIndex: 'order',
            key: 'order',
            width: 80,
        },
        {
            title: '排序操作',
            key: 'orderActions',
            width: 140,
            render: (_value: unknown, record: ArticleCategoryOption, index: number) => (
                <Space>
                    <Button
                        size="small"
                        onClick={() => handleMoveCategory(record, 'up')}
                        disabled={orderSubmitting || !canManageCategories || index === 0}
                    >
                        上移
                    </Button>
                    <Button
                        size="small"
                        onClick={() => handleMoveCategory(record, 'down')}
                        disabled={orderSubmitting || !canManageCategories || index === categories.length - 1}
                    >
                        下移
                    </Button>
                </Space>
            ),
        },
        {
            title: '文章数',
            dataIndex: 'count',
            key: 'count',
            width: 100,
            render: (count: number | undefined) => <Tag color={count ? 'blue' : 'default'}>{count ?? 0}</Tag>,
        },
        {
            title: '操作',
            key: 'action',
            width: 160,
            render: (_value: unknown, record: ArticleCategoryOption) => (
                <Space>
                    {canManageCategories && (
                        <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
                            编辑
                        </Button>
                    )}
                    {canManageCategories && (
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => openDeleteModal(record)}>
                            删除
                        </Button>
                    )}
                </Space>
            ),
        },
    ], [canManageCategories, categories, orderSubmitting]);

    const deleteTargetOptions = useMemo(
        () => categories.filter(item => item.key !== deleteCategory?.key),
        [categories, deleteCategory?.key]
    );
    const deleteRequiresTarget = (deleteCategory?.count ?? 0) > 0;
    const deleteDisabled = deleteRequiresTarget && (!deleteTarget || deleteTargetOptions.length === 0);

    return (
        <div>
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Title level={2}>分类管理</Title>
                {canManageCategories && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                        新增分类
                    </Button>
                )}
            </div>

            <DataTable<ArticleCategoryOption>
                columns={columns}
                dataSource={categories}
                loading={loading}
                rowKey="key"
                pagination={false}
                enableDrawerDetails={false}
                disableMobileMore
            />

            <Modal
                title={editingCategory ? '编辑分类' : '新增分类'}
                open={modalOpen}
                onOk={handleSubmit}
                onCancel={() => setModalOpen(false)}
                okText={editingCategory ? '保存' : '创建'}
                cancelText="取消"
                okButtonProps={{ loading: submitting }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="分类 Key"
                        name="key"
                        rules={[{ required: true, message: '请输入分类 Key' }]}
                    >
                        <Input placeholder="例如：health" disabled={!!editingCategory} />
                    </Form.Item>
                    <Form.Item
                        label="分类名称"
                        name="label"
                        rules={[{ required: true, message: '请输入分类名称' }]}
                    >
                        <Input placeholder="例如：健康医疗" />
                    </Form.Item>
                    <Form.Item
                        label="排序"
                        name="order"
                    >
                        <InputNumber min={1} style={{ width: '100%' }} placeholder="数字越小越靠前" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="删除分类"
                open={deleteOpen}
                okText="确认删除"
                cancelText="取消"
                okButtonProps={{ danger: true, loading: deleteSubmitting, disabled: deleteDisabled }}
                onOk={handleDeleteConfirm}
                onCancel={() => setDeleteOpen(false)}
            >
                <div style={{ marginBottom: 8 }}>
                    确认删除分类 <Tag>{deleteCategory?.label}</Tag> 吗？
                </div>
                {deleteRequiresTarget ? (
                    <>
                        <div style={{ marginBottom: 8, color: '#475569' }}>
                            该分类下有 {deleteCategory?.count ?? 0} 篇文章，请选择迁移目标分类。
                        </div>
                        {deleteTargetOptions.length > 0 ? (
                            <Select
                                placeholder="选择迁移目标分类"
                                value={deleteTarget}
                                onChange={(value: string) => setDeleteTarget(value)}
                                style={{ width: '100%' }}
                                options={deleteTargetOptions.map(item => ({
                                    label: item.label,
                                    value: item.key,
                                }))}
                            />
                        ) : (
                            <div style={{ color: '#ef4444' }}>
                                没有可选目标分类，无法删除该分类。
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ color: '#475569' }}>该分类下暂无文章，可直接删除。</div>
                )}
            </Modal>
        </div>
    );
};

export default ArticleCategoryListPage;
