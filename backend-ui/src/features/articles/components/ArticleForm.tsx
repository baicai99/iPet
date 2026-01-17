import React, { useEffect, useMemo, useState } from 'react';
import { Form, Input, Button, Select, Card, Space, Upload, App, Checkbox } from 'antd';
import type { RcFile } from 'antd/es/upload';
import { UploadOutlined } from '@ant-design/icons';
import type { CreateArticleRequest, UpdateArticleRequest } from '@/api/contracts/articles';
import { useArticleCategories } from '../hooks/useArticleCategories';

interface ArticleFormProps {
    initialValues?: UpdateArticleRequest;
    onSubmit: (values: CreateArticleRequest | UpdateArticleRequest) => Promise<void>;
    loading?: boolean;
    isEdit?: boolean;
    onCancel?: () => void;
}

const ArticleForm: React.FC<ArticleFormProps> = ({
    initialValues,
    onSubmit,
    loading = false,
    isEdit = false,
    onCancel,
}) => {
    const { message } = App.useApp();
    const { categories } = useArticleCategories();
    const [form] = Form.useForm();
    const [coverPreview, setCoverPreview] = useState<string>('');
    const coverValue = Form.useWatch('cover', form) as string | undefined;

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues);
            if (typeof initialValues.cover === 'string') {
                setCoverPreview(initialValues.cover);
            }
        }
    }, [initialValues, form]);

    useEffect(() => {
        if (coverValue && coverValue !== coverPreview) {
            setCoverPreview(coverValue);
        }
        if (!coverValue && coverPreview) {
            setCoverPreview('');
        }
    }, [coverValue, coverPreview]);

    const uploadHint = useMemo(() => '请在这里上传封面', []);
    const categoryOptions = useMemo(
        () => categories.map(category => ({ label: category.label, value: category.key })),
        [categories]
    );

    const compressImageToJpeg = async (file: RcFile, maxSize = 1600, quality = 0.8): Promise<string> => {
        const url = URL.createObjectURL(file);
        try {
            const image = await new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('图片加载失败'));
                img.src = url;
            });

            const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
            const targetWidth = Math.max(1, Math.round(image.width * scale));
            const targetHeight = Math.max(1, Math.round(image.height * scale));

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('图片压缩失败');
            }
            ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

            const blob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob((result) => resolve(result), 'image/jpeg', quality)
            );
            if (!blob) {
                throw new Error('图片压缩失败');
            }

            return await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('图片读取失败'));
                reader.readAsDataURL(blob);
            });
        } finally {
            URL.revokeObjectURL(url);
        }
    };

    const handleCoverUpload = async (file: RcFile) => {
        try {
            const compressed = await compressImageToJpeg(file);
            form.setFieldsValue({ cover: compressed });
            setCoverPreview(compressed);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '封面处理失败';
            message.error(errorMessage);
        }
        return false;
    };

    const handleCoverRemove = () => {
        form.setFieldsValue({ cover: undefined });
        setCoverPreview('');
    };

    const handleFinish = async (values: CreateArticleRequest | UpdateArticleRequest) => {
        try {
            await onSubmit(values);
        } catch {
            // Error already handled by parent component and API interceptors
        }
    };

    return (
        <Card title={isEdit ? '编辑文章' : '新增文章'} variant="borderless">
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={initialValues}
                requiredMark="optional"
            >
                <Form.Item
                    label="文章标题"
                    name="title"
                    rules={[{ required: true, message: '请输入文章标题' }]}
                >
                    <Input placeholder="请输入文章标题" maxLength={100} />
                </Form.Item>

                <Form.Item
                    label="分类"
                    name="category"
                    rules={[{ required: true, message: '请选择文章分类' }]}
                >
                    <Select placeholder="请选择分类" options={categoryOptions} />
                </Form.Item>

                <Form.Item
                    label="标签"
                    name="tags"
                    rules={[
                        { required: true, message: '请至少添加一个标签' },
                        {
                            validator: (_, value: string[]) => {
                                if (!value || value.length === 0) {
                                    return Promise.reject(new Error('请至少添加一个标签'));
                                }
                                return Promise.resolve();
                            },
                        },
                    ]}
                    extra="用于指标/场景关联与推荐，至少 1 个"
                >
                    <Select mode="tags" placeholder="输入标签后回车" />
                </Form.Item>

                <Form.Item
                    label="摘要"
                    name="summary"
                    rules={[{ required: true, message: '请输入文章摘要' }]}
                >
                    <Input.TextArea placeholder="请输入文章摘要" rows={3} maxLength={300} showCount />
                </Form.Item>

                <Form.Item
                    label="封面图片"
                    name="cover"
                    extra="支持任意图片格式，自动转换为 JPG 并压缩；建议尺寸 16:9"
                >
                    <Upload
                        accept="image/*"
                        showUploadList={false}
                        beforeUpload={handleCoverUpload}
                    >
                        <div
                            style={{
                                border: '1px dashed #d9d9d9',
                                borderRadius: 8,
                                padding: 16,
                                textAlign: 'center',
                                background: '#fafafa',
                                cursor: 'pointer',
                                minHeight: 180,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                            }}
                        >
                            {coverPreview ? (
                                <img
                                    src={coverPreview}
                                    alt="封面预览"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        maxHeight: 220,
                                        objectFit: 'cover',
                                        borderRadius: 6,
                                    }}
                                />
                            ) : (
                                <span style={{ color: '#8c8c8c', fontSize: 14 }}>
                                    <UploadOutlined style={{ marginRight: 8 }} />
                                    {uploadHint}
                                </span>
                            )}
                        </div>
                    </Upload>
                    {coverPreview && (
                        <Button
                            type="link"
                            onClick={handleCoverRemove}
                            style={{ padding: 0, marginTop: 8 }}
                        >
                            移除封面
                        </Button>
                    )}
                </Form.Item>

                <Form.Item
                    label="正文内容"
                    name="content"
                    rules={[{ required: true, message: '请输入正文内容' }]}
                >
                    <Input.TextArea
                        placeholder="请输入 Markdown 内容..."
                        rows={15}
                        showCount
                        style={{ fontFamily: 'monospace' }}
                    />
                </Form.Item>

                <Form.Item label="作者" name="author">
                    <Input placeholder="请输入作者（选填）" />
                </Form.Item>

                <Form.Item name="sectionPinned" valuePropName="checked">
                    <Checkbox>列表置顶（Summary/文章列表优先展示）</Checkbox>
                </Form.Item>

                <Form.Item
                    label="类目置顶（指标 key）"
                    name="pinnedMetrics"
                    extra="在对应指标详情页的文章区域置顶展示"
                >
                    <Select mode="tags" placeholder="输入指标 key 后回车" />
                </Form.Item>

                <Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            {isEdit ? '保存修改' : '立即发布'}
                        </Button>
                        {onCancel && (
                            <Button onClick={onCancel} disabled={loading}>
                                取消
                            </Button>
                        )}
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default ArticleForm;
