import { describe, it, expect } from 'vitest';
import { queryKeys } from './queryKeys';

describe('queryKeys', () => {
    describe('users', () => {
        it('should generate correct all key', () => {
            expect(queryKeys.users.all()).toEqual(['users']);
        });

        it('should generate correct list key', () => {
            expect(queryKeys.users.list({ page: 1, limit: 10 })).toEqual([
                'users',
                'list',
                { page: 1, limit: 10 },
            ]);
        });

        it('should generate correct detail key', () => {
            expect(queryKeys.users.detail('123')).toEqual(['users', 'detail', '123']);
        });
    });

    describe('dashboard', () => {
        it('should generate correct stats key', () => {
            expect(queryKeys.dashboard.stats()).toEqual(['dashboard', 'stats']);
        });

        it('should generate correct usersTrend key', () => {
            expect(queryKeys.dashboard.usersTrend('7d')).toEqual(['dashboard', 'users-trend', '7d']);
        });

        it('should generate correct recordsTrend key', () => {
            expect(queryKeys.dashboard.recordsTrend('30d')).toEqual(['dashboard', 'records-trend', '30d']);
        });
    });

});
