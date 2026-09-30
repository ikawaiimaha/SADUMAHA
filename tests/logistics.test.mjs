import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ACCOUNTS } from '../server/review-store.mjs';
import { openLogisticsStore, PHYSICAL_STATUSES } from '../server/logistics-store.mjs';
import { createRehearsalApp } from '../server/rehearsal-server.mjs';
const [artist, coordinator, director] = ACCOUNTS;
const logistics = { origin: 'Fictional studio loading bay', destination: 'Fictional Sharjah gallery receiving bay', carrier: 'Demo carrier / TEST-001', handling: 'Keep upright. Use rated lifting equipment.', gross_weight_kg: 105 };
const approved = { revisions: [{ number: 3, status: 'Publication_Approved', content: { title: 'Kufic Horizon', label: { artistName: 'Noura Al Mazrouei' } } }] };
async function setup() { const file = join(await mkdtemp(join(tmpdir(), 'sadu-crates-')), 'logistics.json'); let review = structuredClone(approved); const store = await openLogisticsStore(file, () => review); const act = (actor, command) => store.act(actor, { version: store.read(actor).version, ...command }); return { file, store, act, revise: () => { review.revisions[0].number++; } }; }
test('manifest requires approved content and complete logistics; stores one stable artwork ID', async () => {
 const { store, act, revise } = await setup();
 await assert.rejects(act(artist, { action: 'save', logistics: { ...logistics, gross_weight_kg: 0 } }), e => e.status === 422);
 await assert.rejects(act(coordinator, { action: 'save', logistics }), e => e.status === 403);
 await act(artist, { action: 'save', logistics }); const id = store.read(artist).artwork_records[0].id;
 await act(artist, { action: 'save', logistics }); assert.equal(store.read(artist).artwork_records[0].id, id);
 const pdf = store.manifest(artist, id); assert.equal(pdf.subarray(0,5).toString(), '%PDF-');
 revise(); assert.throws(() => store.manifest(artist, id), e => e.status === 409);
 const blocked = await openLogisticsStore(join(tmpdir(), `unapproved-${Date.now()}.json`), () => ({ revisions: [] }));
 await assert.rejects(blocked.act(artist, { version: 0, action: 'save', logistics }), e => e.status === 409);
});
test('arrival is scoped, durable, idempotent and independent of other approvals', async () => {
 const { store, file, act } = await setup(); await act(artist, { action: 'save', logistics }); const id = store.read(artist).artwork_records[0].id;
 assert.throws(() => store.read(director), e => e.status === 403);
 assert.throws(() => store.read({ ...artist, artistId: 'other' }), e => e.status === 403);
 await assert.rejects(act(artist, { action: 'arrive', artwork_id: id, note: 'Received at demo bay' }), e => e.status === 403);
 await assert.rejects(act(coordinator, { action: 'arrive', artwork_id: 'unknown', note: 'Received' }), e => e.status === 404);
 await assert.rejects(act(coordinator, { action: 'arrive', artwork_id: id, note: '' }), e => e.status === 422);
 await assert.rejects(act(coordinator, { action: 'status', artwork_id: id, physical_status: 'Installed', note: 'Mounted' }), e => e.status === 409);
 await act(coordinator, { action: 'arrive', artwork_id: id, note: 'Received at fictional Sharjah bay' }); const before = store.read(coordinator);
 await act(coordinator, { action: 'arrive', artwork_id: id, note: 'Repeated scan' }); assert.deepEqual(store.read(coordinator), before);
 const reopened = await openLogisticsStore(file, () => approved); assert.deepEqual(reopened.read(coordinator), before);
 await assert.rejects(act(coordinator, { action: 'status', artwork_id: id, physical_status: 'In_Transit', note: 'Backward move' }), e => e.status === 409);
 await assert.rejects(act(artist, { action: 'save', logistics }), e => e.status === 409);
 assert.equal(before.artwork_records[0].physical_status, 'On_Site_Sharjah'); assert.equal(approved.revisions[0].status, 'Publication_Approved');
});
test('all forward movement states preserve actor, observation and time; competing updates conflict', async () => {
 const { store, act } = await setup(); await act(artist, { action: 'save', logistics }); const id = store.read(artist).artwork_records[0].id;
 const v = store.read(coordinator).version;
 const results = await Promise.allSettled([1,2].map(() => store.act(coordinator,{version:v,action:'status',artwork_id:id,physical_status:'In_Transit',note:'Collected'})));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 for (const status of PHYSICAL_STATUSES.slice(2)) await act(coordinator,{action:'status',artwork_id:id,physical_status:status,note:'Fictional observation at venue'});
 assert.equal(store.read(coordinator).artwork_records[0].physical_status,'Installed');
 assert.ok(store.read(coordinator).events.at(-1).at);
});
test('logistics HTTP API requires a session and rejects forged role and cross-origin actions', async t => {
 const file = join(await mkdtemp(join(tmpdir(),'sadu-crate-http-')),'review.json'); const app = await createRehearsalApp({ prelaunchGate: (_req, _res, next) => next(), file});
 const server = await new Promise(resolve => { const s=app.listen(0,'127.0.0.1',()=>resolve(s)); }); t.after(()=>new Promise(resolve=>server.close(resolve)));
 const origin=`http://127.0.0.1:${server.address().port}`;
 assert.equal((await fetch(`${origin}/api/review/logistics`)).status,401);
 const login=await fetch(`${origin}/api/review/session`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({accountId:artist.id})}); const cookie=login.headers.get('set-cookie').split(';')[0];
 const post = (extra, source=origin)=>fetch(`${origin}/api/review/logistics`,{method:'POST',headers:{Origin:source,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({version:0,action:'arrive',artwork_id:'x',note:'test',...extra})});
 assert.equal((await post({role:'General_Exhibition_Coordinator'})).status,403); assert.equal((await post({},'https://example.invalid')).status,403);
 assert.equal((await fetch(`${origin}/api/review/logistics/unknown/manifest.pdf`,{headers:{Cookie:cookie}})).status,404);
});

test('a shipped crate retains its historical manifest after a publication amendment', async () => {
 const {store,act,revise}=await setup();await act(artist,{action:'save',logistics});const id=store.read(artist).artwork_records[0].id;
 await act(coordinator,{action:'status',artwork_id:id,physical_status:'In_Transit',note:'Collected at fictional loading bay'});
 const before=store.read(artist);revise();
 assert.equal(store.manifest(artist,id).subarray(0,5).toString(),'%PDF-');
 assert.deepEqual(store.read(artist),before);
 await assert.rejects(act(artist,{action:'save',logistics}),e=>e.status===409);
});
