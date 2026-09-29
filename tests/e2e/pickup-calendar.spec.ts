import {test,expect} from '@playwright/test';
test('pickup input has edition bounds and rejects December instead of forwarding it',async({page})=>{
 await page.clock.install({time:new Date('2026-09-01T08:00:00Z')});
 await page.route('**/src/lib/useOperationalRows.ts*',route=>route.fulfill({contentType:'application/javascript',body:`export function useOperationalRows(table){return {rows:table==='sadu_artwork_checklist'?[{id:'a',source:{title:'Fictional artwork'}}]:table==='sadu_consignments'?[{id:'c',artwork_id:'a',origin:'ARTIST_STUDIO'}]:[],notice:'Test fixture',live:false,refresh:async()=>{}};}`}));
 await page.route('**/src/main.tsx*',route=>route.fulfill({contentType:'application/javascript',body:`import React from '/node_modules/.vite/deps/react.js';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';import {FreightPickupScheduler} from '/src/components/FreightPickupScheduler.tsx';import '/src/index.css';ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(FreightPickupScheduler));window.dispatchEvent(new Event('sadu:ready'));`}));
 await page.goto('/');
 const ready=page.getByLabel('Ready for Pickup Date');await expect(ready).toHaveAttribute('min','2026-09-01');await expect(ready).toHaveAttribute('max','2026-09-10');
 await page.getByLabel('Approved artwork metadata').selectOption('a');
 for(const [label,value] of [['Country /','UAE'],['City /','Abu Dhabi'],['District /','District'],['Street /','Street'],['Villa / Building','Building']])await page.getByLabel(label,{exact:false}).fill(value);
 await page.getByLabel('Google Maps / Makani Pin URL').fill('https://maps.google.com/?q=fictional');
 await ready.fill('2026-09-03');await expect(page.getByRole('button',{name:'Submit & lock pickup request'})).toBeEnabled();
 await ready.fill('2026-12-03');await expect(page.getByRole('button',{name:'Submit & lock pickup request'})).toBeDisabled();await expect(page.getByRole('alert')).toContainText('Pickup blocked');
 await page.clock.setFixedTime(new Date('2026-09-29T08:00:00Z'));await page.reload();await expect(page.getByText('Intake closed /',{exact:false})).toBeVisible();await expect(page.getByLabel('Ready for Pickup Date')).toBeDisabled();
});
