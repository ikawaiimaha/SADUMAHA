// One-way export of nomination cases to the department's shared folder
// (docs/pilot-slice-nomination.md, "Export to the shared folder"). Each export writes a new dated
// folder and never edits existing files. Decision emails stay in SADU.
import type { CaseWork, NominationCase, NominationDecision, NominationEvent } from './nominations';
import { caseStage } from './nominations';

/** RFC 4180 CSV with a UTF-8 BOM and CRLF line endings, so Excel opens Arabic correctly. */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const cell = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n') + '\r\n';
}

/** A file or folder name that is safe on Windows shared drives. */
export function safeName(value: string, max = 80): string {
  const cleaned = value.replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().replace(/[. ]+$/, '');
  return (cleaned.slice(0, max).trim() || 'Untitled');
}

export const exportStamp = (date: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}${p(date.getMinutes())}`;
};

export const caseFolderName = (c: Pick<NominationCase, 'id' | 'name'>) => `${safeName(c.name, 60)} - ${c.id.slice(0, 8)}`;

const stageNames = { DRAFT: 'Scouting (not contacted)', READY: 'Ready', SENT: 'Sent to Committee', APPROVED: 'Approved', DECLINED: 'Declined', OTHER: 'Other' } as const;

export function nominationsCsv(cases: NominationCase[], decisions: NominationDecision[]): string {
  const latest = (id: string) => decisions.filter(d => d.dossier_id === id).sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0];
  return toCsv([
    ['Case ID', 'Artist (English)', 'Artist (Arabic)', 'Nationality', 'Base city', 'Category', 'Medium', 'Participation', 'Status', 'Sent to Committee', 'Committee recommendation', 'Decision', 'Decision date', 'Minute or reason'],
    ...cases.map(c => {
      const d = latest(c.id);
      return [c.id, c.name, c.arabic_name, c.nationality, c.base_city, c.category, c.medium, c.participation ?? '', stageNames[caseStage(c)],
        c.sent_to_committee_at?.slice(0, 10) ?? '', d?.committee_recommendation ?? '', d?.director_decision ?? '', d?.decided_on ?? '', d?.minute ?? ''];
    }),
  ]);
}

export function caseSummaryCsv(c: NominationCase, works: CaseWork[]): string {
  return toCsv([
    ['Field', 'Value'],
    ['Case ID', c.id], ['Artist (English)', c.name], ['Artist (Arabic)', c.arabic_name], ['Nationality', c.nationality],
    ['Base city', c.base_city], ['Category', c.category], ['Medium', c.medium], ['Participation', c.participation ?? ''],
    ['Status', stageNames[caseStage(c)]], ['Biography', c.biography], ['Rationale', c.rationale], ['Links', c.links.join('\n')],
    [],
    ['Work', 'Title', 'Year', 'Medium', 'Dimensions', 'Credit', 'Published in', 'File'],
    ...works.map((w, i) => [String(i + 1), w.title, w.year, w.medium, w.dimensions, w.source_credit, w.published_in, workFileName(w, i)]),
  ]);
}

export const fileExtension = (path: string) => (path.split('.').pop() ?? 'bin').toLowerCase();
export const workFileName = (w: Pick<CaseWork, 'title' | 'image_path'>, index: number) => `Work ${index + 1} - ${safeName(w.title, 60)}.${fileExtension(w.image_path)}`;

export function readMe(event: NominationEvent, date: Date, count: number): string {
  return [
    `Exported from SADU on ${date.toISOString()} (${count} case${count === 1 ? '' : 's'}, ${event.name_en}).`,
    '',
    'This folder is a one-way copy. SADU is the record of the nomination cases and their decisions.',
    'Files here are not updated automatically, and changes made here do not reach SADU.',
    'Export again from SADU for a newer copy; each export is a new dated folder.',
    'Decision emails stay in SADU and are not included.',
    '',
    `صُدّر من سدو بتاريخ ${date.toISOString()}. هذا المجلد نسخة باتجاه واحد؛ سدو هو السجل المعتمد للترشيحات وقراراتها.`,
    'لا تُحدَّث الملفات هنا تلقائياً، ولا تصل التعديلات التي تُجرى هنا إلى سدو. صدّر مجدداً للحصول على نسخة أحدث.',
  ].join('\r\n');
}

/** Where exported files go: a folder chosen in the browser, or a ZIP download. */
export interface ExportSink {
  write(path: string[], data: Blob | string): Promise<void>;
  finish(): Promise<void>;
}

type DirHandle = {
  name: string;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<DirHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<{ createWritable(): Promise<{ write(data: Blob | string): Promise<void>; close(): Promise<void> }> }>;
  queryPermission?(o: { mode: 'readwrite' }): Promise<PermissionState>;
  requestPermission?(o: { mode: 'readwrite' }): Promise<PermissionState>;
};
type PickerWindow = Window & { showDirectoryPicker?: (o?: { mode?: 'readwrite'; id?: string }) => Promise<DirHandle> };

export const canWriteToFolder = () => typeof window !== 'undefined' && typeof (window as PickerWindow).showDirectoryPicker === 'function';

// The chosen shared folder is remembered in this browser (IndexedDB), so it is picked once.
const DB = 'sadu-export', STORE = 'handles', KEY = 'shared-folder';
function idb<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return new Promise(resolve => {
    try {
      const open = indexedDB.open(DB, 1);
      open.onupgradeneeded = () => open.result.createObjectStore(STORE);
      open.onerror = () => resolve(undefined);
      open.onsuccess = () => {
        try {
          const req = run(open.result.transaction(STORE, mode).objectStore(STORE));
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(undefined);
        } catch { resolve(undefined); }
      };
    } catch { resolve(undefined); }
  });
}

/** Returns the remembered shared folder if access is still granted, otherwise asks for one. */
export async function sharedFolder(forcePick = false): Promise<DirHandle> {
  if (!forcePick) {
    const saved = await idb<DirHandle>('readonly', s => s.get(KEY) as IDBRequest<DirHandle>);
    if (saved) {
      const state = (await saved.queryPermission?.({ mode: 'readwrite' })) ?? 'prompt';
      if (state === 'granted' || (await saved.requestPermission?.({ mode: 'readwrite' })) === 'granted') return saved;
    }
  }
  const picked = await (window as PickerWindow).showDirectoryPicker!({ mode: 'readwrite', id: 'sadu-shared-folder' });
  await idb('readwrite', s => s.put(picked, KEY));
  return picked;
}

export function folderSink(root: DirHandle): ExportSink {
  return {
    async write(path, data) {
      let dir = root;
      for (const part of path.slice(0, -1)) dir = await dir.getDirectoryHandle(part, { create: true });
      const file = await dir.getFileHandle(path[path.length - 1], { create: true });
      const out = await file.createWritable();
      await out.write(data);
      await out.close();
    },
    async finish() {},
  };
}

export async function zipSink(downloadName: string): Promise<ExportSink> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  return {
    async write(path, data) { zip.file(path.join('/'), data); },
    async finish() {
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, `${downloadName}.zip`);
    },
  };
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export type ExportInput = {
  event: NominationEvent;
  cases: NominationCase[];
  works: CaseWork[];
  decisions: NominationDecision[];
  /** Downloads a stored file; returns null when it cannot be read. */
  fetchFile: (path: string) => Promise<Blob | null>;
  presentation?: { blob: Blob; fileName: string };
  date: Date;
};

/** Writes SADU export/<Event>/<date time>/… and returns the number of files that could not be copied. */
export async function writeExport(sink: ExportSink, input: ExportInput): Promise<{ missing: string[] }> {
  const base = ['SADU export', safeName(input.event.name_en), exportStamp(input.date)];
  const missing: string[] = [];
  await sink.write([...base, `READ ME - exported from SADU ${input.date.toISOString().slice(0, 10)}.txt`], readMe(input.event, input.date, input.cases.length));
  await sink.write([...base, 'Nominations.csv'], nominationsCsv(input.cases, input.decisions));
  if (input.presentation) await sink.write([...base, `${safeName(input.presentation.fileName, 120)}.pptx`], input.presentation.blob);
  for (const c of input.cases) {
    const folder = [...base, caseFolderName(c)];
    const works = input.works.filter(w => w.dossier_id === c.id).sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
    await sink.write([...folder, 'Case summary.csv'], caseSummaryCsv(c, works));
    if (c.cv_url) {
      const cv = await input.fetchFile(c.cv_url);
      if (cv) await sink.write([...folder, `CV - ${safeName(c.name, 60)}.${fileExtension(c.cv_url)}`], cv); else missing.push(`${c.name}: CV`);
    }
    for (const [i, w] of works.entries()) {
      const image = await input.fetchFile(w.image_path);
      if (image) await sink.write([...folder, workFileName(w, i)], image); else missing.push(`${c.name}: ${w.title}`);
    }
  }
  await sink.finish();
  return { missing };
}
