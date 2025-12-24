import { test as base, expect, type Page } from '@playwright/test';

/**
 * Test credentials from environment variables
 * These should be set in CI or local .env file
 */
export const TEST_USER = {
    email: process.env.E2E_TEST_EMAIL || 'e2e-test@ipet.test',
    password: process.env.E2E_TEST_PASSWORD || 'Test123456!',
};

/**
 * Backend API base URL
 */
export const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';

/**
 * Extended test fixture with common utilities
 */
export const test = base.extend<{
    /** Wait for auth state to be ready */
    waitForAuth: (page: Page) => Promise<void>;
    /** Register a new test user if not exists */
    ensureTestUser: () => Promise<void>;
}>({
    waitForAuth: async ({ }, use) => {
        const waitForAuth = async (page: Page) => {
            // Wait for localStorage to have auth token (uni-app storage keys)
            await page.waitForFunction(() => {
                const storage = localStorage;
                // Check common uni-app and custom auth storage keys
                for (const key of Object.keys(storage)) {
                    if (key.includes('token') || key.includes('auth') || key.includes('Token')) {
                        const value = storage.getItem(key);
                        if (value && value.length > 10) return true;
                    }
                }
                return false;
            }, { timeout: 15000 });
        };
        await use(waitForAuth);
    },

    ensureTestUser: async ({ request }, use) => {
        const ensureTestUser = async () => {
            try {
                // Try to register test user (will fail if already exists, which is fine)
                await request.post(`${API_BASE_URL}/api/users/register`, {
                    data: {
                        email: TEST_USER.email,
                        password: TEST_USER.password,
                    },
                });
            } catch {
                // User likely already exists, continue
            }
        };
        await use(ensureTestUser);
    },
});

export { expect };

/**
 * Wait for the summary/home page to be visible
 */
export async function waitForSummaryPage(page: Page): Promise<void> {
    // Wait for navigation to summary page
    await page.waitForURL(/.*summary.*|.*\/$/, { timeout: 15000 });

    // Wait for page content to load
    await page.waitForLoadState('networkidle');
}

/**
 * Wait for login page to be visible
 */
export async function waitForLoginPage(page: Page): Promise<void> {
    await page.waitForURL(/.*login.*/, { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');
}

/**
 * Check if user is logged in by looking for auth token
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
        const token = localStorage.getItem('auth_token') ||
            localStorage.getItem('accessToken') ||
            localStorage.getItem('uni_token');
        return !!token;
    });
}

/**
 * Clear all auth state
 */
export async function clearAuthState(page: Page): Promise<void> {
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
}
