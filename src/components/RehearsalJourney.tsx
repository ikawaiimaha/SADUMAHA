import { isLocalPreview } from '../lib/previewRoutes';
import { JOURNEY_STORAGE_KEY, emptyJournal, restoreJournal, serializeJournal, journalReducer } from '../data/journeyJournal';
import React, { useEffect, useReducer, useState, useRef } from 'react';
import { DEMO_ARTIST, DESKS, SOURCES, JOURNEY_TASKS, currentDecision, ledgerRows, missingTasks, taskById, taskStatus, type DecisionDraft, type Desk, type JourneyAction, type JourneyState, type JourneyTask, type TaskId } from '../data/rehearsalJourney';
import { journeyCopy, type JourneyCopy, type JourneyLanguage } from '../i18n/journey';
import { readPreference, writePreference } from '../utils/preferences';

const panel = 'rounded-xl border border-[#D9CEBA] bg-white ps-5 pe-5 py-5';
const input = 'mt-1 block w-full rounded border border-[#8C8173] bg-white ps-3 pe-3 py-2';
const button = 'rounded bg-[#8B261E] text-white ps-4 pe-3 py-2 font-semibold disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B261E]';
const secondary = 'rounded border border-[#8C8173] ps-4 pe-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2';
const localDateTime = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
type TaskForm = { draft: DecisionDraft; when: string; note: string; checks: boolean[] };
type Filter = 'All tasks' | 'Outstanding' | 'My desk';
type Notice = { kind: 'recorded' | 'completed' } | { kind: 'review'; outcome: 'confirmed' | 'disputed' } | null;
const STORAGE_UNAVAILABLE = 'storage-unavailable';
const createForms = () => Object.fromEntries(JOURNEY_TASKS.map(task => [task.id, { draft: { taskId: task.id, source: 'Verbal instruction', speaker: '', occurredAt: '', statement: '', reference: '' }, when: localDateTime(), note: '', checks: task.checks.map(() => false) }])) as Record<TaskId, TaskForm>;

/** Same preference and default as the workbench's I18nProvider; <html lang/dir> keeps the preview bar in step. */
function useJourneyLanguage(): [JourneyLanguage, () => void] {
  const [lang, setLang] = useState<JourneyLanguage>(() => { const saved = readPreference('sadu_lang'); return saved === 'en' || saved === 'ar' ? saved : 'ar'; });
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = journeyCopy[lang].dir;
    document.title = journeyCopy[lang].documentTitle;
  }, [lang]);
  return [lang, () => { const next = journeyCopy[lang].switchLang; writePreference('sadu_lang', next); setLang(next); }];
}

