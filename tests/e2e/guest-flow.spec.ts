import { test, expect, waitForSummaryPage, clearAuthState } from './fixtures';

test.describe('Guest Login Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Clear any existing auth state before each test
        await page.goto('/');
        await clearAuthState(page);
    });

    test('should auto-login as guest and access summary page', async ({ page }) => {
        // Intercept the guest auth API call
        const guestAuthPromise = page.waitForResponse(
            (response) => response.url().includes('/auth/guest') && (response.status() === 200 || response.status() === 201),
            { timeout: 15000 }
        );

        // Navigate to home page (this should trigger guest login)
        await page.goto('/');

        // Wait for guest auth to complete
        const guestAuthResponse = await guestAuthPromise;
        expect(guestAuthResponse.ok()).toBeTruthy();

        // Verify the response contains an access token
        const responseBody = await guestAuthResponse.json();
        expect(responseBody).toHaveProperty('accessToken');

        // Wait for summary page to load
        await waitForSummaryPage(page);

        // Verify we're on the summary page
        await expect(page).toHaveURL(/.*summary.*|.*\/$/);
    });

    test('should have valid auth token stored after guest login', async ({ page, waitForAuth }) => {
        // Intercept guest auth
        const guestAuthPromise = page.waitForResponse(
            (response) => response.url().includes('/auth/guest'),
            { timeout: 15000 }
        );

        // Navigate to home
        await page.goto('/');

        // Wait for guest auth response
        await guestAuthPromise;

        // Give time for token to be stored
        await page.waitForTimeout(2000);

        // Verify token is stored in localStorage
        const hasToken = await page.evaluate(() => {
            for (const key of Object.keys(localStorage)) {
                if (key.includes('token') || key.includes('auth') || key.includes('Token')) {
                    const value = localStorage.getItem(key);
                    if (value && value.length > 10) return true;
                }
            }
            return false;
        });

        expect(hasToken).toBeTruthy();
    });
});
