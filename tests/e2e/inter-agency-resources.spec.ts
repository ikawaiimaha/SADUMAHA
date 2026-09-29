import {test,expect} from '@playwright/test';
test('48-hour contingency routes to Finance and the resource PDF is downloadable',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-10-01T10:00:00Z')});
 await page.route('**/src/main.tsx*',route=>route.fulfill({contentType:'application/javascript',body:`
 import React from '/node_modules/.vite/deps/react.js';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';import {InterAgencyResources} from '/src/components/InterAgencyResources.tsx';import {resourceTransition} from '/src/data/interAgencyResources.ts';import '/src/index.css';const h=React.createElement;
 function Harness(){const [role,setRole]=React.useState('TECHNICAL');const [rows,setRows]=React.useState([]);const keys={demo:'c1:1'};return h('main',null,...['TECHNICAL','COORDINATOR','FINANCE'].map(r=>h('button',{key:r,onClick:()=>setRole(r)},r)),h(InterAgencyResources,{rows,dossiers:[{id:'demo',artistName:'Fictional Artist',assignedCoordinatorId:'demo-coordinator'}],eligibleIds:['demo'],scopeKeys:keys,actor:role,coordinatorId:'demo-coordinator',isAr:false,onAction:a=>{const at=new Date().toISOString();setRows(r=>resourceTransition(r,a.type==='request'?{...a,ticket:{...a.ticket,requestedAt:at}}:a,role,at,['demo'],['demo'],'demo-coordinator',keys));}}));}
 ReactDOM.createRoot(document.getElementById('root')).render(h(Harness));window.dispatchEvent(new Event('sadu:ready'));
 `}));
 await page.goto('/');await page.getByLabel('Eligible dossier with accepted agreement').selectOption('demo');await page.getByLabel('Required date/time — browser local time').fill('2026-10-05T14:00');await page.getByRole('button',{name:'Record Resource Request',exact:true}).click();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download Rehearsal Dispatch PDF'}).click();const pdf=await download;await pdf.saveAs(testInfo.outputPath('resource-request.pdf'));expect(pdf.suggestedFilename()).toMatch(/SADU-resource-.*pdf/);
 await page.getByRole('button',{name:'COORDINATOR',exact:true}).click();await expect(page.getByLabel('Rental vendor')).toBeDisabled();
 await page.clock.fastForward(48*60*60*1000);await expect(page.getByLabel('Rental vendor')).toBeEnabled();await page.getByLabel('Rental vendor').fill('Fictional Rental');await page.getByLabel('Petty-cash request (AED)').fill('500');await page.getByLabel('Rationale',{exact:true}).fill('No agency response');await page.getByRole('button',{name:'Request Finance Approval — rehearsal',exact:true}).click();
 await page.getByRole('button',{name:'FINANCE',exact:true}).click();await page.getByLabel('Finance decision reference').fill('FIN-REHEARSAL-01');await page.getByRole('button',{name:'Approve Request — rehearsal',exact:true}).click();await expect(page.getByText('Fictional Rental · AED 500 · APPROVED')).toBeVisible();await expect(page.getByRole('button',{name:'Approve Request — rehearsal',exact:true})).toHaveCount(0);
 await page.screenshot({path:testInfo.outputPath('resource-finance.png'),fullPage:true});expect(errors).toEqual([]);
});

test('Director workload totals update immediately after reassignment and veto',async({page},testInfo)=>{
 await page.route('**/src/main.tsx*',route=>route.fulfill({contentType:'application/javascript',body:`
 import React from '/node_modules/.vite/deps/react.js';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';import {InstitutionalDashboard} from '/src/components/InstitutionalDashboard.tsx';import {reassignDossier} from '/src/data/institutionalMetrics.ts';import '/src/index.css';const h=React.createElement;
 function Harness(){const [rows,setRows]=React.useState([{id:'demo',artistName:'Fictional Artist',status:'APPROVED',artworkCount:4,assignedCoordinatorId:'demo-coordinator'}]);const [status,setStatus]=React.useState('CONTRACT_EXECUTED');return h('main',null,h('button',{onClick:()=>setStatus('DIRECTOR_VETOED')},'Veto fixture'),h(InstitutionalDashboard,{dossiers:rows,evidence:[{id:'demo',status,prCleared:true}],isAr:false,canReassign:true,lockedIds:[],onReassign:(id,target,reason)=>setRows(r=>reassignDossier(r,id,target,reason,'BIENNIAL_DIRECTOR',new Date().toISOString(),[]))}));}
 ReactDOM.createRoot(document.getElementById('root')).render(h(Harness));window.dispatchEvent(new Event('sadu:ready'));
 `}));
 await page.goto('/');await expect(page.locator('dl').getByText('1',{exact:true})).toHaveCount(3);
 await page.getByRole('combobox',{name:'Dossier',exact:true}).selectOption('demo');await page.getByLabel('New coordinator').selectOption('coordinator-2');await page.getByLabel('Reassignment reason').fill('Balance active work');await page.getByRole('button',{name:'Record Reassignment'}).click();await expect(page.getByRole('meter',{name:'ساره الشيخ: 1 dossiers'})).toHaveAttribute('value','1');
 await page.getByRole('button',{name:'Veto fixture'}).click();await expect(page.locator('dl').getByText('0',{exact:true})).toHaveCount(3);await page.screenshot({path:testInfo.outputPath('workloads.png'),fullPage:true});
});
