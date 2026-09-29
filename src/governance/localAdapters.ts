import type { IAuthProvider, IStorageProvider, ISignatureProvider, Principal, SignatureReceipt } from './ports';

export class LocalAuthProvider implements IAuthProvider {
  readonly mode = 'fictional-local' as const;
  private sessions = new Map<string, { actor: Principal; expires: number }>();
  constructor(private accounts: readonly Principal[]) {}
  /** Explicit account selection for testing, never real identity verification. */
  async selectAccount(id: string): Promise<string> {
    const actor = this.accounts.find(a => a.id === id);
    if (!actor) throw new Error('Unknown local account');
    for (const [key, session] of this.sessions) if (session.expires <= Date.now()) this.sessions.delete(key);
    if (this.sessions.size >= 100) throw Object.assign(new Error('Too many local sessions'), { status: 429 });
    const token = crypto.randomUUID();
    this.sessions.set(token, { actor: { ...actor }, expires: Date.now() + 8 * 3600000 }); return token;
  }
  async authenticate(token: string): Promise<Principal | null> {
    const session = this.sessions.get(token);
    if (!session || session.expires <= Date.now()) { this.sessions.delete(token); return null; }
    return { ...session.actor };
  }
  async revoke(token: string) { this.sessions.delete(token); }
}

/** Volatile synthetic bytes only. This adapter is NOT an encrypted document vault. */
export class LocalStorageProvider implements IStorageProvider {
  private objects = new Map<string, { owner: string; exhibition: string; bytes: Uint8Array }>();
  async put(actor: Principal, bytes: Uint8Array) {
    if (!actor.id || !actor.exhibitionId || bytes.byteLength > 1024 * 1024) throw new Error('Invalid local storage request');
    const copy = Uint8Array.from(bytes);
    const hash = await crypto.subtle.digest('SHA-256', copy);
    const objectId = crypto.randomUUID();
    this.objects.set(objectId, { owner: actor.id, exhibition: actor.exhibitionId, bytes: copy });
    return { objectId, digest: Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('') };
  }
  async get(actor: Principal, objectId: string) {
    const object = this.objects.get(objectId);
    if (!object || object.owner !== actor.id || object.exhibition !== actor.exhibitionId) throw new Error('Local object unavailable');
    return Uint8Array.from(object.bytes);
  }
}

export class LocalSignatureProvider implements ISignatureProvider {
  private receipts = new Set<string>();
  async request(actor: Principal, target: { entityId: string; versionHash: string }): Promise<SignatureReceipt> {
    if (!actor.id || !/^[0-9a-f-]{36}$/i.test(target.entityId) || !/^[0-9a-f]{64}$/.test(target.versionHash)) throw new Error('Invalid signature target');
    const id = crypto.randomUUID(); this.receipts.add(id);
    return { id, entityId: target.entityId, versionHash: target.versionHash, actorId: actor.id, status: 'SIMULATED_NOT_SIGNED', legallySigned: false };
  }
  async verify(receiptId: string) { return { valid: false, simulated: this.receipts.has(receiptId) }; }
}
