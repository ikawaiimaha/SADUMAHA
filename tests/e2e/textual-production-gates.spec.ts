import {test,expect} from '@playwright/test';
test('HIP verifies exact text before Committee can endorse; changed text revokes handoff',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.tsx*',route=>route.fulfill({contentType:'application/javascript',body:`
 import React from '/node_modules/.vite/deps/react.js';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
 import {TextualVerificationLedger} from '/src/components/CulturalVerificationCard.tsx';
 import {CommitteeNominationLedger} from '/src/components/PrepCommitteeWorkspace.tsx';
 import {verifyTextualContent} from '/src/data/culturalDeclaration.ts';import {reviewByCommittee,directorEligible} from '/src/data/vetting.ts';import '/src/index.css';
 const h=React.createElement;
 function Harness(){const [role,setRole]=React.useState('PREP_COMMITTEE');const [d,setD]=React.useState({id:'text-test',artistName:'Fictional text artist',artistCategory:'Emerging',nationality:'Test',medium:'Ink',proposedWorkTitle:'Test',assignedCoordinatorId:'demo-coordinator',isCommissioned:true,cvFileName:'cv.pdf',previousWorksCount:1,mockupCount:1,submittedAt:'2026-09-01T10:00:00Z',status:'PENDING_COMMITTEE_REVIEW',culturalDeclaration:{containsText:true,exactText:'Fictional source text and reference',explanation:'Translation and context'}});
 return h('main',null,...['HIP','PREP_COMMITTEE'].map(r=>h('button',{key:r,onClick:()=>setRole(r)},r)),h('button',{onClick:()=>setD(x=>({...x,culturalDeclaration:{...x.culturalDeclaration,exactText:'Changed'}}))},'Change declared text'),h('p',null,directorEligible(d,[])?'Director visible':'Director hidden'),role==='HIP'?h(TextualVerificationLedger,{dossiers:[d],isAr:false,onVerify:()=>setD(x=>verifyTextualContent(x,role,new Date().toISOString()))}):h(CommitteeNominationLedger,{dossiers:[d],tags:[],isAr:false,onReview:(id,endorse,minutes)=>setD(x=>reviewByCommittee(x,role,endorse,minutes,[],new Date().toISOString()))}));}
 ReactDOM.createRoot(document.getElementById('root')).render(h(Harness));window.dispatchEvent(new Event('sadu:ready'));
 `}));
 await page.goto('/');await expect(page.getByRole('button',{name:'Endorse to Director',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'HIP',exact:true}).click();await page.getByRole('button',{name:'Record Textual Verification — rehearsal',exact:true}).click();
 await page.getByRole('button',{name:'PREP_COMMITTEE',exact:true}).click();await page.getByRole('button',{name:'Endorse to Director',exact:true}).click();
 await expect(page.getByText('Director visible',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Change declared text'}).click();await expect(page.getByText('Director hidden',{exact:true})).toBeVisible();expect(errors).toEqual([]);
});
test('test photo approval survives desk switch and unlocks only the approved revision',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.tsx*',route=>route.fulfill({contentType:'application/javascript',body:`
 import React from '/node_modules/.vite/deps/react.js';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';import {SessionDraftProvider} from '/src/context/SessionDrafts.tsx';import {ProductionBridge} from '/src/components/ProductionBridge.tsx';import '/src/index.css';const h=React.createElement;
 function Harness(){const [role,setRole]=React.useState('TECHNICAL');const [revision,setRevision]=React.useState(1);return h('main',null,...['TECHNICAL','ARTIST'].map(r=>h('button',{key:r,onClick:()=>setRole(r)},r)),h('button',{onClick:()=>setRevision(2)},'Amend agreement'),h(ProductionBridge,{artistId:'test-artist',isAr:false,actor:role,revision}));}
 ReactDOM.createRoot(document.getElementById('root')).render(h(SessionDraftProvider,null,h(Harness)));window.dispatchEvent(new Event('sadu:ready'));
 `}));
 await page.goto('/');await page.getByRole('button',{name:'Request Artist Prototyping Sign-Off',exact:true}).click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await page.getByRole('button',{name:'Request Artist Prototyping Sign-Off',exact:true}).click();await dialog.getByLabel('Test title',{exact:true}).fill('Rust Coating Test #1');
 await dialog.locator('input[type=file]').setInputFiles({name:'coating.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
 await dialog.getByRole('button',{name:'Request Artist Approval — simulated',exact:true}).click();
 await expect(page.getByRole('button',{name:'Record Approved Test Work Completed'})).toBeDisabled();
 await page.getByRole('button',{name:'ARTIST',exact:true}).click();await page.getByRole('button',{name:'Approve',exact:true}).click();
 await page.getByRole('button',{name:'TECHNICAL',exact:true}).click();await expect(page.getByRole('button',{name:'Record Approved Test Work Completed'})).toBeEnabled();
 await page.getByRole('button',{name:'Record Approved Test Work Completed'}).click();await expect(page.getByText(/Approved test work completed ·/)).toBeVisible();
 await page.getByRole('button',{name:'Amend agreement'}).click();await expect(page.getByText('Prior agreement revision — not valid for current execution')).toBeVisible();await expect(page.getByRole('button',{name:'Record Approved Test Work Completed'})).toBeDisabled();expect(errors).toEqual([]);
});
