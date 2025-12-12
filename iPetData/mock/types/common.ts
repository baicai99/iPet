export interface RequestConfig {
    url: string;
    method?: string;
    data?: any;
    params?: any;
    headers?: Record<string, string>;
    [key: string]: any;
}
