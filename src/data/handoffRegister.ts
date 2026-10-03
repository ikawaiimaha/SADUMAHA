// Read-only evidence context. This module cannot apply workflow commands or grant approvals.
import type { CollectionStage } from './collectionReadiness';

export type HandoffPhase = 'handoff' | 'pickup' | 'packing' | 'print';
export type RegisterText = { en: string; ar: string };
export interface HandoffSource {
  id: string;
  kind: 'MAILBOX_SUMMARY' | 'PRIOR_EVIDENCE_REGISTER';
  title: string;
  localPath: string;
  sha256: string;
  limitation: RegisterText;
}
export interface HandoffEntry {
  id: string;
  title: RegisterText;
  affectedWorks: string[];
  sourceRefs: { sourceId: string; locator: string; subject: string; excerpt: string }[];
  requestedAction: RegisterText;
  owner: { role: RegisterText; assignment: RegisterText };
  conditions: RegisterText[];
  acknowledgment: {
    status: 'REPORTED_UNVERIFIED' | 'CONDITIONAL_REPORTED' | 'NOT_ESTABLISHED';
    detail: RegisterText;
  };
  unresolvedEvidence: RegisterText[];
  demoPhase: HandoffPhase | null;
  demoBoundary: RegisterText;
}
export interface HandoffRegister {
  schemaVersion: 1;
  mode: 'LOCAL_REFERENCE_ONLY';
  id: string;
  revision: number;
  caseName: string;
  preparedAt: string;
  sources: HandoffSource[];
  entries: HandoffEntry[];
}

export const MAX_REGISTER_BYTES = 512 * 1024;
const phases: HandoffPhase[] = ['handoff', 'pickup', 'packing', 'print'];
const invalid = (): never => { throw new Error('Invalid local handoff register.'); };
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
};
const text = (value: unknown, max = 2000): string => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) return invalid();
  return value;
};
const copy = (value: unknown): RegisterText => {
  const v = object(value); return { en: text(v.en), ar: text(v.ar) };
};
function list<T>(value: unknown, item: (v: unknown) => T, max = 50): T[] {
  if (!Array.isArray(value) || !value.length || value.length > max) return invalid();
  return value.map(item);
}

// Explicit projection drops unknown fields, including any imported workflow/approval state.
export function parseHandoffRegister(raw: string): HandoffRegister {
  if (new TextEncoder().encode(raw).length > MAX_REGISTER_BYTES) return invalid();
  const v = object(JSON.parse(raw));
  if (v.schemaVersion !== 1 || v.mode !== 'LOCAL_REFERENCE_ONLY' || !Number.isInteger(v.revision) || Number(v.revision) < 1) return invalid();
  const preparedAt = text(v.preparedAt, 50);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(preparedAt) || !Number.isFinite(Date.parse(preparedAt))) return invalid();
  const sources = list(v.sources, item => {
    const s = object(item);
    if (!['MAILBOX_SUMMARY', 'PRIOR_EVIDENCE_REGISTER'].includes(String(s.kind)) || !/^[a-f0-9]{64}$/.test(String(s.sha256))) return invalid();
    return { id: text(s.id, 80), kind: s.kind as HandoffSource['kind'], title: text(s.title), localPath: text(s.localPath), sha256: String(s.sha256), limitation: copy(s.limitation) };
  });
  const sourceIds = new Set(sources.map(s => s.id));
  if (sourceIds.size !== sources.length) return invalid();
  const entries = list(v.entries, item => {
    const e = object(item), owner = object(e.owner), ack = object(e.acknowledgment);
    if (!['REPORTED_UNVERIFIED', 'CONDITIONAL_REPORTED', 'NOT_ESTABLISHED'].includes(String(ack.status))) return invalid();
    if (e.demoPhase !== null && !phases.includes(e.demoPhase as HandoffPhase)) return invalid();
    return {
      id: text(e.id, 80), title: copy(e.title), affectedWorks: list(e.affectedWorks, x => text(x, 300)),
      sourceRefs: list(e.sourceRefs, item => {
        const r = object(item), sourceId = text(r.sourceId, 80);
        if (!sourceIds.has(sourceId)) return invalid();
        return { sourceId, locator: text(r.locator, 300), subject: text(r.subject), excerpt: text(r.excerpt, 6000) };
      }),
      requestedAction: copy(e.requestedAction), owner: { role: copy(owner.role), assignment: copy(owner.assignment) },
      conditions: list(e.conditions, copy), acknowledgment: { status: ack.status as HandoffEntry['acknowledgment']['status'], detail: copy(ack.detail) },
      unresolvedEvidence: list(e.unresolvedEvidence, copy), demoPhase: e.demoPhase as HandoffPhase | null, demoBoundary: copy(e.demoBoundary),
    };
  }, 100);
  if (new Set(entries.map(e => e.id)).size !== entries.length) return invalid();
  return { schemaVersion: 1, mode: 'LOCAL_REFERENCE_ONLY', id: text(v.id, 80), revision: Number(v.revision), caseName: text(v.caseName, 300), preparedAt, sources, entries };
}

export function handoffPhase(stage: CollectionStage): HandoffPhase {
  if (['confirmed', 'unavailable', 'acceptance'].includes(stage)) return 'handoff';
  return stage === 'pickup' ? 'pickup' : 'packing';
}
export function handoffsForPhase(register: HandoffRegister, phase: HandoffPhase) {
  return register.entries.filter(entry => entry.demoPhase === phase);
}
