import type { SandboxRole } from './executiveSandbox';

export type Proposal = { en: string; ar: string; rationale: string; feasibility: string; translation: string };
export type Essay = { introduction: { en: string; ar: string }; context: { en: string; ar: string }; checkedEn: boolean; checkedAr: boolean };
export type Phase = 'Proposal draft' | 'Director review' | 'Chairman review' | 'Editorial draft' | 'Final review' | 'Published';
export type Note = { id: number; area: 'proposal' | 'essay'; reason: string; text: string; anchor: string; resolution?: string; explanation?: string };
export type ThemeEvent = { role: SandboxRole; action: 'SUBMIT_PROPOSAL' | 'PREFLIGHT' | 'ENDORSE' | 'SELECT' | 'RETURN' | 'RESOLVE' | 'SUBMIT_ESSAY' | 'PUBLISH' | 'NEW_VERSION'; at: string; expected: number; preflight?: string; proposals?: Proposal[]; essay?: Essay; selected?: number; note?: Omit<Note, 'id' | 'area'>; noteId?: number; resolution?: string; explanation?: string };
export type ThemeState = { revision: number; phase: Phase; preflight?: string; proposals: Proposal[]; selected?: number; essay?: Essay; notes: Note[]; snapshots: { revision: number; proposals: Proposal[]; essay?: Essay; selected?: number; kind: string }[]; published?: { proposals: Proposal[]; essay: Essay; selected: number; revision: number }; events: ThemeEvent[] };
export const reasons = ['Requires stronger local context', 'Budgetary scope concern', 'Translation or cultural concern', 'Evidence or clarity required'];
export const emptyTheme = (): ThemeState => ({ revision: 0, phase: 'Proposal draft', proposals: [], notes: [], snapshots: [], events: [] });
const required = (v: unknown) => typeof v === 'string' && v.trim().length > 0 && v.length <= 12000;
export function applyTheme(s: ThemeState, e: ThemeEvent): ThemeState {
  if (e.expected !== s.revision) throw new Error('This record changed. Review the latest revision and retry.');
  const n = structuredClone(s);
  const allow = (role: SandboxRole, phase: Phase) => { if (e.role !== role || s.phase !== phase) throw new Error('This action is not available to this role at this stage.'); };
  const resolved = (area: Note['area']) => { if (s.notes.some(x => x.area === area && (!x.resolution || x.resolution === 'Clarification needed'))) throw new Error('Resolve every review note before resubmitting.'); };
  switch (e.action) {
    case 'SUBMIT_PROPOSAL':
      allow('Committee', 'Proposal draft'); resolved('proposal');
      if (!Array.isArray(e.proposals) || e.proposals.length !== 3 || e.proposals.some(p => !['en','ar','rationale','feasibility','translation'].every(k => required(p[k as keyof Proposal])))) throw new Error('Complete all three bilingual proposals, including feasibility and translation concerns.');
      n.proposals = structuredClone(e.proposals); n.selected = undefined; n.preflight = undefined; n.phase = 'Director review'; break;
    case 'PREFLIGHT': allow('Editorial', 'Director review'); if (!required(e.preflight)) throw new Error('Record the bilingual preflight findings.'); n.preflight = e.preflight; break;
    case 'ENDORSE': allow('Director', 'Director review'); if (!s.preflight) throw new Error('Editorial must complete the early bilingual preflight before endorsement.'); n.phase = 'Chairman review'; break;
    case 'SELECT': allow('Chairman', 'Chairman review'); if (!Number.isInteger(e.selected) || e.selected! < 0 || e.selected! > 2) throw new Error('Select one theme.'); n.selected = e.selected; n.phase = 'Editorial draft'; break;
    case 'RETURN': {
      if (s.phase === 'Director review') allow('Director', s.phase); else if (s.phase === 'Chairman review' || s.phase === 'Final review') allow('Chairman', s.phase); else throw new Error('No review is pending.');
      if (!e.note || !reasons.includes(e.note.reason) || !required(e.note.text)) throw new Error('Choose a reason and provide specific review notes.');
      const area = s.phase === 'Final review' ? 'essay' : 'proposal';
      n.notes.push({ id: s.revision + 1, area, reason: e.note.reason, text: e.note.text, anchor: e.note.anchor || 'Whole record' });
      n.phase = area === 'essay' ? 'Editorial draft' : 'Proposal draft'; break;
    }
    case 'RESOLVE': {
      const note = n.notes.find(x => x.id === e.noteId); if (!note) throw new Error('Review note not found.');
      allow(note.area === 'essay' ? 'Editorial' : 'Committee', note.area === 'essay' ? 'Editorial draft' : 'Proposal draft');
      if (!['Addressed', 'Clarification needed', 'Not adopted'].includes(e.resolution || '') || !required(e.explanation)) throw new Error('Record a resolution and explanation.');
      note.resolution = e.resolution; note.explanation = e.explanation; break;
    }
    case 'SUBMIT_ESSAY': allow('Editorial', 'Editorial draft'); resolved('essay');
      if (!e.essay || !e.essay.checkedEn || !e.essay.checkedAr || ![e.essay.introduction?.en,e.essay.introduction?.ar,e.essay.context?.en,e.essay.context?.ar].every(required)) throw new Error('Complete both languages and confirm both human language reviews.');
      n.essay = structuredClone(e.essay); n.phase = 'Final review'; break;
    case 'PUBLISH': allow('Chairman', 'Final review'); if (!s.essay || s.selected === undefined) throw new Error('Approved theme and bilingual essay are required.'); n.published = { proposals: structuredClone(s.proposals), essay: structuredClone(s.essay), selected: s.selected, revision: s.revision }; n.phase = 'Published'; break;
    case 'NEW_VERSION': allow('Committee', 'Published'); n.phase = 'Proposal draft'; n.notes = []; n.selected = undefined; n.essay = undefined; break;
    default: throw new Error('Unknown theme action.');
  }
  n.revision++; n.events.push(structuredClone(e));
  if (['SUBMIT_PROPOSAL','SUBMIT_ESSAY','PUBLISH'].includes(e.action)) n.snapshots.push({ revision: n.revision, proposals: structuredClone(n.proposals), essay: n.essay && structuredClone(n.essay), selected: n.selected, kind: e.action });
  return n;
}
export function restoreTheme(raw: string | null) {
  if (!raw) return emptyTheme();
  const journal = JSON.parse(raw);
  if (journal.version !== 1 || !Array.isArray(journal.events) || journal.events.length > 1000) throw new Error('Invalid theme journal.');
  return journal.events.reduce(applyTheme, emptyTheme()) as ThemeState;
}
