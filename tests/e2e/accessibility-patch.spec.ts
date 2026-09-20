import { test, expect, type Page, type Locator } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('sadu_lang', 'en'); localStorage.setItem('sadu_experience_mode', 'platform'); });
});

async function legacy(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Other sample workspaces', exact: true }).click();
}

async function checkModalKeys(page: Page, dialog: Locator) {
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-modal-close]')).toBeFocused();
  // Try moving backwards past the first control, then forwards through every control.
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
  const controls = await dialog.locator('button:enabled, input:enabled, select:enabled, a[href]').count();
  for (let i = 0; i < controls + 2; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
}

test('role onboarding and RFQ retain keyboard focus, close on Escape, and restore their triggers', async ({ page }, info) => {
  await legacy(page);
  await page.locator('[data-role-switcher]').click();
  await page.getByRole('button', { name: 'Fine Art Logistics & Freight Desk', exact: true }).click();
  await checkModalKeys(page, page.getByRole('dialog'));
  await expect(page.locator('[data-role-switcher]')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Notifications: 3 unread', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Sample logistics message', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send sample message', exact: true })).toBeVisible();
  if (info.project.name === 'mobile') {
    await expect(page.getByRole('button', { name: 'Open navigation menu', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Search workspaces', exact: true })).toBeVisible();
  }
  const trigger = page.getByRole('button', { name: 'Generate Shipping RFQ', exact: true });
  await trigger.click();
  await page.screenshot({ path: info.outputPath('rfq-en.png') });
  await checkModalKeys(page, page.getByRole('dialog', { name: 'Sample RFQ preview', exact: true }));
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: 'عربي', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'رسالة لوجستية تجريبية', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'إرسال رسالة تجريبية', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /إشعارات|الإشعارات/ }).focus();
  await page.getByRole('button', { name: 'إنشاء وثيقة استدراج عروض (RFQ)', exact: true }).click();
  await page.screenshot({ path: info.outputPath('rfq-ar.png') });
  await checkModalKeys(page, page.getByRole('dialog', { name: 'معاينة طلب عروض أسعار تجريبي', exact: true }));
  await page.locator('[data-role-switcher]').click();
  await page.getByRole('button', { name: 'مكتب الشحن واللوجستيات الفنية الدولية', exact: true }).last().click();
  await checkModalKeys(page, page.getByRole('dialog'));
  await expect(page.locator('[data-role-switcher]')).toBeFocused();
});

test('contract instruments work with arrow keys and have named fields in both languages', async ({ page }, info) => {
  await legacy(page);
  for (const ar of [false, true]) {
    if (ar) await page.getByRole('button', { name: 'عربي', exact: true }).click();
    const search = page.locator('[data-workspace-search]:visible');
    await search.click();
    await page.getByRole('button', { name: ar ? /معاينة طلب عقد تجريبي جديد/ : /New Contract Request \(Form 1B/ }).click();
    const dialog = page.getByRole('dialog', { name: ar ? 'معاينة طلب عقد تجريبي' : 'Sample contract request preview', exact: true });
    await expect(dialog.locator('[data-modal-close]')).toBeFocused();
    const radios = dialog.getByRole('radio');
    await expect(radios).toHaveCount(5);
    await radios.nth(0).focus();
    await page.keyboard.press('ArrowDown');
    await expect(radios.nth(1)).toBeChecked();
    await expect(radios.nth(1)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(radios.nth(0)).toBeChecked();
    for (const control of await dialog.locator('select, input[type="text"]').all()) {
      await expect(control).toHaveAccessibleName(/.+/);
    }
    await dialog.locator('[data-modal-close]').focus();
    await page.screenshot({ path: info.outputPath(ar ? 'contract-ar.png' : 'contract-en.png') });
    await checkModalKeys(page, dialog);
    await expect(search).toBeFocused();
  }
});

test('roster errors are announced, linked, bilingual, and keep the draft intact', async ({ page }, info) => {
  await page.goto('/join');
  await page.getByLabel('Sample contact email', { exact: true }).fill('incomplete-draft');
  await page.getByRole('button', { name: /Review registration/ }).click();
  await page.getByRole('checkbox', { name: /I reviewed these fictional details/ }).check();
  await page.getByRole('button', { name: 'Register sample profile', exact: true }).click();
  await expect(page.getByRole('alert')).toBeFocused();
  await page.getByRole('button', { name: 'Add a valid sample contact email.', exact: true }).click();
  const email = page.getByLabel('Sample contact email', { exact: true });
  await expect(email).toBeFocused();
  await expect(email).toHaveValue('incomplete-draft');
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveAccessibleDescription('Add a valid sample contact email.');
  await page.getByRole('button', { name: 'العربية', exact: true }).click();
  await expect(page.getByLabel('بريد التواصل التجريبي', { exact: true })).toHaveAccessibleDescription('أضف بريداً تجريبياً صحيحاً للتواصل.');
  await page.getByLabel('بريد التواصل التجريبي', { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('field-errors-ar.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('proposal errors describe the matching field without blocking incomplete drafting', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Demonstration roles' }).getByRole('button', { name: 'Artist intake', exact: true }).click();
  await page.getByRole('button', { name: /Review and submit/ }).click();
  await page.getByRole('checkbox', { name: /I reviewed this sample proposal/ }).check();
  await page.getByRole('button', { name: 'Submit sample proposal', exact: true }).click();
  await page.getByRole('button', { name: 'Add both proposal titles, or request translation support.', exact: true }).click();
  const title = page.getByLabel('Proposal title · English', { exact: true });
  await expect(title).toBeFocused();
  await expect(title).toHaveAccessibleDescription('Add both proposal titles, or request translation support.');
  await expect(title).toHaveAttribute('aria-invalid', 'true');
  await title.fill('Unfinished concept');
  await page.getByRole('button', { name: /Review and submit/ }).click();
  await page.getByRole('button', { name: /Programme proposal/ }).click();
  await expect(title).toHaveValue('Unfinished concept');
});

test('manual story navigation has concise bilingual announcements without autoplay chatter', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sadu_experience_mode', 'story'));
  await page.clock.install();
  await page.goto('/');
  const status = page.locator('.story-shell [role="status"]');
  await expect(status).toHaveText('');
  await page.getByRole('button', { name: 'Next Chapter', exact: true }).click();
  await expect(status).toContainText('Chapter 2 of 9:');
  await page.getByRole('button', { name: 'العربية', exact: true }).click();
  await expect(status).toContainText('الفصل ٢ من ٩:');
  await page.getByRole('button', { name: 'تشغيل تلقائي', exact: true }).click();
  await page.clock.fastForward(9100);
  await expect(page.locator('.story-progress [aria-current="step"]')).toHaveAccessibleName(/^الفصل ٣:/);
  await expect(status).toHaveText('');
  await page.getByRole('button', { name: 'السابق', exact: true }).click();
  await expect(status).toContainText('الفصل ٢ من ٩:');
  await expect(page.getByRole('button', { name: 'تشغيل تلقائي', exact: true })).toBeVisible();
});
