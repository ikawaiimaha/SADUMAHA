import { test, expect, type Page } from '@playwright/test';

const labels: Record<string, string> = { Committee: 'Preparatory Committee', Director: 'Biennial Director', Coordinator: 'Exhibition Coordinator' };
async function desk(page: Page, name: string) {
  await page.getByRole('combobox', { name: 'Workspace', exact: true }).selectOption({ label: labels[name] ?? name });
  // Theme decisions live on the Chairman's second tab.
  if (name === 'Chairman') await page.getByRole('button', { name: 'Biennial Program Decisions', exact: true }).click();
}

/** The Committee edits one proposal at a time and must open the comparison before submitting. */
async function submitThreeArabicProposals(page: Page, title: (i: number) => string, statement: string) {
  for (let i = 1; i <= 3; i++) {
    await page.getByRole('button', { name: new RegExp(`^Proposal ${i}`) }).click();
    await page.getByLabel('Arabic Name (الاسم بالعربية)', { exact: true }).fill(title(i));
    for (const field of [/^Aesthetic Framework/, /^Contemporary & Historical Relevance/, /^Curatorial Justification/]) {
      await page.getByLabel(field).fill(statement);
    }
  }
  const submit = page.getByRole('button', { name: 'Submit to Biennial Director' });
  await expect(submit).toBeDisabled();
  await page.getByRole('button', { name: 'Compare all three', exact: true }).click();
  await submit.click();
}

