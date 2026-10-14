import { test, expect } from '@playwright/test';

// Specialist-review, venue-review and UAE PASS checks were removed with the unreachable legacy
// workspaces; demoBoundaries.test.ts now forbids their withdrawn signature/certification wording
// anywhere in src.

test('all story chapters preserve the frame, readable provenance and reachable controls in both languages', async ({ page }, info) => {
  const sizes = info.project.name === 'desktop' ? [{ width: 1366, height: 768 }, { width: 844, height: 390 }] : [{ width: 320, height: 700 }, { width: 390, height: 844 }];
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const size of sizes) for (const lang of ['en', 'ar'] as const) {
    await page.setViewportSize(size);
    await page.addInitScript(value => localStorage.setItem('sadu_lang', value), lang);
    await page.goto('/workbench');
    await page.getByRole('button', { name: lang === 'en' ? 'Institutional story — optional' : 'السياق المؤسسي — اختياري', exact: true }).click();
    const card = page.locator('.story-card');
    await expect(card).toHaveAttribute('tabindex', '0');
    // Compare chapter geometry after web fonts settle, separately from cold-load timing.
    await page.evaluate(() => document.fonts.ready);
    const origin = await card.boundingBox();
    const chapters = await page.locator('.story-progress button').count();
    expect(chapters).toBeGreaterThan(3);
    for (let chapter = 0; chapter < chapters; chapter++) {
      if (chapter) await page.locator('.story-progress button').nth(chapter).click();
      await expect(card).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      const rect = await card.boundingBox();
      if (size.height > 560) {
        expect(Math.abs(rect!.y - origin!.y)).toBeLessThan(2);
        expect(Math.abs(rect!.height - origin!.height)).toBeLessThan(2);
        const controls = await page.locator('.story-controls').boundingBox();
        expect(controls!.y + controls!.height).toBeLessThanOrEqual(size.height);
      }
    }
    await page.locator('.story-progress button').first().click();
    const source = page.locator(`[data-source-id="${lang === 'en' ? 'QUOTE-EN-FAYA' : 'QUOTE-AR-WUSTA-76'}"]`);
    await source.locator('summary').click();
    await expect(source).toContainText('2026-09-20');
    await expect(source).toContainText(lang === 'en' ? 'not a SADU translation' : 'مقتطف من النص العربي المنشور');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: info.outputPath(`source-${size.width}-${lang}.png`) });
  }
  expect(errors).toEqual([]);
});
