import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { message, Spin } from 'antd';
import ArticleForm from '../components/ArticleForm';
import { getArticleById, createArticle, updateArticle, type CreateArticleRequest, type UpdateArticleRequest } from '@/api/contracts/articles';

const ArticleEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [initialValues, setInitialValues] = useState<UpdateArticleRequest | undefined>(undefined);

    const fetchDetail = useCallback(async (articleId: string) => {
        setLoading(true);
        try {
            const data = await getArticleById(articleId);
            // Adapt data if needed, currently straightforward mapping
            setInitialValues({
                title: data.title,
                summary: data.summary,
                content: data.content,
                category: data.category,
                cover: data.cover,
                author: data.author,
            });
        } catch {
            message.error('获取文章详情失败');
            navigate('/articles');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        if (isEdit && id) {
            fetchDetail(id);
        }
    }, [fetchDetail, id, isEdit]);

    const handleSubmit = async (values: CreateArticleRequest | UpdateArticleRequest) => {
        setSubmitting(true);
        try {
            if (isEdit && id) {
                await updateArticle(id, values);
                message.success('更新成功');
            } else {
                await createArticle(values as CreateArticleRequest);
                message.success('发布成功');
            }
            navigate('/articles');
        } catch {
            message.error(isEdit ? '更新失败' : '发布失败');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 50 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
            <ArticleForm
                initialValues={initialValues}
                onSubmit={handleSubmit}
                loading={submitting}
                isEdit={isEdit}
                onCancel={() => navigate('/articles')}
            />
        </div>
    );
};

export default ArticleEditPage;
