import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sadu_lang', 'en'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter Institutional System', exact: true }).click();
});
const desk = (page: Page, name: string) => page.getByRole('combobox', {name: 'Workspace', exact: true}).selectOption({label: name === 'Committee' ? 'Preparatory Committee' : name === 'Director' ? 'Biennial Director' : name});

test('authority handoffs preserve mandates and Arabic lock across desk changes', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await desk(page, 'HIP');
  await expect(page.locator('#exhibition-guidelines-arabic')).toBeDisabled();
  await expect(page.getByRole('button', {name: 'Add Tag', exact: true})).toBeDisabled();
  await desk(page, 'Editorial');
  await expect(page.locator('#editorial-arabic')).toBeDisabled();
  await desk(page, 'Committee');
  await page.getByRole('button', {name:'Auto-fill for Demo',exact:true}).click();
  await page.getByRole('button', {name:'Compare all three',exact:true}).click();
  await page.getByRole('button', {name:'Submit to Biennial Director',exact:true}).click();
  await desk(page, 'HIP');
  await desk(page, 'Committee');
  await expect(page.getByRole('button', {name:'Start New Proposal Set',exact:true})).toBeDisabled();
  await expect(page.getByRole('button', {name:'Auto-fill for Demo',exact:true})).toHaveCount(0);
  await desk(page, 'Director');
  await page.getByRole('button', {name:'Auto-fill Notes',exact:true}).click();
  const advice = await page.locator('#director-note-0').inputValue();
  await page.getByRole('button', {name:'Present 3 Themes to Chairman',exact:true}).click();
  await desk(page, 'Chairman');
  await page.getByRole('button', {name:'Biennial Program Decisions',exact:true}).click();
  await page.getByRole('button', {name:'Auto-fill Executive Directives',exact:true}).click();
  const mandate = await page.locator('#chairman-directives-0').inputValue();
  await page.getByRole('button', {name:'Select proposal',exact:true}).first().click();
  const ratify = page.getByRole('button', {name:'Authorize Budget & Transfer Authority',exact:true});
  await page.locator('#approved-budget-amount').fill('0');
  await expect(ratify).toBeDisabled();
  await page.locator('#approved-budget-amount').fill('100000');
  await ratify.click();
  await desk(page,'Editorial');
  await expect(page.getByText(advice,{exact:true})).toBeVisible();
  await expect(page.getByText(mandate,{exact:true})).toBeVisible();
  const arabic = 'بيان مؤسسي لاختبار انتقال الصياغة العربية المعتمدة بين الأقسام';
  await page.locator('#editorial-arabic').fill(arabic);
  await page.getByRole('button',{name:'Ratify Arabic Text & Route to Translation',exact:true}).click();
  await desk(page,'HIP');
  await expect(page.getByText('Status: Pending Editorial Translation',{exact:true}).first()).toBeVisible();
  await expect(page.locator('#exhibition-guidelines-arabic')).toBeDisabled();
  await desk(page,'Editorial');
  await expect(page.locator('#editorial-arabic')).toHaveCount(0);
  await expect(page.getByText(arabic,{exact:true}).first()).toBeVisible();
  await page.locator('#editorial-english').fill('An institutional statement confirming the approved Arabic handoff.');
  const publish = page.getByRole('button',{name:'Publish Official Theme',exact:true});
  await expect(publish).toBeDisabled();
  await page.getByRole('checkbox',{name:/I reviewed the English translation/}).check();
  await publish.click();
  await desk(page,'HIP');
  await expect(page.locator('#exhibition-guidelines-arabic')).toBeEnabled();
  await expect(page.getByText(mandate,{exact:true})).toBeVisible();
  await expect(page.getByText(advice,{exact:true})).toBeVisible();
  await desk(page,'Editorial');
  await expect(page.locator('#editorial-english')).toBeDisabled();
  expect(errors).toEqual([]);
});

test('Inbox and search contain keyboard focus and dismiss in both languages', async ({page}) => {
  // Exercise retained components in isolation: the former sample-workspace route was retired.
  await page.route('**/src/main.tsx*', route => route.fulfill({contentType:'application/javascript', body:`
    import React from '/node_modules/.vite/deps/react.js';
    import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
    import {I18nProvider,useI18n} from '/src/context/I18nContext.tsx';
    import {InboxModal} from '/src/components/workspaces/InboxModal.tsx';
    import {CommandPalette} from '/src/components/CommandPalette.tsx';
    import {StatusProgressIndicator} from '/src/components/common/StatusProgressIndicator.tsx';
    import {PrintableReportModal} from '/src/components/common/PrintableReportModal.tsx';
    import {PROGRAMMES} from '/src/data/mockData.ts';
    import '/src/index.css';
    const h=React.createElement;
    function Harness(){const {lang,toggleLang,isAr}=useI18n();const [open,setOpen]=React.useState('');const noop=()=>{};
      return h('main',null,h('button',{onClick:toggleLang},'عربي'),
        h('button',{onClick:()=>setOpen('inbox')},isAr?'صندوق الوارد':'Inbox'),
        h('button',{'data-workspace-search':true,onClick:()=>setOpen('search')},'Search'),
        h('button',{onClick:()=>setOpen('report')},'Report'),
        h(StatusProgressIndicator,{type:'contract',variant:'detailed',label:'Sample progress'}),
        h(PrintableReportModal,{isOpen:open==='report',onClose:()=>setOpen(''),metadata:{scopeMode:'unfiltered-sample',programmeName:'Sample',categoryFilter:'all',statusFilter:'all',generatedBy:'Demo',totalRecords:0,workspaceType:'coordinator'},metrics:[],records:[]}),
        h(InboxModal,{isOpen:open==='inbox',onClose:()=>setOpen('')}),
        h(CommandPalette,{isOpen:open==='search',onClose:()=>setOpen(''),lang,currentRole:'SDC_COORDINATOR',selectedProgramme:PROGRAMMES[0],onNavigateTab:noop,onSelectProgramme:noop,onOpenStory:noop,onOpenPresenter:noop,onToggleLanguage:toggleLang,onToggleDensity:noop}));}
    ReactDOM.createRoot(document.getElementById('root')).render(h(I18nProvider,null,h(Harness)));
    window.dispatchEvent(new Event('sadu:ready'));
  `}));
  await page.reload();
  for (const ar of [false,true]) {
    if(ar) await page.getByRole('button',{name:'عربي',exact:true}).click();
    const trigger = page.getByRole('button',{name:ar?'صندوق الوارد':'Inbox',exact:true});
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-modal-close]')).toBeFocused();
    for(let i=0;i<15;i++) {
      await page.keyboard.press(i===0?'Shift+Tab':'Tab');
      expect(await dialog.evaluate(node=>node.contains(document.activeElement))).toBe(true);
    }
    await expect(dialog.getByRole('textbox')).toHaveAccessibleName(/.+/);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    const search = page.locator('[data-workspace-search]:visible');
    await search.click();
    await expect(dialog).toHaveAccessibleName(ar?'البحث في مساحات العمل':'Search workspaces');
    await dialog.getByRole('textbox').focus();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('textbox')).not.toBeFocused();
    expect(await dialog.evaluate(node=>node.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(search).toBeFocused();
    for (const name of ['Report', /Sample progress/]) {
      const opener=page.getByRole('button',{name});
      await opener.click();
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleName(/.+/);
      await page.keyboard.press('Shift+Tab');
      expect(await dialog.evaluate(node=>node.contains(document.activeElement))).toBe(true);
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
    }
  }
});
