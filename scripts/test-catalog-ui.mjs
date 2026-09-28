import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true}),page=await browser.newPage();
try {
 await page.goto('http://127.0.0.1:3010/');
 await page.evaluate(async()=>{
 const React=(await import('/node_modules/.vite/deps/react.js')).default,{createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
 const {ExhibitionMetadata,LiveCatalogAggregator}=await import('/src/components/CatalogMetadata.tsx');
 const {SessionDraftProvider}=await import('/src/context/SessionDrafts.tsx');
 const {commissionReducer,createCommission}=await import('/src/data/commissionScenario.ts');
 const root=createRoot(document.body.appendChild(document.createElement('div')));
 let state={...createCommission(),agreementRevision:1,contracts:[{id:'catalog-test',artistId:'demo-kufic-horizon',artistName:'Test Artist',status:'ARTIST_APPROVED',documents:{highResStatus:'NOT_UPLOADED',artworkDpi:300}}]};
 window.renderCatalog=(hip=false)=>root.render(React.createElement(SessionDraftProvider,null,hip?React.createElement(LiveCatalogAggregator,{state,isAr:false}):React.createElement(ExhibitionMetadata,{state,contract:state.contracts[0],isAr:false,onSubmit:a=>{state=commissionReducer(state,a);window.renderCatalog();}})));
 window.renderCatalog();
 });
 await page.getByLabel('عنوان المعرض بالعربية',{exact:true}).fill('ميزان');
 await page.getByLabel('Exhibition Title in English',{exact:true}).fill('Mizan Test');
 await page.getByLabel('Curatorial Concept / Artist Statement',{exact:true}).fill('A rehearsal artist statement.');
 await page.getByText('August 15, 2026',{exact:true}).waitFor();await page.getByText('September 10, 2026',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Submit to Curatorial Team',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Submit to Curatorial Team',exact:true}).isDisabled(),true);
 await page.evaluate(()=>window.renderCatalog(true));
 await page.getByText('Mizan Test',{exact:true}).waitFor();await page.getByText('A rehearsal artist statement.',{exact:true}).waitFor();
 console.log('PASS: accepted Artist metadata form, supplied deadlines, duplicate lock and live HIP handoff.');
} finally {await browser.close();}
