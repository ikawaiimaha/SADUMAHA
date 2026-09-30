import { isLocalPreview } from '../lib/previewRoutes';
import { JOURNEY_STORAGE_KEY, emptyJournal, restoreJournal, serializeJournal, journalReducer } from '../data/journeyJournal';
import React, { useEffect, useReducer, useState, useRef } from 'react';
import { DEMO_ARTIST, DESKS, SOURCES, JOURNEY_TASKS, createJourney, currentDecision, journeyReducer, ledgerRows, missingTasks, taskById, taskStatus, type DecisionDraft, type Desk, type JourneyAction, type JourneyState, type JourneyTask, type TaskId } from '../data/rehearsalJourney';

const panel = 'rounded-xl border border-[#D9CEBA] bg-white ps-5 pe-5 py-5';
const input = 'mt-1 block w-full rounded border border-[#8C8173] bg-white ps-3 pe-3 py-2';
const button = 'rounded bg-[#8B261E] text-white ps-4 pe-3 py-2 font-semibold disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B261E]';
const secondary = 'rounded border border-[#8C8173] ps-4 pe-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2';
const localDateTime = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
type TaskForm = { draft: DecisionDraft; when: string; note: string; checks: boolean[] };
const createForms = () => Object.fromEntries(JOURNEY_TASKS.map(task => [task.id, { draft: { taskId: task.id, source: 'Verbal instruction', speaker: '', occurredAt: '', statement: '', reference: '' }, when: localDateTime(), note: '', checks: task.checks.map(() => false) }])) as Record<TaskId, TaskForm>;

