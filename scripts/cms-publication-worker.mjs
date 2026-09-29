import {createClient} from '@supabase/supabase-js';
import {pathToFileURL} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import 'dotenv/config';
export function cmsConfig(env){
 if(!env.SDC_CMS_WEBHOOK_URL||!env.SDC_CMS_WEBHOOK_TOKEN)return null;
 const url=new URL(env.SDC_CMS_WEBHOOK_URL);
 if(url.protocol!=='https:'||url.username||url.password||url.hash||url.search||!(url.hostname==='sdc.gov.ae'||url.hostname.endsWith('.sdc.gov.ae')))throw new Error('CMS destination must be approved HTTPS SDC infrastructure');
 return {url:url.href,token:env.SDC_CMS_WEBHOOK_TOKEN};
}
export async function deliver(config,payload,eventId,fetcher=fetch){
 const response=await fetcher(config.url,{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json',Authorization:`Bearer ${config.token}`,'Idempotency-Key':eventId},body:JSON.stringify({...payload,event_id:eventId})});
 if(!response.ok)throw new Error('CMS rejected delivery');
 const ack=await response.json();if(ack?.accepted!==true||ack?.event_id!==eventId)throw new Error('CMS acknowledgement mismatch');
}
export async function runCycle(db,config,fetcher=fetch){
 if(!config)return {pendingConfiguration:true};
 const now=new Date().toISOString();const found=await db.from('sadu_publication_queue').select('*').in('sync_status',['Pending_Sync','Failed_Sync']).neq('status','CANCELLED').lte('next_attempt_at',now).or(`lease_until.is.null,lease_until.lt.${now}`).order('approved_at').limit(5);if(found.error)throw new Error('Queue unavailable');
 let processed=0;
 for(const item of found.data??[]){
  const lease=new Date(Date.now()+120000).toISOString();const claim=await db.from('sadu_publication_queue').update({lease_until:lease,attempts:item.attempts+1}).eq('scenario_id',item.scenario_id).in('sync_status',['Pending_Sync','Failed_Sync']).neq('status','CANCELLED').or(`lease_until.is.null,lease_until.lt.${now}`).select('scenario_id');if(claim.error||!claim.data?.length)continue;
  try{
   const scenario=await db.from('sadu_exhibition_scenarios').select('contract_id,status').eq('id',item.scenario_id).single();if(scenario.error||scenario.data?.status!=='SUBMITTED')throw new Error();
   const contract=await db.from('bilateral_contracts').select('status').eq('id',scenario.data.contract_id).single();if(contract.error||!['ARTIST_APPROVED','LOCKED'].includes(contract.data?.status))throw new Error();
   const artworks=[];
   for(const a of item.payload.artworks){
    if(Date.now()>Date.parse(lease)-30000)throw new Error();
    const evidence=await db.from('sadu_media_inventory').select('received,reviewed_at').eq('object_name',a.media_object).single();if(evidence.error||!evidence.data?.received||!evidence.data.reviewed_at)throw new Error();
    const signed=await db.storage.from('logistics-secure').createSignedUrl(a.media_object,300);if(signed.error)throw new Error();
    artworks.push({reference_id:a.reference_id,ar:a.ar,en:a.en,year:a.year,height_cm:a.height_cm,width_cm:a.width_cm,media_url:signed.data.signedUrl,media_url_expires_in_seconds:300});
   }
   if(Date.now()>Date.parse(lease)-30000)throw new Error();
   await deliver(config,{schema_version:1,exhibition_title:item.payload.exhibition_title,artworks},`sadu:${item.scenario_id}:${item.approved_at}`,fetcher);
   const done=await db.from('sadu_publication_queue').update({status:'DELIVERED',sync_status:'Synced',delivered_at:new Date().toISOString(),lease_until:null,last_error:null}).eq('scenario_id',item.scenario_id).eq('lease_until',lease);if(done.error)throw new Error();processed++;
  }catch{
   const backoff=Math.min(86400000,60000*2**Math.min(item.attempts,10));
   await db.from('sadu_publication_queue').update({status:'FAILED',sync_status:'Failed_Sync',lease_until:null,last_error:'Delivery not confirmed; check server integration and current approved assets.',next_attempt_at:new Date(Date.now()+backoff).toISOString()}).eq('scenario_id',item.scenario_id).eq('lease_until',lease);
  }
 }
 return {processed};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const config=cmsConfig(process.env);
 if(!config){console.log('CMS not configured; publication records remain pending.');}
 else{
  if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Server database configuration missing');
  const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  do{try{console.log(await runCycle(db,config));}catch{console.error('Publication worker cycle failed; retry scheduled.');}if(process.argv.includes('--once'))break;await delay(15000);}while(true);
 }
}
