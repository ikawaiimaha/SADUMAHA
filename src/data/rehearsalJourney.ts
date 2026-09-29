/** Fictional presentation model only. Never imported by the authenticated pilot. */
export const DEMO_ARTIST = { id: 'demo-kufic-horizon', name: 'Noura Al Mazrouei', work: 'Kufic Horizon: Architectural Bronze & Black Oxide', weight: 84, fee: 45000 } as const;
export const DESKS = ['Committee', 'Director', 'Editorial', 'General Exhibition Coordinator', 'Artist', 'PR', 'Technical', 'Finance', 'Logistics'] as const;
export type Desk = typeof DESKS[number];
export const SOURCES = ['Verbal instruction', 'Email', 'Meeting', 'Document'] as const;
export type SourceKind = typeof SOURCES[number];
export type TaskId = 'brief' | 'selection' | 'invitation' | 'agreement' | 'acceptance' | 'materials' | 'editorial' | 'pr' | 'technical' | 'advance' | 'receipt' | 'delivery' | 'return' | 'completion';
export type JourneyTask = { id: TaskId; stage: number; title: string; owner: Desk; requires: TaskId[]; due: string; checks: string[]; detail: string };
export const JOURNEY_TASKS: JourneyTask[] = [
  { id: 'brief', stage: 1, title: 'Record the exhibition brief', owner: 'Committee', requires: [], due: 'Before selection', checks: ['Review the fictional brief: calligraphy in architectural form'], detail: 'One prepared exhibition brief keeps this rehearsal focused. Recording it creates no institutional policy.' },
  { id: 'selection', stage: 2, title: 'Record the artist selection', owner: 'Director', requires: ['brief'], due: 'Before invitation', checks: ['Review Noura’s fictional bronze proposal and 84 kg declared weight'], detail: 'Selection records participation in this scenario. It grants no technical clearance or payment authority.' },
  { id: 'invitation', stage: 3, title: 'Prepare the invitation letter', owner: 'General Exhibition Coordinator', requires: ['selection'], due: 'Before agreement', checks: ['Review the invitation text shown in Documents'], detail: 'A versioned rehearsal invitation. No email is sent and no real signature is captured.' },
  { id: 'agreement', stage: 4, title: 'Record the agreed terms', owner: 'General Exhibition Coordinator', requires: ['invitation'], due: 'Before artist acceptance', checks: ['Review AED 45,000 with 30% advance, 40% delivery and 30% completion & return'], detail: 'These fixed terms are sample data for this journey, not a universal payment policy.' },
  { id: 'acceptance', stage: 4, title: 'Record artist acceptance', owner: 'Artist', requires: ['agreement'], due: 'Before advance review', checks: ['Review the sample scope and three payment milestones'], detail: 'Simulates the artist’s acceptance. No legally binding signature or external action occurs.' },
  { id: 'materials', stage: 5, title: 'Submit the sample artwork package', owner: 'Artist', requires: ['selection'], due: 'Before Editorial review', checks: ['Sample artwork image linked to the artwork ID', 'Sample Arabic/English title and description present', 'Sample mounting sketch present'], detail: 'A fictional completeness checklist; no real files are uploaded. Draft notes can be recorded before dependencies are complete. Payment does not block collecting metadata.' },
  { id: 'editorial', stage: 5, title: 'Review the artwork package', owner: 'Editorial', requires: ['materials'], due: 'Before exhibition closure', checks: ['Review sample bilingual text', 'Review sample image-to-label association'], detail: 'Editorial review concerns the package. It does not publish content to an external website.' },
  { id: 'pr', stage: 6, title: 'Record identity and travel evidence', owner: 'PR', requires: ['acceptance'], due: 'Before advance review', checks: ['Identity document reviewed — simulation', 'Travel and visa status reviewed — simulation'], detail: 'No personal identity data is requested. PR supplies evidence; Finance acts separately.' },
  { id: 'technical', stage: 6, title: 'Record technical evidence', owner: 'Technical', requires: ['acceptance', 'materials'], due: 'Before advance review', checks: ['Site and floor-load assessment reviewed — simulation', 'Mounting specifications reviewed — simulation'], detail: '84 kg alone cannot establish safety. This represents a specialist assessment, not an engineering calculation.' },
  { id: 'advance', stage: 6, title: 'Authorize the sample advance', owner: 'Finance', requires: ['acceptance', 'pr', 'technical'], due: 'After both evidence reviews', checks: ['Review the independent PR and Technical records'], detail: 'Record AED 13,500 once in the rehearsal ledger. No transfer is made.' },
  { id: 'receipt', stage: 7, title: 'Record arrival and condition', owner: 'Logistics', requires: ['advance'], due: 'Before delivery payment', checks: ['Sample crate received', 'Measurements and seal checked', 'Condition checked and intact — simulation'], detail: 'A physical receipt must be recorded; a planned date is not evidence of arrival.' },
  { id: 'delivery', stage: 7, title: 'Authorize the sample delivery tranche', owner: 'Finance', requires: ['receipt'], due: 'After physical receipt', checks: ['Review the recorded arrival and condition'], detail: 'Record AED 18,000 once. Receipt does not automatically create a payment.' },
  { id: 'return', stage: 8, title: 'Record closure and safe return', owner: 'Logistics', requires: ['receipt', 'editorial'], due: 'After the exhibition', checks: ['Exhibition closed — simulation', 'Safe return recorded — simulation', 'Condition reconciled — simulation'], detail: 'Keep closure, return and condition explicit. No carrier is contacted.' },
  { id: 'completion', stage: 8, title: 'Authorize the sample completion tranche', owner: 'Finance', requires: ['delivery', 'return'], due: 'After return and reconciliation', checks: ['Review closure and safe-return evidence'], detail: 'Record the final AED 13,500 once. This completes the fictional journey.' },
];
export type DecisionDraft = { taskId: TaskId; source: SourceKind; speaker: string; occurredAt: string; statement: string; reference?: string };
export type DecisionRecord = DecisionDraft & { id: string; artistId: string; revision: number; recordedBy: Desk; recordedAt: string; confirmation?: { outcome: 'confirmed' | 'disputed'; by: Desk; at: string; note: string } };
export type JourneyState = { revision: number; decisions: DecisionRecord[]; completed: Partial<Record<TaskId, { at: string; by: Desk; decisionId: string; evidence: string[] }>> };
export const createJourney = (): JourneyState => ({ revision: 1, decisions: [], completed: {} });
export type JourneyAction =
  | { type: 'record'; draft: DecisionDraft; actor: Desk; at: string; id: string }
  | { type: 'confirm'; decisionId: string; actor: Desk; at: string; outcome: 'confirmed' | 'disputed'; note: string }
  | { type: 'complete'; taskId: TaskId; decisionId: string; actor: Desk; at: string; checks: boolean[] };
