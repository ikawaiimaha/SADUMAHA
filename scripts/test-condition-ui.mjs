import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true}),page=await browser.newPage();
try {
 await page.goto('http://127.0.0.1:3010/');
 await page.evaluate(async()=>{
 const React=(await import('/node_modules/.vite/deps/react.js')).default,{createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
 const {ConditionReporting}=await import('/src/components/ConditionReporting.tsx');
 const {commissionReducer,createCommission}=await import('/src/data/commissionScenario.ts');
 const root=createRoot(document.body.appendChild(document.createElement('div')));
 let state=createCommission();state={...state,agreementRevision:1,contracts:[{id:'test',artistId:'demo-kufic-horizon',shippingLiability:'ARTIST',status:'ARTIST_APPROVED'}],logistics:{status:'PHYSICAL_ASSET_RECEIVED',reference:'test-receipt',receivedAt:'2026-09-01T00:00:00Z'}};
 window.conditionRole='LOGISTICS';window.conditionState=()=>state;window.renderCondition=(role)=>{window.conditionRole=role;root.render(React.createElement(ConditionReporting,{state,isAr:false,actor:role,onRecord:a=>{state=commissionReducer(state,a);window.renderCondition(role);}}));};window.renderCondition('LOGISTICS');
 });
 await page.getByLabel('DAMAGED IN TRANSIT',{exact:true}).check();
 assert.equal(await page.getByRole('button',{name:'Record condition report',exact:true}).isDisabled(),true);
 await page.locator('input[type=file]').last().setInputFiles({name:'damage.png',mimeType:'image/png',buffer:Buffer.from('sample rehearsal evidence')});
 await page.getByRole('button',{name:'Record condition report',exact:true}).click();
 await page.getByRole('button',{name:'Dispatch Evidence to Artist Portal',exact:true}).click();
 await page.getByRole('button',{name:'Initiate Plan B (Emergency Re-Production)',exact:true}).click();
 await page.getByLabel('Secondary production grant — AED',{exact:true}).fill('5000');
 await page.getByLabel('Emergency flight — route and date',{exact:true}).fill('Fictional route, 10 October');
 await page.getByLabel('Emergency justification',{exact:true}).fill('Replace damaged work');
 await page.getByRole('button',{name:'Route urgently to Director & Finance',exact:true}).click();
 await page.evaluate(()=>window.renderCondition('FINANCE'));
 assert.equal(await page.getByRole('button',{name:'Record approval',exact:true}).count(),0);
 await page.evaluate(()=>window.renderCondition('BIENNIAL_DIRECTOR'));
 await page.getByRole('button',{name:'Record approval',exact:true}).click();
 await page.evaluate(()=>window.renderCondition('FINANCE'));
 await page.getByRole('button',{name:'Record approval',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.conditionState().emergencyRequests[0].financeDecision),'APPROVED');
 await page.evaluate(()=>window.renderCondition('ARTIST'));
 await page.getByRole('link',{name:'damage.png',exact:true}).waitFor();
 console.log('PASS: damage evidence requirement, Artist evidence bridge, Plan B modal, Director-first Finance approval.');
} finally {await browser.close();}
