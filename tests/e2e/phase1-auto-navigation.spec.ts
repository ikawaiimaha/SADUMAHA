import { test, expect, type Page } from '@playwright/test';

// Auto-forward (opt-in) moves the presenter to the next owner's desk 3.5 s after a handoff.
// The clock is controlled so the tests do not wait in real time.

const workspace = (page: Page) => page.getByRole('combobox', { name: 'Workspace', exact: true });
const advance = (page: Page) => page.clock.runFor(4000);

async function open(page: Page) {
  await page.clock.install();
  await page.addInitScript(() => localStorage.setItem('sadu_lang', 'en'));
  await page.goto('/workbench');
  await page.getByRole('button', { name: 'Enter Institutional System', exact: true }).click();
  await page.getByRole('checkbox', { name: /Auto-forward/ }).check();
}

async function submitAutoFilledProposals(page: Page) {
  await page.getByRole('button', { name: 'Auto-fill for Demo', exact: true }).click();
  await page.getByRole('button', { name: 'Compare all three', exact: true }).click();
  await page.getByRole('button', { name: 'Submit to Biennial Director' }).click();
}

test('Phase 1 success automatically advances through Director, Chairman, Editorial and General Coordinator', async ({ page }) => {
  await open(page);
  await expect(workspace(page)).toHaveValue('PREP_COMMITTEE');
  await submitAutoFilledProposals(page);
  await expect(page.getByText('Submitted to the Biennial Director', { exact: true })).toBeVisible();
  await advance(page);
  await expect(workspace(page)).toHaveValue('BIENNIAL_DIRECTOR');

  await page.getByRole('button', { name: 'Auto-fill Notes', exact: true }).click();
  await expect(page.locator('#director-note-0')).not.toHaveValue('');
  await page.getByRole('button', { name: 'Present 3 Themes to Chairman' }).click();
  await advance(page);
  await expect(workspace(page)).toHaveValue('CHAIRMAN');

  await page.getByRole('button', { name: 'Biennial Program Decisions', exact: true }).click();
  await page.getByRole('button', { name: 'Auto-fill Executive Directives' }).click();
  const directive = 'توجيه تنفيذي خاص بدعم الأعمال التركيبية الكبرى';
  await page.locator('#chairman-directives-0').fill(directive);
  await page.getByRole('button', { name: 'Select proposal' }).first().click();
  await page.locator('#approved-budget-amount').fill('12500000');
  await page.getByRole('button', { name: 'Authorize Budget & Transfer Authority' }).click();
  await advance(page);
  await expect(workspace(page)).toHaveValue('EDITORIAL');

  await expect(page.locator('#editorial-arabic')).toBeVisible();
  await page.locator('#editorial-arabic').fill('البيان الفني المؤسسي المعتمد للخط العربي المعاصر');
  await page.getByRole('button', { name: 'Ratify Arabic Text & Route to Translation' }).click();
  await page.locator('#editorial-english').fill('Official institutional statement on contemporary Arabic calligraphy.');
  await page.getByRole('checkbox', { name: /I reviewed the English translation/ }).check();
  await page.getByRole('button', { name: 'Publish Official Theme', exact: true }).click();
  await expect(page.getByText('Theme Locked & Dispatched', { exact: true })).toBeVisible();
  await advance(page);
  await expect(workspace(page)).toHaveValue('GENERAL_COORDINATOR');
  await expect(page.locator('#exhibition-guidelines-arabic')).toBeEnabled();

  // The Chairman's ratified record stays locked and keeps the directive.
  await workspace(page).selectOption('CHAIRMAN');
  await page.getByRole('button', { name: 'Biennial Program Decisions', exact: true }).click();
  await expect(page.getByText(directive, { exact: true })).toBeVisible();
  await expect(page.locator('#approved-budget-amount')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Auto-fill Executive Directives' })).toHaveCount(0);
});

test('Director return clears queues and cancels pending Chairman navigation', async ({ page }) => {
  await open(page);
  await submitAutoFilledProposals(page);
  await advance(page);
  await expect(workspace(page)).toHaveValue('BIENNIAL_DIRECTOR');
  await page.getByRole('button', { name: 'Present 3 Themes to Chairman' }).click();
  // Return before the auto-forward fires: the pending move to the Chairman must be cancelled.
  await page.getByRole('button', { name: 'Return to Preparatory Committee' }).click();
  await advance(page);
  await expect(workspace(page)).not.toHaveValue('CHAIRMAN');
  await workspace(page).selectOption('PREP_COMMITTEE');
  await expect(page.getByRole('button', { name: 'Submit to Biennial Director' })).toBeVisible();
  await workspace(page).selectOption('CHAIRMAN');
  await page.getByRole('button', { name: 'Biennial Program Decisions', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Select proposal' })).toHaveCount(0);
  await workspace(page).selectOption('BIENNIAL_DIRECTOR');
  await expect(page.getByRole('button', { name: 'Present 3 Themes to Chairman' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Auto-fill Notes' })).toBeDisabled();
});