export const taskById = (id: TaskId) => JOURNEY_TASKS.find(t => t.id === id)!;
export const missingTasks = (state: JourneyState, task: JourneyTask) => task.requires.filter(id => !state.completed[id]);
export const currentDecision = (state: JourneyState, taskId: TaskId) => state.decisions.filter(d => d.taskId === taskId && d.revision === state.revision).at(-1);
export function taskStatus(state: JourneyState, task: JourneyTask): 'Complete' | 'Blocked' | 'Ready' | 'Needs confirmation' | 'Disputed' {
  if (state.completed[task.id]) return 'Complete';
  const record = currentDecision(state, task.id);
  if (record?.confirmation?.outcome === 'disputed') return 'Disputed';
  if (missingTasks(state, task).length) return 'Blocked';
  return record && !record.confirmation ? 'Needs confirmation' : 'Ready';
}
export function journeyReducer(state: JourneyState, action: JourneyAction): JourneyState {
  if (!DESKS.includes(action.actor) || !Number.isFinite(Date.parse(action.at))) return state;
  if (action.type === 'record') {
    const d = action.draft;
    if (!JOURNEY_TASKS.some(t => t.id === d.taskId) || state.completed[d.taskId] || !SOURCES.includes(d.source)
      || !d.speaker.trim() || d.speaker.length > 120 || !d.statement.trim() || d.statement.length > 2000
      || (d.reference?.length ?? 0) > 250 || !Number.isFinite(Date.parse(d.occurredAt)) || Date.parse(d.occurredAt) > Date.parse(action.at)
      || !action.id || state.decisions.some(r => r.id === action.id)) return state;
    return { ...state, decisions: [...state.decisions, { ...d, speaker: d.speaker.trim(), statement: d.statement.trim(), id: action.id, artistId: DEMO_ARTIST.id, revision: state.revision, recordedBy: action.actor, recordedAt: action.at }] };
  }
  const record = state.decisions.find(d => d.id === action.decisionId);
  if (!record || record.revision !== state.revision || record !== currentDecision(state, record.taskId) || state.completed[record.taskId]) return state;
  const task = taskById(record.taskId);
  if (action.actor !== task.owner || Date.parse(action.at) < Date.parse(record.recordedAt)) return state;
  if (action.type === 'confirm') {
    if (record.confirmation || !['confirmed', 'disputed'].includes(action.outcome) || !action.note.trim() || action.note.length > 500) return state;
    return { ...state, decisions: state.decisions.map(d => d.id === record.id ? { ...d, confirmation: { outcome: action.outcome, by: action.actor, at: action.at, note: action.note.trim() } } : d) };
  }
  if (action.taskId !== record.taskId || missingTasks(state, task).length || record.confirmation?.outcome !== 'confirmed'
    || Date.parse(action.at) < Date.parse(record.confirmation.at) || action.checks.length !== task.checks.length || !action.checks.every(v => v === true)) return state;
  return { ...state, completed: { ...state.completed, [task.id]: { at: action.at, by: action.actor, decisionId: record.id, evidence: [...task.checks] } } };
}
export const ledgerRows = (state: JourneyState) => ([['advance', 13500], ['delivery', 18000], ['completion', 13500]] as const).filter(([id]) => state.completed[id]).map(([id, amount]) => ({ milestone: taskById(id).title, amount, ...state.completed[id]! }));
