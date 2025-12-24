import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for iPet E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './tests/e2e',

    /* Run tests in files in parallel */
    fullyParallel: true,

    /* Fail the build on CI if you accidentally left test.only in the source code */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Opt out of parallel tests on CI for stability */
    workers: process.env.CI ? 1 : undefined,

    /* Reporter to use */
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['list']
    ],

    /* Shared settings for all the projects below */
    use: {
        /* Base URL for navigation */
        baseURL: process.env.BASE_URL || 'http://localhost:5173',

        /* Collect trace on first retry */
        trace: 'on-first-retry',

        /* Capture screenshot on failure */
        screenshot: 'only-on-failure',

        /* Video recording on failure */
        video: 'retain-on-failure',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        // Uncomment to add more browsers
        // {
        //   name: 'firefox',
        //   use: { ...devices['Desktop Firefox'] },
        // },
        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'] },
        // },
    ],

    /* Output folder for test artifacts */
    outputDir: 'test-results/',

    /* Global timeout for each test */
    timeout: 30000,

    /* Expect timeout */
    expect: {
        timeout: 10000
    },

    /* Run your local dev server before starting the tests */
    // Disabled for CI - servers are started separately
    // webServer: [
    //   {
    //     command: 'cd iPet-BackEnd && npm run start:dev',
    //     url: 'http://127.0.0.1:3000/api/infra/health',
    //     reuseExistingServer: !process.env.CI,
    //     timeout: 120000,
    //   },
    //   {
    //     command: 'cd iPet-uniapp && npm run dev:h5',
    //     url: 'http://127.0.0.1:5173',
    //     reuseExistingServer: !process.env.CI,
    //     timeout: 60000,
    //   },
    // ],
});
