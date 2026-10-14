import { test, expect } from '@playwright/test';

// Loading resilience for the live entry page. Draft-import, RFQ, label and operations-print
// checks were removed with the unreachable intake and legacy workspace components.

test('failed app script leaves bilingual retry outside React', async ({ page }) => {
  await page.route(/\/src\/main\.tsx|\/assets\/index-.*\.js/, route => route.abort());
  await page.goto('/');
  await expect(page.locator('#sadu-fallback')).toBeVisible();
  await expect(page.getByRole('button', { name: /Retry/ })).toBeVisible();
  await expect(page.getByText('لم يكتمل تحميل سدو. تحقق من الاتصال ثم أعد المحاولة.')).toBeVisible();
});

test('unresolved optional font CSS does not block the application', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sadu_lang', 'en'));
  await page.route('https://fonts.googleapis.com/**', async route => {
    await new Promise(resolve => setTimeout(resolve, 8000));
    await route.abort().catch(() => {});
  });
  await page.goto('/', { waitUntil: 'commit' });
  await expect(page.locator('#task-heading')).toBeVisible({ timeout: 6000 });
  await expect(page.locator('#sadu-fallback')).toBeHidden();
});
