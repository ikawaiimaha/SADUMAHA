import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalAuthProvider, LocalStorageProvider, LocalSignatureProvider } from '../src/governance/localAdapters';
const actor = { id: 'demo-artist', exhibitionId: 'demo-exhibition', role: 'Artist' };
test('local auth is explicitly fictional, copied and revocable', async () => {
  const auth = new LocalAuthProvider([actor]); const token = await auth.selectAccount(actor.id);
  assert.equal(auth.mode, 'fictional-local'); assert.deepEqual(await auth.authenticate(token), actor);
  const principal = await auth.authenticate(token); principal!.role = 'Director';
  assert.equal((await auth.authenticate(token))!.role, 'Artist');
  await auth.revoke(token); assert.equal(await auth.authenticate(token), null);
});
test('synthetic storage isolates owner/scope and copies bytes; simulated signing never verifies as real', async () => {
  const storage = new LocalStorageProvider(); const bytes = new Uint8Array([1, 2, 3]); const item = await storage.put(actor, bytes); bytes[0] = 9;
  assert.deepEqual(await storage.get(actor, item.objectId), new Uint8Array([1, 2, 3]));
  await assert.rejects(storage.get({ ...actor, exhibitionId: 'other' }, item.objectId));
  await assert.rejects(storage.get({ ...actor, id: 'other' }, item.objectId));
  const signing = new LocalSignatureProvider(); const receipt = await signing.request(actor, { entityId: crypto.randomUUID(), versionHash: item.digest });
  assert.equal(receipt.legallySigned, false); assert.deepEqual(await signing.verify(receipt.id), { valid: false, simulated: true });
});