export default function RehearsalJourney() {
  const [journal, dispatch] = useReducer(journalReducer, undefined, () => {
    try { return restoreJournal(sessionStorage.getItem(JOURNEY_STORAGE_KEY)); }
    catch { return { ...emptyJournal(), recoveryError: 'Browser session storage is unavailable. Export your review record before leaving.' }; }
  });
  const state = journal.state;
  const [storageError, setStorageError] = useState('');
  useEffect(() => {
    if (journal.recoveryError) return;
    try { sessionStorage.setItem(JOURNEY_STORAGE_KEY, serializeJournal(journal)); setStorageError(''); }
    catch { setStorageError('Unable to save this browser session. Export the review record before leaving.'); }
  }, [journal]);
  const resumeTask = JOURNEY_TASKS.find(t => !state.completed[t.id] && !missingTasks(state, t).length) ?? JOURNEY_TASKS[JOURNEY_TASKS.length - 1];
  const [desk, setDesk] = useState<Desk>(resumeTask.owner);
  const [selected, setSelected] = useState<TaskId>(resumeTask.id);
  const taskPanel = useRef<HTMLElement>(null);
  const focusTask = () => requestAnimationFrame(() => { taskPanel.current?.focus({ preventScroll: true }); taskPanel.current?.scrollIntoView({ block: 'start' }); });
  const [filter, setFilter] = useState<'All tasks' | 'Outstanding' | 'My desk'>('All tasks');
  const [notice, setNotice] = useState('');
  const [forms, setForms] = useState(createForms);
  const task = taskById(selected);
  const complete = Object.keys(state.completed).length;
  const act = (action: JourneyAction) => { dispatch(action); setNotice(action.type === 'record' ? 'Statement recorded. It does not complete the task.' : action.type === 'confirm' ? `Review recorded: ${action.outcome}.` : 'Rehearsal task completed. The shared checklist is updated.'); };
  const open = (t: JourneyTask) => { setSelected(t.id); setDesk(t.owner); setNotice(''); focusTask(); };
  const unsaved = JOURNEY_TASKS.some(t => {
    if (state.completed[t.id]) return false;
    const f = forms[t.id]; const r = currentDecision(state, t.id);
    return f.checks.some(Boolean) || Boolean(f.note.trim() && !r?.confirmation) || Boolean((f.draft.speaker.trim() || f.draft.statement.trim() || f.draft.reference?.trim()) && (!r || f.draft.speaker.trim() !== r.speaker || f.draft.statement.trim() !== r.statement || f.draft.source !== r.source || Date.parse(f.when) !== Date.parse(r.occurredAt)));
  });
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);
  useEffect(() => { document.title = 'SADU — Fictional artist journey'; }, []);
  return <div className="min-h-screen bg-[#F7F1E6] text-[#2C2A29]" dir="ltr" lang="en">
    <a href="#journey-task" className="sr-only focus:not-sr-only focus:block ps-4 pe-4 py-2">Skip to current task</a>
    <header className="border-b border-[#D9CEBA] ps-5 pe-5 py-5"><div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4">
      <div><strong className="font-serif text-3xl text-[#8B261E]">SADU</strong><p className="text-sm">Guided exhibition demo</p></div>
      <details className="text-sm"><summary className="cursor-pointer underline py-2">Demo controls</summary><p className="max-w-sm my-2">Try another team’s view. This simulates responsibility, not sign-in.</p><label>Rehearsal desk<select className={input} value={desk} onChange={e => { setDesk(e.target.value as Desk); setNotice(''); }}>{DESKS.map(d => <option key={d}>{d}</option>)}</select></label></details>
    </div></header>
    <main className="mx-auto max-w-7xl ps-4 pe-4 py-6 space-y-6">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-[#8B261E]">Artist dashboard</p>
        <h1 className="text-3xl font-serif">{DEMO_ARTIST.name}</h1>
        <p>{DEMO_ARTIST.work} · {DEMO_ARTIST.weight} kg</p>
        <p className="max-w-3xl">Follow the next action below. Each step shows which team is responsible and what they need to check.</p>
        <p className="text-sm">Fictional demo · No messages, payments or external publishing.</p>
        {(journal.recoveryError || storageError) && <p role="alert">{journal.recoveryError || storageError}</p>}
        <div className="flex flex-wrap items-center gap-3"><progress aria-label="Completed rehearsal tasks" max={JOURNEY_TASKS.length} value={complete} className="h-4 w-64 accent-[#8B261E]"/><span>{complete} of {JOURNEY_TASKS.length} tasks complete</span></div>
        {complete < JOURNEY_TASKS.length && <button className={secondary} onClick={() => open(resumeTask)}>Continue: {resumeTask.title}</button>}
        {unsaved && <p className="text-sm" role="status">Unrecorded edits in this tab. Complete or record the task before leaving.</p>}
        {complete === JOURNEY_TASKS.length && <p role="status" className="rounded border border-green-700 bg-green-50 ps-4 pe-4 py-3">Journey complete. All three fictional tranches are recorded and return is reconciled. <a className="underline font-semibold" href="#journey-record" onClick={() => { const details = document.getElementById("journey-record"); if (details instanceof HTMLDetailsElement) details.open = true; }}>Export your review record</a>.</p>}
      </section>
      <div className="space-y-4">
        <section ref={taskPanel} id="journey-task" tabIndex={-1} className={`${panel} space-y-4 scroll-mt-4 focus:outline-none`} aria-labelledby="task-heading">
          <p className="text-sm font-semibold text-[#8B261E]">{state.completed[selected] ? "Completed action" : "Your current action"}</p>
          <p className="text-sm">Stage {task.stage} of 8 · {task.owner} · {taskStatus(state, task)}</p>
          <h2 id="task-heading" className="text-2xl font-semibold">{task.title}</h2>
          <p>{task.detail}</p><p><strong>When:</strong> {task.due}</p>
          {desk !== task.owner && <div className="rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-3 pe-3 py-3"><p>The {task.owner} desk confirms and completes this task. Any rehearsal desk can record a statement.</p><button className={`${secondary} mt-2`} onClick={() => setDesk(task.owner)}>Open {task.owner} desk</button></div>}
          {!!missingTasks(state, task).length && <aside className="rounded bg-amber-50 border border-amber-700 ps-3 pe-3 py-3"><strong>Waiting for:</strong><ul className="list-disc ps-5">{missingTasks(state, task).map(id => <li key={id}><button className="underline py-1" onClick={() => open(taskById(id))}>{taskById(id).title} · {taskById(id).owner}</button></li>)}</ul><p className="mt-2 text-sm">You can record a draft statement now. Completion waits for the listed prerequisites.</p></aside>}
          <p role="status" aria-live="polite">{notice}</p>
          <DecisionTask task={task} state={state} desk={desk} onAction={act} form={forms[selected]} onFormChange={form => setForms(previous => ({ ...previous, [selected]: form }))}/>
          {state.completed[selected] && complete < JOURNEY_TASKS.length && <button className={button} onClick={() => { const next = JOURNEY_TASKS.find(t => !state.completed[t.id] && !missingTasks(state, t).length); if (next) open(next); }}>Open next available task</button>}
        </section>
      </div>
        <details className={panel}><summary className="cursor-pointer font-semibold">All steps · {complete} of {JOURNEY_TASKS.length} complete</summary>
          <h2 id="task-list-heading" className="text-xl font-semibold mt-4">Artist task list</h2>
          <p className="mt-2 text-sm">One list for the artist and every desk. Timing below is a sequence, not a real deadline.</p>
          <label className="block my-3">Show tasks<select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} className={input}>{['All tasks', 'Outstanding', 'My desk'].map(f => <option key={f}>{f}</option>)}</select></label>
          <ol className="max-h-52 overflow-y-auto space-y-2 lg:max-h-[65vh]">{JOURNEY_TASKS.filter(t => filter === 'All tasks' || filter === 'Outstanding' && !state.completed[t.id] || filter === 'My desk' && t.owner === desk).map(t => <li key={t.id}>
            <button aria-current={t.id === selected ? 'step' : undefined} className={`w-full rounded border ps-3 pe-3 py-3 text-start focus-visible:outline-2 ${t.id === selected ? 'border-[#8B261E] bg-[#F7F1E6]' : 'border-[#D9CEBA]'}`} onClick={() => { setSelected(t.id); setNotice(''); focusTask(); }}>
              <span className="block font-semibold">{JOURNEY_TASKS.indexOf(t) + 1}. {t.title}</span><span className="block text-sm">{t.owner} · {taskStatus(state, t)}</span>
            </button>
          </li>)}</ol>
          {filter === 'Outstanding' && complete === JOURNEY_TASKS.length && <p>No outstanding tasks.</p>}
        </details>
      <details className="space-y-4"><summary className="cursor-pointer rounded-xl border border-[#D9CEBA] bg-white ps-5 pe-5 py-5 font-semibold">Documents &amp; payment record</summary>
      <Documents state={state}/>
      <section className={panel}><h2 className="text-xl font-semibold">Rehearsal payment ledger</h2><p className="my-2">AED 45,000 · Advance 30% / Delivery 40% / Completion & return 30%. Evidence and Finance actions are separate.</p>
        {!ledgerRows(state).length ? <p>No payments recorded.</p> : <ul className="space-y-2">{ledgerRows(state).map(r => <li key={r.decisionId}>{r.milestone} · AED {r.amount.toLocaleString('en-AE')} · {new Date(r.at).toLocaleString('en-GB')}</li>)}</ul>}
      </section>
      </details>
      <details id="journey-record" className={panel}><summary className="cursor-pointer font-semibold">Decisions &amp; export</summary><section className="mt-4"><h2 className="text-xl font-semibold">Decision history</h2><p className="my-2">A verbal instruction is valid source material. Recording it does not imply confirmation, payment, publication or technical clearance.</p>
        {!state.decisions.length && <p>No statements recorded yet.</p>}
        <ol className="space-y-3">{state.decisions.slice().reverse().map(r => <li className="border-t border-[#D9CEBA] pt-3" key={r.id}><strong>{taskById(r.taskId).title}</strong><p>{r.source} · {r.speaker} · {new Date(r.occurredAt).toLocaleString('en-GB')}</p><p className="whitespace-pre-wrap break-words">{r.statement}</p><p className="text-sm">Recorded by {r.recordedBy} · {r.confirmation ? `${r.confirmation.outcome} by ${r.confirmation.by}: ${r.confirmation.note}` : 'Reported — awaiting confirmation'}{currentDecision(state, r.taskId)?.id !== r.id ? ' · Superseded statement retained' : ''}</p>{r.reference && <p className="break-words">Optional source reference: {r.reference}</p>}</li>)}</ol>
        <button className={`${secondary} mt-4`} onClick={() => { const blob = new Blob([JSON.stringify({ format: 'sadu-fictional-review-v1', artist: DEMO_ARTIST, ...state }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'SADU-fictional-review.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }}>Download review record</button>
      </section>
      </details>
      <details className="text-sm border-t border-[#D9CEBA] pt-4"><summary className="cursor-pointer underline py-2">About this demo &amp; other tools</summary>
        <p className="my-3">Recorded progress stays in this browser tab. Unrecorded text is not saved. Export your decisions before closing the tab. Advanced review and shipping tools use separate records on the development computer.</p>
        <nav aria-label="Preview navigation" className="flex flex-wrap gap-4"><a href="/overview" className="underline py-2">Presentation overview</a><a href="/review" className="underline py-2">{isLocalPreview(window.location.hostname) ? 'Open the two-tier submission review' : 'Advanced review · local service only'}</a></nav>
      </details>
    </main>
  </div>;
}

function DecisionTask({ task, state, desk, onAction, form, onFormChange }: { task: JourneyTask; state: JourneyState; desk: Desk; onAction: (a: JourneyAction) => void; form: TaskForm; onFormChange: (form: TaskForm) => void }) {
  const { draft, when, note, checks } = form;
  const setDraft = (draft: DecisionDraft) => onFormChange({ ...form, draft });
  const setWhen = (when: string) => onFormChange({ ...form, when });
  const setNote = (note: string) => onFormChange({ ...form, note });
  const setChecks = (update: (values: boolean[]) => boolean[]) => onFormChange({ ...form, checks: update(checks) });
  const record = currentDecision(state, task.id);
  const done = state.completed[task.id];
  const recordedTime = Date.parse(when);
  const validDraft = draft.speaker.trim() && draft.statement.trim() && Number.isFinite(recordedTime) && recordedTime <= Date.now();
  if (done) return <div className="rounded border border-green-700 bg-green-50 ps-4 pe-4 py-4"><strong>Completed by {done.by}</strong><p>{new Date(done.at).toLocaleString('en-GB')}</p><p>Decision and evidence remain in the shared history.</p></div>;
  return <div className="space-y-4">
    {(!record || record.confirmation?.outcome === 'disputed') && <details><summary className="cursor-pointer font-semibold">Record an offline or external conversation (fallback)</summary><form className="space-y-3" onSubmit={e => { e.preventDefault(); if (!validDraft) return; onAction({ type: 'record', draft: { ...draft, occurredAt: new Date(when).toISOString() }, actor: desk, id: crypto.randomUUID(), at: new Date().toISOString() }); }}>
      <h3 className="font-semibold">{record ? 'Record a corrected statement' : 'Record what was said or received'}</h3>
      <label className="block">Source type<select className={input} value={draft.source} onChange={e => setDraft({ ...draft, source: e.target.value as DecisionDraft['source'] })}>{SOURCES.map(s => <option key={s} disabled={s === 'SADU_Portal'}>{s === 'SADU_Portal' ? 'SADU_Portal (automatic)' : s}</option>)}</select></label>
      <label className="block">Speaker or sender (fictional)<input required maxLength={120} className={input} value={draft.speaker} onChange={e => setDraft({ ...draft, speaker: e.target.value })}/></label>
      <label className="block">When it happened (your local time)<input required type="datetime-local" className={input} value={when} onChange={e => setWhen(e.target.value)}/></label>
      <label className="block">Statement and exact scope<textarea required maxLength={2000} rows={3} className={input} value={draft.statement} onChange={e => setDraft({ ...draft, statement: e.target.value })}/></label>
      <label className="block">Source reference (optional)<input maxLength={250} className={input} placeholder="Email subject, WhatsApp thread, meeting name, or leave blank" value={draft.reference} onChange={e => setDraft({ ...draft, reference: e.target.value })}/></label>
      {when && (!Number.isFinite(recordedTime) || recordedTime > Date.now()) && <p role="alert">Enter a valid time that is not in the future.</p>}
      <p className="text-sm">No document is required for a verbal instruction. Recorded by: {desk}. Do not enter real personal information.</p>
      <button type="button" className={secondary} onClick={() => onFormChange({ ...form, draft: { ...draft, speaker: `Sample ${task.owner} representative`, statement: `For ${DEMO_ARTIST.name}: ${task.title.toLowerCase()}. ${task.detail}` }, when: localDateTime() })}>Use fictional example</button>
      <button className={`${button} ms-2`} disabled={!validDraft}>Record statement</button>
    </form></details>}
    {record && <section className="rounded border border-[#D9CEBA] ps-4 pe-4 py-4 space-y-3"><h3 className="font-semibold">Current statement</h3><p>{record.source} · {record.speaker}</p><p className="whitespace-pre-wrap break-words">{record.statement}</p><p><strong>{record.confirmation?.outcome ?? 'Reported — awaiting confirmation'}</strong></p>
      {!record.confirmation && <><label className="block">Confirmation or disagreement note<textarea maxLength={500} className={input} value={note} onChange={e => setNote(e.target.value)} placeholder="Describe what this desk confirms or disputes"/></label><div className="flex flex-wrap gap-2"><button className={button} disabled={desk !== task.owner || !note.trim()} onClick={() => onAction({ type: 'confirm', decisionId: record.id, actor: desk, at: new Date().toISOString(), outcome: 'confirmed', note })}>Confirm statement</button><button className={secondary} disabled={desk !== task.owner || !note.trim()} onClick={() => onAction({ type: 'confirm', decisionId: record.id, actor: desk, at: new Date().toISOString(), outcome: 'disputed', note })}>Record disagreement</button></div><p className="text-sm">This is a simulated {task.owner} review, not a verified reply from an external person.</p></>}
    </section>}
    <fieldset className="space-y-3" disabled={desk !== task.owner || Boolean(missingTasks(state, task).length) || Boolean(record && record.confirmation?.outcome !== 'confirmed')}><legend className="font-semibold mb-2">Task-specific evidence</legend>{task.checks.map((label, i) => <label className="flex items-start gap-3" key={label}><input type="checkbox" checked={checks[i]} className="mt-1 h-5 w-5 shrink-0 accent-[#8B261E]" onChange={e => setChecks(values => values.map((v, index) => index === i ? e.target.checked : v))}/><span>{label}</span></label>)}</fieldset>
    {!record && <><p>For an action performed here, review the evidence and complete it below. SADU records the source, desk and time automatically. External statements still need separate confirmation.</p><button className={button} disabled={desk !== task.owner || Boolean(missingTasks(state, task).length) || !checks.every(Boolean)} onClick={() => onAction({ type: 'portal_complete', taskId: task.id, actor: desk, at: new Date().toISOString(), id: crypto.randomUUID(), checks })}>Record portal action and complete task</button></>}
    {record && <button className={button} disabled={desk !== task.owner || Boolean(missingTasks(state, task).length) || record?.confirmation?.outcome !== 'confirmed' || !checks.every(Boolean)} onClick={() => record && onAction({ type: 'complete', taskId: task.id, decisionId: record.id, actor: desk, at: new Date().toISOString(), checks })}>{task.owner === 'Finance' ? 'Record fictional Finance authorization' : 'Complete rehearsal task'}</button>}
    <p className="text-sm">{desk !== task.owner ? `Switch to the ${task.owner} desk to complete this task.` : missingTasks(state, task).length ? 'Complete the prerequisites listed above first.' : record && record.confirmation?.outcome !== 'confirmed' ? 'Confirm this statement, or record a correction if it is disputed.' : !checks.every(Boolean) ? 'Review and check every evidence item above to enable completion.' : 'All requirements are met. You can complete this fictional task.'}</p>
  </div>;
}

function Documents({ state }: { state: JourneyState }) {
  const [notice, setNotice] = useState('');
  const selected = Boolean(state.completed.selection);
  const invited = Boolean(state.completed.invitation);
  return <section className={`${panel} space-y-3`}><h2 className="text-xl font-semibold">Documents and shared terms</h2>
    <p><strong>Invitation · version {state.revision}</strong> · {!selected ? 'Waiting for selection' : invited ? 'Prepared in rehearsal' : 'Draft — awaiting Coordinator review'}</p>
    <blockquote className="border-s-4 border-[#8B261E] ps-4">Dear Noura Al Mazrouei, we invite you to present Kufic Horizon: Architectural Bronze &amp; Black Oxide in this fictional exhibition. Participation is subject to the separately recorded sample agreement and specialist reviews.</blockquote>
    <p>Sample agreement: one 84 kg work, AED 45,000; AED 13,500 advance, AED 18,000 delivery, AED 13,500 after closure, safe return and condition reconciliation.</p>
    <p>Sample package: one linked artwork image, bilingual title/description and mounting sketch. These are checklist placeholders, not uploaded or inspected files.</p>
    <button className={secondary} disabled={!selected} onClick={async () => { try { const { downloadInvitation } = await import('../utils/invitationLetterPdf'); await downloadInvitation({ id: 'demo-invitation-v1', artistId: DEMO_ARTIST.id, artistName: DEMO_ARTIST.name, work: DEMO_ARTIST.work, version: state.revision, createdAt: state.completed.selection!.at, bodyAr: '', bodyEn: 'Dear Noura Al Mazrouei, we invite you to present Kufic Horizon: Architectural Bronze & Black Oxide in this fictional exhibition. Participation is subject to the separately recorded sample agreement and specialist reviews. This rehearsal copy is not officially signed or sent.' }, false, false); setNotice('Rehearsal PDF prepared. This is not an officially approved invitation.'); } catch { setNotice('Unable to prepare PDF. Please retry.'); } }}>Download invitation draft PDF</button>
    <p role="status">{notice}</p>
  </section>;
}
