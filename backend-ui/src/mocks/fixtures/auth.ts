import { http, HttpResponse } from 'msw';

export const authHandlers = [
    http.post('/api/admin/login', async ({ request }) => {
        const { username } = await request.json() as { username?: string; password?: string };

        return HttpResponse.json({
            success: true,
            data: {
                accessToken: 'mock-jwt-token-admin',
                expiresIn: 86400,
                admin: {
                    id: '1',
                    username: username || 'admin',
                    displayName: 'Admin User',
                    role: 'admin',
                },
            },
            requestId: 'req_mock_login_admin',
            timestamp: Date.now(),
        });
    }),
];
