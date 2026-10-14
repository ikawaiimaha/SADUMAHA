import { defineConfig } from '@playwright/test';
import { randomBytes } from 'node:crypto';

// A fresh prelaunch password per run, handed to the dev server and used by global-setup to
// unlock through the real endpoint. Never reuse a running server: it would hold another password.
process.env.SADU_PRELAUNCH_PASSWORD ??= randomBytes(24).toString('hex');

export default defineConfig({
  testDir: './tests/e2e', timeout: 60_000, workers: 1, fullyParallel: false,
  // One retry in CI only; Playwright reports a test that passes on retry as flaky, not as passed.
  retries: process.env.CI ? 1 : 0,
  // treatment-flow needs a prebuilt rehearsal bundle and runs via `npm run test:treatment:browser`.
  testIgnore: ['treatment-flow.spec.ts'],
  globalSetup: './tests/e2e/global-setup.ts',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4177', storageState: '.local/e2e/prelaunch-state.json', channel: process.env.PLAYWRIGHT_CHANNEL || undefined, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'npm run dev -- --port 4177 --strictPort', url: 'http://127.0.0.1:4177', reuseExistingServer: false, timeout: 60_000,
    env: { SADU_PRELAUNCH_PASSWORD: process.env.SADU_PRELAUNCH_PASSWORD } },
});
