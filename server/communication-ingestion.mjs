import { createHash, randomUUID } from 'node:crypto';

/** Trusted provider adapter boundary; never call with a browser-provided identity or mapping. */
export async function ingestCommunication(receipts, request, adapter, resolveBinding) {
  if (!adapter || adapter.mode !== 'local-test') throw Object.assign(new Error('External ingestion is paused.'), { status: 503 });
  const verified = await adapter.verify(request);
  if (!verified || !['WHATSAPP', 'EMAIL'].includes(verified.channel)) throw Object.assign(new Error('Unverified source.'), { status: 403 });
  const binding = await resolveBinding(verified.bindingId);
  if (!binding || binding.channel !== verified.channel || binding.providerAccountId !== verified.providerAccountId || !binding.targetEntityId || !binding.exhibitionId) throw Object.assign(new Error('No verified dossier binding.'), { status: 422 });
  if (typeof verified.eventId !== 'string' || !verified.eventId || verified.eventId.length > 256 || !/^[0-9a-f-]{36}$/i.test(verified.evidenceRef ?? '')) throw Object.assign(new Error('Invalid receipt metadata.'), { status: 422 });
  // Store opaque evidence reference only. Text/media belong to a separately authorized evidence store.
  const eventHash = createHash('sha256').update(JSON.stringify([verified.channel, verified.providerAccountId, verified.eventId])).digest('hex');
  const old = receipts.find(r => r.eventHash === eventHash);
  if (old) {
    if (old.targetEntityId !== binding.targetEntityId || old.exhibitionId !== binding.exhibitionId) throw Object.assign(new Error('Conflicting duplicate delivery.'), { status: 409 });
    return old;
  }
  const receipt = { id: randomUUID(), eventHash, sourceType: verified.channel === 'WHATSAPP' ? 'WhatsApp / Instant Messaging' : 'Email', targetEntityId: binding.targetEntityId, exhibitionId: binding.exhibitionId, evidenceRef: verified.evidenceRef, status: 'RECEIVED_UNREVIEWED', receivedAt: new Date().toISOString() };
  receipts.push(receipt); return receipt;
}
