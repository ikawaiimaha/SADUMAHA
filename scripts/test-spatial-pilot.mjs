import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert/strict';
const config=JSON.parse(execFileSync('cmd.exe',['/d','/s','/c','npx supabase status -o json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));
assert.equal(config.API_URL,'http://127.0.0.1:55321');
const roomId='pilot-test-'+crypto.randomUUID();
const opts={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(config.API_URL,config.SERVICE_ROLE_KEY,opts), ids=[];
const sql=input=>execFileSync('docker',['exec','-i','supabase_db_SADUMAHA-main','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{input,encoding:'utf8',stdio:['pipe','pipe','pipe']});
const client=()=>createClient(config.API_URL,config.ANON_KEY,opts);
async function user(role){const email=`pilot-${crypto.randomUUID()}@example.test`,password=crypto.randomUUID()+'!aA1';const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.equal(error,null);ids.push(data.user.id);sql(`insert into public.sadu_pilot_members values ('${data.user.id}','${role}');`);const c=client();assert.equal((await c.auth.signInWithPassword({email,password})).error,null);return {c,id:data.user.id};}
try {
 sql(`insert into public.sadu_pilot_spaces values ('${roomId}','Test venue','Test room','Test curator');`);
 const a=await user('COORDINATOR'),b=await user('COORDINATOR'),director=await user('BIENNIAL_DIRECTOR'),tech=await user('TECHNICAL');
 assert.ok((await client().from('sadu_pilot_dossiers').select()).error);
 assert.ok((await a.c.from('sadu_pilot_members').update({role:'BIENNIAL_DIRECTOR'}).eq('user_id',a.id)).error);
 await a.c.auth.updateUser({data:{institutional_role:'BIENNIAL_DIRECTOR'}});
 async function dossier(c,name){const r=await c.from('sadu_pilot_dossiers').insert({artist_name:name,nationality:'Fictional',medium:'Bronze'}).select().single();assert.equal(r.error,null);return r.data;}
 const da=await dossier(a.c,'Pilot A'),db=await dossier(b.c,'Pilot B');
 assert.equal((await b.c.from('sadu_pilot_dossiers').select().eq('id',da.id)).data.length,0);
 assert.ok((await a.c.from('sadu_pilot_claims').insert({space_id:roomId,dossier_id:da.id})).error);
 assert.equal((await a.c.from('sadu_pilot_dossiers').update({status:'APPROVED'}).eq('id',da.id).select()).data.length,0);
 for(const id of [da.id,db.id])assert.equal((await director.c.from('sadu_pilot_dossiers').update({status:'APPROVED'}).eq('id',id).select().single()).error,null);
 assert.ok((await b.c.from('sadu_pilot_claims').insert({space_id:roomId,dossier_id:da.id})).error);
 const race=await Promise.all([a.c.from('sadu_pilot_claims').insert({space_id:roomId,dossier_id:da.id}).select().single(),b.c.from('sadu_pilot_claims').insert({space_id:roomId,dossier_id:db.id}).select().single()]);
 assert.equal(race.filter(r=>!r.error).length,1);assert.equal(race.find(r=>r.error).error.code,'23505');
 const claim=race.find(r=>!r.error).data,foreign=claim.claimed_by===a.id?b:a;
 const payload={claim_id:claim.id,equipment:'Lighting Rig',mounting:'Ceiling Mount',phase:'FINAL_INSTALLATION'};
 assert.ok((await foreign.c.from('sadu_pilot_requests').insert(payload)).error);
 assert.equal((await tech.c.from('sadu_pilot_requests').insert(payload)).error,null);
 const session=(await tech.c.auth.getSession()).data.session,restored=client();assert.equal((await restored.auth.setSession({access_token:session.access_token,refresh_token:session.refresh_token})).error,null);
 assert.equal((await restored.from('sadu_pilot_requests').select().eq('claim_id',claim.id)).data.length,1);
 assert.ok((await tech.c.from('sadu_pilot_claims').delete().eq('id',claim.id)).error);
 console.log('PASS: Auth/API ownership, role escalation denial, approval gate, concurrent claims, technical authorization, session restoration and immutable claims.');
} finally {
 if(ids.length){const list=ids.map(id=>`'${id}'`).join(',');sql(`delete from public.sadu_pilot_requests where requested_by in (${list});delete from public.sadu_pilot_claims where claimed_by in (${list});delete from public.sadu_pilot_dossiers where coordinator_id in (${list});delete from public.sadu_pilot_members where user_id in (${list});`);for(const id of ids)await admin.auth.admin.deleteUser(id);}
 sql(`delete from public.sadu_pilot_spaces where id='${roomId}';`);
}
