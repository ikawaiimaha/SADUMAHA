// Nomination cases (docs/pilot-slice-nomination.md). The database enforces every rule here; these
// helpers only mirror them so the screen can say what is missing before the database refuses.
import type { SupabaseClient } from '@supabase/supabase-js';

export type NominationEvent = { id: string; name_en: string; name_ar: string; edition: string | null };
export type NominationStatus = 'INCOMPLETE_DOSSIER' | 'PENDING_COMMITTEE_REVIEW' | 'DIRECTOR_APPROVED' | 'DIRECTOR_VETOED' | string;
export type NominationCase = {
  id: string; event_id: string | null; created_by: string | null; status: NominationStatus;
  name: string; arabic_name: string; nationality: string; base_city: string | null; category: string; medium: string;
  participation: 'EXISTING_WORK' | 'NEW_COMMISSION' | null; biography: string | null; rationale: string | null;
  links: string[]; cv_url: string | null; sent_to_committee_at: string | null;
  committee_recommendation: string | null; committee_minutes: string | null; rejection_reason: string | null;
  created_at: string; updated_at: string;
};
export type CaseWork = {
  id: string; dossier_id: string; position: number; title: string; year: string | null; medium: string | null;
  dimensions: string | null; source_credit: string; image_path: string; created_at: string;
};
export type NominationDecision = {
  id: string; dossier_id: string; committee_recommendation: 'RECOMMENDED' | 'NOT_RECOMMENDED';
  director_decision: 'APPROVED' | 'DECLINED' | 'RETURNED'; decided_on: string; email_reference: string;
  minute: string; evidence_path: string; recorded_by: string; recorded_at: string;
};

export const BUCKET = 'artist-dossiers';
export const MIN_WORKS = 3;
export const MAX_WORKS = 8;
export const CASE_COLUMNS = 'id,event_id,created_by,status,name,arabic_name,nationality,base_city,category,medium,participation,biography,rationale,links,cv_url,sent_to_committee_at,committee_recommendation,committee_minutes,rejection_reason,created_at,updated_at';

export type MissingItem = 'name' | 'arabic_name' | 'nationality' | 'category' | 'medium' | 'biography' | 'rationale' | 'works';
const filled = (v: string | null | undefined) => !!v && v.trim().length > 0;

/** Mirrors sadu_nomination_complete(): what still blocks "Mark ready". */
export function missingForReady(c: Pick<NominationCase, 'name' | 'arabic_name' | 'nationality' | 'category' | 'medium' | 'biography' | 'rationale'>, workCount: number): MissingItem[] {
  const missing: MissingItem[] = [];
  for (const key of ['name', 'arabic_name', 'nationality', 'category', 'medium', 'biography', 'rationale'] as const) if (!filled(c[key])) missing.push(key);
  if (workCount < MIN_WORKS) missing.push('works');
  return missing;
}

/** The step a case is at, as the Coordinator sees it. */
export type CaseStage = 'DRAFT' | 'READY' | 'SENT' | 'APPROVED' | 'DECLINED' | 'OTHER';
export function caseStage(c: Pick<NominationCase, 'status' | 'sent_to_committee_at'>): CaseStage {
  if (c.status === 'INCOMPLETE_DOSSIER') return 'DRAFT';
  if (c.status === 'PENDING_COMMITTEE_REVIEW') return c.sent_to_committee_at ? 'SENT' : 'READY';
  if (c.status === 'DIRECTOR_APPROVED') return 'APPROVED';
  if (c.status === 'DIRECTOR_VETOED') return 'DECLINED';
  return 'OTHER';
}

const IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const CV_TYPES: Record<string, string> = { 'application/pdf': 'pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx' };
const EVIDENCE_TYPES: Record<string, string> = { 'application/pdf': 'pdf', 'application/vnd.ms-outlook': 'msg', 'message/rfc822': 'eml' };
const MB = 1024 * 1024;

export type FileKind = 'work' | 'cv' | 'evidence';
/** Returns the file extension to store, or null when the file is not accepted for this kind. */
export function acceptedExtension(file: Pick<File, 'name' | 'type' | 'size'>, kind: FileKind): string | null {
  const limit = kind === 'evidence' ? 25 * MB : 20 * MB;
  if (file.size <= 0 || file.size > limit) return null;
  const types = kind === 'work' ? IMAGE_TYPES : kind === 'cv' ? CV_TYPES : EVIDENCE_TYPES;
  if (types[file.type]) return types[file.type];
  // Outlook messages and some PDFs arrive without a MIME type; fall back to the extension.
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  return Object.values(types).includes(ext) && (file.type === '' || file.type === 'application/octet-stream') ? ext : null;
}

export const acceptAttribute: Record<FileKind, string> = {
  work: '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp',
  cv: '.pdf,.docx',
  evidence: '.pdf,.msg,.eml',
};

export const casePath = (caseId: string, folder: 'works' | 'cv' | 'decision-evidence', ext: string) =>
  `nominations/${caseId}/${folder}/${crypto.randomUUID()}.${ext}`;

/** Uploads without overwrite; the bucket is append-only. Returns the stored path. */
export async function uploadCaseFile(client: SupabaseClient, caseId: string, folder: 'works' | 'cv' | 'decision-evidence', file: File, ext: string): Promise<string> {
  const path = casePath(caseId, folder, ext);
  const { error } = await client.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) throw new Error(error.message);
  return path;
}

export async function signedUrls(client: SupabaseClient, paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const { data, error } = await client.storage.from(BUCKET).createSignedUrls(paths, 3600);
  if (error || !data) return {};
  return Object.fromEntries(data.filter(d => d.signedUrl && d.path).map(d => [d.path as string, d.signedUrl as string]));
}

export function linksFromText(text: string): string[] {
  return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 10);
}
