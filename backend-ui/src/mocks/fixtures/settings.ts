/**
 * 设置 MSW Handlers
 */

import { http, HttpResponse } from 'msw';

const API_BASE = '/api';

export const mockSettingsState = {
    username: 'admin',
    email: 'admin@example.com',
    port: 5173,
    entryPath: 'admin',
};

export const settingsHandlers = [
    http.get(`${API_BASE}/admin/settings`, () => {
        return HttpResponse.json({
            success: true,
            data: mockSettingsState,
        });
    }),

    http.put(`${API_BASE}/admin/settings`, async ({ request }) => {
        const body = (await request.json()) as Partial<typeof mockSettingsState> & {
            password?: string;
            currentPassword?: string;
        };

        if (!body.username || !body.email || !body.entryPath || !body.port) {
            return HttpResponse.json({ success: false, error: { message: '缺少必要参数' } }, { status: 400 });
        }

        if (body.password) {
            if (!('currentPassword' in body) || body.currentPassword !== 'admin123') {
                return HttpResponse.json({ success: false, error: { message: '旧密码错误' } }, { status: 403 });
            }
        }

        mockSettingsState.username = body.username;
        mockSettingsState.email = body.email;
        mockSettingsState.port = body.port;
        mockSettingsState.entryPath = body.entryPath;

        return HttpResponse.json({
            success: true,
            data: mockSettingsState,
        });
    }),

    http.post(`${API_BASE}/admin/settings/verify-password`, async ({ request }) => {
        const body = (await request.json()) as { currentPassword?: string };
        if (!body.currentPassword) {
            return HttpResponse.json({ success: false, error: { message: '请输入旧密码' } }, { status: 400 });
        }
        if (body.currentPassword !== 'admin123') {
            return HttpResponse.json({ success: false, error: { message: '旧密码错误' } }, { status: 403 });
        }
        return HttpResponse.json({ success: true, data: { valid: true } });
    }),
];
