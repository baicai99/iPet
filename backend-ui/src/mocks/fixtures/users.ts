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

        const total = result.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const start = (page - 1) * limit;
        const end = start + limit;

        return HttpResponse.json({
            items: result.slice(start, end),
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        });
    }),

    http.get('/api/admin/users/guests/stats', () => {
        return HttpResponse.json(mockGuestStats);
    }),

    http.get('/api/admin/users/:id', ({ params }) => {
        const userId = params.id as string;
        const detail = mockUserDetails[userId];
        if (!detail) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 });
        }
        return HttpResponse.json(detail);
    }),

    http.patch('/api/admin/users/:id/ban', ({ params }) => {
        const userId = params.id as string;
        const detail = mockUserDetails[userId];
        if (!detail) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 });
        }
        return HttpResponse.json({ ...detail, isBanned: true, bannedAt: new Date().toISOString() });
    }),

    http.patch('/api/admin/users/:id/unban', ({ params }) => {
        const userId = params.id as string;
        const detail = mockUserDetails[userId];
        if (!detail) {
            return HttpResponse.json({ message: 'User not found' }, { status: 404 });
        }
        return HttpResponse.json({ ...detail, isBanned: false, bannedAt: undefined, bannedReason: undefined });
    }),

    http.delete('/api/admin/users/:id', () => {
        return HttpResponse.json({ ok: true });
    }),
];
