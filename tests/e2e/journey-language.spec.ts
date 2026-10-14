import { test, expect, type Page } from '@playwright/test';

const noHorizontalOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('guided journey opens in Arabic RTL and switches language with the preview bar', async ({ page }, info) => {
  await page.goto('/');
  const root = page.locator('div[lang]').filter({ has: page.locator('#journey-task') });
  await expect(root).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { level: 1, name: 'نورة المزروعي' })).toBeVisible();
  await expect(page.locator('#task-heading')).toHaveText('تسجيل موجز المعرض');
  await expect(page.getByRole('complementary', { name: 'جلسة العرض', exact: true })).toHaveAttribute('dir', 'rtl');
  expect(await noHorizontalOverflow(page)).toBe(true);
  await page.screenshot({ path: info.outputPath('journey-ar.png'), fullPage: false });

  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(root).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('#task-heading')).toHaveText('Record the exhibition brief');
  await expect(page.getByRole('complementary', { name: 'Preview session', exact: true })).toHaveAttribute('dir', 'ltr');
  await expect(page).toHaveTitle('SADU — Fictional artist journey');
  expect(await noHorizontalOverflow(page)).toBe(true);
  await page.screenshot({ path: info.outputPath('journey-en.png'), fullPage: false });

  await page.reload();
  await expect(page.locator('#task-heading')).toHaveText('Record the exhibition brief');
});
