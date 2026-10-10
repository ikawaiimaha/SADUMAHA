import { defineConfig } from '@playwright/test';

// A separate synthetic, loopback-only server/store is created for each test.
export default defineConfig({
  testDir: './tests/e2e', testMatch: 'treatment-flow.spec.ts',
  timeout: 120_000, workers: 1, fullyParallel: false,
  outputDir: '.local/treatment-browser-results',
  reporter: [['list']],
  use: { actionTimeout: 10_000, trace: 'retain-on-failure', screenshot: 'only-on-failure', timezoneId: 'Asia/Dubai' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
