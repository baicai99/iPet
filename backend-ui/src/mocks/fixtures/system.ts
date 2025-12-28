import { http, HttpResponse } from 'msw';

export const systemHandlers = [
    http.get('/api/system/monitor', () => {
        return HttpResponse.json({
            cpuUsage: 45,
            memoryUsage: 62,
            diskUsage: 78,
            uptime: 123456
        });
    }),

    http.get('/api/system/audit-logs', () => {
        return HttpResponse.json({
            data: [
                { id: 1, action: 'LOGIN', user: 'admin', timestamp: new Date().toISOString(), details: 'Login successful' },
                { id: 2, action: 'DELETE_USER', user: 'super_admin', timestamp: new Date().toISOString(), details: 'Deleted user ID 5' },
                { id: 3, action: 'UPDATE_SETTINGS', user: 'super_admin', timestamp: new Date().toISOString(), details: 'Updated system settings' },
            ],
            total: 3,
            page: 1,
            pageSize: 10
        });
    }),
];
