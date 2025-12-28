import { http, HttpResponse } from 'msw';

export const authHandlers = [
    http.post('/api/admin/login', async ({ request }) => {
        const { username } = await request.json() as { username?: string; password?: string };
        const isSuperAdmin = username === 'super_admin';

        return HttpResponse.json({
            accessToken: isSuperAdmin ? 'mock-jwt-token-super-admin' : 'mock-jwt-token-admin',
            expiresIn: 86400,
            admin: {
                id: isSuperAdmin ? '2' : '1',
                username: username || 'admin',
                displayName: isSuperAdmin ? 'Super Admin User' : 'Admin User',
                role: isSuperAdmin ? 'super_admin' : 'admin',
            }
        });
    }),
];
