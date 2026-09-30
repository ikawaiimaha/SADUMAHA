/** Local rehearsal contracts. None of these interfaces asserts provider certification. */
export interface Principal { id: string; exhibitionId: string; role: string; }
export interface IAuthProvider {
  readonly mode: 'fictional-local' | 'external';
  authenticate(credential: string): Promise<Principal | null>;
  revoke(credential: string): Promise<void>;
}
export interface IStorageProvider {
  put(actor: Principal, bytes: Uint8Array): Promise<{ objectId: string; digest: string }>;
  get(actor: Principal, objectId: string): Promise<Uint8Array>;
}
export interface SignatureReceipt {
  id: string; entityId: string; versionHash: string; actorId: string;
  status: 'SIMULATED_NOT_SIGNED'; legallySigned: false;
}
export interface ISignatureProvider {
  request(actor: Principal, target: { entityId: string; versionHash: string }): Promise<SignatureReceipt>;
  verify(receiptId: string): Promise<{ valid: boolean; simulated: boolean }>;
}
export interface Entity { id: string; kind: 'Artwork' | 'Contract'; currentRevisionHash: string; }
export interface Revision<T> { id: string; entityId: string; hash: string; parentHash: string | null; content: T; createdAt: string; }
export interface DecisionLog {
  id: string; actorId: string; sourceType: 'SADU_Portal' | 'SYSTEM_MIGRATION'; actionType: 'SUBMITTED' | 'DRAFT_SAVED' | 'TAGS_EXTRACTED' | 'PROFILE_VERIFIED' | 'CREATED' | 'REVISED' | 'APPROVED' | 'REJECTED' | 'REVIEW_REQUESTED';
  targetEntityId: string; versionHash: string;
  purpose: 'PORTAL_ACTION' | 'BASELINE_CAPTURE' | 'CONTENT_UPDATE' | 'CONTRACT_UPDATE' | 'CURATORIAL_REVIEW' | 'PUBLICATION_REVIEW' | 'REVISION_REQUEST' | 'FICTIONAL_SPECIALIST_REVIEW';
  at: string;
}
export interface ChangeImpact {
  id: string; entityId: string; fromHash: string; toHash: string; domain: string;
  changedFields: string[]; approvalId: string | null;
  status: 'STALE' | 'REQUIRES_RE_APPROVAL' | 'RESOLVED'; at: string; resolvedBy?: string;
}

/** Provider verification produces metadata; raw request content never becomes a decision payload. */
export interface ICommunicationAdapter {
  readonly mode: 'local-test' | 'external';
  verify(request: unknown): Promise<null | { channel: 'WHATSAPP' | 'EMAIL'; providerAccountId: string; bindingId: string; eventId: string; evidenceRef: string }>;
}
