import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});const page=await browser.newPage();const id='directory-check-'+crypto.randomUUID();
try {
 await page.goto('http://127.0.0.1:3010/');
 const initial=await page.evaluate(async(id)=>{const m=await import('/src/data/masterDirectory.ts');const file=new File(['%PDF-1.4 sample test'],'press.pdf',{type:'application/pdf'});await m.writeProfile({id,name:'Test profile',nationality:'Test',medium:'Video',editions:['12th Edition'],bioAr:'سيرة',bioEn:'Saved biography',affiliations:'Test gallery',press:[{id:'file1',file,uploadedAt:new Date().toISOString()}]});return (await m.readProfiles()).find(p=>p.id===id).bioEn;},id);
 assert.equal(initial,'Saved biography');await page.reload();
 const restored=await page.evaluate(async(id)=>{const m=await import('/src/data/masterDirectory.ts');const p=(await m.readProfiles()).find(p=>p.id===id);return {bio:p.bioEn,file:p.press[0].file.name,content:await p.press[0].file.text()};},id);
 assert.equal(restored.bio,'Saved biography');assert.equal(restored.file,'press.pdf');assert.match(restored.content,/%PDF/);
 console.log('PASS: browser profile and PDF contents survive page reload.');
} finally {
 await page.evaluate(id=>new Promise((resolve,reject)=>{const r=indexedDB.open('sadu-master-directory-v1',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('profiles','readwrite');tx.objectStore('profiles').delete(id);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};}),id);
 await browser.close();
}
