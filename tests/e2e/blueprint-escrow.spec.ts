import {test,expect} from '@playwright/test';
test('required blueprint input rejects renamed files and keeps final submission locked',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/lib/pilotSupabase.ts*',route=>route.fulfill({contentType:'application/javascript',body:`
 const scenario={id:'s',contract_id:'c',status:'DRAFT',artwork_checklist:[{id:'z',name:'Wall 1',artworkCount:1,medium:'Print',displaySpecifications:'Framed',printRequired:true,avRequired:false,darkRoom:false,requires_spatial_planning:true}]};
 export const pilotSupabaseUrl='http://localhost:54321';
 export const pilotSupabase={auth:{getUser:async()=>({data:{user:{id:'artist'}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from(table){const q={select(){return q},eq(){return q},in(){return q},maybeSingle:async()=>({data:scenario}),then(resolve){return Promise.resolve({data:table==='bilateral_contracts'?[{id:'c',proposed_work_title:'Fictional print'}]:[],error:null}).then(resolve)}};return q}};
 `}));
 await page.route('**/src/lib/useOperationalRows.ts*',route=>route.fulfill({contentType:'application/javascript',body:`export function useOperationalRows(){return {rows:[],notice:'',live:false,refresh:async()=>{}}}`}));
 await page.route('**/src/main.tsx*',route=>route.fulfill({contentType:'application/javascript',body:`import React from '/node_modules/.vite/deps/react.js';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';import {ExhibitionScenario} from '/src/components/ExhibitionScenario.tsx';import '/src/index.css';ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ExhibitionScenario));window.dispatchEvent(new Event('sadu:ready'));`}));
 await page.goto('/');await page.getByLabel('Accepted database contract').selectOption('c');
 await expect(page.getByRole('checkbox',{name:'Requires spatial planning'})).toBeChecked();
 const input=page.getByLabel('Spatial layout PDF',{exact:false});await expect(input).toHaveAttribute('accept','.pdf,application/pdf');await input.setInputFiles({name:'layout.pdf',mimeType:'application/pdf',buffer:Buffer.from('not a PDF')});
 await expect(page.getByText('Use TIFF/PNG or MP4/MOV up to 2 GiB;', {exact:false})).toBeVisible();await expect(page.getByRole('button',{name:'Submit Final Deliverables'})).toBeDisabled();await page.screenshot({path:testInfo.outputPath('blueprint.png'),fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();expect(errors).toEqual([]);
});
