import test from 'node:test';import assert from 'node:assert/strict';
import {cmsConfig,deliver,runCycle} from '../scripts/cms-publication-worker.mjs';
test('CMS stays inert without configuration and rejects unapproved destinations',async()=>{
 assert.equal(cmsConfig({}),null);assert.deepEqual(await runCycle(null,null),{pendingConfiguration:true});
 for(const url of ['http://sdc.gov.ae/hook','https://evil.test','https://sdc.gov.ae.evil.test','https://user:pass@sdc.gov.ae/hook','https://sdc.gov.ae/hook?token=secret'])assert.throws(()=>cmsConfig({SDC_CMS_WEBHOOK_URL:url,SDC_CMS_WEBHOOK_TOKEN:'test'}));
 assert.equal(cmsConfig({SDC_CMS_WEBHOOK_URL:'https://events.sdc.gov.ae/hook',SDC_CMS_WEBHOOK_TOKEN:'test'}).url,'https://events.sdc.gov.ae/hook');
});
test('delivery requires matching acknowledgement and blocks redirects',async()=>{
 const config={url:'https://events.sdc.gov.ae/hook',token:'test'};
 await assert.rejects(deliver(config,{},'event',async()=>({ok:true,json:async()=>({accepted:true,event_id:'wrong'})})));
 await assert.rejects(deliver(config,{},'event',async()=>({ok:false})));
 await deliver(config,{schema_version:1},'event',async(url,opts)=>{assert.equal(opts.redirect,'error');assert.equal(opts.headers['Idempotency-Key'],'event');assert.equal(JSON.parse(opts.body).event_id,'event');return {ok:true,json:async()=>({accepted:true,event_id:'event'})};});
});
function fixture(){
 const writes=[];const item={scenario_id:'scenario',approved_at:'2026-09-29',attempts:0,payload:{exhibition_title:{en:'Balance'},artworks:[{reference_id:'art',media_object:'private/file',ar:{title:'ميزان'},en:{title:'Balance'},year:2026,height_cm:20,width_cm:30}]}};
 const db={from(table){let change;const q={select(){return q},update(v){change=v;writes.push(v);return q},eq(){return q},in(){return q},neq(){return q},lte(){return q},or(){return q},order(){return q},limit(){return q},single(){return q},then(resolve){const data=table==='sadu_publication_queue'?(change?[{scenario_id:'scenario'}]:[item]):table==='sadu_exhibition_scenarios'?{status:'SUBMITTED',contract_id:'contract'}:table==='bilateral_contracts'?{status:'ARTIST_APPROVED'}:{received:true,reviewed_at:'now'};return Promise.resolve({data,error:null}).then(resolve)}};return q},storage:{from(){return {async createSignedUrl(path,ttl){assert.equal(ttl,300);return {data:{signedUrl:'https://storage.test/private-token'},error:null}}}}}};return {db,writes};
}
test('worker strips object paths, acknowledges success and records retriable failure',async()=>{
 const config={url:'https://sdc.gov.ae/hook',token:'test'};const a=fixture();await runCycle(a.db,config,async(url,options)=>{const p=JSON.parse(options.body);assert.equal(p.artworks[0].media_object,undefined);assert.equal(p.artworks[0].media_url_expires_in_seconds,300);return {ok:true,json:async()=>({accepted:true,event_id:p.event_id})};});assert.equal(a.writes.at(-1).sync_status,'Synced');
 const b=fixture();await runCycle(b.db,config,async()=>{throw new Error('Private credential details')});assert.equal(b.writes.at(-1).sync_status,'Failed_Sync');assert.ok(b.writes.at(-1).next_attempt_at);assert.ok(!b.writes.at(-1).last_error.includes('credential'));
});
