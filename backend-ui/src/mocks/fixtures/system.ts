import { http, HttpResponse } from 'msw';

export const systemHandlers = [
    http.get('/api/admin/system/info', () => {
        return HttpResponse.json({
            success: true,
            data: {
                status: 'ok',
                uptime: 123456,
                version: '0.0.22',
                system: {
                    platform: 'darwin',
                    arch: 'arm64',
                    nodeVersion: 'v20.10.0',
                    uptime: 123456,
                    memoryUsage: {
                        total: 17179869184,
                        free: 8589934592,
                        used: 8589934592,
                        usedPercent: '50.00',
                    },
                    cpuUsage: [1.2, 1.0, 0.9],
                },
            },
            requestId: 'req_mock_system_info',
            timestamp: Date.now(),
        });
    }),

    http.get('/api/admin/system/storage', () => {
        return HttpResponse.json({
            success: true,
            data: {
                totalFiles: 1500,
                totalSize: 524288000,
                totalSizeFormatted: '500 MB',
                breakdown: {
                    jpg: { count: 1000, size: 350000000 },
                    png: { count: 400, size: 150000000 },
                    webp: { count: 100, size: 24288000 },
                },
            },
            requestId: 'req_mock_system_storage',
            timestamp: Date.now(),
        });
    }),

    http.get('/api/admin/audit-logs', ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page') || '1');
        const limit = Number(url.searchParams.get('limit') || '10');
        const items = [
            {
                id: 'log-1',
                action: 'login',
                user: 'admin',
                timestamp: new Date().toISOString(),
                details: 'Login successful',
                ip: '127.0.0.1',
            },
            {
                id: 'log-2',
                action: 'login_failed',
                user: 'unknown',
                timestamp: new Date().toISOString(),
                details: JSON.stringify({ username: 'admin', reason: '密码错误', remaining: 2 }),
                ip: '127.0.0.1',
            },
            {
                id: 'log-3',
                action: 'delete_user',
                user: 'admin',
                timestamp: new Date().toISOString(),
                details: 'Deleted user ID 5',
                ip: '10.0.0.8',
            },
            {
                id: 'log-4',
                action: 'update_article',
                user: 'admin',
                timestamp: new Date().toISOString(),
                details: 'Updated article ID 2',
                ip: '10.0.0.8',
            },
        ];

        return HttpResponse.json({
            success: true,
            data: {
                items,
                total: items.length,
                page,
                limit,
                totalPages: 1,
            },
            requestId: 'req_mock_audit_logs',
            timestamp: Date.now(),
        });
    }),
];
