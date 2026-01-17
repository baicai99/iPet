import { useCallback, useEffect, useState } from 'react';
import { getArticleCategories } from '@/api/contracts/articles';
import type { ArticleCategoryOption } from '@/api/types';

export const useArticleCategories = () => {
    const [categories, setCategories] = useState<ArticleCategoryOption[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getArticleCategories();
            setCategories([...data].sort((a, b) => a.order - b.order));
        } catch (error) {
            console.error('[ArticleCategories] Fetch failed', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handler = () => {
            fetchCategories();
        };
        window.addEventListener('article-categories-updated', handler);
        return () => window.removeEventListener('article-categories-updated', handler);
    }, [fetchCategories]);

    return {
        categories,
        loading,
        refresh: fetchCategories,
    };
};
