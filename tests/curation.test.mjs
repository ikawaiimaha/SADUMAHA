import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { extractKeywords, filterArtworks } from '../src/curation/keywords.mjs';
import { ACCOUNTS, initialReview, transitionReview, projectReview, openReviewStore } from '../server/review-store.mjs';
const [artist, coordinator, director] = ACCOUNTS;
test('extraction is normalized, bounded, deterministic and rejects noise', () => {
 assert.deepEqual(extractKeywords('The artist explores architectural memories and memory. Bronze sculpture in spatial spaces.'), ['memory','space','architecture','bronze','sculpture']);
 assert.deepEqual(extractKeywords('the and artist artworks this this'), []);
 assert.deepEqual(extractKeywords('River river RIVER 123 <script>'), ['river']);
 assert.deepEqual(extractKeywords('في هذا العمل عن الذاكرة الذاكرة'), ['الذاكرة']);
 assert.ok(extractKeywords('architecture memory identity ecology environment community tradition landscape migration geometry calligraphy sculpture').length === 8);
 assert.throws(() => extractKeywords('x'.repeat(10001)));
});
test('multi-artwork filters use exact AND matches and support no matches and clearing', () => {
 const rows=[{id:'a',tags:['memory','bronze']},{id:'b',tags:['memory']},{id:'c',tags:['ecology']}];
 assert.equal(filterArtworks(rows,[]).length,3);
 assert.deepEqual(filterArtworks(rows,['memory']).map(a=>a.id),['a','b']);
 assert.deepEqual(filterArtworks(rows,['memory','bronze']).map(a=>a.id),['a']);
 assert.equal(filterArtworks(rows,['missing']).length,0);
});
test('submission owns extraction; revision changes cannot inherit stale or forged themes', () => {
 let s=initialReview();
 const act=(actor,action,extra={})=>{s=transitionReview(s,actor,{version:s.version,revision:s.revisions.at(-1).number,action,...extra});};
 act(artist,'save',{content:{title:'A',concept:'Memory and architecture',tags:['fake']}});
 assert.equal(projectReview(s,coordinator).curationArtworks.length,0);
 act(artist,'submit',{tags:['fake']}); assert.deepEqual(s.revisions[0].tagging.tags,['architecture','memory']);
 assert.equal(projectReview(s,director).curationArtworks.length,0);
 act(coordinator,'request_revision',{note:'Change concept'}); assert.equal(s.revisions.at(-1).tagging,undefined);
 act(artist,'save',{content:{title:'B',concept:'Ecology and landscape'}});act(artist,'submit');
 assert.deepEqual(projectReview(s,coordinator).curationArtworks[0].tags,['ecology','landscape']);
 assert.deepEqual(s.revisions[0].tagging.tags,['architecture','memory']);
});
test('legacy extraction is explicit, role protected, preserves approval and persists after reopening', async () => {
 let s=initialReview();s.revisions[0].status='Publication_Approved';
 assert.throws(()=>transitionReview(s,artist,{version:0,revision:1,action:'tag_existing'}),e=>e.status===403);
 const next=transitionReview(s,coordinator,{version:0,revision:1,action:'tag_existing'});
 assert.equal(next.revisions[0].status,'Publication_Approved');assert.deepEqual(next.outbox,s.outbox);assert.deepEqual(next.revisions[0].content,s.revisions[0].content);
 assert.throws(()=>transitionReview(next,coordinator,{version:1,revision:1,action:'tag_existing'}),e=>e.status===409);
 const file=join(await mkdtemp(join(tmpdir(),'sadu-tags-')),'review.json');const store=await openReviewStore(file);
 await store.act(artist,{version:0,revision:1,action:'submit'});
 const reopened=await openReviewStore(file);assert.deepEqual(reopened.read(coordinator).curationArtworks,store.read(coordinator).curationArtworks);
});
