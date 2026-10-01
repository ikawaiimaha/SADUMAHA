import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { createCollectionDemo, attachCollectionDemoUi } from '../server/collection-demo.mjs';

test('browser handoff, retained drafts, saved-refresh failure and tablet layout', {timeout:120000}, async()=>{
  const directory=await mkdtemp(join(tmpdir(),'sadu-collection-browser-'));
  const runtime=await createCollectionDemo(directory);await attachCollectionDemoUi(runtime.app,directory);
  const server=runtime.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true});
  const external=[],errors=[];
  const account=async id=>{
    const context=await browser.newContext({viewport:{width:820,height:1180}});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(!r.url().startsWith(origin))external.push(r.url());});
    await page.goto(origin+'/connected-pilot');await page.getByLabel('Demonstration account').selectOption(id);
    await expect(page.getByRole('heading',{name:'Collection details',exact:true})).toBeVisible();return page;
  };
  try {
    const a=await account('pilot-Logistics');
    for(const [label,value] of [['Physical collection address','Synthetic store'],['Collection city','Paris'],['Collection country — not nationality','France'],['Collection contact','Demo desk'],['Source reference — no email body','SYNTHETIC-01'],['IANA timezone, e.g. Europe/Paris','Europe/Paris'],['Availability start','2026-10-01'],['Availability end','2026-10-31']])await a.getByLabel(label,{exact:true}).fill(value);
    await a.getByRole('button',{name:'Add closure',exact:true}).click();
    await a.getByLabel('Closure 1 start').fill('2026-10-10');await a.getByLabel('Closure 1 end').fill('2026-10-15');
    await a.getByRole('button',{name:'Save collection revision'}).click();
    await a.getByLabel('I checked this address, contact and availability against the recorded source').check();
    await a.getByRole('button',{name:'Confirm source details'}).click();
    await a.getByLabel('Proposed pickup date').fill('2026-10-10');await a.getByRole('button',{name:'Save pickup plan — no booking'}).click();
    await expect(a.getByRole('alert')).toContainText('closure');
    await a.getByRole('button',{name:'Discard draft'}).click();
    const coordinator=await account('demo-coordinator');
    await coordinator.getByLabel('Backup owner',{exact:true}).selectOption('demo-backup');
    await coordinator.getByLabel('Handover reason').fill('Primary officer unavailable — synthetic handover');
    await coordinator.getByRole('button',{name:'Activate backup',exact:true}).click();
    await expect(a.getByText('Read-only. The active Logistics owner handles collection changes.')).toBeVisible({timeout:10000});
    const b=await account('demo-backup');
    await expect(b.getByRole('region',{name:'Your next actions'})).toContainText('Choose an available pickup date');
    await b.getByLabel('Proposed pickup date').fill('2026-10-16');await b.getByRole('button',{name:'Save pickup plan — no booking'}).click();
    await expect(b.getByRole('region',{name:'Your next actions'})).toContainText('Pickup planned locally');
    await b.getByRole('button',{name:'Amend collection details'}).click();await b.getByLabel('Physical collection address').fill('Retained local draft');
    const current=await coordinator.request.get(origin+'/api/review/pilot');const snapshot=await current.json();
    const response=await coordinator.request.post(origin+'/api/review/pilot/collection/'+snapshot.artwork.id,{headers:{Origin:origin},data:{version:snapshot.collection.version,action:'ASSIGN',primaryId:'pilot-Logistics',backupId:'demo-backup',activeId:'demo-backup',reason:'Concurrent confirmed assignment'}});assert.equal(response.status(),200);
    await b.evaluate(()=>window.dispatchEvent(new Event('focus')));
    await expect(b.getByRole('button',{name:'Review latest record and retain draft'})).toBeVisible();
    await expect(b.getByLabel('Physical collection address')).toHaveValue('Retained local draft');
    await b.getByRole('button',{name:'Review latest record and retain draft'}).click();
    await expect(b.getByRole('button',{name:'Save collection revision'})).toBeEnabled();
    // A successful mutation followed by failed reads must not be called a failed save.
    await b.route('**/api/review/pilot**',route=>route.request().method()==='GET'?route.abort():route.continue());
    await b.getByRole('button',{name:'Save collection revision'}).click();
    await expect(b.getByText('Saved; refresh unavailable. Refresh before making another change.')).toBeVisible();
    assert.equal(runtime.repository.read().collectionRevisions.at(-1).address,'Retained local draft');
    assert.equal(runtime.repository.read().collectionRevisions.at(-1).confirmation,null);
    await b.unroute('**/api/review/pilot**');await b.evaluate(()=>window.dispatchEvent(new Event('focus')));
    await expect(b.getByText('Retained local draft, Paris, France',{exact:true})).toBeVisible();
    await b.getByRole('button',{name:'Amend collection details'}).click();await b.getByLabel('Physical collection address').fill('Discard me');
    await b.getByRole('button',{name:'Discard draft'}).click();await expect(b.getByLabel('Demonstration account')).toBeEnabled();
    assert.equal(await b.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
    await b.screenshot({path:join(directory,'tablet-handoff.png'),fullPage:true});
    await b.setViewportSize({width:390,height:844});assert.equal(await b.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
    assert.deepEqual(external,[]);assert.deepEqual(errors,[]);assert.deepEqual(runtime.repository.read().payments,[]);
    console.log('Browser evidence:',directory);
  } finally {await browser.close();await new Promise(r=>server.close(r));}
});
