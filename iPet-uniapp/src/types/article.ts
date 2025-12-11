export interface Article {
    id: string;
    title: string;
    summary: string;
    content: string;
    cover?: string;
    category: string;
    author?: string;
    createdAt?: string;
    updatedAt?: string;
    /** 文章标签数组，用于推荐匹配 */
    tags: string[];
    /** 文章更新时间，格式 YYYY-MM-DD，用于排序 */
    updateTime: string;
    [key: string]: any;
}
