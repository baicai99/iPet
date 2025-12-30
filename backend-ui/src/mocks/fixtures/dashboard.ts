import { http, HttpResponse } from 'msw';

function formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function generateTrend(days: number, base: number, variance: number) {
    const trend = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const noise = Math.floor((Math.random() - 0.5) * variance);
        trend.push({ date: formatDate(date), count: Math.max(0, base + noise + i * 2) });
    }
    return trend;
}

export const dashboardHandlers = [
    http.get('/api/admin/stats/dashboard', () => {
        return HttpResponse.json({
            success: true,
            data: {
                users: {
                    total: 18234,
                    guests: 5200,
                    registered: 13034,
                    active7d: 6421,
                    active30d: 12310,
                    newToday: 214,
                },
                pets: {
                    total: 8960,
                    distribution: [
                        { type: 'dog', count: 4200 },
                        { type: 'cat', count: 3600 },
                        { type: 'other', count: 1160 },
                    ],
                },
                healthRecords: {
                    total: 33210,
                    today: 312,
                },
                articles: {
                    total: 128,
                    totalViews: 583420,
                },
                generatedAt: new Date().toISOString(),
            },
            requestId: 'req_mock_dashboard_stats',
            timestamp: Date.now(),
        });
    }),

    http.get('/api/admin/stats/users/trend', ({ request }) => {
        const url = new URL(request.url);
        const days = Number(url.searchParams.get('days')) || 30;
        return HttpResponse.json({
            success: true,
            data: generateTrend(days, 220, 80),
            requestId: 'req_mock_users_trend',
            timestamp: Date.now(),
        });
    }),

    http.get('/api/admin/stats/records/trend', ({ request }) => {
        const url = new URL(request.url);
        const days = Number(url.searchParams.get('days')) || 30;
        return HttpResponse.json({
            success: true,
            data: generateTrend(days, 180, 60),
            requestId: 'req_mock_records_trend',
            timestamp: Date.now(),
        });
    }),
];
