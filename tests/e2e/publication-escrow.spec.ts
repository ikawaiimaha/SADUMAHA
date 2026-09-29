import {test,expect} from '@playwright/test';
test('Editorial locks exact bilingual revision and amendment removes the design export',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.tsx*',route=>route.fulfill({contentType:'application/javascript',body:`
 import React from '/node_modules/.vite/deps/react.js';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';import {SessionDraftProvider,useSessionDraft} from '/src/context/SessionDrafts.tsx';import {PublicationEscrow} from '/src/components/PublicationEscrow.tsx';import {rosterTransition} from '/src/data/artworkRoster.ts';import '/src/index.css';const h=React.createElement;
 const item={id:'one',titleAr:'ميزان',titleEn:'Balance',descriptionAr:'دراسة الخط والفراغ',descriptionEn:'A study of script and space.',year:'2026',medium:'Ink on paper',height:'100',width:'80',depth:'2',image:new File(['fictional'],'sample.png',{type:'image/png'})};
 const draft={artistId:'fictional',status:'DRAFT',exhibitionTitleAr:'خطوط الضوء',exhibitionTitleEn:'Lines of Light',items:[item],history:[],events:[]};
 function Harness(){const [all,setAll]=useSessionDraft('artwork-rosters:v1',{});const [editorial,setEditorial]=React.useState(true);React.useEffect(()=>setAll({fictional:rosterTransition(draft,{type:'submit',at:'2026-09-01T10:00:00Z'},'ARTIST')}),[]);return h('main',{dir:'rtl',style:{maxWidth:1000,marginInline:'auto',padding:20}},h('button',{onClick:()=>setEditorial(!editorial)},'Switch desk'),h('button',{onClick:()=>setAll(p=>({...p,fictional:rosterTransition(p.fictional,{type:'request',at:new Date().toISOString()},'ARTIST')}))},'Request amendment fixture'),h(PublicationEscrow,{editorial}));}
 ReactDOM.createRoot(document.getElementById('root')).render(h(SessionDraftProvider,null,h(Harness)));window.dispatchEvent(new Event('sadu:ready'));
 `}));
 await page.goto('/');const approve=page.getByRole('button',{name:'Lock text & export bilingual proof'});await expect(approve).toBeDisabled();await page.getByRole('checkbox').check();
 const download=page.waitForEvent('download');await approve.click();const pdf=await download;await pdf.saveAs(testInfo.outputPath('labels.pdf'));await expect(page.getByText('EDITORIAL LOCKED — current design source')).toBeVisible();
 await page.getByRole('button',{name:'Switch desk'}).click();await expect(page.getByRole('button',{name:'Download current bilingual labels PDF'})).toBeVisible();await page.screenshot({path:testInfo.outputPath('publication.png'),fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.getByRole('button',{name:'Request amendment fixture'}).click();await expect(page.getByRole('button',{name:'Download current bilingual labels PDF'})).toHaveCount(0);await expect(page.getByText('No current publication ready.')).toBeVisible();expect(errors).toEqual([]);
});
