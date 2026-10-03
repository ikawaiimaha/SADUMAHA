import test from 'node:test';
import assert from 'node:assert/strict';
import { replaceLocalFile } from '../server/local-file-recovery.mjs';
test('temporary file lock retries are bounded and retain the same replacement paths',async()=>{
  let attempts=0;const delays=[];
  await replaceLocalFile('pending','current',async(a,b)=>{assert.equal(a,'pending');assert.equal(b,'current');if(++attempts<3)throw Object.assign(Error(),{code:'EPERM'});},async ms=>{delays.push(ms);});
  assert.equal(attempts,3);assert.deepEqual(delays,[25,50]);
  attempts=0;
  await assert.rejects(replaceLocalFile('pending','current',async()=>{attempts++;throw Object.assign(Error(),{code:'EBUSY'});},async()=>{}),{code:'EBUSY'});
  assert.equal(attempts,4);
  attempts=0;
  await assert.rejects(replaceLocalFile('pending','current',async()=>{attempts++;throw Object.assign(Error(),{code:'ENOSPC'});},async()=>{}),{code:'ENOSPC'});
  assert.equal(attempts,1);
});
