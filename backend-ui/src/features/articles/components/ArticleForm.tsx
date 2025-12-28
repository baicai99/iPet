import React, { useEffect } from 'react';
import { Form, Input, Button, Select, Card, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { CreateArticleRequest, UpdateArticleRequest } from '@/api/contracts/articles';
import type { ArticleCategory } from '@/api/types';

interface ArticleFormProps {
    initialValues?: UpdateArticleRequest;
    onSubmit: (values: CreateArticleRequest | UpdateArticleRequest) => Promise<void>;
    loading?: boolean;
    isEdit?: boolean;
    onCancel?: () => void;
}

const CATEGORY_OPTIONS: { label: string; value: ArticleCategory }[] = [
    { label: '教育科普', value: 'education' },
    { label: '健康医疗', value: 'health' },
    { label: '日常护理', value: 'care' },
    { label: '营养饮食', value: 'nutrition' },
];

const ArticleForm: React.FC<ArticleFormProps> = ({
    initialValues,
    onSubmit,
    loading = false,
    isEdit = false,
    onCancel,
}) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues);
        }
    }, [initialValues, form]);

    const handleFinish = async (values: CreateArticleRequest | UpdateArticleRequest) => {
        try {
            await onSubmit(values);
        } catch (error) {
            console.error('Submit failed:', error);
        }
    };

    return (
        <Card title={isEdit ? '编辑文章' : '新增文章'} bordered={false}>
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
                    <Select placeholder="请选择分类" options={CATEGORY_OPTIONS} />
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
                    extra="支持 JPG/PNG 格式，建议尺寸 16:9"
                >
                    {/* 暂时使用 Input 输入 URL，需后续集成实际上传组件 */}
                    <Input placeholder="请输入封面图片 URL" prefix={<UploadOutlined />} />
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