export default function RehearsalJourney() {
  const [lang, toggleLanguage] = useJourneyLanguage();
  const t = journeyCopy[lang];
  const [journal, dispatch] = useReducer(journalReducer, undefined, () => {
    try { return restoreJournal(sessionStorage.getItem(JOURNEY_STORAGE_KEY)); }
    catch { return { ...emptyJournal(), recoveryError: STORAGE_UNAVAILABLE }; }
  });
  const state = journal.state;
  const [storageFailed, setStorageFailed] = useState(false);
  useEffect(() => {
    if (journal.recoveryError) return;
    try { sessionStorage.setItem(JOURNEY_STORAGE_KEY, serializeJournal(journal)); setStorageFailed(false); }
    catch { setStorageFailed(true); }
  }, [journal]);
  const recoveryMessage = !journal.recoveryError ? '' : journal.recoveryError === STORAGE_UNAVAILABLE ? t.storageUnavailable : journal.recoveryError.startsWith('Saved journey could not be validated') ? t.recoveryInvalid : journal.recoveryError;
  const resumeTask = JOURNEY_TASKS.find(task => !state.completed[task.id] && !missingTasks(state, task).length) ?? JOURNEY_TASKS[JOURNEY_TASKS.length - 1];
  const [desk, setDesk] = useState<Desk>(resumeTask.owner);
  const [selected, setSelected] = useState<TaskId>(resumeTask.id);
  const taskPanel = useRef<HTMLElement>(null);
  const focusTask = () => requestAnimationFrame(() => { taskPanel.current?.focus({ preventScroll: true }); taskPanel.current?.scrollIntoView({ block: 'start' }); });
  const [filter, setFilter] = useState<Filter>('All tasks');
  const [notice, setNotice] = useState<Notice>(null);
  const [forms, setForms] = useState(createForms);
  const task = taskById(selected);
  const copy = t.task(task);
  const complete = Object.keys(state.completed).length;
  const act = (action: JourneyAction) => { dispatch(action); setNotice(action.type === 'record' ? { kind: 'recorded' } : action.type === 'confirm' ? { kind: 'review', outcome: action.outcome } : { kind: 'completed' }); };
  const noticeText = !notice ? '' : notice.kind === 'recorded' ? t.noticeRecorded : notice.kind === 'review' ? t.noticeReview(t.outcome[notice.outcome]) : t.noticeCompleted;
  const open = (next: JourneyTask) => { setSelected(next.id); setDesk(next.owner); setNotice(null); focusTask(); };
  const when = (iso: string) => new Date(iso).toLocaleString(t.locale);
  const unsaved = JOURNEY_TASKS.some(item => {
    if (state.completed[item.id]) return false;
    const f = forms[item.id]; const r = currentDecision(state, item.id);
    return f.checks.some(Boolean) || Boolean(f.note.trim() && !r?.confirmation) || Boolean((f.draft.speaker.trim() || f.draft.statement.trim() || f.draft.reference?.trim()) && (!r || f.draft.speaker.trim() !== r.speaker || f.draft.statement.trim() !== r.statement || f.draft.source !== r.source || Date.parse(f.when) !== Date.parse(r.occurredAt)));
  });
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);
  return <div className="min-h-screen bg-[#F7F1E6] text-[#2C2A29]" dir={t.dir} lang={lang}>
    <a href="#journey-task" className="sr-only focus:not-sr-only focus:block ps-4 pe-4 py-2">{t.skip}</a>
    <header className="border-b border-[#D9CEBA] ps-5 pe-5 py-5"><div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4">
      <div><strong className="font-serif text-3xl text-[#8B261E]">{lang === 'ar' ? 'سدو' : 'SADU'}</strong><p className="text-sm">{t.subtitle}</p></div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={secondary} lang={t.switchLang} onClick={toggleLanguage}>{t.switchTo}</button>
        <details className="text-sm"><summary className="cursor-pointer underline py-2">{t.demoControls}</summary><p className="max-w-sm my-2">{t.demoControlsNote}</p><label>{t.rehearsalDesk}<select className={input} value={desk} onChange={e => { setDesk(e.target.value as Desk); setNotice(null); }}>{DESKS.map(d => <option key={d} value={d}>{t.desk(d)}</option>)}</select></label></details>
      </div>
    </div></header>
    <main className="mx-auto max-w-7xl ps-4 pe-4 py-6 space-y-6">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-[#8B261E]">{t.dashboard}</p>
        <h1 className="text-3xl font-serif">{t.artistName}</h1>
        <p>{t.artistWork} · {DEMO_ARTIST.weight} {t.kg}</p>
        <p className="max-w-3xl">{t.intro}</p>
        <p className="text-sm">{t.fictional}</p>
        {(recoveryMessage || storageFailed) && <p role="alert">{recoveryMessage || t.storageFailed}</p>}
        <div className="flex flex-wrap items-center gap-3"><progress aria-label={t.progressLabel} max={JOURNEY_TASKS.length} value={complete} className="h-4 w-64 accent-[#8B261E]"/><span>{t.progress(complete, JOURNEY_TASKS.length)}</span></div>
        {complete < JOURNEY_TASKS.length && <button className={secondary} onClick={() => open(resumeTask)}>{t.continueTo(t.task(resumeTask).title)}</button>}
        {unsaved && <p className="text-sm" role="status">{t.unsaved}</p>}
        {complete === JOURNEY_TASKS.length && <p role="status" className="rounded border border-green-700 bg-green-50 ps-4 pe-4 py-3">{t.journeyComplete} <a className="underline font-semibold" href="#journey-record" onClick={() => { const details = document.getElementById("journey-record"); if (details instanceof HTMLDetailsElement) details.open = true; }}>{t.exportRecord}</a>.</p>}
      </section>
      <div className="space-y-4">
        <section ref={taskPanel} id="journey-task" tabIndex={-1} className={`${panel} space-y-4 scroll-mt-4 focus:outline-none`} aria-labelledby="task-heading">
          <p className="text-sm font-semibold text-[#8B261E]">{state.completed[selected] ? t.completedAction : t.currentAction}</p>
          <p className="text-sm">{t.stageLine(task.stage, t.desk(task.owner), t.status(taskStatus(state, task)))}</p>
          <h2 id="task-heading" className="text-2xl font-semibold">{copy.title}</h2>
          <p>{copy.detail}</p><p><strong>{t.when}</strong> {copy.due}</p>
          {desk !== task.owner && <div className="rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-3 pe-3 py-3"><p>{t.otherDesk(t.desk(task.owner))}</p><button className={`${secondary} mt-2`} onClick={() => setDesk(task.owner)}>{t.openDesk(t.desk(task.owner))}</button></div>}
          {!!missingTasks(state, task).length && <aside className="rounded bg-amber-50 border border-amber-700 ps-3 pe-3 py-3"><strong>{t.waitingFor}</strong><ul className="list-disc ps-5">{missingTasks(state, task).map(id => <li key={id}><button className="underline py-1" onClick={() => open(taskById(id))}>{t.task(taskById(id)).title} · {t.desk(taskById(id).owner)}</button></li>)}</ul><p className="mt-2 text-sm">{t.draftAllowed}</p></aside>}
          <p role="status" aria-live="polite">{noticeText}</p>
          <DecisionTask t={t} task={task} state={state} desk={desk} onAction={act} form={forms[selected]} onFormChange={form => setForms(previous => ({ ...previous, [selected]: form }))}/>
          {state.completed[selected] && complete < JOURNEY_TASKS.length && <button className={button} onClick={() => { const next = JOURNEY_TASKS.find(item => !state.completed[item.id] && !missingTasks(state, item).length); if (next) open(next); }}>{t.openNext}</button>}
        </section>
      </div>
        <details className={panel}><summary className="cursor-pointer font-semibold">{t.allSteps(complete, JOURNEY_TASKS.length)}</summary>
          <h2 id="task-list-heading" className="text-xl font-semibold mt-4">{t.taskList}</h2>
          <p className="mt-2 text-sm">{t.taskListNote}</p>
          <label className="block my-3">{t.showTasks}<select value={filter} onChange={e => setFilter(e.target.value as Filter)} className={input}>{(['All tasks', 'Outstanding', 'My desk'] as const).map(f => <option key={f} value={f}>{t.filter(f)}</option>)}</select></label>
          <ol className="max-h-52 overflow-y-auto space-y-2 lg:max-h-[65vh]">{JOURNEY_TASKS.filter(item => filter === 'All tasks' || filter === 'Outstanding' && !state.completed[item.id] || filter === 'My desk' && item.owner === desk).map(item => <li key={item.id}>
            <button aria-current={item.id === selected ? 'step' : undefined} className={`w-full rounded border ps-3 pe-3 py-3 text-start focus-visible:outline-2 ${item.id === selected ? 'border-[#8B261E] bg-[#F7F1E6]' : 'border-[#D9CEBA]'}`} onClick={() => { setSelected(item.id); setNotice(null); focusTask(); }}>
              <span className="block font-semibold">{JOURNEY_TASKS.indexOf(item) + 1}. {t.task(item).title}</span><span className="block text-sm">{t.desk(item.owner)} · {t.status(taskStatus(state, item))}</span>
            </button>
          </li>)}</ol>
          {filter === 'Outstanding' && complete === JOURNEY_TASKS.length && <p>{t.noOutstanding}</p>}
        </details>
      <details className="space-y-4"><summary className="cursor-pointer rounded-xl border border-[#D9CEBA] bg-white ps-5 pe-5 py-5 font-semibold">{t.documentsPayments}</summary>
      <Documents t={t} state={state}/>
      <section className={panel}><h2 className="text-xl font-semibold">{t.ledger}</h2><p className="my-2">{t.ledgerNote}</p>
        {!ledgerRows(state).length ? <p>{t.noPayments}</p> : <ul className="space-y-2">{ledgerRows(state).map(r => <li key={r.decisionId}>{t.task(taskById(r.taskId)).title} · {t.aed} {r.amount.toLocaleString(t.number)} · {when(r.at)}</li>)}</ul>}
      </section>
      </details>
      <details id="journey-record" className={panel}><summary className="cursor-pointer font-semibold">{t.decisionsExport}</summary><section className="mt-4"><h2 className="text-xl font-semibold">{t.history}</h2><p className="my-2">{t.historyNote}</p>
        {!state.decisions.length && <p>{t.noStatements}</p>}
        <ol className="space-y-3">{state.decisions.slice().reverse().map(r => <li className="border-t border-[#D9CEBA] pt-3" key={r.id}><strong>{t.task(taskById(r.taskId)).title}</strong><p>{t.source(r.source)} · <bdi>{r.speaker}</bdi> · {when(r.occurredAt)}</p><p className="whitespace-pre-wrap break-words"><bdi>{r.statement}</bdi></p><p className="text-sm">{t.recordedBy(t.desk(r.recordedBy))} · {r.confirmation ? t.outcomeBy(t.outcome[r.confirmation.outcome], t.desk(r.confirmation.by), r.confirmation.note) : t.awaiting}{currentDecision(state, r.taskId)?.id !== r.id ? t.superseded : ''}</p>{r.reference && <p className="break-words">{t.sourceReference} <bdi>{r.reference}</bdi></p>}</li>)}</ol>
        <button className={`${secondary} mt-4`} onClick={() => { const blob = new Blob([JSON.stringify({ format: 'sadu-fictional-review-v1', artist: DEMO_ARTIST, ...state }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'SADU-fictional-review.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }}>{t.download}</button>
      </section>
      </details>
      <details className="text-sm border-t border-[#D9CEBA] pt-4"><summary className="cursor-pointer underline py-2">{t.about}</summary>
        <p className="my-3">{t.aboutNote}</p>
        <nav aria-label={t.previewNav} className="flex flex-wrap gap-4"><a href="/overview" className="underline py-2">{t.overview}</a><a href="/review" className="underline py-2">{isLocalPreview(window.location.hostname) ? t.reviewLocal : t.reviewRemote}</a></nav>
      </details>
    </main>
  </div>;
}

function DecisionTask({ t, task, state, desk, onAction, form, onFormChange }: { t: JourneyCopy; task: JourneyTask; state: JourneyState; desk: Desk; onAction: (a: JourneyAction) => void; form: TaskForm; onFormChange: (form: TaskForm) => void }) {
  const { draft, when, note, checks } = form;
  const setDraft = (draft: DecisionDraft) => onFormChange({ ...form, draft });
  const setWhen = (when: string) => onFormChange({ ...form, when });
  const setNote = (note: string) => onFormChange({ ...form, note });
  const setChecks = (update: (values: boolean[]) => boolean[]) => onFormChange({ ...form, checks: update(checks) });
  const record = currentDecision(state, task.id);
  const done = state.completed[task.id];
  const copy = t.task(task);
  const owner = t.desk(task.owner);
  const recordedTime = Date.parse(when);
  const validDraft = draft.speaker.trim() && draft.statement.trim() && Number.isFinite(recordedTime) && recordedTime <= Date.now();
  if (done) return <div className="rounded border border-green-700 bg-green-50 ps-4 pe-4 py-4"><strong>{t.completedBy(t.desk(done.by))}</strong><p>{new Date(done.at).toLocaleString(t.locale)}</p><p>{t.decisionKept}</p></div>;
  return <div className="space-y-4">
    {(!record || record.confirmation?.outcome === 'disputed') && <details><summary className="cursor-pointer font-semibold">{t.fallback}</summary><form className="space-y-3" onSubmit={e => { e.preventDefault(); if (!validDraft) return; onAction({ type: 'record', draft: { ...draft, occurredAt: new Date(when).toISOString() }, actor: desk, id: crypto.randomUUID(), at: new Date().toISOString() }); }}>
      <h3 className="font-semibold">{record ? t.recordCorrected : t.recordSaid}</h3>
      <label className="block">{t.sourceType}<select className={input} value={draft.source} onChange={e => setDraft({ ...draft, source: e.target.value as DecisionDraft['source'] })}>{SOURCES.map(s => <option key={s} value={s} disabled={s === 'SADU_Portal'}>{s === 'SADU_Portal' ? t.portalAutomatic : t.source(s)}</option>)}</select></label>
      <label className="block">{t.speaker}<input required maxLength={120} className={input} value={draft.speaker} onChange={e => setDraft({ ...draft, speaker: e.target.value })}/></label>
      <label className="block">{t.happened}<input required type="datetime-local" dir="ltr" className={input} value={when} onChange={e => setWhen(e.target.value)}/></label>
      <label className="block">{t.statement}<textarea required maxLength={2000} rows={3} className={input} value={draft.statement} onChange={e => setDraft({ ...draft, statement: e.target.value })}/></label>
      <label className="block">{t.reference}<input maxLength={250} className={input} placeholder={t.referencePlaceholder} value={draft.reference} onChange={e => setDraft({ ...draft, reference: e.target.value })}/></label>
      {when && (!Number.isFinite(recordedTime) || recordedTime > Date.now()) && <p role="alert">{t.invalidTime}</p>}
      <p className="text-sm">{t.noDocument(t.desk(desk))}</p>
      <button type="button" className={secondary} onClick={() => onFormChange({ ...form, draft: { ...draft, speaker: t.exampleSpeaker(owner), statement: `${t.artistName}: ${copy.title}. ${copy.detail}` }, when: localDateTime() })}>{t.example}</button>
      <button className={`${button} ms-2`} disabled={!validDraft}>{t.record}</button>
    </form></details>}
    {record && <section className="rounded border border-[#D9CEBA] ps-4 pe-4 py-4 space-y-3"><h3 className="font-semibold">{t.currentStatement}</h3><p>{t.source(record.source)} · <bdi>{record.speaker}</bdi></p><p className="whitespace-pre-wrap break-words"><bdi>{record.statement}</bdi></p><p><strong>{record.confirmation ? t.outcome[record.confirmation.outcome] : t.awaiting}</strong></p>
      {!record.confirmation && <><label className="block">{t.confirmNote}<textarea maxLength={500} className={input} value={note} onChange={e => setNote(e.target.value)} placeholder={t.confirmPlaceholder}/></label><div className="flex flex-wrap gap-2"><button className={button} disabled={desk !== task.owner || !note.trim()} onClick={() => onAction({ type: 'confirm', decisionId: record.id, actor: desk, at: new Date().toISOString(), outcome: 'confirmed', note })}>{t.confirm}</button><button className={secondary} disabled={desk !== task.owner || !note.trim()} onClick={() => onAction({ type: 'confirm', decisionId: record.id, actor: desk, at: new Date().toISOString(), outcome: 'disputed', note })}>{t.dispute}</button></div><p className="text-sm">{t.simulated(owner)}</p></>}
    </section>}
    <fieldset className="space-y-3" disabled={desk !== task.owner || Boolean(missingTasks(state, task).length) || Boolean(record && record.confirmation?.outcome !== 'confirmed')}><legend className="font-semibold mb-2">{t.evidence}</legend>{copy.checks.map((label, i) => <label className="flex items-start gap-3" key={task.checks[i]}><input type="checkbox" checked={checks[i]} className="mt-1 h-5 w-5 shrink-0 accent-[#8B261E]" onChange={e => setChecks(values => values.map((v, index) => index === i ? e.target.checked : v))}/><span>{label}</span></label>)}</fieldset>
    {!record && <><p>{t.portalNote}</p><button className={button} disabled={desk !== task.owner || Boolean(missingTasks(state, task).length) || !checks.every(Boolean)} onClick={() => onAction({ type: 'portal_complete', taskId: task.id, actor: desk, at: new Date().toISOString(), id: crypto.randomUUID(), checks })}>{t.portalComplete}</button></>}
    {record && <button className={button} disabled={desk !== task.owner || Boolean(missingTasks(state, task).length) || record?.confirmation?.outcome !== 'confirmed' || !checks.every(Boolean)} onClick={() => record && onAction({ type: 'complete', taskId: task.id, decisionId: record.id, actor: desk, at: new Date().toISOString(), checks })}>{task.owner === 'Finance' ? t.financeComplete : t.complete}</button>}
    <p className="text-sm">{desk !== task.owner ? t.hintSwitch(owner) : missingTasks(state, task).length ? t.hintPrereq : record && record.confirmation?.outcome !== 'confirmed' ? t.hintConfirm : !checks.every(Boolean) ? t.hintChecks : t.hintReady}</p>
  </div>;
}

function Documents({ t, state }: { t: JourneyCopy; state: JourneyState }) {
  const [notice, setNotice] = useState<'ready' | 'failed' | ''>('');
  const selected = Boolean(state.completed.selection);
  const invited = Boolean(state.completed.invitation);
  return <section className={`${panel} space-y-3`}><h2 className="text-xl font-semibold">{t.documents}</h2>
    <p><strong>{t.invitationVersion(state.revision)}</strong> · {!selected ? t.invitationWaiting : invited ? t.invitationPrepared : t.invitationDraft}</p>
    <blockquote className="border-s-4 border-[#8B261E] ps-4">{t.invitationBody}</blockquote>
    <p>{t.agreementSummary}</p>
    <p>{t.packageSummary}</p>
    <button className={secondary} disabled={!selected} onClick={async () => { try { const { downloadInvitation } = await import('../utils/invitationLetterPdf'); await downloadInvitation({ id: 'demo-invitation-v1', artistId: DEMO_ARTIST.id, artistName: DEMO_ARTIST.name, work: DEMO_ARTIST.work, version: state.revision, createdAt: state.completed.selection!.at, bodyAr: '', bodyEn: 'Dear Noura Al Mazrouei, we invite you to present Kufic Horizon: Architectural Bronze & Black Oxide in this fictional exhibition. Participation is subject to the separately recorded sample agreement and specialist reviews. This rehearsal copy is not officially signed or sent.' }, false, false); setNotice('ready'); } catch { setNotice('failed'); } }}>{t.downloadInvitation}</button>
    <p role="status">{notice === 'ready' ? t.pdfReady : notice === 'failed' ? t.pdfFailed : ''}</p>
  </section>;
}
