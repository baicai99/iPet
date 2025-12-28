import { test, expect } from '@playwright/test';

test.describe('Mobile Viewport', () => {
    // This test will run against projects configured with mobile viewports in playwright.config.ts
    test('should adapt layout for mobile', async ({ page, isMobile }) => {
        // Skip if not mobile project
        if (!isMobile) test.skip();

        await page.goto('/login');

        // Check that there is no horizontal scrollbar
        const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const clientWidth = await page.evaluate(() => document.body.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
});
