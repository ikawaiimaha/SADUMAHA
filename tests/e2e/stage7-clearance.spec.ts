import { test, expect } from '@playwright/test';

test.fixme(true, 'Written for the pre-redesign workbench/story flow; its controls moved or were removed. Re-author against the current UI.');

test('Stage 7 requires separate PR and Technical clearance before Finance release', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sadu_lang', 'en');
    localStorage.setItem('sadu_experience_mode', 'platform');
  });
  await page.goto('/workbench');
  await page.getByRole('button', { name: 'Enter Institutional System', exact: true }).click();
  const labels: Record<string, string> = { Committee: 'Preparatory Committee', Director: 'Biennial Director', Coordinator: 'Exhibition Coordinator' };
  const role = (name: string) => page.getByRole('combobox', { name: 'Workspace', exact: true }).selectOption({ label: labels[name] ?? name });
  await role('Coordinator');
  await page.getByRole('button', { name: /Noura Al Mazrouei/ }).click();
  await page.getByRole('button', { name: 'Generate Demo Agreement' }).click();
  await role('Artist');
  await page.getByRole('button', { name: 'Accept Demo Agreement' }).click();
  await role('Finance');
  const release = page.getByRole('button', { name: 'Release Advance Payment — simulated' });
  await expect(release).toBeDisabled();
  await expect(page.getByText('Waiting on PR and Technical clearance. Advance payment is locked.')).toBeVisible();
  await role('PR & Protocol');
  await page.getByRole('checkbox', { name: 'Passport Verification — simulated' }).check();
  await page.getByRole('checkbox', { name: 'Visa Status Cleared — simulated' }).check();
  await page.getByRole('button', { name: 'Verify Identity & Travel Documents' }).click();
  await role('Finance');
  await expect(release).toBeDisabled();
  await expect(page.getByText('Waiting on Technical clearance. Advance payment is locked.')).toBeVisible();
  await role('Technical');
  await page.getByRole('checkbox', { name: 'Approve 84 kg Floor Load Variance — simulated' }).check();
  await expect(page.getByRole('button', { name: 'Approve Structural Variance' })).toBeDisabled();
  await page.getByRole('checkbox', { name: 'Verify Mounting Bracket Specs — simulated' }).check();
  await page.getByRole('button', { name: 'Approve Structural Variance' }).click();
  await role('Finance');
  await expect(release).toBeEnabled();
  await release.click();
  await expect(page.getByText('Advance authorization recorded in the local demo only. No money transferred.')).toBeVisible();
  await role('PR & Protocol');
  await page.getByRole('checkbox', { name: 'Passport Verification — simulated' }).uncheck();
  await role('Finance');
  await expect(release).toBeDisabled();
  await expect(page.getByText('Waiting on PR clearance. Advance payment is locked.')).toBeVisible();
});
