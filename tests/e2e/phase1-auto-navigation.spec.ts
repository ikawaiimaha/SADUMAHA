import { test, expect } from '@playwright/test';

test('Phase 1 success automatically advances through Director, Chairman, Editorial and HIP', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sadu_lang', 'en');
    localStorage.setItem('sadu_experience_mode', 'platform');
  });
  await page.goto('/');
  await page.getByRole('navigation').getByRole('button', { name: 'Committee', exact: true }).click();
  for (let i = 0; i < 3; i++) {
    await page.locator('input[id*="-arabic-"]').nth(i).fill(`ثيمة عربية ${i + 1}`);
    for (const field of ['aesthetic', 'contemporary', 'curatorial']) {
      await page.locator(`textarea[id*="-${field}-"]`).nth(i).fill('بيان عربي عن جماليات الخط والفنون المعاصرة');
    }
  }
  await page.getByRole('button', { name: 'Submit to Biennial Director' }).click();
  await expect(page.getByText('Submitted to the Biennial Director', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Present 3 Themes to Chairman' }).click();
  await page.getByRole('button', { name: 'Approve Theme' }).first().click();
  await page.getByRole('button', { name: 'Authorize Budget & Transfer Authority' }).click();
  await expect(page.locator('#editorial-arabic')).toBeVisible();
  await page.getByRole('button', { name: 'Ratify Arabic Text & Route to Translation' }).click();
  await page.locator('#editorial-english').fill('Official institutional statement on contemporary Arabic calligraphy.');
  await page.getByRole('checkbox', { name: /I reviewed the English translation/ }).check();
  await page.getByRole('button', { name: 'Publish Official Theme', exact: true }).click();
  await expect(page.getByText('Theme Locked & Dispatched', { exact: true })).toBeVisible();
  await expect(page.locator('#exhibition-guidelines-arabic')).toBeEnabled();
});

test('starting a new proposal set cancels pending auto-navigation', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sadu_lang', 'en');
    localStorage.setItem('sadu_experience_mode', 'platform');
  });
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('navigation').getByRole('button', { name: 'Committee', exact: true }).click();
  for (let i = 0; i < 3; i++) {
    await page.locator('input[id*="-arabic-"]').nth(i).fill(`ثيمة عربية ${i + 1}`);
    for (const field of ['aesthetic', 'contemporary', 'curatorial']) {
      await page.locator(`textarea[id*="-${field}-"]`).nth(i).fill('بيان عربي عن جماليات الخط والفنون المعاصرة');
    }
  }
  await page.getByRole('button', { name: 'Submit to Biennial Director' }).click();
  await page.getByRole('button', { name: 'Start New Proposal Set' }).click();
  await page.clock.runFor(2000);
  await expect(page.locator('input[id*="-arabic-"]').first()).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Submit to Biennial Director' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Present 3 Themes to Chairman' })).toHaveCount(0);
});
