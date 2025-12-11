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
    [key: string]: any;
}
