import { describe, it, expect } from 'vitest';
import { UserSchema, UserListSchema, GuestStatsSchema } from './users';

describe('UserSchema', () => {
    it('should parse valid user data', () => {
        const validUser = {
            id: '1',
            email: 'test@example.com',
            displayName: 'Test User',
            isGuest: false,
            isBanned: false,
            bannedAt: undefined,
            bannedReason: undefined,
            lastActiveAt: '2024-01-02T00:00:00Z',
            petsCount: 5,
            createdAt: '2024-01-01T00:00:00Z',
        };

        const result = UserSchema.safeParse(validUser);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.email).toBe('test@example.com');
        }
    });

    it('should reject invalid user data', () => {
        const invalidUser = {
            id: 123, // should be string
            email: 'invalid-email', // invalid format
        };

        const result = UserSchema.safeParse(invalidUser);
        expect(result.success).toBe(false);
    });

    it('should validate email format', () => {
        const userWithInvalidEmail = {
            id: '1',
            email: 'not-an-email',
            displayName: 'Test User',
            isGuest: false,
            isBanned: false,
            petsCount: 0,
            createdAt: '2024-01-01T00:00:00Z',
        };

        const result = UserSchema.safeParse(userWithInvalidEmail);
        expect(result.success).toBe(false);
    });
});

describe('UserListSchema', () => {
    it('should parse user list with pagination', () => {
        const userList = {
            items: [
                {
                    id: '1',
                    email: 'test@example.com',
                    displayName: 'Test User',
                    isGuest: false,
                    isBanned: false,
                    petsCount: 5,
                    createdAt: '2024-01-01T00:00:00Z',
                },
            ],
            pagination: {
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
            },
        };

        const result = UserListSchema.safeParse(userList);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.items).toHaveLength(1);
            expect(result.data.pagination.total).toBe(1);
        }
    });

    it('should reject invalid pagination data', () => {
        const invalidList = {
            items: [],
            pagination: {
                page: 'not-a-number', // should be number
                limit: 10,
                total: 0,
                totalPages: 0,
            },
        };

        const result = UserListSchema.safeParse(invalidList);
        expect(result.success).toBe(false);
    });
});

describe('GuestStatsSchema', () => {
    it('should parse valid guest stats', () => {
        const validStats = {
            total: 100,
            last7Days: 50,
            last30Days: 50,
        };

        const result = GuestStatsSchema.safeParse(validStats);
        expect(result.success).toBe(true);
    });

    it('should reject negative numbers', () => {
        const invalidStats = {
            total: -1,
            last7Days: 50,
            last30Days: 50,
        };

        const result = GuestStatsSchema.safeParse(invalidStats);
        expect(result.success).toBe(false);
    });
});
