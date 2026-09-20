import { test, expect, type Page } from '@playwright/test';
import { sampleIntakeDraft, recoverableDraft } from '../../src/data/artistIntake';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('sadu_lang', 'en'); localStorage.setItem('sadu_experience_mode', 'platform'); });
});

test('JSON import validates, confirms replacement, cancels safely and restores bilingual text', async ({ page }) => {
  await page.goto('/join');
  const name = page.getByLabel('Catalogue name · English', { exact: true });
  await name.fill('Keep this text');
  const upload = async (name: string, buffer: Buffer) => {
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Restore from file', exact: true }).click();
    await (await chooser).setFiles({ name, mimeType: 'application/json', buffer });
  };
  await upload('bad.json', Buffer.from('{"schema":1,"data":[]}'));
  await expect(page.getByText(/Import failed\./)).toBeVisible();
  await expect(name).toHaveValue('Keep this text');
  const buffer = Buffer.from(JSON.stringify({ schema: 1, data: recoverableDraft(sampleIntakeDraft()) }));
  await upload('sample.json', buffer);
  const dialog = page.getByRole('dialog', { name: 'Replace draft text?', exact: true });
  await expect(dialog).toBeVisible(); await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(name).toHaveValue('Keep this text');
  await expect(page.getByRole('button', { name: 'Restore from file', exact: true })).toBeFocused();
  await upload('sample.json', buffer);
  await dialog.getByRole('button', { name: 'Replace with imported text', exact: true }).click();
  await expect(name).toHaveValue('Sample Artist');
  await expect(page.getByLabel('Catalogue name · Arabic', { exact: true })).toHaveValue('فنان تجريبي');
  await expect(page.getByLabel('Sample contact email', { exact: true })).toHaveValue('');
  await expect(page.getByText(/Draft text restored to this session\./)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('sadu:fictional-intake:v1:DEMO-ART-001'))).toBeNull();
});

test('dirty draft requests a reload warning; opted-in text recovers after reload', async ({ page, context }) => {
  await page.goto('/join');
  await page.getByLabel('Catalogue name · English', { exact: true }).fill('Offline recovery sample');
  const prevented = await page.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true })));
  expect(prevented).toBe(true);
  await page.getByRole('button', { name: 'Enable device backup', exact: true }).click();
  await context.setOffline(true);
  await page.getByLabel('Catalogue name · Arabic', { exact: true }).fill('نص محفوظ');
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device at' })).toBeVisible();
  await context.setOffline(false);
  page.on('dialog', d => d.accept());
  await page.reload();
  await page.getByRole('button', { name: 'Restore saved text', exact: true }).click();
  await expect(page.getByLabel('Catalogue name · Arabic', { exact: true })).toHaveValue('نص محفوظ');
});

test('failed app script leaves bilingual retry outside React', async ({ page }) => {
  await page.route(/\/src\/main\.tsx|\/assets\/index-.*\.js/, route => route.abort());
  await page.goto('/join');
  await expect(page.locator('#sadu-fallback')).toBeVisible();
  await expect(page.getByRole('button', { name: /Retry/ })).toBeVisible();
  await expect(page.getByText('لم يكتمل تحميل سدو. تحقق من الاتصال ثم أعد المحاولة.')).toBeVisible();
});

test('unresolved optional font CSS does not block the application', async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', async route => {
    await new Promise(resolve => setTimeout(resolve, 8000));
    await route.abort().catch(() => {});
  });
  await page.goto('/join', { waitUntil: 'commit' });
  await expect(page.getByLabel('Catalogue name · English', { exact: true })).toBeVisible({ timeout: 6000 });
  await expect(page.locator('#sadu-fallback')).toBeHidden();
});

async function workspace(page: Page, role: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Other sample workspaces', exact: true }).click();
  await page.locator('[data-role-switcher]').click();
  await page.getByRole('button', { name: role, exact: true }).first().click();
  await page.getByRole('button', { name: 'Enter sample workspace', exact: true }).click();
}

test('RFQ printing isolates its portal and preserves the workspace after print', async ({ page }, info) => {
  await workspace(page, 'Fine Art Logistics & Freight Desk');
  await page.getByRole('button', { name: 'عربي', exact: true }).click();
  await page.getByRole('button', { name: 'إنشاء وثيقة استدراج عروض (RFQ)', exact: true }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#root')).toBeHidden();
  await expect(page.locator('#rfq-generator-modal')).toBeVisible();
  await page.pdf({ path: info.outputPath('rfq-ar.pdf'), preferCSSPageSize: true, printBackground: true });
  await page.emulateMedia({ media: null });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('textbox', { name: 'رسالة لوجستية تجريبية', exact: true })).toBeVisible();
});

test('labels print in one column at 15 cm without cropped metadata', async ({ page }, info) => {
  await workspace(page, 'Salma Al-Suwaidi');
  await page.getByRole('button', { name: 'Specialist Operations', exact: true }).click();
  await page.getByRole('button', { name: 'Editorial & Catalogue', exact: true }).click();
  await page.locator('#btn-generate-gallery-labels').click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#root')).toBeHidden();
  const label = page.locator('.gallery-label').first();
  const box = await label.boundingBox(); expect(box!.width).toBeCloseTo(15 / 2.54 * 96, 0);
  await expect(label.locator('bdi').first()).toHaveText('قطر 150 سم');
  expect(await label.evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  await page.pdf({ path: info.outputPath('labels.pdf'), preferCSSPageSize: true, printBackground: true });
  await page.emulateMedia({ media: null });
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('#btn-generate-gallery-labels')).toBeVisible();
});

test('Arabic operations print excludes preview toolbar and preserves complete KPI text', async ({ page }, info) => {
  await workspace(page, 'Salma Al-Suwaidi');
  await page.getByRole('button', { name: 'Specialist Operations', exact: true }).click();
  await page.getByRole('button', { name: 'عربي', exact: true }).click();
  await page.locator('#btn-operations-preview-report').click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#root')).toBeHidden();
  await expect(page.locator('#report-modal-title')).toBeHidden();
  for (const text of await page.locator('[data-report-overlay] .truncate').all()) {
    expect(await text.evaluate(el => getComputedStyle(el).whiteSpace)).toBe('normal');
  }
  await page.pdf({ path: info.outputPath('operations-ar.pdf'), preferCSSPageSize: true, printBackground: true });
});
