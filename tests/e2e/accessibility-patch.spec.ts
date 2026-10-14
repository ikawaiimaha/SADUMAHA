import { test, expect, type Page, type Locator } from '@playwright/test';

// Accessibility checks against screens that are reachable from the current app.
// The previous version targeted workspaces that are no longer mounted.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sadu_lang', 'en'));
});

async function enterWorkbench(page: Page) {
  await page.goto('/workbench');
  await page.getByRole('button', { name: 'Enter Institutional System', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Workspace', exact: true })).toBeVisible();
}

const focusInside = (dialog: Locator) => dialog.evaluate(node => node.contains(document.activeElement));

/** Shift+Tab, then Tab past every control: focus must never leave the dialog. */
async function expectFocusTrapped(page: Page, dialog: Locator) {
  await expect(dialog).toBeVisible();
  expect(await focusInside(dialog)).toBe(true);
  await page.keyboard.press('Shift+Tab');
  expect(await focusInside(dialog)).toBe(true);
  const controls = await dialog.locator('button:enabled, input:enabled, select:enabled, textarea:enabled, a[href]').count();
  for (let i = 0; i < controls + 2; i++) {
    await page.keyboard.press('Tab');
    expect(await focusInside(dialog)).toBe(true);
  }
}

test('presenter details trap focus, close on Escape and restore the trigger in both languages', async ({ page }) => {
  await enterWorkbench(page);
  for (const [tools, trigger, language] of [['Demo tools', 'Presenter details', 'العربية'], ['أدوات العرض', 'تفاصيل العرض', 'English']] as const) {
    const button = page.getByRole('button', { name: trigger, exact: true });
    if (!(await button.isVisible())) await page.getByText(tools, { exact: true }).click();
    await button.click();
    const dialog = page.getByRole('dialog');
    await expectFocusTrapped(page, dialog);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(button).toBeFocused();
    await page.getByRole('button', { name: language, exact: true }).first().click();
  }
});

test('the workspace lock keeps focus inside and cannot be dismissed with Escape', async ({ page }) => {
  await enterWorkbench(page);
  await page.getByRole('button', { name: /^Lock workspace$|^قفل مساحة العمل$/ }).click();
  const dialog = page.getByRole('dialog');
  await expectFocusTrapped(page, dialog);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
});

test('every visible form control on each desk has an accessible name in both languages', async ({ page }) => {
  test.slow();
  await enterWorkbench(page);
  const select = page.getByRole('combobox', { name: 'Workspace', exact: true });
  const desks = (await select.locator('optgroup option').evaluateAll(options => options.map(o => (o as HTMLOptionElement).value)));
  expect(desks.length).toBeGreaterThan(8);
  const unnamed: string[] = [];
  for (const lang of ['en', 'ar'] as const) {
    if (lang === 'ar') await page.getByRole('button', { name: 'العربية', exact: true }).first().click();
    const workspace = page.getByRole('combobox', { name: lang === 'en' ? 'Workspace' : 'مساحة العمل', exact: true });
    for (const desk of desks) {
      await workspace.selectOption(desk);
      await page.waitForLoadState('domcontentloaded');
      const missing = await page.locator('main input:visible:not([type=hidden]), main select:visible, main textarea:visible').evaluateAll(controls => controls
        .filter(control => {
          const el = control as HTMLInputElement;
          const labelled = el.labels?.length || el.getAttribute('aria-label')?.trim() || el.getAttribute('aria-labelledby') || el.title?.trim();
          return !labelled;
        })
        .map(control => control.outerHTML.slice(0, 160)));
      unnamed.push(...missing.map(m => `${lang}/${desk}: ${m}`));
    }
  }
  expect(unnamed, unnamed.join('\n')).toEqual([]);
});

test('on phones the floating lock control is icon-sized and never covers story footer text', async ({ page }) => {
  for (const width of [320, 390]) for (const [lang, story] of [['en', 'Institutional story — optional'], ['ar', 'السياق المؤسسي — اختياري']] as const) {
    await page.setViewportSize({ width, height: 700 });
    await page.addInitScript(value => localStorage.setItem('sadu_lang', value), lang);
    await page.goto('/workbench');
    await page.getByRole('button', { name: story, exact: true }).click();
    const lock = page.getByRole('button', { name: lang === 'en' ? 'Lock workspace' : 'قفل مساحة العمل', exact: true });
    const box = (await lock.boundingBox())!;
    expect(box.width).toBeLessThanOrEqual(48);
    expect(box.height).toBeGreaterThanOrEqual(44);
    const overlaps = await page.locator('.story-footer span').evaluateAll((spans, b) => spans.filter(span => {
      for (const r of span.getClientRects()) if (r.left < b.x + b.width && r.right > b.x && r.top < b.y + b.height && r.bottom > b.y) return true;
      return false;
    }).map(span => span.textContent), box);
    expect(overlaps, `${width}px ${lang}`).toEqual([]);
  }
});

test('manual story navigation has concise bilingual announcements without autoplay chatter', async ({ page }) => {
  await page.clock.install();
  await page.goto('/workbench');
  await page.getByRole('button', { name: 'Institutional story — optional', exact: true }).click();
  const status = page.locator('.story-shell [role="status"]');
  await expect(status).toHaveText('');
  await page.getByRole('button', { name: 'Next Chapter', exact: true }).click();
  await expect(status).toContainText(/Chapter 2 of \d+:/);
  await page.getByRole('button', { name: 'العربية', exact: true }).click();
  await expect(status).toContainText(/الفصل ٢ من [٠-٩]+:/);
  await page.getByRole('button', { name: 'تشغيل تلقائي', exact: true }).click();
  await page.clock.fastForward(9100);
  await expect(page.locator('.story-progress [aria-current="step"]')).toHaveAccessibleName(/^الفصل ٣:/);
  await expect(status).toHaveText('');
  await page.getByRole('button', { name: 'السابق', exact: true }).click();
  await expect(status).toContainText(/الفصل ٢ من [٠-٩]+:/);
});
