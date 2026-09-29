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


let seeded=false;const report=randomUUID(),path=`${artist}/condition-reports/${report}/${randomUUID()}.png`;
try {
 sql(`begin;insert into auth.users(id) values('${artist}');insert into public.bilateral_contracts(id,artist_id,artist_name,status) values('${contract}','${artist}','Fictional condition test','ARTIST_APPROVED');commit;`);seeded=true;
 const registered=await logistics.from('sadu_condition_reports').insert({id:report,contract_id:contract,artist_id:artist,description:'Loose screws',photos:[path]});if(registered.error)throw new Error('Registrar insert failed');
 const photo=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
 const uploaded=await logistics.storage.from('logistics-secure').upload(path,photo,{contentType:'image/png',upsert:false});if(uploaded.error)throw new Error('Private evidence upload failed');
 const routed=await logistics.from('sadu_condition_reports').update({status:'DAMAGED_PENDING_ARTIST_APPROVAL'}).eq('id',report).select('id').single();if(routed.error)throw new Error('Evidence finalization failed');
 const read=await viewer.from('sadu_condition_reports').select('*').eq('id',report).single();if(read.error||read.data.status!=='DAMAGED_PENDING_ARTIST_APPROVAL')throw new Error('Artist alert missing');
 const image=await viewer.storage.from('logistics-secure').download(path);if(image.error||image.data.size!==photo.length)throw new Error('Artist photo download failed');
 const denied=await editorial.from('sadu_condition_reports').select('*').eq('id',report);if(denied.data?.length)throw new Error('Unrelated role read report');
 const choice=await viewer.from('sadu_condition_reports').update({status:'ARTIST_REPAIR_PLANNED'}).eq('id',report).select('status,decided_by,decision_at').single();if(choice.error||choice.data.decided_by!==artist||!choice.data.decision_at)throw new Error('Artist decision failed');
 const repeat=await viewer.from('sadu_condition_reports').update({status:'REPAIR_AUTHORIZED'}).eq('id',report).select('id');if(repeat.data?.length)throw new Error('Decision overwritten');
 console.log('PASS: private photo upload -> Artist read/download -> immutable authenticated repair choice; unrelated Editorial access denied.');
}finally{
 if(seeded)sql(`begin;set local storage.allow_delete_query='true';delete from storage.objects where bucket_id='logistics-secure' and name='${path}';delete from public.sadu_condition_reports where id='${report}';delete from public.bilateral_contracts where id='${contract}';delete from auth.users where id='${artist}';commit;`);
}
