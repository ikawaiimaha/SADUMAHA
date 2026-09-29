import {test,expect} from '@playwright/test';
test('room and venue approval flow into read-only Technical matrix without another request',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.tsx*',route=>route.fulfill({contentType:'application/javascript',body:`
 import React from '/node_modules/.vite/deps/react.js';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
 import {SessionDraftProvider} from '/src/context/SessionDrafts.tsx';
 import {SharedSpatialLedger} from '/src/components/SharedSpatialLedger.tsx';
 import {GreenlightedTechnicalMatrix} from '/src/components/TechnicalRequirements.tsx';
 import {GovernanceDesk} from '/src/components/VenueGovernance.tsx';import '/src/index.css';
 const h=React.createElement;
 function Harness(){const [desk,setDesk]=React.useState('COORDINATOR');const [changed,setChanged]=React.useState(false);
 const dossier={id:'fictional-projector',artistName:'Fictional installation artist',medium:'Video installation',status:'APPROVED',assignedCoordinatorId:'demo-coordinator',approvalRevision:1,technicalRequirements:[{id:'av',equipment:'AV_PROJECTOR',specifications:changed?'8K projector':'4K projector',mounting:'CEILING_MOUNT'}]};
 return h('main',null,...['COORDINATOR','VENUE','TECHNICAL'].map(d=>h('button',{key:d,onClick:()=>setDesk(d)},d)),
 h('button',{onClick:()=>setChanged(true)},'Revised specifications'),
 desk==='COORDINATOR'?h(SharedSpatialLedger,{isAr:false,coordinatorId:'demo-coordinator',dossiers:[dossier]}):desk==='VENUE'?h(GovernanceDesk,{role:'COORDINATOR',pending:[]}):h(GreenlightedTechnicalMatrix,{dossier,isAr:false}));}
 ReactDOM.createRoot(document.getElementById('root')).render(h(SessionDraftProvider,null,h(Harness)));window.dispatchEvent(new Event('sadu:ready'));
 `}));
 await page.goto('/');
 await expect(page.getByText('AWAITING_APPROVED_ROOM',{exact:true})).toBeVisible();
 const room=page.getByRole('article').filter({has:page.getByRole('heading',{name:'Sharjah Art Museum - Hall 1',exact:true})});
 await room.getByRole('combobox').selectOption('fictional-projector');await room.getByRole('button',{name:'Claim Space',exact:true}).click();
 await expect(page.getByText('PENDING_VENUE_APPROVAL',{exact:true}).first()).toBeVisible();
 await page.getByRole('button',{name:'TECHNICAL',exact:true}).click();
 await expect(page.getByText('CLEARED_BY_CURATOR',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'VENUE',exact:true}).click();
 await page.locator('summary').click();
 await page.getByRole('button',{name:'Clear for Venue — rehearsal',exact:true}).click();
 await page.getByRole('button',{name:'TECHNICAL',exact:true}).click();
 await expect(page.getByText('CLEARED_BY_CURATOR',{exact:true})).toBeVisible();
 await expect(page.getByText('4K projector',{exact:true})).toBeVisible();
 await expect(page.getByText(/Sharjah Art Museum - Hall 1/)).toBeVisible();
 await expect(page.getByRole('button',{name:/Clear for Venue|Record both routes/})).toHaveCount(0);
 await page.getByRole('button',{name:'Revised specifications',exact:true}).click();
 await expect(page.getByText('CLEARED_BY_CURATOR',{exact:true})).toHaveCount(0);
 await expect(page.getByText('PENDING_VENUE_APPROVAL',{exact:true})).toBeVisible();
 expect(errors).toEqual([]);
});
