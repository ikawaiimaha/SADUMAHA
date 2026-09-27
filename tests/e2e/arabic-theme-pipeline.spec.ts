import { test, expect } from '@playwright/test';

test('Arabic-first theme handoff and verified bilingual release', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sadu_lang', 'en');
    localStorage.setItem('sadu_experience_mode', 'platform');
  });
  await page.goto('/');
  const role = (name: string) => page.getByRole('navigation').getByRole('button', { name, exact: true }).click();
  await role('Editorial');
  await expect(page.getByRole('button', { name: 'Ratify Arabic Text & Route to Translation' })).toBeDisabled();
  await role('Committee');
  for (let i = 0; i < 3; i++) {
    await page.locator('input[id*="-arabic-"]').nth(i).fill(`ثيمة عربية ${i + 1}`);
    for (const field of ['aesthetic', 'contemporary', 'curatorial']) {
      await page.locator(`textarea[id*="-${field}-"]`).nth(i).fill('بيان عربي عن جماليات الخط وعلاقته بالفنون المعاصرة');
    }
  }
  await page.getByRole('button', { name: 'Submit to Biennial Director' }).click();
  await role('Chairman');
  await expect(page.getByRole('button', { name: 'Approve Theme' })).toHaveCount(0);
  await role('Director');
  await page.locator('textarea').first().fill('مراجعة الجدوى الإدارية والفنية');
  await page.getByRole('button', { name: 'Present 3 Themes to Chairman' }).click();
  await role('Chairman');
  await expect(page.getByText('مراجعة الجدوى الإدارية والفنية', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Approve Theme' }).first().click();
  await page.getByRole('button', { name: 'Authorize Budget & Transfer Authority' }).click();
  await role('Editorial');
  await expect(page.locator('#editorial-english')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Publish Official Theme' })).toHaveCount(0);
  const arabic = 'البيان الفني المؤسسي المعتمد لاستكشاف جماليات الخط العربي المعاصر';
  await page.locator('#editorial-arabic').fill(arabic);
  await page.getByRole('button', { name: 'Ratify Arabic Text & Route to Translation' }).click();
  await expect(page.locator('#editorial-arabic')).toHaveCount(0);
  await role('Director');
  await role('Editorial');
  // The Arabic lock is local: remounting Editorial returns to Step 1.
  await expect(page.locator('#editorial-arabic')).toBeVisible();
  await expect(page.locator('#editorial-english')).toHaveCount(0);
  await role('Chairman');
  await expect(page.locator('#approved-budget-amount')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Unlock / Change Selection' })).toBeDisabled();
  await role('Editorial');
  await page.locator('#editorial-arabic').fill(arabic);
  await page.getByRole('button', { name: 'Ratify Arabic Text & Route to Translation' }).click();
  await expect(page.getByText(arabic, { exact: true })).toBeVisible();
  const publish = page.getByRole('button', { name: 'Publish Official Theme' });
  await expect(publish).toBeDisabled();
  await page.locator('#editorial-english').fill('The institutional artistic statement explores contemporary Arabic calligraphy.');
  await expect(publish).toBeDisabled();
  const verified = page.getByRole('checkbox', { name: /I reviewed the English translation/ });
  await verified.check();
  await expect(publish).toBeEnabled();
  await page.locator('#editorial-english').fill('The verified institutional statement explores the aesthetics of contemporary Arabic calligraphy.');
  await expect(verified).not.toBeChecked();
  await verified.check();
  await publish.click();
  await role('Director');
  await role('Editorial');
  await expect(page.locator('#editorial-english')).toBeDisabled();
  await expect(page.getByText('Theme Locked & Dispatched', { exact: true })).toBeVisible();
});
