import { IntakeDraft, isIntakeDraft, recoverableDraft } from '../data/artistIntake';
export const INTAKE_DRAFT_KEY = 'sadu:fictional-intake:v1:DEMO-ART-001';
export interface DraftEnvelope { schema: 1; revision: string; savedAt: string; data: IntakeDraft }
export interface DraftStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function readIntakeDraft(storage: DraftStorage): DraftEnvelope | null {
  const raw = storage.getItem(INTAKE_DRAFT_KEY); if (!raw) return null;
  if (raw.length > 150000) throw new Error('invalid-draft');
  const draft = JSON.parse(raw) as DraftEnvelope;
  if (draft.schema !== 1 || typeof draft.revision !== 'string' || draft.revision.length > 100 || !Number.isFinite(Date.parse(draft.savedAt)) || !isIntakeDraft(draft.data)) throw new Error('invalid-draft');
  return { ...draft, data: recoverableDraft(draft.data) };
}
export function writeIntakeDraft(storage: DraftStorage, data: IntakeDraft, expected: string | null, revision: string, savedAt: string): DraftEnvelope {
  const current = readIntakeDraft(storage);
  if ((current?.revision ?? null) !== expected) throw new Error('conflict');
  if (!isIntakeDraft(data) || !revision || revision.length > 100 || !Number.isFinite(Date.parse(savedAt))) throw new Error('invalid-draft');
  const record: DraftEnvelope = { schema: 1, revision, savedAt, data: recoverableDraft(data) };
  const raw = JSON.stringify(record); if (raw.length > 150000) throw new Error('too-large');
  storage.setItem(INTAKE_DRAFT_KEY, raw);
  if (storage.getItem(INTAKE_DRAFT_KEY) !== raw) throw new Error('conflict');
  return record;
}
