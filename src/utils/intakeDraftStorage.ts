import { IntakeDraft, isIntakeDraft, recoverableDraft } from '../data/artistIntake';
export const INTAKE_DRAFT_KEY = 'sadu:fictional-intake:v1:DEMO-ART-001';
export const MAX_DRAFT_FILE_BYTES = 150000;

/** Accept the existing download format; restore only allowlisted draft fields. */
export function parseIntakeDraftFile(raw: string): IntakeDraft {
  if (new TextEncoder().encode(raw).length > MAX_DRAFT_FILE_BYTES) throw new Error('too-large');
  const file = JSON.parse(raw.replace(/^\uFEFF/, ''), (key, value) => {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('invalid-draft');
    return value;
  });
  const object = (value: unknown) => value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!object(file) || file.schema !== 1 || !object(file.data) || !object(file.data.profile) || !object(file.data.proposals)) throw new Error('invalid-draft');
  const data = file.data;
  // Compatibility with exports created before legal names became separate fields.
  data.profile.legalNameEn ??= ''; data.profile.legalNameAr ??= '';
  if (data.programmeBriefs !== undefined && !object(data.programmeBriefs)) throw new Error('invalid-draft');
  for (const proposal of Object.values(data.proposals)) {
    if (!object(proposal) || !object((proposal as { budget?: unknown }).budget)) throw new Error('invalid-draft');
  }
  if (!isIntakeDraft(data)) throw new Error('invalid-draft');
  return recoverableDraft(data);
}
export interface DraftEnvelope { schema: 1; revision: string; savedAt: string; data: IntakeDraft }
export interface DraftStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function readIntakeDraft(storage: DraftStorage): DraftEnvelope | null {
  const raw = storage.getItem(INTAKE_DRAFT_KEY); if (!raw) return null;
  if (raw.length > 150000) throw new Error('invalid-draft');
  const draft = JSON.parse(raw) as DraftEnvelope;
  // Older backups predate separate legal-name fields. Migrate only these known additions.
  if (draft?.schema === 1 && draft.data?.profile && typeof draft.data.profile === 'object') {
    draft.data.profile.legalNameEn ??= ''; draft.data.profile.legalNameAr ??= '';
  }
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
