import test from 'node:test';
import assert from 'node:assert/strict';
import { validateConservation, conservationWarnings, normalizedPin, budgetGauge } from '../src/logistics/museumCare.mjs';
import { twinAudioView } from '../server/twin-audio-view.mjs';
test('conservation validates limits and surfaces unavailable or inadequate venue capability', () => {
  const rider = { max_lux:50, target_temp_c:20, target_humidity_pct:40 };
  assert.deepEqual(validateConservation(rider),rider);
  assert.throws(()=>validateConservation({...rider,target_humidity_pct:101}));
  assert.equal(conservationWarnings(rider,null).length,1);
  assert.equal(conservationWarnings(rider,{lux:60,min_temp_c:22,max_temp_c:25,min_humidity_pct:50,max_humidity_pct:60}).length,3);
  assert.equal(conservationWarnings(rider,{lux:40,min_temp_c:18,max_temp_c:22,min_humidity_pct:35,max_humidity_pct:45}).length,0);
});
test('pins validate normalized image coordinates including edges', () => {
  assert.deepEqual(normalizedPin(0,100),{x_pct:0,y_pct:100});
  for(const n of [-1,101,NaN,Infinity]) assert.throws(()=>normalizedPin(n,50));
});
test('withdrawal preserves outstanding commitments; only reconciled release increases availability', () => {
  const line={id:'one',amount:10000,paid:2000,released:0,status:'CONTRACT_EXECUTED'};
  const active=budgetGauge(20000,[line]); assert.equal(active.allocated,8000); assert.equal(active.available,10000);
  const withdrawn=budgetGauge(20000,[{...line,status:'WITHDRAWN'}]); assert.equal(withdrawn.allocated,0);assert.equal(withdrawn.reserved,8000);assert.equal(withdrawn.available,active.available);
  assert.equal(budgetGauge(20000,[{...line,status:'WITHDRAWN',released:8000}]).available,18000);
  assert.throws(()=>budgetGauge(20000,[{...line,released:9000}]));
  assert.throws(()=>budgetGauge(20000,[line,line]));
});
test('audio page escapes verified cultural text and uses only local voices with fallback', () => {
  const output=twinAudioView({ name:[{'@language':'en','@value':'<img onerror=evil>'}],description:[{'@language':'en','@value':'</script><script>evil()</script>'}] });
  assert.doesNotMatch(output,/<img onerror=evil>|<script>evil/);
  assert.match(output,/v.localService/); assert.match(output,/No on-device voice/);assert.match(output,/Pause/);assert.match(output,/pagehide/);
});
