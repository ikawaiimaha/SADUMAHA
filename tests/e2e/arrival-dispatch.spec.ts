import {test,expect} from '@playwright/test';

test('PR handoff selects airport provider and gates jury manifest without template editing',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/main.tsx*',route=>route.fulfill({contentType:'application/javascript',body:`
    import React from '/node_modules/.vite/deps/react.js';
    import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
    import {SessionDraftProvider} from '/src/context/SessionDrafts.tsx';
    import {ArrivalPackagePreview} from '/src/components/ArrivalPackagePreview.tsx';
    import {ArrivalDispatchPanel} from '/src/components/ArrivalDispatchPanel.tsx';
    import {recordArrivalDispatch} from '/src/data/arrivalPackage.ts';
    import '/src/index.css';
    const h=React.createElement;
    function Harness(){const [desk,setDesk]=React.useState('PR');const [jury,setJury]=React.useState(false);const [rows,setRows]=React.useState([]);
      const recipient={id:jury?'jury':'guest',artistName:jury?'Fictional juror':'Fictional guest',status:'APPROVED',arrivalRecipientTag:jury?'JURY_MEMBER':'GUEST_ARTIST',assignedCoordinatorId:'demo',approvalRevision:1};
      return h('main',null,h('button',{onClick:()=>setDesk(desk==='PR'?'COORDINATOR':'PR')},'Switch desk'),h('button',{onClick:()=>{setJury(!jury);setDesk('PR')}},'Switch recipient'),
        desk==='PR'?h(ArrivalPackagePreview,{key:recipient.id,artistId:recipient.id,artistName:recipient.artistName,isAr:false}):
        h(ArrivalDispatchPanel,{key:recipient.id,recipient,isAr:false,records:rows,publicationReady:true,onDispatch:draft=>setRows(current=>recordArrivalDispatch(current,recipient,draft,'COORDINATOR','demo',true,new Date().toISOString()))}));}
    ReactDOM.createRoot(document.getElementById('root')).render(h(SessionDraftProvider,null,h(Harness)));window.dispatchEvent(new Event('sadu:ready'));
  `}));
  await page.goto('/');
  for(const jury of [false,true]){
    if(jury)await page.getByRole('button',{name:'Switch recipient'}).click();
    await page.getByRole('combobox',{name:'Arrival airport',exact:true}).selectOption(jury?'SHJ':'DXB');
    await page.getByLabel('Sample flight number',{exact:true}).fill('DEMO 101');
    await page.getByLabel('Arrival terminal',{exact:true}).fill('1');
    await page.getByLabel('Arrival time — UAE local (UTC+04:00)',{exact:true}).fill('2026-10-06T14:30');
    for(const checkbox of await page.getByRole('checkbox').all())await checkbox.check();
    await page.getByRole('button',{name:'Switch desk'}).click();
    const dispatch=page.getByRole('button',{name:'Dispatch Arrival Package — Simulate'});
    await expect(dispatch).toBeEnabled();
    await expect(page.locator('textarea,select')).toHaveCount(0);
    await expect(page.getByText(/Proposed airport assistance:/)).toContainText(jury?'Hala':'Marhaba');
    await expect(page.getByText(/Judging Mechanism PDF/)).toHaveCount(jury?1:0);
    await dispatch.click();await expect(dispatch).toBeDisabled();
    await expect(page.getByRole('status')).toContainText('Rehearsal dispatch recorded — no email sent');
    await page.getByRole('button',{name:'Switch desk'}).click();
    await page.getByRole('button',{name:'Switch desk'}).click();
    await expect(dispatch).toBeDisabled();
    await page.getByRole('button',{name:'Switch desk'}).click();
    await page.getByRole('combobox',{name:'Arrival airport',exact:true}).selectOption('OTHER');
    await page.getByRole('button',{name:'Switch desk'}).click();
    await expect(dispatch).toBeDisabled();await expect(page.getByText(/Proposed airport assistance:/)).toHaveCount(0);
    await expect(page.getByText(/Judging Mechanism PDF/)).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
