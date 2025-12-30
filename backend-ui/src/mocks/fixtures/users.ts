import { http, HttpResponse } from 'msw';
import { mockUsers, mockUserDetails, mockGuestStats } from './users-data';

function parseBoolean(value: string | null): boolean | undefined {
    if (value === null) return undefined;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
}

export const usersHandlers = [
    http.get('/api/admin/users', ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search');
        const isGuest = parseBoolean(url.searchParams.get('isGuest'));
        const isBanned = parseBoolean(url.searchParams.get('isBanned'));
        const page = Number(url.searchParams.get('page') || '1');
        const limit = Number(url.searchParams.get('limit') || '10');
        const sortBy = url.searchParams.get('sortBy');
        const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

        let result = [...mockUsers];

        if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter(
                (user) =>
                    user.displayName.toLowerCase().includes(searchLower) ||
                    user.email.toLowerCase().includes(searchLower)
            );
        }

        if (isGuest !== undefined) {
            result = result.filter((user) => user.isGuest === isGuest);
        }

        if (isBanned !== undefined) {
            result = result.filter((user) => user.isBanned === isBanned);
        }

        if (sortBy === 'petsCount') {
            result.sort((a, b) => (a.petsCount - b.petsCount) * (sortOrder === 'asc' ? 1 : -1));
        } else if (sortBy === 'lastActiveAt') {
            result.sort((a, b) => {
                const aTime = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
                const bTime = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
                return (aTime - bTime) * (sortOrder === 'asc' ? 1 : -1);
            });
        } else if (sortBy === 'createdAt') {
            result.sort((a, b) => {
                const aTime = new Date(a.createdAt).getTime();
                const bTime = new Date(b.createdAt).getTime();
                return (aTime - bTime) * (sortOrder === 'asc' ? 1 : -1);
            });
        }

        const total = result.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const start = (page - 1) * limit;
        const end = start + limit;

        return HttpResponse.json({
            success: true,
            data: {
                items: result.slice(start, end),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                },
            },
            requestId: 'req_mock_users_list',
            timestamp: Date.now(),
        });
    }),

    http.get('/api/admin/users/guests/stats', () => {
        return HttpResponse.json({
            success: true,
            data: mockGuestStats,
            requestId: 'req_mock_guest_stats',
            timestamp: Date.now(),
        });
    }),

    http.get('/api/admin/users/:id', ({ params }) => {
        const userId = params.id as string;
        const detail = mockUserDetails[userId];
        if (!detail) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 });
        }
        return HttpResponse.json({
            success: true,
            data: detail,
            requestId: `req_mock_user_${userId}`,
            timestamp: Date.now(),
        });
    }),

    http.patch('/api/admin/users/:id/ban', ({ params }) => {
        const userId = params.id as string;
        const detail = mockUserDetails[userId];
        if (!detail) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 });
        }
        return HttpResponse.json({
            success: true,
            data: { ...detail, isBanned: true, bannedAt: new Date().toISOString() },
            requestId: `req_mock_ban_${userId}`,
            timestamp: Date.now(),
        });
    }),

    http.patch('/api/admin/users/:id/unban', ({ params }) => {
        const userId = params.id as string;
        const detail = mockUserDetails[userId];
        if (!detail) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 });
        }
        return HttpResponse.json({
            success: true,
            data: { ...detail, isBanned: false, bannedAt: undefined, bannedReason: undefined },
            requestId: `req_mock_unban_${userId}`,
            timestamp: Date.now(),
        });
    }),

    http.delete('/api/admin/users/:id', ({ params }) => {
        const userId = params.id as string;
        return HttpResponse.json({
            success: true,
            data: { ok: true },
            requestId: `req_mock_delete_${userId}`,
            timestamp: Date.now(),
        });
    }),

    http.patch('/api/admin/users/batch/ban', async ({ request }) => {
        const body = (await request.json()) as { ids?: string[] };
        return HttpResponse.json({
            success: true,
            data: { count: body.ids?.length || 0 },
            requestId: 'req_mock_batch_ban',
            timestamp: Date.now(),
        });
    }),

    http.patch('/api/admin/users/batch/unban', async ({ request }) => {
        const body = (await request.json()) as { ids?: string[] };
        return HttpResponse.json({
            success: true,
            data: { count: body.ids?.length || 0 },
            requestId: 'req_mock_batch_unban',
            timestamp: Date.now(),
        });
    }),

    http.patch('/api/admin/users/batch/delete', async ({ request }) => {
        const body = (await request.json()) as { ids?: string[] };
        return HttpResponse.json({
            success: true,
            data: { count: body.ids?.length || 0 },
            requestId: 'req_mock_batch_delete',
            timestamp: Date.now(),
        });
    }),
];
