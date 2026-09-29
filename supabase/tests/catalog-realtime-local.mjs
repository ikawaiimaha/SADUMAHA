// Local-only integration: two authenticated clients and a real Realtime notification.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHmac,randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const db='supabase_db_SADUMAHA-main';
const sql=q=>execFileSync('docker',['exec','-i',db,'psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-qtA'],{input:q,encoding:'utf8',stdio:['pipe','pipe','pipe']});
const config=JSON.parse(execFileSync('docker',['inspect','supabase_storage_SADUMAHA-main'],{encoding:'utf8'}))[0];
const env=Object.fromEntries(config.Config.Env.map(s=>[s.slice(0,s.indexOf('=')),s.slice(s.indexOf('=')+1)]));
const port=execFileSync('docker',['port','supabase_kong_SADUMAHA-main','8000/tcp'],{encoding:'utf8'}).trim().split('\n')[0].split(':').at(-1);
const url=`http://127.0.0.1:${port}`;
const artist=randomUUID(),operator=randomUUID(),booking=randomUUID(),scenario=randomUUID(),zone=randomUUID(),artwork=randomUUID(),contract='realtime-test-'+randomUUID();
const encode=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
function token(id,role){const base=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:id,role:'authenticated',institutional_role:role,app_metadata:{institutional_role:role},aud:'authenticated',exp:Math.floor(Date.now()/1000)+300});return base+'.'+createHmac('sha256',env.AUTH_JWT_SECRET).update(base).digest('base64url');}
const artistJWT=token(artist,'ARTIST'),logisticsJWT=token(operator,'LOGISTICS');
const viewer=createClient(url,env.ANON_KEY,{accessToken:async()=>artistJWT,auth:{persistSession:false}});
const editorial=createClient(url,env.ANON_KEY,{accessToken:async()=>token(operator,'EDITORIAL'),auth:{persistSession:false}});
const logistics=createClient(url,env.ANON_KEY,{accessToken:async()=>logisticsJWT,auth:{persistSession:false}});
let seeded=false,channel;
try{
 let fixture=readFileSync(new URL('./catalog-freight.sql',import.meta.url),'utf8');
 const cut=fixture.indexOf('select set_config',fixture.indexOf("change_status='PENDING';")+1);fixture=fixture.slice(0,cut)+'commit;';
 for(const [old,value] of [['11111111-1111-4111-8111-111111111111',artist],['22222222-2222-4222-8222-222222222222',scenario],['33333333-3333-4333-8333-333333333333',zone],['44444444-4444-4444-8444-444444444444',artwork],['66666666-6666-4666-8666-666666666666',booking],['catalog-test',contract]])fixture=fixture.replaceAll(old,value);
 sql(fixture);seeded=true;
 await viewer.realtime.setAuth(artistJWT);
 let resolveTranslation;const translated=new Promise(resolve=>{resolveTranslation=resolve;});
 let resolveEvent;const event=new Promise(resolve=>{resolveEvent=resolve;});
 channel=viewer.channel('local-shipment-test-'+randomUUID()).on('postgres_changes',{event:'UPDATE',schema:'public',table:'sadu_freight_bookings',filter:`id=eq.${booking}`},payload=>{if(payload.new.status==='IN_TRANSIT')resolveEvent(payload.new);}).on('postgres_changes',{event:'UPDATE',schema:'public',table:'sadu_artwork_checklist',filter:`id=eq.${artwork}`},payload=>{if(payload.new.translation_status==='TRANSLATION_COMPLETED')resolveTranslation(payload.new);});
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Realtime subscription timed out')),15000);channel.subscribe(status=>{if(status==='SUBSCRIBED'){clearTimeout(timer);resolve();}if(status==='CHANNEL_ERROR'){clearTimeout(timer);reject(new Error('Realtime subscription failed'));}});});
 const approval=await logistics.from('sadu_freight_bookings').update({change_status:'APPROVED'}).eq('id',booking);if(approval.error)throw new Error('Date approval API failed');
 const update=await logistics.from('sadu_freight_bookings').update({status:'IN_TRANSIT'}).eq('id',booking);if(update.error)throw new Error('Shipment API update failed');
 let timer;try{await Promise.race([event,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Artist did not receive Realtime event')),15000);})]);}finally{clearTimeout(timer);}
 const fresh=await viewer.from('sadu_freight_bookings').select('status,history').eq('id',booking).single();if(fresh.error||fresh.data.status!=='IN_TRANSIT'||fresh.data.history.length!==4)throw new Error('Artist readback or history mismatch');
 const translation=await editorial.from('sadu_artwork_checklist').update({translation_ar:{title:'ميزان',medium:'حبر',concept:'دراسة',bio:'سيرة'},translation_status:'TRANSLATION_COMPLETED'}).eq('id',artwork);if(translation.error)throw new Error('Editorial API approval failed');
 let translationTimer;try{await Promise.race([translated,new Promise((_,reject)=>{translationTimer=setTimeout(()=>reject(new Error('Translation Realtime timeout')),15000);})]);}finally{clearTimeout(translationTimer);}
 console.log('PASS: Logistics shipment and Editorial translation updates reached Artist via Supabase Realtime; booking history retained.');
}finally{
 if(channel)await viewer.removeChannel(channel);
 viewer.realtime.disconnect();logistics.realtime.disconnect();
 if(seeded)sql(`begin;set local storage.allow_delete_query='true';delete from public.sadu_freight_bookings where id='${booking}';delete from public.sadu_artwork_checklist where id='${artwork}';delete from storage.objects where bucket_id='logistics-secure' and name='${artist}/scenarios/${scenario}/${zone}/PRINT/test.png';delete from public.sadu_scenario_media where scenario_id='${scenario}';delete from public.sadu_exhibition_scenarios where id='${scenario}';delete from public.bilateral_contracts where id='${contract}';delete from auth.users where id='${artist}';commit;`);
}
