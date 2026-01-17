export interface ArticleCategoryOption {
    key: string;
    label: string;
    order: number;
}

export const ARTICLE_CATEGORIES: ArticleCategoryOption[] = [
    { key: 'education', label: '科普', order: 1 },
    { key: 'recipe', label: '狗饭', order: 2 },
    { key: 'mythbust', label: '辟谣', order: 3 },
    { key: 'news', label: '资讯', order: 4 },
    { key: 'health', label: '健康医疗', order: 5 },
    { key: 'care', label: '日常护理', order: 6 },
    { key: 'nutrition', label: '营养饮食', order: 7 },
];

export const normalizeArticleCategoryList = (options: ArticleCategoryOption[]) => {
    return [...options].sort((a, b) => a.order - b.order || a.key.localeCompare(b.key));
};
