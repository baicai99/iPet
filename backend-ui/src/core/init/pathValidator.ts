/**
 * Path Validator - 入口路径验证工具
 * @description 验证动态入口路径、生成随机路径、构建完整URL
 */

import { getEntryPath, getAccessConfig } from './initStore';

// ============ 路径验证 ============

/**
 * 验证路径格式是否合法
 * @param path 路径字符串
 * @returns true 表示格式合法
 */
export function isValidPathFormat(path: string): boolean {
    // 路径规则：
    // 1. 长度 1-16 字符
    // 2. 只能包含小写字母、数字
    // 3. 必须以字母开头
    const pathRegex = /^[a-z][a-z0-9]{0,15}$/;
    return pathRegex.test(path);
}

/**
 * 验证当前访问路径是否匹配配置的入口路径
 * @param currentPath 当前访问路径（从 window.location.pathname 获取）
 * @returns true 表示路径匹配
 */
export function validateEntryPath(currentPath: string): boolean {
    const configuredPath = getEntryPath();

    // 如果未配置入口路径，认为系统未初始化，不验证
    if (!configuredPath) return false;

    // 移除开头的斜杠并分割路径
    const pathSegments = currentPath.replace(/^\//, '').split('/');

    // 第一个路径段应该匹配配置的入口路径
    return pathSegments[0] === configuredPath;
}

/**
 * 从当前路径提取入口路径部分
 * @param currentPath 当前完整路径
 * @returns 提取的入口路径，如果不存在则返回 null
 */
export function extractEntryPath(currentPath: string): string | null {
    const pathSegments = currentPath.replace(/^\//, '').split('/');
    return pathSegments[0] || null;
}

// ============ 路径生成 ============

/**
 * 生成随机字符串
 */
function generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 生成随机的入口路径
 * @returns 随机生成的合法入口路径，格式如 "admin-x7k9m2"
 */
export function generateRandomPath(length = 8): string {
    const safeLength = Math.min(Math.max(length, 1), 16);
    const firstChar = generateRandomString(1).replace(/[^a-z]/g, 'a');
    const remaining = safeLength > 1 ? generateRandomString(safeLength - 1) : '';
    return `${firstChar}${remaining}`;
}

/**
 * 生成多个候选路径供用户选择
 * @param count 生成数量，默认 3 个
 * @returns 路径数组
 */
export function generatePathOptions(count = 3, length = 8): string[] {
    const options: string[] = [];
    for (let i = 0; i < count; i++) {
        options.push(generateRandomPath(length));
    }
    return options;
}

// ============ URL 构建 ============

/**
 * 获取完整的后台访问基础 URL
 * @param entryPath 入口路径（可选，默认使用配置的路径）
 * @returns 完整的基础 URL，如 "http://localhost:5173/admin-x7k9m2"
 */
export function getFullAdminUrl(entryPath?: string): string {
    const config = getAccessConfig();
    const path = entryPath || getEntryPath();

    if (!config || !path) {
        throw new Error('Access config or entry path not configured');
    }

    const { url, port } = config;

    // 如果 URL 已经包含端口或者端口是标准端口（80/443），不添加端口
    let baseUrl = url;
    if (port && !url.includes(':' + port)) {
        // 检查是否已有端口
        const hasPort = /:\d+/.test(url);
        if (!hasPort && port !== 80 && port !== 443) {
            // 去掉 URL 末尾的斜杠
            baseUrl = url.replace(/\/$/, '');
            baseUrl = `${baseUrl}:${port}`;
        }
    }

    // 确保 URL 没有末尾斜杠
    baseUrl = baseUrl.replace(/\/$/, '');

    return `${baseUrl}/${path}`;
}

/**
 * 获取完整的登录页 URL
 * @param entryPath 入口路径（可选）
 * @returns 登录页完整 URL
 */
export function getLoginUrl(entryPath?: string): string {
    return `${getFullAdminUrl(entryPath)}/login`;
}

/**
 * 获取完整的后台首页 URL
 * @param entryPath 入口路径（可选）
 * @returns 后台首页完整 URL
 */
export function getDashboardUrl(entryPath?: string): string {
    return `${getFullAdminUrl(entryPath)}/dashboard`;
}

// ============ 路径比较 ============

/**
 * 检查两个路径是否相同（忽略大小写和前后斜杠）
 */
export function pathsMatch(path1: string, path2: string): boolean {
    const normalize = (p: string) => p.replace(/^\/|\/$/g, '').toLowerCase();
    return normalize(path1) === normalize(path2);
}

// ============ 路径建议 ============

/**
 * 生成安全的路径建议
 * @returns 推荐的安全路径及说明
 */
export function getSafePathSuggestions(): Array<{ path: string; description: string }> {
    return [
        {
            path: generateRandomPath(),
            description: '随机生成 - 推荐',
        },
        {
            path: `backend-${generateRandomString(6)}`,
            description: '后台标识',
        },
        {
            path: `manage-${generateRandomString(6)}`,
            description: '管理标识',
        },
    ];
}
