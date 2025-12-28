import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test('should login successfully with admin credentials', async ({ page }) => {
        // Navigate to login page
        await page.goto('/login');

        // Fill in credentials (assuming standard selectors, adjust as needed)
        await page.fill('input[id="username"]', 'admin');
        await page.fill('input[id="password"]', 'password');

        // Submit
        await page.click('button[type="submit"]');

        // Expect to be redirected to dashboard
        await expect(page).toHaveURL('/dashboard');

        // Check for dashboard content
        await expect(page.getByText('Overview')).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[id="username"]', 'wrong');
        await page.fill('input[id="password"]', 'wrong');
        await page.click('button[type="submit"]');

        // Expect error message
        // Note: Adjust selector based on actual Auth implementation
        await expect(page.getByText('Invalid credentials')).toBeVisible();
    });
});
