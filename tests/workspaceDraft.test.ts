import test from 'node:test';
import assert from 'node:assert/strict';
import {DraftWriter,type WorkspaceDraft} from '../src/lib/workspaceDraft';
const input:WorkspaceDraft={taskId:'test',key:'pickup',kind:'collection',panel:'decision',baseVersion:1,fields:{pickupDate:'2026-10-20'},fileName:null,attempted:false};
test('client serializes autosave, submission intent and discard with fresh CAS revisions',async()=>{
  const calls:Array<{revision:number;draft:WorkspaceDraft|null}>=[];
  const writer=new DraftWriter(4,async(revision,draft)=>{calls.push({revision,draft});await new Promise(r=>setTimeout(r,5));return {revision:revision+1,draft,currentVersion:1};});
  await Promise.all([writer.write(input),writer.write({...input,attempted:true}),writer.write(null)]);
  assert.deepEqual(calls.map(c=>c.revision),[4,5,6]);assert.equal(calls[1].draft?.attempted,true);assert.equal(calls[2].draft,null);
});
test('ambiguous network outcome freezes later writes instead of overwriting an unknown saved version',async()=>{
  let calls=0;const writer=new DraftWriter(0,async()=>{calls++;throw Error('Response lost');});
  await assert.rejects(writer.write(input),/Response lost/);
  await assert.rejects(writer.write(null),/Reload/);assert.equal(calls,1);assert.equal(writer.blocked,true);
});
