import { test, expect, type Page } from '@playwright/test';

async function legacy(page: Page, title: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Other sample workspaces', exact: true }).click();
  await page.getByRole('button', { name: 'Mohammed Ibrahim Al Qaseer', exact: true }).click();
  await page.getByRole('button', { name: title, exact: true }).click();
  await page.getByRole('button', { name: 'Enter sample workspace', exact: true }).click();
}

test('specialist reviews use demo actors and never turn into signatures', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('sadu_lang', 'en'); localStorage.setItem('sadu_experience_mode', 'platform'); });
  await legacy(page, 'DEMO-COMMITTEE');
  await page.getByRole('button', { name: /Cultural & Textual Verification/ }).click();
  await expect(page.getByRole('button', { name: /Sign as/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Record sample script review', exact: true }).click();
  await page.getByRole('button', { name: 'Record sample specialist review', exact: true }).click();
  await expect(page.getByText('DEMO-SPECIALIST-REVIEW', { exact: true })).toBeVisible();
  await expect(page.getByText('Sample reviews recorded; no institutional certification.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'عربي', exact: true }).click();
  await expect(page.getByText('سُجلت مراجعات تجريبية؛ لا اعتماد مؤسسياً.', { exact: true })).toBeVisible();
  await expect(page.getByText('توقيع رسمي معتمد', { exact: false })).toHaveCount(0);
});

test('venue action records only a local DEMO review, including Arabic', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('sadu_lang', 'en'); localStorage.setItem('sadu_experience_mode', 'platform'); });
  await legacy(page, 'Aisha Al-Mehairi');
  await page.getByRole('button', { name: 'Record sample venue review', exact: true }).click();
  await expect(page.getByText('Sample venue review recorded locally. No engineering certification or permit issued.', { exact: true })).toBeVisible();
  await expect(page.getByText(/^DEMO-VENUE-/)).toHaveCount(2);
  await page.getByRole('button', { name: 'عربي', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'مراجعة فنية ومراجعة موقع تجريبيتان', exact: true })).toBeVisible();
  await expect(page.getByText('اعتماد وإصدار تصريح SAM', { exact: false })).toHaveCount(0);
});

test('all story chapters preserve the frame, readable provenance and reachable controls in both languages', async ({ page }, info) => {
  const sizes = info.project.name === 'desktop' ? [{width:1366,height:768},{width:844,height:390}] : [{width:320,height:700},{width:390,height:844}];
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const size of sizes) for (const lang of ['en','ar']) {
    await page.setViewportSize(size);
    await page.addInitScript(value => { localStorage.setItem('sadu_lang', value); localStorage.setItem('sadu_experience_mode','story'); }, lang);
    await page.goto('/');
    const card = page.locator('.story-card');
    await expect(card).toHaveAttribute('tabindex', '0');
    // Compare chapter geometry after web fonts settle, separately from cold-load timing.
    await page.evaluate(() => document.fonts.ready);
    const origin = await card.boundingBox();
    for (let chapter=0; chapter<9; chapter++) {
      if (chapter) await page.locator('.story-progress button').nth(chapter).click();
      await expect(card).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1)).toBe(true);
      const rect = await card.boundingBox();
      if (size.height>560) {
        expect(Math.abs(rect!.y-origin!.y)).toBeLessThan(2);
        expect(Math.abs(rect!.height-origin!.height)).toBeLessThan(2);
        const controls = await page.locator('.story-controls').boundingBox();
        expect(controls!.y+controls!.height).toBeLessThanOrEqual(size.height);
      }
    }
    await page.locator('.story-progress button').first().click();
    const source = page.locator(`[data-source-id="${lang==='en'?'QUOTE-EN-FAYA':'QUOTE-AR-WUSTA-76'}"]`);
    await source.locator('summary').click();
    await expect(source).toContainText('2026-09-20');
    await expect(source).toContainText(lang==='en'?'not a SADU translation':'مقتطف من النص العربي المنشور');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1)).toBe(true);
    await page.screenshot({path:info.outputPath(`source-${size.width}-${lang}.png`)});
  }
  expect(errors).toEqual([]);
});

test('UAE PASS walkthrough stays disconnected and does not accept custody', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('sadu_lang','en'); localStorage.setItem('sadu_experience_mode','platform'); });
  await page.goto('/');
  const role = (name: string) => page.getByRole('navigation', { name:'Demonstration roles' }).getByRole('button', {name,exact:true}).click();
  await role('Logistics');
  await page.getByLabel('Crate identity', {exact:true}).fill('DEMO-MF-04');
  await page.getByRole('checkbox', {name:'Exterior and seal match the sample packing record'}).check();
  await page.getByRole('button', {name:'Record arrival',exact:true}).click();
  await role('Technical');
  await page.getByRole('button', {name:'Attach sample condition report',exact:true}).click();
  await role('Exhibition manager');
  await page.getByRole('button', {name:'Review Handover',exact:true}).click();
  await page.getByRole('button', {name:'Preview proposed UAE PASS journey',exact:true}).click();
  await expect(page.getByText('PROPOSED JOURNEY · UAE PASS NOT CONNECTED', {exact:true})).toBeVisible();
  await page.getByRole('button', {name:'Next step',exact:true}).click();
  await page.getByRole('button', {name:'Next step',exact:true}).click();
  await expect(page.getByText(/No result or signed document exists here/)).toBeVisible();
  await page.getByRole('button', {name:'Return to demo review',exact:true}).click();
  await page.getByRole('button', {name:'Close dossier',exact:true}).click();
  await expect(page.getByText('Demo handover recorded · read-only', {exact:false})).toHaveCount(0);
  await expect(page.getByRole('button', {name:'Review Handover',exact:true})).toBeEnabled();
});
