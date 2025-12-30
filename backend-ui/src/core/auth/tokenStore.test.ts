import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getToken, setToken, clearToken } from './tokenStore';

// Mock storage
const mockStorage = new Map<string, string>();

describe('tokenStore', () => {
    beforeEach(() => {
        // Clear both localStorage and sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        mockStorage.clear();
        vi.clearAllMocks();
    });

    it('should store and retrieve token', () => {
        const token = 'test-token-123';
        setToken(token);
        expect(getToken()).toBe(token);
    });

    it('should clear token', () => {
        setToken('test-token');
        clearToken();
        expect(getToken()).toBeNull();
    });

    it('should persist token in sessionStorage', () => {
        const token = 'persistent-token';
        setToken(token);

        // Verify sessionStorage was updated
        expect(sessionStorage.getItem('admin_token')).toBe(token);
    });

    it('should clear both token and admin info', () => {
        setToken('test-token');
        sessionStorage.setItem('admin_info', '{"username":"test"}');

        clearToken();

        expect(getToken()).toBeNull();
        expect(sessionStorage.getItem('admin_info')).toBeNull();
    });
});