test('Arabic-first theme handoff and verified bilingual release', async ({ page }) => {
  test.slow();
  await page.addInitScript(() => localStorage.setItem('sadu_lang', 'en'));
  await page.goto('/workbench');
  await page.getByRole('button', { name: 'Enter Institutional System', exact: true }).click();
  await page.getByRole('checkbox', { name: /Auto-forward/ }).uncheck();

  await desk(page, 'General Exhibition Coordinator');
  await expect(page.locator('#exhibition-guidelines-arabic')).toBeDisabled();
  await desk(page, 'Editorial');
  await expect(page.getByRole('button', { name: 'Ratify Arabic Text & Route to Translation' })).toBeDisabled();

  await desk(page, 'Committee');
  await submitThreeArabicProposals(page, i => `ثيمة عربية ${i}`, 'بيان عربي عن جماليات الخط وعلاقته بالفنون المعاصرة');
  await desk(page, 'Chairman');
  await expect(page.getByRole('button', { name: 'Select proposal' })).toHaveCount(0);
  await desk(page, 'Director');
  await page.locator('#director-note-0').fill('مراجعة الجدوى الإدارية والفنية');
  await page.getByRole('button', { name: 'Present 3 Themes to Chairman' }).click();
  await desk(page, 'Chairman');
  await expect(page.getByText('مراجعة الجدوى الإدارية والفنية', { exact: true })).toBeVisible();

  // The Committee cannot replace a submitted batch; only a Director return reopens it, and the
  // return clears the Chairman's docket until a new batch is presented.
  await desk(page, 'Committee');
  await expect(page.getByRole('button', { name: 'Start New Proposal Set' })).toBeDisabled();
  await desk(page, 'Director');
  await page.getByRole('button', { name: 'Return to Preparatory Committee' }).click();
  await desk(page, 'Chairman');
  await expect(page.getByRole('button', { name: 'Select proposal' })).toHaveCount(0);
  // The returned batch reopens for revision with its previous text retained.
  await desk(page, 'Committee');
  await expect(page.getByLabel('Arabic Name (الاسم بالعربية)', { exact: true })).toHaveValue('ثيمة عربية 1');
  await submitThreeArabicProposals(page, i => `ثيمة بديلة ${i}`, 'صياغة عربية بديلة عن جماليات الخط المعاصر');
  await desk(page, 'Chairman');
  await expect(page.getByRole('button', { name: 'Select proposal' })).toHaveCount(0);
  await desk(page, 'Director');
  await page.getByRole('button', { name: 'Present 3 Themes to Chairman' }).click();
  await desk(page, 'Chairman');
  await page.getByRole('button', { name: 'Select proposal' }).first().click();
  const authorizeBudget = page.getByRole('button', { name: 'Authorize Budget & Transfer Authority' });
  for (const invalid of ['', '0', '-500000']) {
    await page.locator('#approved-budget-amount').fill(invalid);
    await expect(authorizeBudget).toBeDisabled();
  }
  await page.locator('#approved-budget-amount').fill('12500000');
  await expect(authorizeBudget).toBeEnabled();
  await authorizeBudget.click();
  await expect(page.locator('#approved-budget-amount')).toBeDisabled();
  await expect(page.getByRole('button', { name: /Theme Locked/ })).toBeDisabled();

  await desk(page, 'Committee');
  await expect(page.getByText('Status: Locked - Theme Ratified by Chairman', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start New Proposal Set' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Submit to Biennial Director' })).toHaveCount(0);

  await desk(page, 'Editorial');
  await expect(page.locator('#editorial-english')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Publish Official Theme' })).toHaveCount(0);
  const arabic = 'البيان الفني المؤسسي المعتمد لاستكشاف جماليات الخط العربي المعاصر';
  await page.locator('#editorial-arabic').fill(arabic);
  await page.getByRole('button', { name: 'Ratify Arabic Text & Route to Translation' }).click();
  await expect(page.getByText(arabic, { exact: true })).toBeVisible();
  const publish = page.getByRole('button', { name: 'Publish Official Theme' });
  await expect(publish).toBeDisabled();
  await page.locator('#editorial-english').fill('The institutional artistic statement explores contemporary Arabic calligraphy.');
  await expect(publish).toBeDisabled();
  const verified = page.getByRole('checkbox', { name: /I reviewed the English translation/ });
  await verified.check();
  await expect(publish).toBeEnabled();
  // Editing the translation withdraws the reviewer's confirmation.
  const english = 'The verified institutional statement explores the aesthetics of contemporary Arabic calligraphy.';
  await page.locator('#editorial-english').fill(english);
  await expect(verified).not.toBeChecked();
  await verified.check();
  await publish.click();
  await expect(page.getByText('Theme Locked & Dispatched', { exact: true })).toBeVisible();

  await desk(page, 'General Exhibition Coordinator');
  await expect(page.locator('#exhibition-guidelines-arabic')).toBeEnabled();
  await expect(page.getByText('Status: Pending Editorial Translation', { exact: true })).toHaveCount(0);
  await expect(page.getByText(arabic, { exact: true })).toBeVisible();
  await expect(page.getByText(english, { exact: true })).toBeVisible();
  const guidelines = 'الدليل التنسيقي الجديد للخط العربي والمعايير الفنية للمعرض';
  await page.locator('#exhibition-guidelines-arabic').fill(guidelines);
  await page.getByRole('button', { name: 'Submit to Editorial for Translation' }).click();

  await desk(page, 'Editorial');
  await expect(page.getByRole('heading', { name: 'Translation Queue — General Coordinator Guidelines' })).toBeVisible();
  await expect(page.getByText(guidelines, { exact: true })).toBeVisible();
  const publishGuidelines = page.getByRole('button', { name: 'Publish Bilingual Guidelines' });
  await expect(publishGuidelines).toBeDisabled();
  const guidelinesEnglish = 'New curatorial guidelines for Arabic calligraphy and exhibition artistic standards.';
  await page.locator('#guidelines-english').fill(guidelinesEnglish);
  await publishGuidelines.click();
  await expect(page.getByText('Bilingual guidelines published and returned to the General Exhibition Coordinator.')).toBeVisible();

  await desk(page, 'General Exhibition Coordinator');
  await expect(page.getByRole('heading', { name: 'Published Bilingual Guidelines' })).toBeVisible();
  await expect(page.getByText(guidelinesEnglish, { exact: true })).toBeVisible();
});
