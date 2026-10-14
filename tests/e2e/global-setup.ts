// Unlocks the prelaunch gate once through its real endpoint and saves the session
// cookie for every test. The password is generated per run in playwright.config.ts.
import { chromium, request, type FullConfig } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const E2E_STORAGE_STATE = '.local/e2e/prelaunch-state.json';

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL!;
  const context = await request.newContext({ baseURL });
  // The first request to a cold dev server can be slow; allow one retry with a generous timeout.
  const post = () => context.post('/api/prelaunch/unlock', {
    headers: { Origin: baseURL },
    data: { password: process.env.SADU_PRELAUNCH_PASSWORD },
    timeout: 90_000,
  });
  const unlock = await post().catch(() => post());
  if (!unlock.ok()) throw new Error(`Prelaunch unlock failed with ${unlock.status()}`);
  mkdirSync(dirname(E2E_STORAGE_STATE), { recursive: true });
  await context.storageState({ path: E2E_STORAGE_STATE });
  await context.dispose();

  // A cold Vite server optimizes dependencies on first load and reloads the page, which
  // aborts the first test's navigation. Load the app once here so tests start warm.
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL, storageState: E2E_STORAGE_STATE });
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120_000 }).catch(() => undefined);
    await page.locator('aside[lang]').first().waitFor({ timeout: 120_000 }).catch(() => undefined);
  }
  await browser.close();
}
