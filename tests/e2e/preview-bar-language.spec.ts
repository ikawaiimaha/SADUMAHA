import { test, expect } from '@playwright/test';

const arabic = /[؀-ۿ]/;

test('preview bar follows the chosen language and later language switches', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sadu_lang', 'en'));
  await page.goto('/');
  const bar = page.getByRole('complementary', { name: 'Preview session', exact: true });
  await expect(bar).toBeVisible();
  await expect(bar).toHaveAttribute('dir', 'ltr');
  await expect(bar.getByRole('button', { name: 'Lock preview', exact: true })).toBeVisible();
  expect(await bar.innerText()).not.toMatch(arabic);

  // The app's language provider writes <html lang>; the bar must follow it without a reload.
  await page.evaluate(() => { document.documentElement.lang = 'ar'; });
  const arBar = page.getByRole('complementary', { name: 'جلسة العرض', exact: true });
  await expect(arBar).toHaveAttribute('dir', 'rtl');
  await expect(arBar.getByRole('button', { name: 'قفل العرض', exact: true })).toBeVisible();
});

test('preview bar opens in Arabic when Arabic is saved', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sadu_lang', 'ar'));
  await page.goto('/');
  const bar = page.getByRole('complementary', { name: 'جلسة العرض', exact: true });
  await expect(bar).toHaveAttribute('dir', 'rtl');
  await expect(bar).toHaveAttribute('lang', 'ar');
  expect(await bar.innerText()).not.toMatch(/Lock preview|Preview session/);
});
