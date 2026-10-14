import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import express from 'express';
import { chromium, expect } from '@playwright/test';
import { applyLedger, ledgerSeed, restoreLedger } from '../src/lib/spatialLedger.ts';

// The browser sandbox and authoritative HTTP route are separate. This exercises
// the real dashboard and session journal; committeeRecommendation.test.mjs covers HTTP persistence.
const output = resolve('.local', `committee-browser-${Date.now()}`);
await mkdir(output, { recursive: true });
await build({ configFile: false, envDir: false, publicDir: false, plugins: [react(), tailwindcss()],
  build: { outDir: resolve(output, 'build'), emptyOutDir: false, rollupOptions: { input: resolve('tests/fixtures/committee-preview.html') } },
});
const app = express(); app.use(express.static(resolve(output, 'build')));
const server = app.listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const results = [];
function legacyJournal() {
  let state = ledgerSeed(); const events = [];
  const act = (role, command, id = `sandbox-${role}`) => {
    const event = { actor: { id, role, exhibitionId: 'sandbox' }, command: { ...command, expected: state.version }, themeApprovalId: 'SYNTHETIC-THEME', at: '2026-10-10T12:00:00Z' };
    state = applyLedger(state, event.actor, event.command, event.themeApprovalId, event.at, true);
    events.push(event);
  };
  act('Director', { action: 'AUTHORIZE_BLOCK' });
  act('General_Exhibition_Coordinator', { action: 'CURATE_CREATE_SLOTS', id: 'brief', galleryId: 'gallery-a', quantity: 1, areaM2: 10, budgetMinor: 100000, coordinatorId: 'coordinator-a', brief: 'SYNTHETIC calligraphy proposal for browser verification.' });
  act('Exhibition_Coordinator', { action: 'CURATE_PROPOSE', id: 'proposal', slotId: 'brief:1', artistId: 'case-mounir-fatmi', areaM2: 8, costMinor: 80000, fit: 'SYNTHETIC concept with sufficient scope for review.', evidence: 'SYNTHETIC-BROWSER-EVIDENCE' }, 'coordinator-a');
  act('General_Exhibition_Coordinator', { action: 'CURATE_SHORTLIST', id: 'proposal', revision: 1 });
  act('General_Exhibition_Coordinator', { action: 'CURATE_LOCK', id: 'browser-board' });
  act('Committee', { action: 'CURATE_COMMITTEE_APPROVE', id: 'proposal', revision: 1 });
  return { format: 1, events };
}
try {
  browser = await chromium.launch();
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    for (const language of ['en', 'ar']) {
      const context = await browser.newContext({ viewport });
      context.setDefaultTimeout(10_000);
      let page; const errors = [], external = [];
      try {
        page = await context.newPage();
        page.on('pageerror', e => errors.push(e.message));
        await context.route('**/*', route => {
          const url = route.request().url();
          if (url.startsWith(origin) || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
          external.push(url); return route.abort();
        });
        await page.addInitScript(({ language, journal }) => {
          if (!sessionStorage.getItem('committee-check-initialized')) {
            localStorage.setItem('sadu_lang', language);
            sessionStorage.setItem('sadu-executive-sandbox-role', 'Committee');
            sessionStorage.setItem('sadu-spatial-ledger-v1', JSON.stringify(journal));
            sessionStorage.setItem('committee-check-initialized', 'true');
          }
        }, { language, journal: legacyJournal() });
        await page.goto(origin + '/tests/fixtures/committee-preview.html');
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await expect(page.locator('html')).toHaveAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
        await page.getByRole('button', { name: 'Spaces & allocations', exact: true }).click();
        await page.getByRole('button', { name: 'Defense board', exact: true }).click();
        const minute = page.getByLabel(language === 'ar' ? 'محضر التوصية' : 'Recommendation minute', { exact: true });
        const record = page.getByRole('button', { name: language === 'ar' ? 'تسجيل التوصية لمدير الملتقى' : 'Record recommendation for Director', exact: true });
        const endorse = () => page.getByRole('button', { name: language === 'ar' ? 'اعتماد القائمة وإقفالها' : 'Endorse & lock roster', exact: true });
        await expect(minute).toBeVisible(); await expect(record).toBeDisabled();
        await minute.fill('abc'); await expect(record).toBeDisabled();
        await page.locator('#sandbox-role').selectOption('Director');
        await expect(endorse()).toBeDisabled();
        await expect(page.locator('#endorse-needs-minutes')).toBeVisible();
        await page.locator('#sandbox-role').selectOption('Committee');
        const text = language === 'ar' ? 'توصية تجريبية: إحالة هذا المقترح إلى مدير الملتقى.' : 'SYNTHETIC minute: recommend this proposal to the Director.';
        await minute.fill(text); await expect(record).toBeEnabled(); await record.click();
        await expect(page.getByRole('status').filter({ hasText: language === 'ar' ? 'سُجّل محضر التوصية' : 'Recommendation minute recorded.' })).toBeVisible();
        let journal = await page.evaluate(() => JSON.parse(sessionStorage.getItem('sadu-spatial-ledger-v1')));
        let ledger = restoreLedger(journal.events);
        assert.equal(ledger.curation.nominations[0].status, 'COMMITTEE_APPROVED');
        assert.equal(ledger.artworks[0].state, 'UNASSIGNED');
        assert.equal(ledger.curation.recommendations[0].minute, text);
        await page.screenshot({ path: resolve(output, `committee-${viewport.width}-${language}.png`), fullPage: true });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal page overflow');
        await page.locator('#sandbox-role').selectOption('Director');
        await expect(endorse()).toBeEnabled(); await endorse().click();
        journal = await page.evaluate(() => JSON.parse(sessionStorage.getItem('sadu-spatial-ledger-v1')));
        ledger = restoreLedger(journal.events);
        assert.equal(ledger.curation.phase, 'ENDORSED');
        assert.equal(journal.events.filter(e => e.command.action === 'CURATE_COMMITTEE_APPROVE').length, 1);
        assert.equal(ledger.curation.recommendations.length, 1);
        await page.reload();
        await page.getByRole('button', { name: 'Spaces & allocations', exact: true }).click();
        await page.getByRole('button', { name: 'Defense board', exact: true }).click();
        await expect(page.getByText(text, { exact: true })).toBeVisible();
        await page.getByRole('button', { name: language === 'ar' ? 'English' : 'العربية', exact: true }).click();
        await expect(page.locator('html')).toHaveAttribute('dir', language === 'ar' ? 'ltr' : 'rtl');
        assert.deepEqual(errors, []); assert.deepEqual(external, []);
        results.push({ width: viewport.width, language, passed: true });
        console.log(`PASS Committee browser: ${viewport.width}px ${language}`);
      } catch (error) {
        if (page) {
          await page.screenshot({ path: resolve(output, `failed-${viewport.width}-${language}.png`), fullPage: true });
          await writeFile(resolve(output, `failed-${viewport.width}-${language}.json`), JSON.stringify({ errors, external, text: await page.locator('body').innerText() }, null, 2));
        }
        console.error(`Failure evidence: ${output}`);
        throw error;
      } finally { await context.close(); }
    }
  }
  await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`Passed ${results.length} browser cases. Evidence: ${output}`);
} finally { await browser?.close(); await new Promise(r => server.close(r)); }
