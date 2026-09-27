import { test, expect } from '@playwright/test';

test('Phase 1 success automatically advances through Director, Chairman, Editorial and HIP', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sadu_lang', 'en');
    localStorage.setItem('sadu_experience_mode', 'platform');
  });
  await page.goto('/');
  await page.getByRole('navigation').getByRole('button', { name: 'Committee', exact: true }).click();
  await page.getByRole('button', { name: 'Auto-fill for Demo', exact: true }).click();
  const names = [['الميزان', 'Al Mizan - Balance'], ['النقطة', 'Al Nuqta - The Dot'], ['تجليات', 'Tajliyat - Manifestations']];
  for (let i = 0; i < names.length; i++) {
    await expect(page.locator('input[id*="-arabic-"]').nth(i)).toHaveValue(names[i][0]);
    await expect(page.locator('input[id*="-english-"]').nth(i)).toHaveValue(names[i][1]);
  }
  await expect(page.locator('textarea[id*="-aesthetic-"]').first()).toHaveValue('استكشاف التوازن البصري والروحي في التكوينات الهندسية للخط العربي.');
  await page.getByRole('button', { name: 'Submit to Biennial Director' }).click();
  await expect(page.getByText('Submitted to the Biennial Director', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Auto-fill Notes', exact: true }).click();
  await expect(page.locator('textarea').first()).toHaveValue('مفهوم قوي يتوافق مع رؤية الدائرة، نوصي بالتركيز على الجانب المعماري في المبررات لتسهيل التخصيص المالي.');
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
  await page.clock.runFor(4000);
  await expect(page.locator('input[id*="-arabic-"]').first()).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Submit to Biennial Director' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Present 3 Themes to Chairman' })).toHaveCount(0);
});

test('Director return clears queues and cancels pending Chairman navigation', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sadu_lang', 'en');
    localStorage.setItem('sadu_experience_mode', 'platform');
  });
  await page.clock.install();
  await page.goto('/');
  const role = (name: string) => page.getByRole('navigation').getByRole('button', { name, exact: true }).click();
  await role('Committee');
  await page.getByRole('button', { name: 'Auto-fill for Demo' }).click();
  await page.getByRole('button', { name: 'Submit to Biennial Director' }).click();
  await role('Director');
  await page.getByRole('button', { name: 'Present 3 Themes to Chairman' }).click();
  await page.getByRole('button', { name: 'Return to Preparatory Committee' }).click();
  await page.clock.runFor(4000);
  await expect(page.getByRole('button', { name: 'Auto-fill for Demo' })).toBeVisible();
  await role('Chairman');
  await expect(page.getByRole('button', { name: 'Approve Theme' })).toHaveCount(0);
  await role('Director');
  await expect(page.locator('textarea')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Present 3 Themes to Chairman' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Auto-fill Notes' })).toBeDisabled();
});
