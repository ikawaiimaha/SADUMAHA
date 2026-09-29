// Local-only gallery capability API test; synthetic fixtures only.
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

let seeded=false;
try {
 let seed=readFileSync('supabase/tests/catalog-freight.sql','utf8').split('select public.sadu_issue_consignment')[0];
 for(const [old,value] of [['11111111-1111-4111-8111-111111111111',artist],['22222222-2222-4222-8222-222222222222',scenario],['33333333-3333-4333-8333-333333333333',zone],['44444444-4444-4444-8444-444444444444',artwork],['catalog-test',contract]])seed=seed.replaceAll(old,value);
 sql(seed+'commit;');seeded=true;
 const issued=await viewer.rpc('sadu_issue_consignment',{a:artwork,o:'THIRD_PARTY_GALLERY',n:'Fictional Gallery',e:'gallery@example.invalid'});
 if(issued.error||!issued.data)throw new Error('Gallery invitation API failed');
 const anonymous=createClient(url,env.ANON_KEY,{auth:{persistSession:false}});
 const payload={length_cm:120,width_cm:80,height_cm:40,weight_kg:84,insurance_value:8000,currency:'EUR',country:'France',city:'Paris',district:'Test',street:'Test',building:'Test Gallery',map_url:'https://maps.google.com/?q=test',hours:'8 AM - 12 PM, call one hour prior',phone:'+33123456789'};
 const received=await anonymous.rpc('sadu_receive_consignment',{t:issued.data,d:payload});if(received.error)throw new Error('Anonymous token submission API failed');
 const replay=await anonymous.rpc('sadu_receive_consignment',{t:issued.data,d:payload});if(!replay.error)throw new Error('Replay accepted');
 const read=await logistics.from('sadu_consignments').select('*').eq('artwork_id',artwork).single();if(read.error||read.data.status!=='CONSIGNMENT_DATA_RECEIVED'||read.data.details.weight_kg!==84)throw new Error('Logistics handoff failed');
 const leaked=await anonymous.from('sadu_consignments').select('*');if(!leaked.error)throw new Error('Anonymous table read allowed');
 console.log('PASS: owned invitation -> anonymous one-time submission -> Logistics receipt; replay and anonymous reads denied.');
}finally{
 if(seeded)sql(`begin;set local storage.allow_delete_query='true';delete from sadu_private.consignment_tokens where consignment_id in(select id from public.sadu_consignments where artwork_id='${artwork}');delete from public.sadu_consignments where artwork_id='${artwork}';delete from public.sadu_artwork_checklist where id='${artwork}';delete from storage.objects where bucket_id='logistics-secure' and name='${artist}/scenarios/${scenario}/${zone}/PRINT/test.png';delete from public.sadu_scenario_media where scenario_id='${scenario}';delete from public.sadu_exhibition_scenarios where id='${scenario}';delete from public.bilateral_contracts where id='${contract}';delete from auth.users where id='${artist}';commit;`);
}
