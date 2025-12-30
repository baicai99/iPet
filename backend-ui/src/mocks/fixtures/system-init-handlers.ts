/**
 * 系统初始化 MSW Handlers
 */

import { http, HttpResponse } from 'msw';
import {
    getMockAdminExistsResponse,
    getMockInitSystemResponse,
    getMockUpdateEntryPathResponse,
} from './system-init';
import { mockSettingsState } from './settings';

const API_BASE = '/api';

// 模拟状态：用于记住是否已经初始化
let mockInitialized = false;

export const systemInitHandlers = [
    // 检查管理员是否存在
    http.get(`${API_BASE}/admin/exists`, () => {
        // 如果已初始化，返回存在；否则返回不存在
        return HttpResponse.json(getMockAdminExistsResponse(mockInitialized));
    }),

    // 提交系统初始化
    http.post(`${API_BASE}/admin/init`, async ({ request }) => {
        const body = (await request.json()) as {
            accessUrl: string;
            port?: number;
            entryPath: string;
            admin: {
                username: string;
                email: string;
                password: string;
            };
        };

        // 模拟验证
        if (!body.entryPath || !body.admin.username || !body.admin.password) {
            return HttpResponse.json(
                { success: false, message: '缺少必要参数' },
                { status: 400 }
            );
        }

        // 标记为已初始化
        mockInitialized = true;
        mockSettingsState.entryPath = body.entryPath;
        if (typeof body.port === 'number') {
            mockSettingsState.port = body.port;
        }

        // 返回初始化成功
        return HttpResponse.json(getMockInitSystemResponse(body.admin.username));
    }),

    // 更新入口路径
    http.put(`${API_BASE}/admin/settings/entry-path`, async ({ request }) => {
        const body = (await request.json()) as {
            newPath: string;
            currentPassword: string;
        };

        // 模拟密码验证（简单示例）
        if (body.currentPassword !== 'admin123') {
            return HttpResponse.json({ success: false, message: '密码错误' }, { status: 403 });
        }

        // 更新入口路径
        mockSettingsState.entryPath = body.newPath;

        return HttpResponse.json(
            getMockUpdateEntryPathResponse(body.newPath, 'http://localhost:5173')
        );
    }),

    // 更新访问配置
    http.put(`${API_BASE}/admin/settings/access-config`, async ({ request }) => {
        const body = (await request.json()) as {
            url: string;
            port?: number;
        };

        // 简单验证
        if (!body.url) {
            return HttpResponse.json({ success: false, message: '缺少 URL' }, { status: 400 });
        }

        return HttpResponse.json({ success: true });
    }),

    // 获取系统配置
    http.get(`${API_BASE}/admin/settings/system-config`, () => {
        return HttpResponse.json({
            accessUrl: 'http://localhost:5173',
            port: mockSettingsState.port,
            entryPath: mockSettingsState.entryPath,
        });
    }),
];
