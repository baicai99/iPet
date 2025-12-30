/**
 * 系统初始化 Mock 数据
 */

import type { CheckAdminExistsResponse, InitSystemResponse } from '@/api/contracts/system-init';
import type { AdminInfo } from '@/api/types';

/**
 * Mock: 检查管理员是否存在
 */
export function getMockAdminExistsResponse(exists: boolean): CheckAdminExistsResponse {
    return { exists };
}

/**
 * Mock: 系统初始化成功响应
 */
export function getMockInitSystemResponse(username: string): InitSystemResponse {
    const admin: AdminInfo = {
        id: '1',
        username,
        displayName: username,
        role: 'admin',
    };

    return {
        success: true,
        admin,
        accessToken: 'mock_init_token_' + Date.now(),
        message: '系统初始化成功！',
    };
}

/**
 * Mock: 入口路径更新成功响应
 */
export function getMockUpdateEntryPathResponse(newPath: string, baseUrl: string) {
    return {
        success: true,
        newPath,
        newLoginUrl: `${baseUrl}/${newPath}/login`,
    };
}
