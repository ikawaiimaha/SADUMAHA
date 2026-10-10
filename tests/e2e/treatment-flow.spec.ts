import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Server } from 'node:http';
import { jsPDF } from 'jspdf';
import { createConnectedPilot, PILOT_ARTWORK } from '../../server/connected-pilot.mjs';
import { createPrelaunchGate } from '../../server/prelaunch-gate.mjs';
import { randomUUID } from 'node:crypto';

const operationsPath = `/api/review/pilot/operations/${PILOT_ARTWORK}`;
const pdf = () => { const doc = new jsPDF(); doc.text('SYNTHETIC trial permission. Not institutional consent.', 15, 25); return Buffer.from(doc.output('arraybuffer')); };
const recordTitle = 'Heavier Than Words — synthetic browser test';

test('conditional treatment: real uploads, role handoffs, amendment and restart', async ({ browser }, info) => {
  const directory = await mkdtemp(resolve('.local/treatment-browser-run-'));
  const password = randomUUID();
  const options = { directory, uiDirectory: resolve('rehearsal/.local/treatment-browser-build'), gate: createPrelaunchGate({ password }), now: () => new Date('2026-10-10T10:00:00Z') };
  let runtime = await createConnectedPilot(options), server: Server, origin = '';
  const contexts: BrowserContext[] = [], errors: string[] = [], external: string[] = [];
  const listen = async (port = 0) => {
    server = runtime.app.listen(port, '127.0.0.1');
    await new Promise<void>(r => server.once('listening', r));
    origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  };
  await listen();
  const actorPage = async (role: string) => {
    const context = await browser.newContext({ ...info.project.use }); contexts.push(context);
    context.setDefaultTimeout(10_000);
    const unlock = await context.request.post(origin + '/api/prelaunch/unlock', { headers: { Origin: origin }, data: { password } });
    expect(unlock.ok()).toBeTruthy();
    await context.route('**/*', route => {
      const url = route.request().url();
      if (url.startsWith(origin) || url.startsWith('blob:') || url.startsWith('data:')) return route.continue();
      external.push(url); return route.abort();
    });
    const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.goto(origin + '/connected-pilot');
    await page.getByLabel('الدور التجريبي').selectOption('pilot-' + role);
    await page.getByRole('button', { name: 'English', exact: true }).click();
    // All operational roles should land directly on their task queue.
    await expect(page.getByRole('button', { name: 'My tasks', exact: true })).toHaveAttribute('aria-pressed', 'true');
    return page;
  };
  const view = async (page: Page) => { const response = await page.request.get(origin + operationsPath); expect(response.ok()).toBeTruthy(); return response.json(); };
  const task = async (page: Page, title: string) => {
    const picker = page.getByRole('combobox', { name: /^Task$/ });
    if (await picker.isVisible()) {
      const option = picker.locator('option').filter({ hasText: title });
      await expect(option).toHaveCount(1); await picker.selectOption(await option.getAttribute('value') as string);
    } else {
      const buttons = page.locator('.work-task-list').getByRole('button').filter({ hasText: title });
      for (const status of ['For you', 'Waiting', 'Done']) {
        if (await buttons.count()) break;
        await page.getByRole('navigation', { name: 'Task filters' }).getByRole('button', { name: new RegExp(status) }).click();
      }
      await buttons.click();
    }
    await expect(page.locator('.work-task-header h3')).toHaveText(title);
  };
  const act = (page: Page) => page.getByRole('region', { name: 'Decision and next action' });
  const actionPane = async (page: Page) => { const button = page.getByRole('navigation', { name: 'Action and evidence' }).getByRole('button', { name: 'Action', exact: true }); if (await button.isVisible()) await button.click(); };
  const inspect = async (page: Page, photo: boolean) => {
    const button = page.getByRole('button', { name: 'View evidence', exact: true });
    if (await button.isVisible()) await button.click();
    const preview = page.locator('.evidence-inline');
    if (photo) await expect(preview.locator('img')).toBeVisible();
    else await expect(preview.locator('canvas')).toBeVisible();
    await expect(preview.getByRole('status')).toHaveCount(0);
    await actionPane(page);
  };
  /** Exactly one blocker, with the expected text, that wraps inside its box instead of overflowing. */
  const expectBlocker = async (page: Page, text: RegExp) => {
    const blocker = act(page).getByTestId('task-blocker');
    await expect(act(page).locator('.work-blocker')).toHaveCount(1);
    await expect(blocker).toHaveCount(1); await expect(blocker).toHaveText(text);
    await expect(blocker).toBeVisible();
    expect(await blocker.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  };
  /** First screen (scrolled to top): role + synthetic-demo label, selected task heading, blocker and evidence access are all in view. */
  const expectFirstScreen = async (page: Page, language: 'ar' | 'en' = 'en') => {
    const phone = (page.viewportSize()?.width ?? 1440) <= 720;
    await page.evaluate(() => window.scrollTo(0, 0));
    const summary = page.getByTestId('role-summary');
    await expect(summary).toBeInViewport({ ratio: 1 });
    await expect(summary).toContainText(language === 'ar' ? 'عرض تجريبي' : 'Synthetic demo');
    await expect(summary).toContainText(language === 'ar' ? 'المنسقة' : 'General Exhibition Coordinator');
    await expect(page.locator('.work-task-header h3')).toBeInViewport({ ratio: 1 });
    await expect(page.getByTestId('task-blocker')).toBeInViewport({ ratio: 1 });
    if (!phone) return;
    // On a phone the simulation select is collapsed, evidence is one tap away, and the header stays compact.
    const roleSelect = page.getByLabel(language === 'ar' ? 'الدور التجريبي' : 'Simulation role');
    await expect(roleSelect).toBeHidden();
    await expect(page.getByRole('button', { name: language === 'ar' ? 'عرض الدليل' : 'View evidence', exact: true })).toBeInViewport({ ratio: 1 });
    expect((await page.locator('.connected-header').boundingBox())!.height).toBeLessThan(110);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: info.outputPath(`first-screen-${language}.png`) });
    // The disclosure remains operable by keyboard, not just touch.
    await summary.focus(); await summary.press('Enter'); await expect(roleSelect).toBeVisible();
    await summary.press('Enter'); await expect(roleSelect).toBeHidden();
  };
  const upload = async (page: Page, name: string, bytes: Buffer, mimeType: string) => {
    await act(page).locator('input[type=file]').setInputFiles({ name, mimeType, buffer: bytes });
    await act(page).getByLabel('Source reference', { exact: true }).fill('SYNTHETIC-BROWSER-SOURCE');
    await act(page).getByLabel('Sender', { exact: true }).fill('Synthetic studio');
    await act(page).getByRole('button', { name: 'Upload and review', exact: true }).click();
    await expect(act(page).getByLabel('File under review')).toBeVisible();
    await inspect(page, mimeType.startsWith('image/'));
  };
  const cleared = async (page: Page, title: string) => {
    await task(page, title);
    await act(page).getByRole('checkbox').check();
    await act(page).getByRole('button', { name: 'Record requirement as cleared', exact: true }).click();
    await expect(act(page).getByRole('button', { name: 'Record requirement as cleared', exact: true })).toHaveCount(0);
  };
  try {
    const gc = await actorPage('General_Exhibition_Coordinator');
    await task(gc, 'Record the conditional treatment');
    await act(gc).getByLabel('Artwork', { exact: true }).fill(recordTitle);
    await act(gc).getByLabel('Exact treatment (one-letter trial first)', { exact: true }).fill('Transparent coating on one letter; photograph before batch work.');
    await act(gc).getByLabel('Source reference', { exact: true }).fill('SYNTHETIC-LAURA-EMAIL');
    await act(gc).getByLabel('Named decision-maker', { exact: true }).fill('Synthetic studio representative');
    await act(gc).getByLabel('Capacity', { exact: true }).fill('Artist representative — synthetic');
    await act(gc).getByRole('combobox', { name: /^Category/ }).first().selectOption('VENUE');
    await act(gc).getByLabel('Condition', { exact: true }).fill('Ventilation checked.');
    for (const [domain, text] of [['ENGINEERING', 'Compatible coating.'], ['FINANCIAL', 'Approved cost.']]) {
      await act(gc).getByRole('button', { name: 'Add a condition', exact: true }).click();
      await act(gc).getByRole('combobox', { name: /^Category/ }).last().selectOption(domain);
      await act(gc).getByLabel('Condition', { exact: true }).last().fill(text);
    }
    await act(gc).getByRole('button', { name: 'Save the conditional treatment', exact: true }).click();
    await expect.poll(async () => (await view(gc)).treatment.current?.revision).toBe(1);
    // Before authorization the trial step shows one blocker (what is missing, who acts) and none of its future forms.
    await task(gc, 'One-letter trial and photograph');
    await expectBlocker(gc, /^Missing: authorization of this revision — General Exhibition Coordinator must record it\.$/);
    await expectFirstScreen(gc);
    await gc.getByRole('button', { name: 'العربية', exact: true }).click();
    await expectFirstScreen(gc, 'ar');
    await gc.getByRole('button', { name: 'English', exact: true }).click();
    await expect(act(gc).locator('input[type=file]')).toHaveCount(0);
    await expect(act(gc).getByRole('button', { name: 'Upload and review', exact: true })).toHaveCount(0);
    await expect(act(gc).getByLabel('Eligible owner')).toHaveCount(0);
    await expect(act(gc).getByRole('button', { name: 'Owner and deadline', exact: true })).toHaveCount(0);
    await task(gc, 'Record one-letter trial authorization');
    await upload(gc, 'synthetic-permission.pdf', pdf(), 'application/pdf');
    await act(gc).getByLabel('Permission reference', { exact: true }).fill('SYNTHETIC-PERMISSION-1');
    const authorize = act(gc).getByRole('button', { name: 'Record external permission', exact: true });
    await expect(authorize).toBeDisabled(); await act(gc).getByRole('checkbox').check(); await authorize.click();
    await expect.poll(async () => (await view(gc)).treatment.authorizations.length).toBe(1);
    await task(gc, 'One-letter trial and photograph');
    await act(gc).getByLabel('Eligible owner').selectOption('pilot-Technical');
    await act(gc).getByLabel('Deadline in your device timezone').fill('2026-10-12T12:00');
    await act(gc).getByLabel('Reason for assignment or change').fill('Synthetic trial handoff');
    await act(gc).getByRole('button', { name: 'Save owner and deadline' }).click();

    const tech = await actorPage('Technical');
    await task(tech, 'One-letter trial and photograph');
    await expect(act(tech).locator('input[type=file]')).toHaveCount(0);
    await expectBlocker(tech, /^Missing: acceptance of the task — Technical must accept it\.$/);
    await act(tech).getByRole('button', { name: 'Accept task', exact: true }).click();
    await expect(act(tech).getByTestId('task-blocker')).toHaveCount(0);
    await expect(act(tech).locator('input[type=file]')).toBeVisible();
    const artist = await actorPage('Artist');
    await task(artist, 'Artist review of the trial photograph');
    await expectBlocker(artist, /^Missing: the trial photograph — Technical must upload it\.$/);
    await expect(act(artist).locator('input[type=file]')).toHaveCount(0);
    await act(tech).locator('input[type=file]').setInputFiles({ name: 'wrong.pdf', mimeType: 'application/pdf', buffer: pdf() });
    await expect(act(tech).getByRole('alert')).toContainText('supported file');
    await expect(act(tech).getByRole('button', { name: 'Upload and review', exact: true })).toBeDisabled();
    // A visible synthetic image, created in the browser; no private photograph is used.
    const photo = Buffer.from(await tech.evaluate(() => { const c = document.createElement('canvas'); c.width = 800; c.height = 500; const x = c.getContext('2d')!; x.fillStyle = '#eee4d5'; x.fillRect(0, 0, 800, 500); x.fillStyle = '#8b4513'; x.font = '120px serif'; x.fillText('ب', 360, 260); x.font = '28px sans-serif'; x.fillText('SYNTHETIC ONE-LETTER SAMPLE', 125, 390); return c.toDataURL('image/png').split(',')[1]; }), 'base64');
    await upload(tech, 'synthetic-letter.png', photo, 'image/png');
    const submitTrial = act(tech).getByRole('button', { name: 'Submit the trial for artist review' });
    await expect(submitTrial).toBeDisabled(); await act(tech).getByRole('checkbox').check(); await submitTrial.click();
    await expect.poll(async () => (await view(tech)).treatment.trials.length).toBe(1);

    await artist.reload(); await artist.getByRole('button', { name: 'English', exact: true }).click();
    await expect(artist.getByRole('heading', { name: recordTitle, exact: true })).toBeVisible();
    await task(artist, 'Artist review of the trial photograph'); await inspect(artist, true);
    const trial = (await view(artist)).treatment.trials.at(-1);
    const fetched = await artist.request.get(origin + operationsPath + '/evidence/' + trial.evidenceId);
    expect(await fetched.body()).toEqual(photo);
    await expect(act(artist).getByTestId('task-blocker')).toHaveCount(0);
    // Desktop keeps the photograph beside the decision; mobile reaches it through the "View evidence" tab.
    const panes = artist.getByRole('navigation', { name: 'Action and evidence' });
    if (await panes.isVisible()) await expect(panes.getByRole('button', { name: 'View evidence', exact: true })).toBeVisible();
    else {
      const [side, decision] = await Promise.all([artist.locator('.work-evidence').boundingBox(), act(artist).boundingBox()]);
      expect(side && decision && Math.abs(side.x - decision.x) > 100 && side.y < decision.y + decision.height && decision.y < side.y + side.height).toBe(true);
    }
    await artist.screenshot({ path: info.outputPath('artist-review.png'), fullPage: true });
    await artist.getByRole('button', { name: 'العربية', exact: true }).click();
    const evidenceTab = artist.getByRole('button', { name: 'عرض الدليل', exact: true });
    if (await evidenceTab.isVisible()) await evidenceTab.click();
    await expect(artist.getByRole('img', { name: 'صورة الدليل: synthetic-letter.png', exact: true })).toBeVisible();
    await expect(artist.locator('html')).toHaveAttribute('dir', 'rtl');
    expect(await artist.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await artist.screenshot({ path: info.outputPath('artist-evidence-arabic.png'), fullPage: true });
    await artist.getByRole('button', { name: 'English', exact: true }).click(); await actionPane(artist);
    await act(artist).getByRole('combobox', { name: /^Decision/ }).selectOption('APPROVE');
    const approve = act(artist).getByRole('button', { name: 'Save the artist’s decision' });
    await expect(approve).toBeDisabled(); await act(artist).getByRole('checkbox').check(); await approve.click();
    await expect.poll(async () => (await view(artist)).treatment.trials.at(-1).decision?.decision).toBe('APPROVE');
    expect((await view(tech)).treatment.batch.allowed).toBe(false);
    await tech.reload(); await tech.getByRole('button', { name: 'English', exact: true }).click();
    await task(tech, 'Record batch completion'); await expect(act(tech).locator('input[type=file]')).toHaveCount(0);
    // The artist's approval alone does not unlock batch work: the blocker names the next missing clearance and its owner.
    await expectBlocker(tech, /^Missing: venue clearance — Museum Operations must clear it\.$/);
    await expect(act(tech).getByRole('button', { name: 'Record completion', exact: true })).toHaveCount(0);
    const showEvidence = tech.getByRole('button', { name: 'View evidence', exact: true });
    if (await showEvidence.isVisible()) await showEvidence.click();
    const record = tech.locator('.work-evidence > details.work-spec');
    await expect(record).not.toHaveAttribute('open', '');
    await record.locator(':scope > summary').click();
    await expect(record.getByRole('heading', { name: 'Conditions', exact: true })).toBeVisible();
    await expect(record.getByText('Ventilation checked.')).toBeVisible();
    await record.locator(':scope > summary').click();
    await actionPane(tech);
    await tech.getByRole('button', { name: 'العربية', exact: true }).click();
    const arabicBlocker = tech.getByTestId('task-blocker');
    await expect(arabicBlocker).toHaveText('الناقص: مراجعة الموقع — المطلوب من إدارة المتحف.');
    await expect(arabicBlocker).toBeVisible();
    expect(await arabicBlocker.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    expect(await tech.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await tech.screenshot({ path: info.outputPath('batch-blocker-arabic.png'), fullPage: true });
    await tech.getByRole('button', { name: 'English', exact: true }).click();
    await cleared(tech, 'Clear the engineering requirement');
    const museum = await actorPage('Museum_Operations'); await cleared(museum, 'Clear the venue requirement');
    const finance = await actorPage('Finance'); await cleared(finance, 'Clear the financial requirement');
    expect((await view(tech)).treatment.batch.allowed).toBe(true);

    // A method-only amendment must retain history but renew permission and trial approval.
    await gc.reload(); await gc.getByRole('button', { name: 'English', exact: true }).click();
    await gc.getByText('Amend or hand over', { exact: true }).click();
    await gc.getByRole('button', { name: 'Revise the treatment', exact: true }).click();
    await act(gc).getByLabel('Exact treatment (one-letter trial first)', { exact: true }).fill('Revised trial: apply a thinner transparent coating to one letter.');
    await act(gc).getByRole('button', { name: 'Save a new treatment revision' }).click();
    await expect.poll(async () => (await view(gc)).treatment.current.revision).toBe(2);
    const amended = (await view(gc)).treatment;
    expect(amended.batch.allowed).toBe(false); expect(amended.checks).toHaveLength(3);
    expect(amended.authorizations).toHaveLength(1); expect(amended.trials).toHaveLength(1);
    expect(amended.trials[0].decision.decision).toBe('APPROVE');
    await task(gc, 'Record one-letter trial authorization');
    await upload(gc, 'synthetic-permission-r2.pdf', pdf(), 'application/pdf');
    await act(gc).getByLabel('Permission reference', { exact: true }).fill('SYNTHETIC-PERMISSION-2');
    await act(gc).getByRole('checkbox').check();
    await act(gc).getByRole('button', { name: 'Record external permission', exact: true }).click();
    await expect.poll(async () => (await view(gc)).treatment.authorizations.length).toBe(2);
    await tech.reload(); await tech.getByRole('button', { name: 'English', exact: true }).click();
    await task(tech, 'One-letter trial and photograph');
    const revisedPhoto = Buffer.from(await tech.evaluate(() => { const c = document.createElement('canvas'); c.width = 800; c.height = 500; const x = c.getContext('2d')!; x.fillStyle = '#e6e8da'; x.fillRect(0, 0, 800, 500); x.fillStyle = '#795638'; x.font = '120px serif'; x.fillText('ب', 360, 260); x.font = '28px sans-serif'; x.fillText('SYNTHETIC REVISED TRIAL', 145, 390); return c.toDataURL('image/png').split(',')[1]; }), 'base64');
    await upload(tech, 'synthetic-letter-r2.png', revisedPhoto, 'image/png');
    await act(tech).getByRole('checkbox').check();
    await act(tech).getByRole('button', { name: 'Submit the trial for artist review' }).click();
    await expect.poll(async () => (await view(tech)).treatment.trials.length).toBe(2);
    await artist.reload(); await artist.getByRole('button', { name: 'English', exact: true }).click();
    await task(artist, 'Artist review of the trial photograph'); await inspect(artist, true);
    await act(artist).getByRole('combobox', { name: /^Decision/ }).selectOption('APPROVE');
    await act(artist).getByRole('checkbox').check();
    await act(artist).getByRole('button', { name: 'Save the artist’s decision' }).click();
    await expect.poll(async () => (await view(tech)).treatment.batch.allowed).toBe(true);

    // Same server/store after restart: sessions expire and original evidence remains.
    const port = (server.address() as { port: number }).port;
    await new Promise<void>(r => server.close(() => r()));
    runtime = await createConnectedPilot(options); await listen(port);
    expect((await tech.request.get(origin + operationsPath)).status()).toBe(401);
    const resumed = await actorPage('Technical');
    expect((await view(resumed)).treatment.batch.allowed).toBe(true);
    await task(resumed, 'Record batch completion');
    await upload(resumed, 'synthetic-completion.png', photo, 'image/png');
    await expect(act(resumed).getByRole('button', { name: 'Record completion', exact: true })).toBeDisabled();
    await act(resumed).getByLabel('Letters treated').fill('12');
    await act(resumed).getByRole('button', { name: 'Record completion', exact: true }).click();
    await expect.poll(async () => (await view(resumed)).treatment.completions[0]?.lettersTreated).toBe(12);
    await new Promise<void>(r => server.close(() => r()));
    runtime = await createConnectedPilot(options); await listen(port);
    const restored = runtime.repository.read().treatments[PILOT_ARTWORK];
    expect(restored.revisions).toHaveLength(2); expect(restored.completions[0].lettersTreated).toBe(12);
    const finalArtist = await actorPage('Artist');
    await task(finalArtist, 'Artist review of the trial photograph');
    await inspect(finalArtist, true);
    const finalEvidenceTab = finalArtist.getByRole('button', { name: 'View evidence', exact: true });
    if (await finalEvidenceTab.isVisible()) await finalEvidenceTab.click();
    await expect(finalArtist.getByText('Treatment completed: 12 letters', { exact: true })).toBeVisible();
    await finalArtist.getByRole('button', { name: 'العربية', exact: true }).click();
    await expect(finalArtist.locator('html')).toHaveAttribute('dir', 'rtl');
    expect(await finalArtist.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await finalArtist.screenshot({ path: info.outputPath('completed-arabic.png'), fullPage: true });
    expect(errors).toEqual([]); expect(external).toEqual([]);
  } finally {
    for (const context of contexts) await context.close();
    await new Promise<void>(r => server.close(() => r()));
  }
});
