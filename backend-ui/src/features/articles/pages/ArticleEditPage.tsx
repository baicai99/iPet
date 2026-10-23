import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { App, Spin } from 'antd';
import ArticleForm from '../components/ArticleForm';
import { getArticleById, createArticle, updateArticle, type CreateArticleRequest, type UpdateArticleRequest } from '@/api/contracts/articles';
import { ROUTES } from '@/router/routes';
import { getErrorMessage } from '@/shared/utils/errorMessage';

const ArticleEditPage: React.FC = () => {
    const { id, entryPath } = useParams<{ id: string; entryPath?: string }>();
    const navigate = useNavigate();
    const isEdit = !!id;
    const basePath = entryPath ? `/${entryPath}` : '';
    const { message } = App.useApp();

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
        } catch (error) {
            message.error(getErrorMessage(error, '获取文章详情失败'));
            navigate(`${basePath}/${ROUTES.ARTICLES}`);
        } finally {
            setLoading(false);
        }
    }, [basePath, message, navigate]);

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
            navigate(`${basePath}/${ROUTES.ARTICLES}`);
        } catch (error) {
            message.error(getErrorMessage(error, isEdit ? '更新失败' : '发布失败'));
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
        <div style={{ padding: 0, margin: 0 }}>
            <ArticleForm
                initialValues={initialValues}
                onSubmit={handleSubmit}
                loading={submitting}
                isEdit={isEdit}
                onCancel={() => navigate(`${basePath}/${ROUTES.ARTICLES}`)}
            />
        </div>
    );
};

export default ArticleEditPage;
