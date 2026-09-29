import {test,expect} from '@playwright/test';
test('approved bilingual labels export a PDF proof',async({page},info)=>{
 page.on('pageerror',e=>console.log(e.message));
 await page.route('**/src/lib/pilotSupabase.ts*',r=>r.fulfill({contentType:'application/javascript',body:`export const pilotSupabase={
 auth:{onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}};}},
 from(table){return {select(){return {eq(){return table==='sadu_exhibition_scenarios'?{async single(){return {data:{status:'SUBMITTED',artwork_checklist:[{id:'wall',name:'Wall 1'}]}};}}:Promise.resolve({data:window.testRows});}};}};},
 storage:{from(){return {async createSignedUrl(){return {data:{signedUrl:'/test-artwork.png'}};}};}}
};`}));
 await page.route('**/test-artwork.png',async r=>{const data=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=300;c.height=200;const x=c.getContext('2d')!;x.fillStyle='#296a8a';x.fillRect(0,0,300,200);x.fillStyle='#d2b66b';x.beginPath();x.arc(150,100,65,0,Math.PI*2);x.fill();return c.toDataURL().split(',')[1];});await r.fulfill({contentType:'image/png',body:Buffer.from(data,'base64')});});
 await page.route('**/src/main.tsx*',r=>r.fulfill({contentType:'application/javascript',body:`import React from '/node_modules/.vite/deps/react.js';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';import {CatalogLabelExport} from '/src/components/CatalogLabelExport.tsx';import '/src/index.css';const rows=[{id:'FAT-001',zone_id:'wall',media_object_name:'artwork.png',scenario_id:'exhibition',religious_text:true,source:{language:'en',title:'And the heaven He raised',medium:'Ahar bamboo paper & Japanese ink',concept:'Study'},translation_ar:{title:'والسماء رفعها',medium:'ورق بامبو مقهر وحبر ياباني',concept:'دراسة'},translation_status:'TRANSLATION_COMPLETED',production_year:2026,height_cm:80,width_cm:50,translated_at:'2026-09-29T10:00:00Z'}];window.testRows=rows;ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(CatalogLabelExport,{rows}));window.dispatchEvent(new Event('sadu:ready'));`}));
 await page.goto('/');const button=page.getByRole('button',{name:/Export bilingual/});await expect(button).toBeDisabled();await page.getByRole('combobox').selectOption('exhibition');
 const wait=page.waitForEvent('download');await button.click();const download=await wait;await download.saveAs(info.outputPath('labels.pdf'));expect(download.suggestedFilename()).toBe('SADU-labels-exhibition.pdf');await expect(page.getByRole('status')).toContainText('proof exported');
 const manifestWait=page.waitForEvent('download');await page.getByRole('button',{name:/Visual Installation/}).click();const manifest=await manifestWait;await manifest.saveAs(info.outputPath('manifest.pdf'));expect(manifest.suggestedFilename()).toBe('SADU-installation-manifest-exhibition.pdf');
 await page.route('**/test-artwork.png',r=>r.fulfill({status:403,body:'Denied'}));await page.getByRole('button',{name:/Visual Installation/}).click();await expect(page.getByRole('status')).toContainText('Export blocked');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
