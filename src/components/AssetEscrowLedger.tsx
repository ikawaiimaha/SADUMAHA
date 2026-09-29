import {useEffect,useRef,useState} from 'react';
import {Lock,HardDriveDownload} from 'lucide-react';
import {pilotSupabase as client} from '../lib/pilotSupabase';
type Receipt={scenario_id:string;contract_id:string;submitted_at:string|null;escrow_ready:boolean};
type Media={object_name:string;scenario_id:string;file_name:string;category:string};
export function AssetEscrowLedger({contractId}:{contractId?:string}) {
 const [rows,setRows]=useState<Receipt[]>([]),[files,setFiles]=useState<Media[]>([]),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const epoch=useRef(0);
 async function refresh(){const gen=++epoch.current;setRows([]);setFiles([]);setNotice('');setBusy(true);
  try {if(!client)throw new Error('Authenticated storage is not configured; execution remains locked.');
   const auth=await client.auth.getUser();if(!auth.data.user)throw new Error('Sign in to inspect private asset escrow. Rehearsal files do not count.');
   let query=client.from('sadu_asset_escrow').select('scenario_id,contract_id,submitted_at,escrow_ready');if(contractId)query=query.eq('contract_id',contractId);
   const result=await query;if(result.error)throw new Error('Escrow evidence unavailable. Check the authenticated account and database migration.');
   const receipts=result.data as Receipt[];const ids=receipts.filter(r=>r.escrow_ready).map(r=>r.scenario_id);
   const media=ids.length?await client.from('sadu_scenario_media').select('object_name,scenario_id,file_name,category').in('scenario_id',ids):{data:[],error:null};
   if(media.error)throw new Error('Private media registry unavailable.');
   if(gen===epoch.current){setRows(receipts);setFiles(media.data??[]);setNotice(receipts.length?'':'No matching asset escrow receipt. Execution remains locked.');}
  }catch(error){if(gen===epoch.current)setNotice(error instanceof Error?error.message:'Escrow check failed.');}
  finally{if(gen===epoch.current)setBusy(false);}
 }
 useEffect(()=>{void refresh();const subscription=client?.auth.onAuthStateChange((event)=>{if(event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')return;epoch.current++;setBusy(false);setRows([]);setFiles([]);setNotice('Account changed. Refresh escrow evidence.');});return()=>{epoch.current++;subscription?.data.subscription.unsubscribe();};},[contractId]);
 async function download(file:Media){if(!client||busy)return;const gen=epoch.current;setBusy(true);try{
  // Authorization and current object existence are checked again by Storage.
  const result=await client.storage.from('logistics-secure').createSignedUrl(file.object_name,60,{download:file.file_name});
  if(result.error)throw new Error('File unavailable or access denied. Refresh escrow evidence.');
  if(gen!==epoch.current)return;const anchor=document.createElement('a');anchor.href=result.data.signedUrl;anchor.rel='noopener';anchor.click();
 }catch(error){if(gen===epoch.current)setNotice(error instanceof Error?error.message:'Download failed.');}finally{if(gen===epoch.current)setBusy(false);}}
 return <section className="my-5 space-y-4 rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start">
  <h2 className="flex items-center gap-2 text-xl font-semibold"><Lock aria-hidden="true"/>عهدة الأصول الرقمية / Digital Asset Escrow</h2>
  <p>Agreement acceptance alone does not establish execution readiness. Every declared print/video zone and required spatial PDF blueprint needs a completed private upload and a locked final checklist. Local sample files and external links do not qualify.</p>
  <button type="button" disabled={busy} className="rounded border ps-4 pe-4 py-2 disabled:opacity-50" onClick={()=>void refresh()}>تحديث الأدلة / Refresh Escrow Evidence</button>
  <p role="status" aria-live="polite">{notice}</p>
  {rows.map(row=><article key={row.scenario_id} className="space-y-3 rounded border bg-[#FFFDF7] ps-4 pe-4 py-4"><h3>Contract <bdi>{row.contract_id}</bdi></h3><p role="status">{row.escrow_ready?'الأصول مكتملة / Asset escrow ready':'مقفل — ملفات ناقصة / Locked — missing final assets'}</p>{row.submitted_at&&<time dateTime={row.submitted_at}>{row.submitted_at}</time>}
   {row.escrow_ready&&files.filter(f=>f.scenario_id===row.scenario_id).map(file=><button key={file.object_name} type="button" disabled={busy} className="flex max-w-full items-center gap-2 rounded border ps-3 pe-3 py-2 text-start disabled:opacity-50" onClick={()=>void download(file)}><HardDriveDownload aria-hidden="true" className="shrink-0"/><span className="break-all">{file.category} · {file.file_name}</span></button>)}
  </article>)}
  <p className="text-sm text-[#736357]">Authorized Technical accounts access the same artwork files, independent of the uploader. Storage evidence only; contract acceptance, cultural review, venue safety and Finance approval remain separate. Private links expire after one minute.</p>
 </section>;
}
