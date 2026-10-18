import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Check, Circle, ClipboardList, Download, FolderOutput, ImagePlus, Lightbulb, Plus, Presentation, UserPlus, Users, X } from 'lucide-react';
import { pilotSupabase as client } from '../lib/pilotSupabase';
import { useUiText, UiText } from '../context/I18nContext';
import { NominationPresentation, presentationBlob } from './NominationPresentation';
import { buildDeck, deckFileName } from '../lib/nominationDeck';
import { canWriteToFolder, folderSink, sharedFolder, writeExport, zipSink, exportStamp, safeName } from '../lib/nominationExport';
import {
  acceptAttribute, acceptedExtension, CASE_COLUMNS, caseStage, linksFromText, MAX_WORKS, MIN_WORKS, missingForReady,
  signedUrls, uploadCaseFile, recordCommitteeBatch, BUCKET,
  type ArtIdea, type CaseStage, type ContentNote, type EventBrief, type ReasonInBrief, type ReasonType, REASON_TYPES, type CaseWork, type CommitteeBatch, type CommitteeBatchCase, type MissingItem, type NominationCase, type NominationDecision, type NominationEvent,
} from '../lib/nominations';

// One look for the whole Nominations area: white cards on the sand ground, brick for the one main action per screen.
const ui = {
  field: 'mt-1 block w-full rounded-md border border-[#D9CEBA] bg-white ps-3 pe-3 py-2 focus:border-[#8B261E] focus:outline-none focus:ring-2 focus:ring-[#8B261E]/20 pointer-coarse:min-h-[44px]',
  button: 'inline-flex items-center justify-center gap-2 rounded-md bg-[#8B261E] ps-4 pe-4 py-2 font-semibold text-white shadow-sm hover:bg-[#74201A] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B261E] pointer-coarse:min-h-[44px]',
  quiet: 'inline-flex items-center justify-center gap-2 rounded-md border border-[#CBB89F] bg-white ps-4 pe-4 py-2 font-medium text-[#2C2A29] hover:bg-[#FFFAF0] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B261E] pointer-coarse:min-h-[44px]',
  link: 'inline-flex items-center gap-1 text-sm font-medium text-[#8B261E] underline-offset-4 hover:underline disabled:opacity-40 min-h-6 pointer-coarse:min-h-[44px]',
  card: 'rounded-xl border border-[#E4D8C4] bg-white shadow-[0_1px_2px_rgba(44,42,41,0.06)]',
  label: 'block text-sm font-medium text-[#3F3A35]',
  muted: 'text-sm text-[#6E6259]',
};

const stageStyle: Record<CaseStage, string> = {
  DRAFT: 'bg-[#F1E7D6] text-[#5E554B]',
  READY: 'bg-[#F7E3B5] text-[#6B4A0F]',
  SENT: 'bg-[#DCE7F0] text-[#26445C]',
  APPROVED: 'bg-[#DCEBDD] text-[#24532C]',
  DECLINED: 'bg-[#F4DCD8] text-[#8B261E]',
  OTHER: 'bg-[#EEEAE4] text-[#5E554B]',
};

type Draft = { name: string; arabic_name: string; nationality: string; base_city: string; category: string; medium: string; participation: string; biography: string; rationale: string; links: string };
const toDraft = (c: NominationCase): Draft => ({
  name: c.name, arabic_name: c.arabic_name, nationality: c.nationality, base_city: c.base_city ?? '', category: c.category, medium: c.medium,
  participation: c.participation ?? '', biography: c.biography ?? '', rationale: c.rationale ?? '', links: c.links.join('\n'),
});
/** The row the case form writes; also what decides whether the form holds anything unsaved. */
const toRow = (d: Draft) => ({
  name: d.name.trim(), arabic_name: d.arabic_name.trim(), nationality: d.nationality.trim(), base_city: d.base_city.trim() || null,
  category: d.category, medium: d.medium.trim(), participation: d.participation || null,
  biography: d.biography.trim() || null, rationale: d.rationale.trim() || null, links: linksFromText(d.links),
});
const AUTOSAVE_MS = 1500;
const REQUIREMENTS: MissingItem[] = ['name', 'arabic_name', 'nationality', 'category', 'medium', 'biography', 'rationale', 'works'];

type View = 'artists' | 'ideas' | 'brief' | 'deck' | 'invite';

// Forms in the open case that hold edits not yet saved (case fields, a work being added, a decision
// being recorded). Kept per form so one clean form cannot clear another's unsaved entries, and at
// module level so the page around the workspace (refresh, sign out) can ask before discarding them.
const unsaved = new Set<string>();
const markUnsaved = (form: string, value: boolean) => { if (value) unsaved.add(form); else unsaved.delete(form); };
/** True when it is fine to leave the open case: nothing unsaved, or the coordinator confirmed. */
export function confirmLeavingCase(question: string): boolean {
  // No clearing here: each form drops its own flag when it unmounts, so a leave that fails keeps the warning.
  return !unsaved.size || window.confirm(question);
}
export const leaveCaseQuestion = (t: (en: string, ar: string) => string) =>
  t('This case has changes you have not saved. Leave without saving them?', 'في هذا الملف تغييرات غير محفوظة. هل تغادر دون حفظها؟');
type Filter = 'ALL' | CaseStage;
// Smooth scrolling only for people who have not asked their device for reduced motion.
const scrollBehavior = (): ScrollBehavior => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

/** readOnly: the General Coordinator follows every case without preparing, sending or recording anything. */
export function NominationWorkspace({ userId, readOnly = false }: { userId: string; readOnly?: boolean }) {
  const { t, isAr } = useUiText();
  const [events, setEvents] = useState<NominationEvent[]>([]);
  const [eventId, setEventId] = useState('');
  const [cases, setCases] = useState<NominationCase[]>([]);
  const [works, setWorks] = useState<CaseWork[]>([]);
  const [decisions, setDecisions] = useState<NominationDecision[]>([]);
  const [batches, setBatches] = useState<CommitteeBatch[]>([]);
  const [batchCases, setBatchCases] = useState<CommitteeBatchCase[]>([]);
  const [ideas, setIdeas] = useState<ArtIdea[]>([]);
  // False until the scouting migration is applied; the Art ideas tab stays hidden rather than failing.
  const [ideasReady, setIdeasReady] = useState(false);
  const [briefs, setBriefs] = useState<EventBrief[]>([]);
  // False until the festival-brief migration is applied; the Brief tab and the reason note stay hidden.
  const [briefReady, setBriefReady] = useState(false);
  // The event whose briefs are loaded; until it matches the selected event, briefs count as still loading.
  const [briefEvent, setBriefEvent] = useState('');
  // False until the reason-types migration is applied; reason types and content notes stay hidden.
  const [reasonsReady, setReasonsReady] = useState(false);
  const [notes, setNotes] = useState<ContentNote[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>('artists');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [selectedId, setSelectedId] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const top = useRef<HTMLDivElement>(null);
  // Counts loads so a slower, superseded load never overwrites what a newer one set.
  const loadSeq = useRef(0);
  // A refresh started before an event switch (for example after an action) loads the event selected now.
  const selectedEvent = useRef(eventId);
  useLayoutEffect(() => { selectedEvent.current = eventId; }, [eventId]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (unsaved.size) e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  // t() is recreated on every render; read it through a ref so loading does not depend on it.
  const text = useRef(t);
  text.current = t;

  const stageLabel: Record<CaseStage, string> = {
    DRAFT: t('Scouting', 'رصد'), READY: t('Ready for Committee', 'جاهز للجنة'), SENT: t('Sent to Committee', 'مُرسَل إلى اللجنة'),
    APPROVED: t('Approved', 'معتمد'), DECLINED: t('Declined', 'مرفوض'), OTHER: t('Other', 'أخرى'),
  };
  const missingLabel: Record<MissingItem, string> = {
    name: t('English name', 'الاسم بالإنجليزية'), arabic_name: t('Arabic name', 'الاسم بالعربية'), nationality: t('Nationality', 'الجنسية'),
    category: t('Category', 'الفئة'), medium: t('Medium', 'الوسيط الفني'), biography: t('Biography', 'النبذة التعريفية'),
    rationale: t('Rationale', 'مبررات الترشيح'), works: t(`At least ${MIN_WORKS} credited works`, `${MIN_WORKS} أعمال على الأقل مع ذكر المصدر`),
  };

  const load = useCallback(async (keepSelection = true) => {
    if (!client) return;
    const seq = ++loadSeq.current;
    const stale = () => seq !== loadSeq.current;
    const t = text.current;
    const ev = await client.from('sadu_events').select('id,name_en,name_ar,edition').eq('active', true).order('name_en');
    if (stale()) return;
    if (ev.error) { setMessage(t('Events could not be loaded.', 'تعذّر تحميل الفعاليات.')); setLoaded(true); return; }
    setEvents(ev.data as NominationEvent[]);
    const current = selectedEvent.current;
    const activeEvent = current || ev.data?.[0]?.id || '';
    if (!current && activeEvent) setEventId(activeEvent);
    if (!activeEvent) { setLoaded(true); return; }
    const cs = await client.from('artist_dossiers').select(CASE_COLUMNS).eq('event_id', activeEvent).order('created_at');
    const ai = await client.from('sadu_art_ideas').select('*').eq('event_id', activeEvent).is('archived_at', null).order('created_at');
    const br = await client.from('sadu_event_briefs').select('*').eq('event_id', activeEvent).order('recorded_at');
    if (stale()) return;
    if (cs.error) { setMessage(t('Cases could not be loaded.', 'تعذّر تحميل ملفات الفنانين.')); setLoaded(true); return; }
    // PGRST205: the table is not there yet (scouting migration not applied), so the tab stays hidden quietly.
    if (ai.error && ai.error.code !== 'PGRST205') setMessage(t('Art ideas could not be loaded.', 'تعذّر تحميل الأفكار الفنية.'));
    setIdeas(ai.error ? [] : (ai.data ?? []) as ArtIdea[]);
    setIdeasReady(!ai.error);
    if (br.error && br.error.code !== 'PGRST205') setMessage(t('The festival brief could not be loaded.', 'تعذّر تحميل توجيهات المهرجان.'));
    // Discarded drafts stay in the database but are hidden here.
    const list = (cs.data as unknown as NominationCase[]).filter(c => !c.discarded_at);
    const ids = list.map(c => c.id);
    const [ws, ds, bs, bcs] = ids.length ? await Promise.all([
      client.from('sadu_case_works').select('*').in('dossier_id', ids).order('position').order('created_at'),
      client.from('sadu_nomination_decisions').select('*').in('dossier_id', ids).order('recorded_at'),
      client.from('sadu_committee_batches').select('*').eq('event_id', activeEvent).order('sent_at'),
      client.from('sadu_committee_batch_cases').select('*').in('dossier_id', ids),
    ]) : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
    // Only the author's own notes come back (the Director reads them all, outside this workspace).
    const cn = await client.from('sadu_content_notes').select('*').in('dossier_id', ids.length ? ids : ['']).order('recorded_at');
    const signed = await signedUrls(client, (ws.data ?? []).map(w => (w as CaseWork).image_path));
    if (stale()) return;
    if (cn.error && cn.error.code !== 'PGRST205') setMessage(t('Content notes could not be loaded.', 'تعذّر تحميل الملاحظات على المحتوى.'));
    setNotes(cn.error ? [] : (cn.data ?? []) as ContentNote[]);
    setReasonsReady(!cn.error);
    setBriefs(br.error ? [] : (br.data ?? []) as EventBrief[]);
    setBriefReady(!br.error);
    setBriefEvent(activeEvent);
    setCases(list);
    setWorks((ws.data ?? []) as CaseWork[]);
    setDecisions((ds.data ?? []) as NominationDecision[]);
    setBatches((bs.data ?? []) as CommitteeBatch[]);
    setBatchCases((bcs.data ?? []) as CommitteeBatchCase[]);
    setUrls(signed);
    if (!keepSelection) setSelectedId('');
    setLoaded(true);
  }, [eventId]);

  useEffect(() => { void load(); }, [load]);

  async function run(work: () => Promise<void>, success: string): Promise<boolean> {
    if (busy) return false;
    setBusy(true); setMessage('');
    try { await work(); await load(); setMessage(success); return true; }
    catch (error) { setMessage(error instanceof Error ? error.message : t('Something went wrong.', 'حدث خطأ.')); return false; }
    finally { setBusy(false); }
  }

  const event = events.find(e => e.id === eventId);
  // Briefs left over from the previously selected event never show or seed a version under this one.
  const eventBriefs = briefs.filter(b => b.event_id === eventId);
  const briefsLoaded = briefReady && briefEvent === eventId;
  const selected = cases.find(c => c.id === selectedId);
  const worksFor = (id: string) => works.filter(w => w.dossier_id === id);
  const decisionsFor = (id: string) => decisions.filter(d => d.dossier_id === id);
  const sentFor = (id: string) => batchCases.filter(bc => bc.dossier_id === id)
    .map(entry => ({ entry, batch: batches.find(b => b.id === entry.batch_id) }))
    .filter((s): s is SentEntry => !!s.batch).sort((a, b) => a.batch.sent_at.localeCompare(b.batch.sent_at));
  const approved = cases.filter(c => caseStage(c) === 'APPROVED');
  const count = (s: CaseStage) => cases.filter(c => caseStage(c) === s).length;
  const thumb = (id: string) => { const w = worksFor(id)[0]; return w ? urls[w.image_path] : undefined; };

  const go = (next: View, caseId = '') => {
    if (!confirmLeavingCase(leaveCaseQuestion(t))) return;
    setView(next); setSelectedId(caseId); setCreating(false); setMessage('');
    requestAnimationFrame(() => top.current?.scrollIntoView({ block: 'start' }));
  };
  const openCase = (id: string) => go('artists', id);

  async function exportCases(subset: NominationCase[], kind: 'ALL' | 'CASE', pickAgain = false) {
    if (!client || !event || busy || !subset.length) return;
    setBusy(true); setMessage('');
    try {
      const date = new Date();
      const sink = canWriteToFolder() ? folderSink(await sharedFolder(pickAgain)) : await zipSink(`SADU export - ${safeName(event.name_en)} - ${exportStamp(date)}`);
      // Every case that reached the presentation stays in it, so an export after the decisions still carries the deck.
      const deckCases = kind === 'ALL' ? subset.filter(c => caseStage(c) !== 'DRAFT') : [];
      const deckLang = isAr ? 'ar' : 'en';
      const presentation = deckCases.length ? {
        blob: await presentationBlob(buildDeck(event, deckCases.map(c => ({ ...c, works: worksFor(c.id) })), deckLang, date), deckLang, urls),
        fileName: deckFileName(event, deckLang, date),
      } : undefined;
      const { missing } = await writeExport(sink, {
        event, cases: subset, works, decisions, presentation, date,
        fetchFile: async path => (await client!.storage.from(BUCKET).download(path)).data ?? null,
      });
      await client.from('sadu_export_log').insert({ event_id: event.id, kind, dossier_ids: subset.map(c => c.id) });
      setMessage(missing.length
        ? t(`Exported, but ${missing.length} file(s) could not be copied: ${missing.join('; ')}`, `اكتمل التصدير، لكن تعذّر نسخ ${missing.length} من الملفات: ${missing.join('؛ ')}`)
        : canWriteToFolder()
          ? t(`Exported ${subset.length} case(s) to the shared folder, in a new dated folder under “SADU export”.`, `صُدِّر ${subset.length} من ملفات الفنانين إلى مجلد جديد مؤرخ داخل «SADU export» في المجلد المشترك.`)
          : t('Export downloaded as a ZIP file. Unzip it into the shared folder.', 'نُزِّلت الملفات المُصدَّرة في ملف مضغوط (ZIP). استخرج محتواه في المجلد المشترك.'));
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      setMessage(aborted ? t('Export cancelled.', 'أُلغي التصدير.') : error instanceof Error ? error.message : t('The export failed.', 'تعذّر التصدير.'));
    } finally { setBusy(false); }
  }

  if (!client) return null;
  // Phones show the short label so all four sections fit on one row without scrolling sideways.
  const tabs: { id: View; label: string; short: string; icon: ReactNode; badge?: number; hidden?: boolean }[] = [
    { id: 'artists', label: t('Artists', 'الفنانون'), short: t('Artists', 'الفنانون'), icon: <Users aria-hidden className="size-4" />, badge: cases.length },
    { id: 'ideas', label: t('Art ideas', 'أفكار فنية'), short: t('Ideas', 'أفكار'), icon: <Lightbulb aria-hidden className="size-4" />, badge: ideas.length, hidden: !ideasReady },
    { id: 'brief', label: t('Brief and reasons', 'التوجيهات والأسباب'), short: t('Brief', 'التوجيهات'), icon: <ClipboardList aria-hidden className="size-4" />, hidden: !briefReady },
    { id: 'deck', label: t('Committee deck', 'العرض التقديمي للجنة'), short: t('Committee', 'اللجنة'), icon: <Presentation aria-hidden className="size-4" />, badge: count('READY'), hidden: readOnly },
    { id: 'invite', label: t('Invite list', 'قائمة الدعوات'), short: t('Invite', 'الدعوات'), icon: <UserPlus aria-hidden className="size-4" />, badge: approved.length },
  ];
  const shownTabs = tabs.filter(tab => !tab.hidden);

  return <section aria-labelledby="nominations-heading" className="space-y-5">
    <div ref={top} className="scroll-mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
      <div className="me-auto min-w-0">
        <h1 id="nominations-heading" className="font-serif text-2xl text-[#1A1817] sm:text-3xl">{event ? `${isAr ? event.name_ar : event.name_en}${event.edition ? ` ${event.edition}` : ''}` : t('Nominations', 'الترشيحات')}</h1>
        <p className={`max-w-2xl ${ui.muted}`}>{readOnly ? t('Every artist case the coordinators are preparing, and where each one stands. You can read them here; the coordinators edit them and record the decisions.', 'كل ملفات الفنانين التي يعدّها المنسقون، ومرحلة كل ملف. يمكنك الاطلاع عليها هنا، ويتولى المنسقون تعديلها وتسجيل القرارات.') : t('Scout artists from published sources, send the ready ones to the Committee as a deck, and record the decision. Artists are not contacted until the Director approves.', 'ارصد الفنانين من المصادر المنشورة، وأرسل الجاهزين منهم إلى اللجنة في عرض تقديمي، ثم سجّل القرار. لا يُتواصل مع الفنان قبل اعتماد المدير.')}</p>
      </div>
      {events.length > 1 && <label className={ui.label}>{t('Event', 'الفعالية')}
        <select className={ui.field} value={eventId} onChange={e => { if (!confirmLeavingCase(leaveCaseQuestion(t))) return; setEventId(e.target.value); go('artists'); }}>
          {events.map(e => <option key={e.id} value={e.id}>{isAr ? e.name_ar : e.name_en}{e.edition ? ` · ${e.edition}` : ''}</option>)}
        </select></label>}
    </div>

    <nav aria-label={t('Nominations sections', 'أقسام الترشيحات')} className={`grid border-b border-[#E4D8C4] sm:flex sm:gap-1 ${shownTabs.length > 4 ? 'grid-cols-5' : shownTabs.length > 3 ? 'grid-cols-4' : 'grid-cols-3'}`}>
      {shownTabs.map(tab => {
        const active = view === tab.id;
        return <button key={tab.id} type="button" aria-current={active ? 'page' : undefined} onClick={() => go(tab.id)}
          className={`-mb-px inline-flex min-w-0 flex-col items-center gap-1 border-b-2 ps-1 pe-1 py-2 text-xs font-semibold sm:flex-row sm:gap-2 sm:ps-3 sm:pe-3 sm:py-3 sm:text-sm ${active ? 'border-[#8B261E] text-[#8B261E]' : 'border-transparent text-[#5E554B] hover:text-[#1A1817]'}`}>
          <span className="inline-flex items-center gap-1.5">{tab.icon}<span className="sm:hidden">{tab.short}</span><span className="hidden sm:inline">{tab.label}</span></span>
          {!!tab.badge && <span className={`rounded-full ps-2 pe-2 text-xs ${active ? 'bg-[#8B261E] text-white' : 'bg-[#F1E7D6] text-[#5E554B]'}`}>{tab.badge}</span>}
        </button>;
      })}
    </nav>

    {message && <div role="status" aria-live="polite" className="flex items-start gap-3 rounded-lg border border-[#CBB89F] bg-[#FFFAF0] ps-4 pe-2 py-2">
      <p className="me-auto py-1"><UiText value={message} /></p>
      <button type="button" className="rounded p-1 text-[#6E6259] hover:bg-[#F1E7D6]" aria-label={t('Dismiss', 'إغلاق')} onClick={() => setMessage('')}><X aria-hidden className="size-4" /></button>
    </div>}

    {view === 'artists' && (selected
      ? <CaseDetail key={selected.id} onBack={() => go('artists')} onDeck={() => go('deck')} onExport={() => void exportCases([selected], 'CASE')} c={selected}
        works={worksFor(selected.id)} decisions={decisionsFor(selected.id)} sent={sentFor(selected.id)} urls={urls}
        mine={!readOnly && selected.created_by === userId} readOnly={readOnly} briefReady={briefsLoaded && eventBriefs.length > 0} reasonsReady={reasonsReady}
        notes={notes.filter(n => n.dossier_id === selected.id)} busy={busy} run={run} refresh={() => load()} missingLabel={missingLabel} stageLabel={stageLabel} />
      : <ArtistsView cases={cases} filter={filter} setFilter={setFilter} stageLabel={stageLabel} count={count} thumb={thumb} worksFor={worksFor} userId={userId}
        loaded={loaded} busy={busy} readOnly={readOnly} creating={creating} setCreating={setCreating} onOpen={openCase} eventReady={!!eventId}
        onExportAll={pick => void exportCases(cases, 'ALL', pick)}
        onCreate={draft => void run(async () => {
          const { data, error } = await client!.from('artist_dossiers').insert({ event_id: eventId, name: draft.name.trim(), arabic_name: draft.arabic_name.trim(), nationality: draft.nationality.trim(), category: draft.category, medium: draft.medium.trim() }).select('id').single();
          if (error) throw new Error(error.message);
          setCreating(false); setSelectedId((data as { id: string }).id);
        }, t('Case created. Add the biography, rationale and works.', 'أُنشئ الملف. أضف النبذة التعريفية ومبررات الترشيح والأعمال.'))} />)}

    {view === 'deck' && event && !readOnly && <NominationPresentation event={event} cases={cases} works={works} urls={urls} busy={busy} onMessage={setMessage} onOpenCase={openCase}
      onExported={(ids, note) => { setMessage(note); void client!.from('sadu_export_log').insert({ event_id: event.id, kind: 'PRESENTATION', dossier_ids: ids }); }}
      onRecordSent={deck => run(async () => { await recordCommitteeBatch(client!, event.id, deck); },
        t('Recorded as sent to the Committee. When the decision email arrives, open each artist and record it.', 'سُجّل الإرسال إلى اللجنة. عند وصول رسالة القرار، افتح ملف كل فنان وسجّل القرار.'))} />}

    {view === 'brief' && event && briefsLoaded && <BriefView key={event.id} eventId={event.id} briefs={eventBriefs} cases={cases} decisions={decisions} readOnly={readOnly} busy={busy} run={run} onOpenCase={openCase} />}

    {view === 'ideas' && event && ideasReady && <ArtIdeas eventId={event.id} ideas={ideas} cases={cases} userId={userId} readOnly={readOnly} busy={busy} run={run} />}

    {view === 'invite' && <section className="space-y-4" aria-labelledby="invite-heading">
      <div><h2 id="invite-heading" className="font-serif text-2xl">{t('Invite list', 'قائمة الدعوات')}</h2>
        <p className={ui.muted}>{t('Artists the Director approved. Contact begins here, at the invitation step.', 'الفنانون الذين اعتمدهم المدير. يبدأ التواصل من هنا، في خطوة الدعوة.')}</p></div>
      {approved.length ? <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{approved.map(c => {
        const d = decisionsFor(c.id).filter(x => x.director_decision === 'APPROVED').pop();
        return <li key={c.id}><button type="button" onClick={() => openCase(c.id)} className={`${ui.card} flex w-full items-center gap-3 ps-3 pe-4 py-3 text-start hover:border-[#CBB89F]`}>
          <Thumb src={thumb(c.id)} name={isAr ? c.arabic_name : c.name} size="size-14" />
          <span className="min-w-0"><strong className="block truncate">{isAr ? c.arabic_name : c.name}</strong>
            <span className={`block truncate ${ui.muted}`}>{c.nationality} · {c.medium}</span>
            {d && <span className={`block ${ui.muted}`}>{t('Approved on', 'اعتُمد بتاريخ')} <bdi dir="ltr">{d.decided_on}</bdi></span>}</span>
        </button></li>;
      })}</ul>
        : <Empty icon={<UserPlus aria-hidden className="size-6" />} title={t('Nobody approved yet', 'لا يوجد فنان معتمد بعد')}
          body={t('When the Director approves an artist, record the decision on their case and they appear here, ready to invite.', 'عندما يعتمد المدير فناناً، سجّل القرار في ملفه فيظهر هنا جاهزاً للدعوة.')} />}
    </section>}
  </section>;
}

function Thumb({ src, name, size = 'size-12' }: { src?: string; name: string; size?: string }) {
  return src ? <img src={src} alt="" className={`${size} shrink-0 rounded-lg object-cover`} />
    : <span aria-hidden className={`${size} grid shrink-0 place-items-center rounded-lg bg-[#F1E7D6] font-serif text-lg text-[#8B261E]`}>{name.trim().charAt(0)}</span>;
}

function StagePill({ stage, label }: { stage: CaseStage; label: string }) {
  return <span className={`inline-flex shrink-0 items-center rounded-full ps-2.5 pe-2.5 py-0.5 text-xs font-semibold ${stageStyle[stage]}`}>{label}</span>;
}

function Empty({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return <div className={`${ui.card} grid place-items-center gap-2 ps-6 pe-6 py-10 text-center`}>
    <span className="grid size-12 place-items-center rounded-full bg-[#F1E7D6] text-[#8B261E]">{icon}</span>
    <h3 className="font-serif text-xl">{title}</h3><p className={`max-w-md ${ui.muted}`}>{body}</p>{action}
  </div>;
}

function ArtistsView({ cases, filter, setFilter, stageLabel, count, thumb, worksFor, userId, loaded, busy, readOnly, creating, setCreating, onOpen, onCreate, onExportAll, eventReady }: {
  cases: NominationCase[]; filter: Filter; setFilter: (f: Filter) => void; stageLabel: Record<CaseStage, string>; count: (s: CaseStage) => number;
  thumb: (id: string) => string | undefined; worksFor: (id: string) => CaseWork[]; userId: string; loaded: boolean; busy: boolean; readOnly: boolean; eventReady: boolean;
  creating: boolean; setCreating: (v: boolean) => void; onOpen: (id: string) => void; onExportAll: (pickAgain: boolean) => void;
  onCreate: (d: Pick<Draft, 'name' | 'arabic_name' | 'nationality' | 'category' | 'medium'>) => void;
}) {
  const { t, isAr } = useUiText();
  const [query, setQuery] = useState('');
  const nextStep = (c: NominationCase): string => {
    const stage = caseStage(c), missing = missingForReady(c, worksFor(c.id).length).length;
    // Read-only viewers get where the case stands, not a to-do that is not theirs.
    if (readOnly) {
      if (stage === 'DRAFT') return missing ? t(`Being prepared, ${missing} ${missing === 1 ? 'item' : 'items'} missing`, `قيد الإعداد (ينقص ${missing})`) : t('Complete, not yet marked ready', 'مكتمل، ولم يُحدَّد جاهزاً للجنة بعد');
      if (stage === 'READY') return t('Ready, waiting to go to the Committee', 'جاهز، بانتظار إرساله إلى اللجنة');
      if (stage === 'SENT') return t('With the Committee, waiting for the decision', 'لدى اللجنة، بانتظار القرار');
    }
    if (stage === 'DRAFT') return missing ? t(`Next: complete the case (${missing} missing)`, `التالي: استكمال الملف (ينقص ${missing})`) : t('Next: mark it ready for the Committee', 'التالي: تحديده جاهزاً للجنة');
    if (stage === 'READY') return t('Next: include it in the Committee deck', 'التالي: إدراجه في العرض التقديمي للجنة');
    if (stage === 'SENT') return t('Next: record the decision from email', 'التالي: تسجيل القرار الوارد بالبريد');
    if (stage === 'APPROVED') return t('On the invite list', 'في قائمة الدعوات');
    return '';
  };
  const stages: CaseStage[] = ['DRAFT', 'READY', 'SENT', 'APPROVED', ...(count('DECLINED') ? ['DECLINED' as CaseStage] : [])];
  // Search appears once the list is long enough to scan; it matches either name, nationality or medium.
  const searchable = cases.length > 5;
  const needle = searchable ? query.trim().toLocaleLowerCase() : '';
  const matches = (c: NominationCase) => !needle || [c.name, c.arabic_name, c.nationality, c.medium].some(v => v?.toLocaleLowerCase().includes(needle));
  const shown = cases.filter(c => (filter === 'ALL' || caseStage(c) === filter) && matches(c));
  const newButton = <button type="button" className={ui.button} disabled={busy || !eventReady} onClick={() => setCreating(true)}><Plus aria-hidden className="size-4" />{t('New artist case', 'ملف فنان جديد')}</button>;

  return <div className="space-y-5">
    {creating && <NewCaseForm busy={busy} onCancel={() => setCreating(false)} onCreate={onCreate} />}

    {!loaded && <div aria-busy="true" aria-label={t('Loading artist cases', 'جارٍ تحميل ملفات الفنانين')} className="space-y-5">
      <div className="grid grid-cols-4 gap-2">{[0, 1, 2, 3].map(i => <div key={i} className={`${ui.card} h-16 animate-pulse motion-reduce:animate-none`} />)}</div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map(i => <li key={i} className={`${ui.card} flex gap-3 ps-4 pe-4 py-4`}>
        <span className="size-14 shrink-0 animate-pulse rounded-lg bg-[#F1E7D6] motion-reduce:animate-none" />
        <span className="flex-1 space-y-2 pt-1"><span className="block h-4 w-2/3 animate-pulse rounded bg-[#F1E7D6] motion-reduce:animate-none" /><span className="block h-3 w-1/2 animate-pulse rounded bg-[#F1E7D6] motion-reduce:animate-none" /></span>
      </li>)}</ul>
    </div>}

    {loaded && !cases.length && !creating ? readOnly ? <Empty icon={<Users aria-hidden className="size-6" />} title={t('No artist cases yet', 'لا توجد ملفات فنانين بعد')}
      body={t('When a coordinator starts scouting an artist, the case appears here.', 'عندما يبدأ أحد المنسقين رصد فنان، يظهر ملفه هنا.')} /> : <Empty icon={<Users aria-hidden className="size-6" />} title={t('Start by scouting an artist', 'ابدأ برصد فنان')}
      body={t('Build a case from published sources only (exhibitions, catalogues, websites, press). Artists are not contacted until the Director approves them.', 'جهّز ملفاً من المصادر المنشورة فقط (المعارض والكتالوجات والمواقع والصحافة). لا يُتواصل مع الفنان إلا بعد اعتماد المدير.')}
      action={<div className="pt-2">{newButton}</div>} /> : cases.length > 0 && <>
      <ol aria-label={t('How a nomination moves', 'مراحل الترشيح')} className={`grid gap-1.5 sm:gap-2 ${stages.length > 4 ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {stages.map((s, i) => <li key={s}>
          <button type="button" aria-pressed={filter === s} onClick={() => setFilter(filter === s ? 'ALL' : s)}
            className={`${ui.card} flex h-full w-full flex-col items-start gap-1 ps-2 pe-2 py-2 text-start sm:flex-row sm:items-center sm:gap-3 sm:ps-3 sm:pe-3 sm:py-3 ${filter === s ? '!border-[#8B261E] !bg-[#FBF4F1]' : 'hover:border-[#CBB89F]'}`}>
            <span className="hidden size-8 shrink-0 place-items-center rounded-full bg-[#F7F1E6] text-sm font-semibold text-[#8B261E] sm:grid">{s === 'DECLINED' ? <X aria-hidden className="size-4" /> : i + 1}</span>
            <span className="min-w-0"><span className="block text-xl font-semibold leading-none sm:text-2xl">{count(s)}</span>
              <span className="block text-xs leading-tight text-[#5E554B] sm:truncate sm:text-sm">{s === 'SENT' ? t('Waiting for decision', 'بانتظار القرار') : stageLabel[s]}</span></span>
          </button></li>)}
      </ol>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {!creating && !readOnly && <span className="w-full sm:order-last sm:w-auto [&>button]:w-full">{newButton}</span>}
        <p className="me-auto text-sm text-[#5E554B]">{filter === 'ALL' ? t(`All ${cases.length} artists`, `كل الفنانين (${cases.length})`)
          : <>{t(`Showing: ${stageLabel[filter]}`, `المعروض: ${stageLabel[filter]}`)} · <button type="button" className={ui.link} onClick={() => setFilter('ALL')}>{t('Show all', 'عرض الكل')}</button></>}</p>
        {searchable && <label className="w-full sm:order-first sm:w-64"><span className="sr-only">{t('Search artists', 'البحث عن فنان')}</span>
          <input type="search" className={`${ui.field} !mt-0`} value={query} onChange={e => setQuery(e.target.value)} placeholder={t('Search by name, nationality or medium', 'ابحث بالاسم أو الجنسية أو الوسيط')} /></label>}
        {!readOnly && canWriteToFolder() && <button type="button" className={ui.link} disabled={busy} onClick={() => onExportAll(true)}>{t('Choose export folder', 'اختيار مجلد التصدير')}</button>}
        {!readOnly && <button type="button" className={ui.quiet} disabled={busy} onClick={() => onExportAll(false)} title={t('Copies every case, the deck and a summary sheet into the department’s shared folder.', 'ينسخ كل الملفات والعرض وجدولاً ملخصاً إلى المجلد المشترك للإدارة.')}>
          <FolderOutput aria-hidden className="size-4" />{t('Export all', 'تصدير الكل')}</button>}
      </div>

      {shown.length ? <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{shown.map(c => {
        const stage = caseStage(c), mine = c.created_by === userId;
        const done = REQUIREMENTS.length - missingForReady(c, worksFor(c.id).length).length;
        return <li key={c.id}><button type="button" onClick={() => onOpen(c.id)} className={`${ui.card} group flex h-full w-full flex-col gap-3 ps-4 pe-4 py-4 text-start hover:border-[#CBB89F] hover:shadow-md`}>
          <span className="flex w-full items-start gap-3">
            <Thumb src={thumb(c.id)} name={isAr ? c.arabic_name : c.name} size="size-14" />
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-lg group-hover:text-[#8B261E]">{isAr ? c.arabic_name : c.name}</strong>
              <span className="block truncate text-sm text-[#5E554B]" lang={isAr ? 'en' : 'ar'}><bdi>{isAr ? c.name : c.arabic_name}</bdi></span>
              <span className="block truncate text-sm text-[#5E554B]">{c.nationality} · {c.medium}</span>
            </span>
          </span>
          <span className="flex w-full flex-wrap items-center gap-2">
            <StagePill stage={stage} label={stageLabel[stage]} />
            {!mine && !readOnly && <span className="text-xs text-[#6E6259]">{t('Another coordinator’s case', 'ملف منسق آخر')}</span>}
          </span>
          {stage === 'DRAFT' && <span className="flex w-full items-center gap-2" aria-label={t(`${done} of ${REQUIREMENTS.length} required items done`, `اكتمل ${done} من ${REQUIREMENTS.length} من البنود المطلوبة`)}>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F1E7D6]"><span className="block h-full rounded-full bg-[#B9875A]" style={{ width: `${(done / REQUIREMENTS.length) * 100}%` }} /></span>
            <span className="text-xs text-[#6E6259]"><bdi>{done}/{REQUIREMENTS.length}</bdi></span>
          </span>}
          <span className="mt-auto text-sm font-medium text-[#8B261E]">{nextStep(c)}</span>
        </button></li>;
      })}</ul> : <p className={ui.muted}>{needle ? t(`No artists match “${query.trim()}”.`, `لا يوجد فنان يطابق «${query.trim()}».`) : t('No artists at this step.', 'لا يوجد فنانون في هذه المرحلة.')}</p>}
    </>}
  </div>;
}

function NewCaseForm({ busy, onCreate, onCancel }: { busy: boolean; onCreate: (d: Pick<Draft, 'name' | 'arabic_name' | 'nationality' | 'category' | 'medium'>) => void; onCancel: () => void }) {
  const { t } = useUiText();
  const [d, setD] = useState({ name: '', arabic_name: '', nationality: '', category: 'Emerging', medium: '' });
  const ok = d.name.trim() && d.arabic_name.trim() && d.nationality.trim() && d.medium.trim();
  return <form className={`${ui.card} grid gap-4 ps-5 pe-5 py-5 sm:grid-cols-2`} onSubmit={e => { e.preventDefault(); if (ok) onCreate(d); }}>
    <div className="sm:col-span-2"><h2 className="font-serif text-xl">{t('New artist case', 'ملف فنان جديد')}</h2>
      <p className={ui.muted}>{t('Start with the basics. You add the biography, rationale and works on the next screen.', 'ابدأ بالأساسيات. تضيف النبذة التعريفية ومبررات الترشيح والأعمال في الشاشة التالية.')}</p></div>
    <label className={ui.label}>{t('Artist name (English)', 'اسم الفنان بالإنجليزية')}<input required autoFocus dir="ltr" className={ui.field} value={d.name} onChange={e => setD({ ...d, name: e.target.value })} /></label>
    <label className={ui.label}>{t('Artist name (Arabic)', 'اسم الفنان بالعربية')}<input required dir="rtl" lang="ar" className={ui.field} value={d.arabic_name} onChange={e => setD({ ...d, arabic_name: e.target.value })} /></label>
    <label className={ui.label}>{t('Nationality', 'الجنسية')}<input required className={ui.field} value={d.nationality} onChange={e => setD({ ...d, nationality: e.target.value })} /></label>
    <label className={ui.label}>{t('Medium / practice', 'الوسيط / الممارسة الفنية')}<input required className={ui.field} value={d.medium} onChange={e => setD({ ...d, medium: e.target.value })} /></label>
    <label className={ui.label}>{t('Category', 'الفئة')}<select className={ui.field} value={d.category} onChange={e => setD({ ...d, category: e.target.value })}>
      <option value="Emerging">{t('Emerging', 'ناشئ')}</option><option value="Established">{t('Established', 'متمرّس')}</option></select></label>
    <div className="flex items-end gap-3"><button className={ui.button} disabled={busy || !ok}>{t('Create case', 'إنشاء الملف')}</button><button type="button" className={ui.quiet} onClick={onCancel}>{t('Cancel', 'إلغاء')}</button></div>
  </form>;
}

type RunFn = (work: () => Promise<void>, success: string) => Promise<boolean>;
type SentEntry = { entry: CommitteeBatchCase; batch: CommitteeBatch };

/** Where the case is on its way from scouting to a decision. */
function StageTrack({ stage }: { stage: CaseStage }) {
  const { t } = useUiText();
  const steps = [t('Scouting', 'رصد'), t('Ready', 'جاهز'), t('Sent to Committee', 'مُرسَل إلى اللجنة'), stage === 'DECLINED' ? t('Declined', 'مرفوض') : t('Approved', 'معتمد')];
  const at = { DRAFT: 0, READY: 1, SENT: 2, APPROVED: 3, DECLINED: 3, OTHER: 0 }[stage];
  return <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" aria-label={t('Progress', 'التقدم')}>
    {steps.map((s, i) => <li key={s} className="flex items-center gap-2" aria-current={i === at ? 'step' : undefined}>
      <span className={`grid size-6 place-items-center rounded-full text-xs font-semibold ${i < at ? 'bg-[#8B261E] text-white' : i === at ? 'border-2 border-[#8B261E] text-[#8B261E]' : 'border border-[#D9CEBA] text-[#8C8173]'}`}>
        {i < at ? <Check aria-hidden className="size-3.5" /> : i + 1}</span>
      <span className={i === at ? 'font-semibold text-[#1A1817]' : 'text-[#6E6259]'}>{s}</span>
      {i < steps.length - 1 && <span aria-hidden className="h-px w-6 bg-[#D9CEBA]" />}
    </li>)}
  </ol>;
}

function Section({ title, children, aside, id }: { title: string; children: ReactNode; aside?: ReactNode; id?: string }) {
  return <section id={id} className={`${ui.card} scroll-mt-4 space-y-4 ps-5 pe-5 py-5`} aria-label={title}>
    <div className="flex flex-wrap items-baseline gap-2"><h3 className="me-auto font-serif text-xl">{title}</h3>{aside}</div>{children}
  </section>;
}

function CaseDetail({ c, works, decisions, sent, urls, mine, readOnly, briefReady, reasonsReady, notes, busy, run, refresh, missingLabel, stageLabel, onExport, onBack, onDeck }: {
  c: NominationCase; works: CaseWork[]; decisions: NominationDecision[]; sent: SentEntry[]; urls: Record<string, string>; mine: boolean; readOnly: boolean; briefReady: boolean; reasonsReady: boolean; notes: ContentNote[]; busy: boolean;
  run: RunFn; refresh: () => Promise<void>; missingLabel: Record<MissingItem, string>; stageLabel: Record<CaseStage, string>; onExport: () => void; onBack: () => void; onDeck: () => void;
}) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const { t, isAr } = useUiText();
  const stage = caseStage(c);
  const editable = mine && stage === 'DRAFT';
  const [draft, setDraft] = useState<Draft>(() => toDraft(c));
  const row = useMemo(() => JSON.stringify(toRow(draft)), [draft]);
  const dirty = row !== JSON.stringify(toRow(toDraft(c)));
  // Autosave: edits are written a moment after typing stops, so nothing is lost by switching away.
  // The manual save stays as a fallback, and the unsaved warning stays on until a save succeeds.
  const [autosave, setAutosave] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const attempted = useRef('');
  useEffect(() => { markUnsaved('case', dirty); }, [dirty]);
  useEffect(() => () => markUnsaved('case', false), []);
  /** Takes the coordinator from a missing item in the checklist to the place where it is filled in. */
  const jumpTo = (m: MissingItem) => {
    const el = document.getElementById(`case-${m}`);
    el?.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) el.focus({ preventScroll: true });
  };
  const missing = missingForReady({ ...c, ...draft }, works.length);
  const set = (k: keyof Draft) => (e: { target: { value: string } }) => setDraft({ ...draft, [k]: e.target.value });
  const decisionRef = useRef<HTMLDivElement>(null);

  const persist = async () => {
    const { error } = await client!.from('artist_dossiers').update(toRow(draft)).eq('id', c.id);
    if (error) throw new Error(error.message);
  };
  const save = () => run(persist, t('Case saved.', 'حُفظ الملف.'));
  useEffect(() => {
    if (!editable || !dirty || busy || autosave === 'saving' || attempted.current === row) return;
    const timer = window.setTimeout(() => {
      attempted.current = row;
      setAutosave('saving');
      persist().then(refresh).then(() => setAutosave('saved'), () => setAutosave('failed'));
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  // persist and refresh read the latest draft through row; listing them would restart the timer every render.
  }, [row, dirty, editable, busy, autosave]);

  const markReady = () => run(async () => {
    if (dirty) await persist();
    const { data, error } = await client!.from('artist_dossiers').update({ status: 'PENDING_COMMITTEE_REVIEW' }).eq('id', c.id).select('id');
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error(t('The case could not be made ready for the Committee. Refresh and try again.', 'تعذّر تجهيز الملف للجنة. حدّث الصفحة وحاول مجدداً.'));
  }, t('The case is ready for the Committee and locked. Next, add it to the Committee deck.', 'أصبح الملف جاهزاً للجنة وقُفل. الخطوة التالية: إضافته إلى العرض التقديمي للجنة.'));

  const category = c.category === 'Emerging' ? t('Emerging', 'ناشئ') : c.category === 'Established' ? t('Established', 'متمرّس') : c.category;
  const participation = c.participation === 'EXISTING_WORK' ? t('Existing work', 'عمل منجز') : c.participation === 'NEW_COMMISSION' ? t('New commission', 'تكليف بعمل جديد') : '';

  return <article className="space-y-5" aria-label={isAr ? c.arabic_name : c.name}>
    <button type="button" className={ui.link} onClick={onBack}><ArrowLeft aria-hidden className="size-4 rtl:rotate-180" />{t('All artists', 'كل الفنانين')}</button>
    <header className={`${ui.card} flex flex-wrap items-center gap-4 ps-5 pe-5 py-5`}>
      <Thumb src={works[0] ? urls[works[0].image_path] : undefined} name={isAr ? c.arabic_name : c.name} size="size-16" />
      <div className="me-auto min-w-0 space-y-1">
        <h2 className="font-serif text-2xl leading-tight sm:text-3xl">{isAr ? c.arabic_name : c.name} <span className="text-lg text-[#6E6259]" lang={isAr ? 'en' : 'ar'}><bdi>{isAr ? c.name : c.arabic_name}</bdi></span></h2>
        <p className={ui.muted}>{[c.nationality, c.base_city, category, c.medium].filter(Boolean).join(' · ')}</p>
      </div>
      <div className="w-full"><StageTrack stage={stage} /></div>
    </header>

    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        {editable ? <Section title={t('About the artist', 'عن الفنان')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={ui.label}>{t('Artist name (English)', 'اسم الفنان بالإنجليزية')}<input dir="ltr" className={ui.field} id="case-name" value={draft.name} onChange={set('name')} /></label>
            <label className={ui.label}>{t('Artist name (Arabic)', 'اسم الفنان بالعربية')}<input dir="rtl" lang="ar" className={ui.field} id="case-arabic_name" value={draft.arabic_name} onChange={set('arabic_name')} /></label>
            <label className={ui.label}>{t('Nationality', 'الجنسية')}<input className={ui.field} id="case-nationality" value={draft.nationality} onChange={set('nationality')} /></label>
            <label className={ui.label}>{t('Base city', 'مدينة الإقامة')}<input className={ui.field} value={draft.base_city} onChange={set('base_city')} /></label>
            <label className={ui.label}>{t('Category', 'الفئة')}<select className={ui.field} id="case-category" value={draft.category} onChange={set('category')}>
              <option value="Emerging">{t('Emerging', 'ناشئ')}</option><option value="Established">{t('Established', 'متمرّس')}</option></select></label>
            <label className={ui.label}>{t('Medium / practice', 'الوسيط / الممارسة الفنية')}<input className={ui.field} id="case-medium" value={draft.medium} onChange={set('medium')} /></label>
            <label className={`${ui.label} sm:col-span-2`}>{t('Proposed participation', 'المشاركة المقترحة')}<select className={ui.field} value={draft.participation} onChange={set('participation')}>
              <option value="">{t('Not decided yet', 'لم تُحدد بعد')}</option><option value="EXISTING_WORK">{t('Existing work', 'عمل منجز')}</option><option value="NEW_COMMISSION">{t('New commission', 'تكليف بعمل جديد')}</option></select></label>
            <label className={`${ui.label} sm:col-span-2`}>{t('Biography', 'النبذة التعريفية')}<span className={`block font-normal ${ui.muted}`}>{t('A short paragraph for the slide.', 'فقرة قصيرة للشريحة.')}</span><textarea rows={4} maxLength={6000} dir="auto" className={ui.field} id="case-biography" value={draft.biography} onChange={set('biography')} /></label>
            <label className={`${ui.label} sm:col-span-2`}>{t('Rationale', 'مبررات الترشيح')}<span className={`block font-normal ${ui.muted}`}>{t('Why this artist, and how the work fits the festival brief: theme, venues, media and disciplines.', 'سبب اختيار هذا الفنان، ومدى توافق عمله مع توجيهات المهرجان: الموضوع وأماكن العرض والوسائط والتخصصات.')}</span><textarea rows={4} maxLength={6000} dir="auto" className={ui.field} id="case-rationale" value={draft.rationale} onChange={set('rationale')} /></label>
            <label className={`${ui.label} sm:col-span-2`}>{t('Links (one per line)', 'روابط (رابط في كل سطر)')}<span className={`block font-normal ${ui.muted}`}>{t('Website, gallery, press.', 'الموقع الإلكتروني، صالة العرض، الصحافة.')}</span><textarea rows={2} dir="ltr" className={ui.field} value={draft.links} onChange={set('links')} /></label>
          </div>
          <div className="flex flex-wrap items-center gap-3"><button type="button" className={ui.quiet} disabled={busy || !dirty} onClick={() => void save()}>{t('Save changes', 'حفظ التغييرات')}</button>
            <span role="status" className={autosave === 'failed' && dirty ? 'text-sm text-[#8B261E]' : ui.muted}>{
              autosave === 'saving' ? t('Saving…', 'جارٍ الحفظ…')
              : dirty ? (autosave === 'failed' ? t('Not saved automatically. Use Save changes.', 'لم يُحفظ تلقائياً. استخدم «حفظ التغييرات».') : t('Unsaved changes', 'تغييرات غير محفوظة'))
              : autosave === 'saved' ? t('All changes saved', 'حُفظت كل التغييرات') : ''}</span></div>
        </Section> : <Section title={t('About the artist', 'عن الفنان')}>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {[[t('Nationality', 'الجنسية'), c.nationality], [t('Base city', 'مدينة الإقامة'), c.base_city], [t('Category', 'الفئة'), category], [t('Medium / practice', 'الوسيط / الممارسة الفنية'), c.medium],
              [t('Proposed participation', 'المشاركة المقترحة'), participation]].map(([k, v]) =>
              <div key={k}><dt className={ui.muted}>{k}</dt><dd dir="auto">{v || '—'}</dd></div>)}
            <div className="sm:col-span-2"><dt className={ui.muted}>{t('Biography', 'النبذة التعريفية')}</dt><dd dir="auto" className="whitespace-pre-line">{c.biography || '—'}</dd></div>
            <div className="sm:col-span-2"><dt className={ui.muted}>{t('Rationale', 'مبررات الترشيح')}</dt><dd dir="auto" className="whitespace-pre-line">{c.rationale || '—'}</dd></div>
            {c.links.length > 0 && <div className="sm:col-span-2"><dt className={ui.muted}>{t('Links', 'روابط')}</dt><dd><ul>{c.links.map(l => <li key={l}><bdi dir="ltr" className="break-all">{l}</bdi></li>)}</ul></dd></div>}
          </dl>
        </Section>}

        <WorksSection c={c} works={works} urls={urls} editable={editable} busy={busy} run={run} />
        {editable && <Section title={t('CV', 'السيرة الذاتية')} aside={<span className={ui.muted}>{t('Optional', 'اختياري')}</span>}><CvUpload c={c} busy={busy} run={run} /></Section>}

        {mine && (stage === 'READY' || stage === 'SENT') && <div ref={decisionRef} className="scroll-mt-4"><DecisionForm c={c} briefReady={briefReady} reasonsReady={reasonsReady} busy={busy} run={run} /></div>}
        {!readOnly && reasonsReady && !c.discarded_at && <ContentNotes c={c} notes={notes} busy={busy} run={run} />}
        {(sent.length > 0 || decisions.length > 0) && <Section title={t('History', 'السجل')}>
          {sent.length > 0 && <SentHistory sent={sent} />}
          {decisions.length > 0 && <DecisionHistory decisions={decisions} sent={sent} />}
        </Section>}
      </div>

      <aside className="order-first space-y-4 lg:order-none lg:sticky lg:top-4">
        <div className={`${ui.card} space-y-3 ps-5 pe-5 py-5`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8B261E]">{t('Next step', 'الخطوة التالية')}</p>
          {stage === 'DRAFT' && (editable ? <>
            <h3 className="font-serif text-lg">{missing.length ? t('Complete the case', 'استكمل الملف') : t('Ready to go to the Committee', 'جاهز للعرض على اللجنة')}</h3>
            <ul className="space-y-1.5">{REQUIREMENTS.map(m => { const ok = !missing.includes(m); return <li key={m} className={`flex items-center gap-2 text-sm ${ok ? 'text-[#6E6259]' : 'text-[#1A1817]'}`}>
              {ok ? <Check aria-hidden className="size-4 text-[#2E6B3A]" /> : <Circle aria-hidden className="size-4 text-[#B9875A]" />}
              {ok ? <span className="line-through decoration-[#CBB89F]">{missingLabel[m]}</span>
                : <button type="button" className="text-start underline decoration-[#CBB89F] underline-offset-4 hover:text-[#8B261E] min-h-6 pointer-coarse:min-h-[44px]" onClick={() => jumpTo(m)}>{missingLabel[m]}</button>}
              <span className="sr-only">{ok ? t('done', 'مكتمل') : t('missing', 'ناقص')}</span></li>; })}</ul>
            {dirty && <button type="button" className={`${ui.quiet} w-full`} disabled={busy} onClick={() => void save()}>{t('Save changes', 'حفظ التغييرات')}</button>}
            <button type="button" className={`${ui.button} w-full`} disabled={busy || missing.length > 0} onClick={() => void markReady()}>{t('Ready for Committee', 'جاهز للجنة')}</button>
            <p className={ui.muted}>{missing.length ? t('Select a missing item to go to it. The button unlocks when everything is ticked.', 'اختر بنداً ناقصاً للانتقال إليه. يُفعَّل الزر عند اكتمال كل البنود.') : t('This locks the case so the Committee sees exactly what you prepared.', 'بذلك يُقفَل الملف، فترى اللجنة ما أعددته دون تغيير.')}</p>
          </> : <><h3 className="font-serif text-lg">{t('Being scouted', 'قيد الرصد')}</h3><p className={ui.muted}>{t('Only the coordinator who created this case can edit it.', 'لا يعدّل هذا الملف إلا المنسق الذي أنشأه.')}</p></>)}
          {stage === 'READY' && <><h3 className="font-serif text-lg">{t('Add it to the Committee deck', 'أضفه إلى العرض التقديمي للجنة')}</h3>
            <p className={ui.muted}>{t('Download the PowerPoint, email it to the Committee, then record it as sent.', 'نزّل ملف PowerPoint وأرسله إلى اللجنة بالبريد، ثم سجّل الإرسال.')}</p>
            {!readOnly && <button type="button" className={`${ui.button} w-full`} onClick={onDeck}><Presentation aria-hidden className="size-4" />{t('Open the Committee deck', 'فتح العرض التقديمي للجنة')}</button>}</>}
          {stage === 'SENT' && <><h3 className="font-serif text-lg">{t('Waiting for the decision', 'بانتظار القرار')}</h3>
            <p className={ui.muted}>{t('When the Committee and Director reply by email, record their decision.', 'عندما تردّ اللجنة والمدير بالبريد، سجّل قرارهما.')}</p>
            {mine && <button type="button" className={`${ui.button} w-full`} onClick={() => decisionRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })}>{t('Record the decision', 'تسجيل القرار')}</button>}</>}
          {stage === 'APPROVED' && <><h3 className="font-serif text-lg">{t('Approved', 'معتمد')}</h3><p className={ui.muted}>{t('This artist is on the invite list. Contact begins at the invitation step.', 'هذا الفنان في قائمة الدعوات. يبدأ التواصل في خطوة الدعوة.')}</p></>}
          {stage === 'DECLINED' && <><h3 className="font-serif text-lg">{t('Declined', 'مرفوض')}</h3><p className={ui.muted}>{t('The case and its reasons are kept in the history.', 'يُحفظ الملف مع أسباب الرفض في السجل.')}</p></>}
          {stage !== 'APPROVED' && <p className="rounded-md bg-[#F7F1E6] ps-3 pe-3 py-2 text-xs text-[#5E554B]">{t('Artist not contacted. Use published sources only until the Director approves.', 'لم يجرِ التواصل مع الفنان. استخدم المصادر المنشورة فقط حتى يعتمد المدير.')}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 ps-1 pe-1">
          {!readOnly && <button type="button" className={ui.link} disabled={busy} onClick={onExport}><Download aria-hidden className="size-4" />{t('Export this case', 'تصدير هذا الملف')}</button>}
          {editable && !confirmDiscard && <button type="button" className="text-sm text-[#6E6259] underline-offset-4 hover:text-[#8B261E] hover:underline min-h-6 pointer-coarse:min-h-[44px]" disabled={busy} onClick={() => setConfirmDiscard(true)}>{t('Discard this draft', 'استبعاد هذه المسودة')}</button>}
        </div>
        {editable && confirmDiscard && <div className={`${ui.card} space-y-3 border-[#E3B8B1] ps-4 pe-4 py-4`}>
          <p className="text-sm">{t('Discard this case? It disappears from the list and can no longer be edited or submitted.', 'هل تريد استبعاد هذا الملف؟ سيختفي من القائمة ولن يمكن تعديله أو إرساله.')}</p>
          <div className="flex gap-2"><button type="button" className={ui.button} disabled={busy} onClick={() => void run(async () => {
            const { data, error } = await client!.from('artist_dossiers').update({ discarded_at: new Date().toISOString() }).eq('id', c.id).select('id');
            if (error) throw new Error(error.message);
            if (!data?.length) throw new Error(t('The case could not be discarded.', 'تعذّر استبعاد الملف.'));
          }, t('Draft discarded.', 'استُبعدت المسودة.')).then(ok => { if (ok) onBack(); })}>{t('Discard', 'استبعاد')}</button>
            <button type="button" className={ui.quiet} onClick={() => setConfirmDiscard(false)}>{t('Keep it', 'الإبقاء عليه')}</button></div>
        </div>}
      </aside>
    </div>
  </article>;
}

function WorksSection({ c, works, urls, editable, busy, run }: { c: NominationCase; works: CaseWork[]; urls: Record<string, string>; editable: boolean; busy: boolean; run: RunFn }) {
  const { t } = useUiText();
  const empty = { title: '', year: '', medium: '', dimensions: '', source_credit: '', published_in: '' };
  const [w, setW] = useState(empty);
  const [file, setFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [adding, setAdding] = useState(false);
  const ext = file ? acceptedExtension(file, 'work') : null;
  const started = adding && (!!file || Object.values(w).some(v => v.trim()));
  useEffect(() => { markUnsaved('work', started); }, [started]);
  useEffect(() => () => markUnsaved('work', false), []);
  const canAdd = editable && works.length < MAX_WORKS && !!ext && w.title.trim() && w.source_credit.trim().length >= 2 && w.published_in.trim().length >= 2;

  const add = () => run(async () => {
    const path = await uploadCaseFile(client!, c.id, 'works', file!, ext!);
    const row = { dossier_id: c.id, position: works.length + 1, title: w.title.trim(), year: w.year.trim() || null, medium: w.medium.trim() || null, dimensions: w.dimensions.trim() || null, source_credit: w.source_credit.trim(), image_path: path };
    let { error } = await client!.from('sadu_case_works').insert({ ...row, published_in: w.published_in.trim() });
    // Before the scouting migration the column does not exist yet; keep the place of publication in the credit instead.
    if (error?.code === 'PGRST204') ({ error } = await client!.from('sadu_case_works').insert({ ...row, source_credit: `${row.source_credit} · Published in: ${w.published_in.trim()}`.slice(0, 500) }));
    if (error) throw new Error(error.message);
    setW(empty); setFile(null); setInputKey(k => k + 1); setAdding(false);
  }, t('Work added.', 'أُضيف العمل.'));

  const remove = (id: string) => run(async () => {
    const { error } = await client!.from('sadu_case_works').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }, t('Work removed from the case.', 'أُزيل العمل من الملف.'));

  return <Section id="case-works" title={t('Selected works', 'الأعمال المختارة')} aside={<span className={ui.muted}>{t(`${works.length} of ${MAX_WORKS} · at least ${MIN_WORKS}`, `${works.length} من ${MAX_WORKS} · ${MIN_WORKS} على الأقل`)}</span>}>
    {works.length > 0 ? <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{works.map(work => <li key={work.id} className="space-y-1">
      {urls[work.image_path] ? <img src={urls[work.image_path]} alt={work.title} className="aspect-[4/3] w-full rounded-lg object-cover" /> : <div className="aspect-[4/3] w-full rounded-lg bg-[#F1E7D6]" />}
      <p dir="auto" className="pt-1 font-semibold">{work.title}{work.year ? `, ${work.year}` : ''}</p>
      {(work.medium || work.dimensions) && <p className="text-sm">{[work.medium, work.dimensions].filter(Boolean).join(' · ')}</p>}
      <p className="text-xs text-[#6E6259]">{t('Credit', 'المصدر')}: <bdi>{work.source_credit}</bdi></p>
      {work.published_in && <p className="text-xs text-[#6E6259]">{t('Published in', 'نُشر في')}: <bdi>{work.published_in}</bdi></p>}
      {editable && <button type="button" className="inline-flex min-h-6 min-w-6 items-center justify-center ps-1 pe-1 text-sm text-[#8B261E] underline pointer-coarse:min-h-[44px] pointer-coarse:ps-2 pointer-coarse:pe-2" disabled={busy} onClick={() => void remove(work.id)}>{t('Remove', 'إزالة')}</button>}
    </li>)}</ul> : !adding && <p className={ui.muted}>{t('No works yet. Add images of the artist’s work from published sources, each with its credit.', 'لا توجد أعمال بعد. أضف صور أعمال الفنان من مصادر منشورة، مع ذكر مصدر كل صورة.')}</p>}
    {editable && works.length < MAX_WORKS && (!adding
      ? <button type="button" className={ui.quiet} onClick={() => setAdding(true)}><ImagePlus aria-hidden className="size-4" />{t('Add a work', 'إضافة عمل')}</button>
      : <form className="grid gap-4 rounded-lg border border-dashed border-[#CBB89F] bg-[#FFFCF6] ps-4 pe-4 py-4 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); if (canAdd) void add(); }}>
        <label className={`${ui.label} sm:col-span-2`}>{t('Image (JPEG, PNG or WebP, up to 20 MB)', 'الصورة (JPEG أو PNG أو WebP، حتى 20 ميغابايت)')}
          <input key={inputKey} type="file" accept={acceptAttribute.work} className={ui.field} onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>
        {file && !ext && <p role="alert" className="text-[#8B261E] sm:col-span-2">{t('This file type or size is not accepted.', 'نوع الملف أو حجمه غير مقبول.')}</p>}
        <label className={ui.label}>{t('Title', 'العنوان')}<input className={ui.field} value={w.title} onChange={e => setW({ ...w, title: e.target.value })} /></label>
        <label className={ui.label}>{t('Year', 'السنة')}<input className={ui.field} value={w.year} onChange={e => setW({ ...w, year: e.target.value })} /></label>
        <label className={ui.label}>{t('Medium', 'الوسيط')}<input className={ui.field} value={w.medium} onChange={e => setW({ ...w, medium: e.target.value })} /></label>
        <label className={ui.label}>{t('Dimensions', 'الأبعاد')}<input className={ui.field} value={w.dimensions} onChange={e => setW({ ...w, dimensions: e.target.value })} /></label>
        <label className={`${ui.label} sm:col-span-2`}>{t('Image source / credit (required)', 'مصدر الصورة / حقوقها (مطلوب)')}<input className={ui.field} value={w.source_credit} onChange={e => setW({ ...w, source_credit: e.target.value })} /></label>
        <label className={`${ui.label} sm:col-span-2`}>{t('Where it was published: exhibition, catalogue, website or press (required)', 'مكان النشر: معرض أو كتالوج أو موقع أو صحافة (مطلوب)')}<input className={ui.field} value={w.published_in} onChange={e => setW({ ...w, published_in: e.target.value })} /></label>
        <div className="flex gap-3 sm:col-span-2"><button className={ui.button} disabled={busy || !canAdd}>{t('Add work', 'إضافة العمل')}</button><button type="button" className={ui.quiet} onClick={() => setAdding(false)}>{t('Cancel', 'إلغاء')}</button></div>
      </form>)}
  </Section>;
}

function CvUpload({ c, busy, run }: { c: NominationCase; busy: boolean; run: RunFn }) {
  const { t } = useUiText();
  const [file, setFile] = useState<File | null>(null);
  const ext = file ? acceptedExtension(file, 'cv') : null;
  return <div className="space-y-3">
    <label className={ui.label}>{t('PDF or Word, from public or artist-provided sources', 'PDF أو Word، من مصادر عامة أو مقدّمة من الفنان')}
      <input type="file" accept={acceptAttribute.cv} className={ui.field} onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>
    {c.cv_url && <p className={ui.muted}>{t('A CV is attached. Uploading another replaces it in the case.', 'أُرفقت سيرة ذاتية. إذا رفعت ملفاً آخر فسيحلّ محلها.')}</p>}
    {file && !ext && <p role="alert" className="text-[#8B261E]">{t('This file type or size is not accepted.', 'نوع الملف أو حجمه غير مقبول.')}</p>}
    <button type="button" className={ui.quiet} disabled={busy || !ext} onClick={() => void run(async () => {
      const path = await uploadCaseFile(client!, c.id, 'cv', file!, ext!);
      const { error } = await client!.from('artist_dossiers').update({ cv_url: path }).eq('id', c.id);
      if (error) throw new Error(error.message);
      setFile(null);
    }, t('CV attached.', 'أُرفقت السيرة الذاتية.'))}>{t('Attach CV', 'إرفاق السيرة الذاتية')}</button>
  </div>;
}

function DecisionForm({ c, briefReady, reasonsReady, busy, run }: { c: NominationCase; briefReady: boolean; reasonsReady: boolean; busy: boolean; run: RunFn }) {
  const { t } = useUiText();
  const today = new Date().toISOString().slice(0, 10);
  const [d, setD] = useState({ committee: '', director: '', decided_on: today, email_reference: '', minute: '', reason_in_brief: '' as ReasonInBrief | '', reason_types: [] as ReasonType[] });
  const [file, setFile] = useState<File | null>(null);
  const ext = file ? acceptedExtension(file, 'evidence') : null;
  const started = !!(d.committee || d.director || d.email_reference.trim() || d.minute.trim() || file);
  useEffect(() => { markUnsaved('decision', started); }, [started]);
  useEffect(() => () => markUnsaved('decision', false), []);
  const ok = d.committee && d.director && d.decided_on && d.decided_on <= today && d.email_reference.trim().length >= 5 && d.minute.trim().length >= 10 && !!ext;
  const choice = (name: 'committee' | 'director', value: string, label: string) =>
    <label className={`flex cursor-pointer items-center gap-2 rounded-md border ps-3 pe-3 py-2 text-sm ${d[name] === value ? 'border-[#8B261E] bg-[#FBF4F1] font-semibold' : 'border-[#D9CEBA] bg-white'}`}>
      <input type="radio" className="accent-[#8B261E]" name={`${name}-${c.id}`} value={value} checked={d[name] === value} onChange={() => setD({ ...d, [name]: value })} />{label}</label>;

  return <form className={`${ui.card} space-y-4 border-[#CBB89F] ps-5 pe-5 py-5`} onSubmit={e => { e.preventDefault(); if (ok) void run(async () => {
    const path = await uploadCaseFile(client!, c.id, 'decision-evidence', file!, ext!);
    const { error } = await client!.from('sadu_nomination_decisions').insert({ dossier_id: c.id, committee_recommendation: d.committee, director_decision: d.director, decided_on: d.decided_on, email_reference: d.email_reference.trim(), minute: d.minute.trim(), evidence_path: path, ...(briefReady && d.reason_in_brief ? { reason_in_brief: d.reason_in_brief } : {}), ...(reasonsReady && d.reason_types.length ? { reason_types: d.reason_types } : {}) });
    if (error) throw new Error(error.message);
  }, t('Decision recorded.', 'سُجّل القرار.')); }}>
    <div><h3 className="font-serif text-xl">{t('Record the decision from email', 'تسجيل القرار الوارد بالبريد الإلكتروني')}</h3>
      <p className={ui.muted}>{t('Enter the outcome exactly as it came back from the Committee and the Director. It cannot be changed once recorded.', 'أدخل القرار كما ورد من اللجنة والمدير. لا يمكن تعديله بعد تسجيله.')}</p></div>
    <fieldset className="space-y-2"><legend className={ui.label}>{t('Committee recommendation', 'توصية اللجنة')}</legend>
      <div className="flex flex-wrap gap-2">{choice('committee', 'RECOMMENDED', t('Recommended', 'موصى به'))}{choice('committee', 'NOT_RECOMMENDED', t('Not recommended', 'غير موصى به'))}</div></fieldset>
    <fieldset className="space-y-2"><legend className={ui.label}>{t('Director’s decision', 'قرار المدير')}</legend>
      <div className="flex flex-wrap gap-2">{choice('director', 'APPROVED', t('Approved', 'معتمد'))}{choice('director', 'DECLINED', t('Declined', 'مرفوض'))}{choice('director', 'RETURNED', t('Returned for more information', 'أُعيد لاستكمال المعلومات'))}</div></fieldset>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className={ui.label}>{t('Decision date', 'تاريخ القرار')}<input type="date" max={today} className={ui.field} value={d.decided_on} onChange={e => setD({ ...d, decided_on: e.target.value })} /></label>
      <label className={ui.label}>{t('Email reference (sender, date, subject)', 'مرجع البريد (المرسل، التاريخ، الموضوع)')}<input className={ui.field} value={d.email_reference} onChange={e => setD({ ...d, email_reference: e.target.value })} /></label>
    </div>
    <label className={ui.label}>{t('Minute or reason, as given (at least 10 characters)', 'المحضر أو السبب كما ورد (10 أحرف على الأقل)')}<textarea rows={3} maxLength={4000} className={ui.field} value={d.minute} onChange={e => setD({ ...d, minute: e.target.value })} /></label>
    {reasonsReady && <fieldset className="space-y-2"><legend className={ui.label}>{t('Type of reason (optional, choose all that apply)', 'نوع السبب (اختياري، اختر كل ما ينطبق)')}</legend>
      <div className="flex flex-wrap gap-2">{REASON_TYPES.map(value => { const on = d.reason_types.includes(value); return <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-md border ps-3 pe-3 py-2 text-sm ${on ? 'border-[#8B261E] bg-[#FBF4F1] font-semibold' : 'border-[#D9CEBA] bg-white'}`}>
        <input type="checkbox" className="accent-[#8B261E]" checked={on} onChange={() => setD({ ...d, reason_types: on ? d.reason_types.filter(x => x !== value) : REASON_TYPES.filter(x => x === value || d.reason_types.includes(x)) })} />{reasonTypeLabel(t)[value]}</label>; })}</div>
      <p className="text-xs text-[#6E6259]">{t('Choose only what the Committee or the Director actually said. The minute above stays the reason as given.', 'اختر ما ذكرته اللجنة أو المدير فعلاً. ويبقى المحضر أعلاه هو السبب كما ورد.')}</p></fieldset>}
    {briefReady && <fieldset className="space-y-2"><legend className={ui.label}>{t('Was this reason in the festival brief? (optional)', 'هل كان هذا السبب وارداً في توجيهات المهرجان؟ (اختياري)')}</legend>
      <div className="flex flex-wrap gap-2">{([['IN_BRIEF', t('Yes, it was in the brief', 'نعم، كان وارداً')], ['NOT_IN_BRIEF', t('No, it was not in the brief', 'لا، لم يكن وارداً')], ['NO_REASON_GIVEN', t('No reason was given', 'لم يُذكر سبب')]] as const).map(([value, label]) =>
        <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-md border ps-3 pe-3 py-2 text-sm ${d.reason_in_brief === value ? 'border-[#8B261E] bg-[#FBF4F1] font-semibold' : 'border-[#D9CEBA] bg-white'}`}>
          <input type="radio" className="accent-[#8B261E]" name={`reason-in-brief-${c.id}`} value={value} checked={d.reason_in_brief === value} onChange={() => setD({ ...d, reason_in_brief: value })} />{label}</label>)}</div>
      <p className="text-xs text-[#6E6259]">{t('This is your note, not the Committee’s. Over a round it shows which requirements were never written down.', 'هذه ملاحظتك لا ملاحظة اللجنة. وعلى امتداد الدورة تكشف هذه الملاحظات المتطلبات التي لم تُدوَّن قط.')}</p></fieldset>}
    <label className={ui.label}>{t('The decision email, saved as PDF, .msg or .eml', 'رسالة القرار محفوظة بصيغة PDF أو ‎.msg أو ‎.eml')}
      <input type="file" accept={acceptAttribute.evidence} className={ui.field} onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>
    {file && !ext && <p role="alert" className="text-[#8B261E]">{t('This file type or size is not accepted.', 'نوع الملف أو حجمه غير مقبول.')}</p>}
    <button className={ui.button} disabled={busy || !ok}>{t('Record decision', 'تسجيل القرار')}</button>
  </form>;
}

/** Every deck that carried this case, kept after a return so the history stays complete. */
function SentHistory({ sent }: { sent: SentEntry[] }) {
  const { t } = useUiText();
  const open = async (path: string) => {
    const url = (await signedUrls(client!, [path]))[path];
    if (url) window.open(url, '_blank', 'noopener');
  };
  return <div className="space-y-2" aria-label={t('Sent to the Committee', 'الإرسال إلى اللجنة')}>
    <h4 className="text-sm font-semibold text-[#5E554B]">{t('Sent to the Committee', 'الإرسال إلى اللجنة')}</h4>
    <ol className="space-y-2">{sent.map(({ entry, batch }) => <li key={batch.id} className="rounded-lg bg-[#FBF7F0] ps-3 pe-3 py-2">
      <p><bdi dir="ltr">{batch.sent_at.slice(0, 10)}</bdi> · <button type="button" className="break-all text-[#8B261E] underline" onClick={() => void open(batch.deck_path)}><bdi>{batch.deck_file_name}</bdi></button></p>
      <p className="text-xs text-[#6E6259]">{batch.deck_language === 'ar' ? t('Arabic', 'العربية') : t('English', 'الإنجليزية')} · {t(`slide position ${entry.position}`, `الترتيب في العرض ${entry.position}`)} · {t('case as last edited on', 'الملف كما كان عند آخر تعديل في')} <bdi dir="ltr">{entry.case_version.slice(0, 16).replace('T', ' ')}</bdi></p>
    </li>)}</ol>
  </div>;
}

function DecisionHistory({ decisions, sent }: { decisions: NominationDecision[]; sent: SentEntry[] }) {
  const { t } = useUiText();
  const outcome = { APPROVED: t('Approved', 'معتمد'), DECLINED: t('Declined', 'مرفوض'), RETURNED: t('Returned for more information', 'أُعيد لاستكمال المعلومات') };
  const rec = { RECOMMENDED: t('Recommended', 'موصى به'), NOT_RECOMMENDED: t('Not recommended', 'غير موصى به') };
  return <div className="space-y-2" aria-label={t('Decision history', 'سجل القرارات')}>
    <h4 className="text-sm font-semibold text-[#5E554B]">{t('Decisions', 'القرارات')}</h4>
    <ol className="space-y-2">{decisions.map(d => <li key={d.id} className="space-y-1 rounded-lg bg-[#FBF7F0] ps-3 pe-3 py-2">
      <p><strong>{outcome[d.director_decision]}</strong> · {t('Committee', 'اللجنة')}: {rec[d.committee_recommendation]} · <bdi dir="ltr">{d.decided_on}</bdi></p>
      <p dir="auto" className="whitespace-pre-line">{d.minute}</p>
      {!!d.reason_types?.length && <p className="text-xs text-[#6E6259]">{d.reason_types.map(x => reasonTypeLabel(t)[x]).join(' · ')}</p>}
      {d.reason_in_brief && <p className="text-xs text-[#6E6259]">{reasonInBriefLabel(t)[d.reason_in_brief]}</p>}
      <p className="text-xs text-[#6E6259]">{t('Recorded from email by the coordinator', 'سجّله المنسق من البريد الإلكتروني')} · <bdi>{d.email_reference}</bdi></p>
      {(() => { const b = sent.find(s => s.batch.id === d.batch_id)?.batch; return <p className="text-xs text-[#6E6259]">{b
        ? <>{t('Decided on the deck sent on', 'صدر القرار بناءً على العرض المُرسَل في')} <bdi dir="ltr">{b.sent_at.slice(0, 10)}</bdi> · <bdi>{b.deck_file_name}</bdi></>
        : t('No sent deck is recorded for this decision.', 'لا يوجد عرض مُرسل مسجّل لهذا القرار.')}</p>; })()}
    </li>)}</ol>
  </div>;
}

/** Art ideas noted while scouting, before (or without) an artist. Shared with the other coordinators; only the author edits. */
function ArtIdeas({ eventId, ideas, cases, userId, readOnly, busy, run }: { eventId: string; ideas: ArtIdea[]; cases: NominationCase[]; userId: string; readOnly: boolean; busy: boolean; run: RunFn }) {
  const { t, isAr } = useUiText();
  const [d, setD] = useState({ title: '', note: '', links: '' });
  const [adding, setAdding] = useState(false);
  const ok = d.title.trim().length >= 3;
  const caseName = (id: string | null) => { const c = cases.find(x => x.id === id); return c ? (isAr ? c.arabic_name : c.name) : ''; };
  const update = (id: string, change: Partial<Pick<ArtIdea, 'dossier_id' | 'archived_at'>>, success: string) => run(async () => {
    const { data, error } = await client!.from('sadu_art_ideas').update(change).eq('id', id).select('id');
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error(t('The idea could not be changed.', 'تعذّر تعديل الفكرة.'));
  }, success);

  const form = <form className={`${ui.card} grid gap-4 ps-5 pe-5 py-5`} onSubmit={e => { e.preventDefault(); if (ok) void run(async () => {
    const { error } = await client!.from('sadu_art_ideas').insert({ event_id: eventId, title: d.title.trim(), note: d.note.trim() || null, links: linksFromText(d.links) });
    if (error) throw new Error(error.message);
    setD({ title: '', note: '', links: '' }); setAdding(false);
  }, t('Idea added.', 'أُضيفت الفكرة.')); }}>
    <h3 className="font-serif text-xl">{t('New idea', 'فكرة جديدة')}</h3>
    <label className={ui.label}>{t('Idea', 'الفكرة')}<input dir="auto" autoFocus maxLength={200} className={ui.field} value={d.title} onChange={e => setD({ ...d, title: e.target.value })} /></label>
    <label className={ui.label}>{t('Notes', 'ملاحظات')}<textarea rows={3} maxLength={4000} dir="auto" className={ui.field} value={d.note} onChange={e => setD({ ...d, note: e.target.value })} /></label>
    <label className={ui.label}>{t('Links (one per line)', 'روابط (رابط في كل سطر)')}<textarea rows={2} dir="ltr" className={ui.field} value={d.links} onChange={e => setD({ ...d, links: e.target.value })} /></label>
    <div className="flex gap-3"><button type="submit" className={ui.button} disabled={busy || !ok}>{t('Add idea', 'إضافة الفكرة')}</button><button type="button" className={ui.quiet} onClick={() => setAdding(false)}>{t('Cancel', 'إلغاء')}</button></div>
  </form>;

  return <section className="space-y-4" aria-labelledby="ideas-heading">
    <div className="flex flex-wrap items-end gap-3">
      <div className="me-auto"><h2 id="ideas-heading" className="font-serif text-2xl">{t('Art ideas', 'أفكار فنية')}</h2>
        <p className={ui.muted}>{t('Ideas for the festival that are not tied to an artist yet. Shared with the other coordinators; they never go to the Committee.', 'أفكار للمهرجان غير مرتبطة بفنان بعد. يراها المنسقون الآخرون، ولا تُعرض على اللجنة.')}</p></div>
      {!adding && !readOnly && <button type="button" className={ui.button} onClick={() => setAdding(true)}><Plus aria-hidden className="size-4" />{t('New idea', 'فكرة جديدة')}</button>}
    </div>
    {adding && form}
    {ideas.length > 0 ? <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{ideas.map(idea => {
      const mine = idea.created_by === userId;
      return <li key={idea.id} className={`${ui.card} flex flex-col gap-2 ps-4 pe-4 py-4`}>
        <p dir="auto" className="font-serif text-lg leading-snug">{idea.title}</p>
        {idea.note && <p dir="auto" className="whitespace-pre-line text-sm text-[#3F3A35]">{idea.note}</p>}
        {idea.links.length > 0 && <ul className="text-sm">{idea.links.map(l => <li key={l}><bdi dir="ltr" className="break-all text-[#6E6259]">{l}</bdi></li>)}</ul>}
        <div className="mt-auto border-t border-[#EFE6D6] pt-2">
          {mine && !readOnly ? <div className="flex flex-wrap items-end gap-3">
            <label className={`${ui.label} min-w-0 flex-1`}>{t('Linked artist', 'الفنان المرتبط')}
              <select className={ui.field} disabled={busy} value={idea.dossier_id ?? ''} onChange={e => void update(idea.id, { dossier_id: e.target.value || null }, t('Idea updated.', 'حُدّثت الفكرة.'))}>
                <option value="">{t('No artist yet', 'لا يوجد فنان بعد')}</option>
                {cases.map(c => <option key={c.id} value={c.id}>{isAr ? c.arabic_name : c.name}</option>)}
              </select></label>
            <button type="button" className="pb-2 text-sm text-[#6E6259] underline-offset-4 hover:underline pointer-coarse:min-h-[44px]" disabled={busy} onClick={() => void update(idea.id, { archived_at: new Date().toISOString() }, t('Idea archived.', 'أُرشفت الفكرة.'))}>{t('Archive', 'أرشفة')}</button>
          </div> : <p className="text-xs text-[#6E6259]">{[idea.dossier_id ? `${t('Linked to', 'مرتبطة بـ')} ${caseName(idea.dossier_id)}` : '', readOnly ? '' : t('Another coordinator’s idea', 'فكرة منسق آخر')].filter(Boolean).join(' · ')}</p>}
        </div>
      </li>;
    })}</ul> : !adding && <Empty icon={<Lightbulb aria-hidden className="size-6" />} title={t('No ideas yet', 'لا توجد أفكار بعد')}
      body={readOnly ? t('Ideas the coordinators note while scouting appear here.', 'تظهر هنا الأفكار التي يدوّنها المنسقون أثناء الرصد.') : t('Note a theme, material or kind of work you want at the festival. Link it to an artist when you find the right one.', 'دوّن موضوعاً أو خامة أو نوعاً من الأعمال تريده في المهرجان، واربطه بفنان عندما تجد الفنان المناسب.')} />}
  </section>;
}

const reasonTypeLabel = (t: (en: string, ar: string) => string): Record<ReasonType, string> => ({
  THEME: t('Fit with the festival theme', 'التوافق مع موضوع المهرجان'),
  QUALITY: t('Quality of the work', 'مستوى العمل'),
  SHOWN_RECENTLY: t('Shown recently', 'عُرض مؤخراً'),
  CONTENT: t('Content concern', 'ملاحظة على المحتوى'),
  LOGISTICS: t('Shipping, visa or timing', 'الشحن أو التأشيرة أو التوقيت'),
  BUDGET: t('Budget', 'الميزانية'),
  BALANCE: t('Balance of countries or media', 'التوازن بين الدول أو الوسائط'),
  OTHER: t('Other', 'سبب آخر'),
});

/** Content notes on a case: private to their author and the Director, never in a deck or an export.
 *  As the General Exhibition Coordinator set it: the team notices, or someone reports; the Director
 *  sees it first, and consults the Chairman if he wants to check something. */
// The database checks these dates against the day in Dubai, so the screen uses the same day.
const dubaiParts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' });
const dubaiDate = (d: Date | string) => {
  const p = Object.fromEntries(dubaiParts.formatToParts(new Date(d)).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
};

function ContentNotes({ c, notes, busy, run }: { c: NominationCase; notes: ContentNote[]; busy: boolean; run: RunFn }) {
  const { t } = useUiText();
  const today = dubaiDate(new Date());
  const empty = { origin: '' as ContentNote['origin'] | '', reported_by: '', note: '' };
  const [d, setD] = useState(empty);
  const [adding, setAdding] = useState(false);
  const [dates, setDates] = useState<Record<string, string>>({});
  const started = adding && !!(d.origin || d.reported_by.trim() || d.note.trim());
  useEffect(() => { markUnsaved('content-note', started); }, [started]);
  useEffect(() => () => markUnsaved('content-note', false), []);
  const ok = !!d.origin && d.note.trim().length >= 10;
  const setDate = (n: ContentNote, column: 'raised_with_director_on' | 'chairman_consulted_on', success: string) => run(async () => {
    const value = dates[`${n.id}:${column}`] || today;
    const { data, error } = await client!.from('sadu_content_notes').update({ [column]: value }).eq('id', n.id).select('id');
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error(t('The note could not be changed.', 'تعذّر تعديل الملاحظة.'));
  }, success);
  const dateField = (n: ContentNote, column: 'raised_with_director_on' | 'chairman_consulted_on', min: string) =>
    <input type="date" min={min} max={today} aria-label={t('Date', 'التاريخ')} className={`${ui.field} w-auto`} value={dates[`${n.id}:${column}`] || today} onChange={e => setDates({ ...dates, [`${n.id}:${column}`]: e.target.value })} />;

  return <Section title={t('Content notes', 'ملاحظات على المحتوى')} aside={<span className={ui.muted}>{t('Private', 'خاصة')}</span>}>
    <p className={ui.muted}>{t('A concern about the artist’s content that the team noticed or someone reported. Only you and the Director see it, and it never goes into the Committee deck or an export. The Director sees it first; if he wants to check something, he consults the Chairman.', 'ملاحظة على محتوى الفنان لاحظها الفريق أو أبلغ عنها أحد. لا يطّلع عليها غيرك والمدير، ولا تُدرج في العرض التقديمي للجنة ولا في التصدير. ويطّلع عليها المدير أولاً، وإن أراد التأكد من أمر استشار رئيس الدائرة.')}</p>
    {notes.length > 0 && <ul className="space-y-2">{notes.map(n => <li key={n.id} className="space-y-2 rounded-lg bg-[#FBF7F0] ps-3 pe-3 py-2">
      <p dir="auto" className="whitespace-pre-line">{n.note}</p>
      <p className="text-xs text-[#6E6259]">{n.origin === 'TEAM' ? t('The team noticed it', 'لاحظها الفريق') : t('Someone reported it', 'أبلغ عنها أحد')}{n.reported_by ? <> · <bdi>{n.reported_by}</bdi></> : null} · <bdi dir="ltr">{dubaiDate(n.recorded_at)}</bdi></p>
      {n.raised_with_director_on
        ? <p className="text-xs text-[#6E6259]">{t('Raised with the Director on', 'عُرضت على المدير في')} <bdi dir="ltr">{n.raised_with_director_on}</bdi></p>
        : <div className="flex flex-wrap items-center gap-2">{dateField(n, 'raised_with_director_on', dubaiDate(n.recorded_at))}
          <button type="button" className={ui.quiet} disabled={busy} onClick={() => void setDate(n, 'raised_with_director_on', t('Recorded as raised with the Director.', 'سُجّل عرضها على المدير.'))}>{t('Raised with the Director', 'عُرضت على المدير')}</button></div>}
      {n.chairman_consulted_on
        ? <p className="text-xs text-[#6E6259]">{t('The Director consulted the Chairman on', 'استشار المدير رئيس الدائرة في')} <bdi dir="ltr">{n.chairman_consulted_on}</bdi></p>
        : n.raised_with_director_on && <div className="flex flex-wrap items-center gap-2">{dateField(n, 'chairman_consulted_on', n.raised_with_director_on)}
          <button type="button" className={ui.quiet} disabled={busy} onClick={() => void setDate(n, 'chairman_consulted_on', t('Recorded that the Director consulted the Chairman.', 'سُجّلت استشارة المدير لرئيس الدائرة.'))}>{t('The Director consulted the Chairman', 'استشار المدير رئيس الدائرة')}</button></div>}
    </li>)}</ul>}
    {adding ? <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (ok) void run(async () => {
      const { error } = await client!.from('sadu_content_notes').insert({ dossier_id: c.id, origin: d.origin, reported_by: d.origin === 'REPORTED' ? d.reported_by.trim() || null : null, note: d.note.trim() });
      if (error) throw new Error(error.message);
      setD(empty); setAdding(false);
    }, t('Note recorded. Only you and the Director can see it.', 'سُجّلت الملاحظة، ولا يطّلع عليها غيرك والمدير.')); }}>
      <fieldset className="space-y-2"><legend className={ui.label}>{t('Where it came from', 'مصدر الملاحظة')}</legend>
        <div className="flex flex-wrap gap-2">{([['TEAM', t('The team noticed it', 'لاحظها الفريق')], ['REPORTED', t('Someone reported it', 'أبلغ عنها أحد')]] as const).map(([value, label]) =>
          <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-md border ps-3 pe-3 py-2 text-sm ${d.origin === value ? 'border-[#8B261E] bg-[#FBF4F1] font-semibold' : 'border-[#D9CEBA] bg-white'}`}>
            <input type="radio" className="accent-[#8B261E]" name={`note-origin-${c.id}`} value={value} checked={d.origin === value} onChange={() => setD({ ...d, origin: value })} />{label}</label>)}</div></fieldset>
      {d.origin === 'REPORTED' && <label className={ui.label}>{t('Who reported it (optional)', 'من أبلغ عنها (اختياري)')}<input dir="auto" maxLength={200} className={ui.field} value={d.reported_by} onChange={e => setD({ ...d, reported_by: e.target.value })} /></label>}
      <label className={ui.label}>{t('The note: what the work shows or what the artist is known for, not their beliefs (at least 10 characters)', 'الملاحظة: ما يتضمنه العمل أو ما يُعرف به الفنان، لا معتقداته (10 أحرف على الأقل)')}<textarea rows={3} maxLength={2000} dir="auto" className={ui.field} value={d.note} onChange={e => setD({ ...d, note: e.target.value })} /></label>
      <div className="flex gap-3"><button type="submit" className={ui.button} disabled={busy || !ok}>{t('Add note', 'إضافة الملاحظة')}</button><button type="button" className={ui.quiet} onClick={() => { setAdding(false); setD(empty); }}>{t('Cancel', 'إلغاء')}</button></div>
    </form> : <button type="button" className={ui.quiet} onClick={() => setAdding(true)}><Plus aria-hidden className="size-4" />{t('Add a content note', 'إضافة ملاحظة على المحتوى')}</button>}
  </Section>;
}

const reasonInBriefLabel = (t: (en: string, ar: string) => string): Record<ReasonInBrief, string> => ({
  IN_BRIEF: t('The reason was in the festival brief', 'كان السبب وارداً في توجيهات المهرجان'),
  NOT_IN_BRIEF: t('The reason was not in the festival brief', 'لم يكن السبب وارداً في توجيهات المهرجان'),
  NO_REASON_GIVEN: t('No reason was given', 'لم يُذكر سبب'),
});

/** The festival brief as the festival management set it, and every reason a nomination was not selected. */
function BriefView({ eventId, briefs, cases, decisions, readOnly, busy, run, onOpenCase }: {
  eventId: string; briefs: EventBrief[]; cases: NominationCase[]; decisions: NominationDecision[]; readOnly: boolean; busy: boolean; run: RunFn; onOpenCase: (id: string) => void;
}) {
  const { t, isAr } = useUiText();
  const current = briefs[briefs.length - 1];
  const empty = { theme: '', venues: '', artist_count: '', media: '', other_requirements: '', source: '' };
  const [d, setD] = useState(empty);
  const [initial, setInitial] = useState(empty);
  const [editing, setEditing] = useState(false);
  const started = editing && (Object.keys(d) as (keyof typeof d)[]).some(k => d[k].trim() !== initial[k].trim());
  useEffect(() => { markUnsaved('brief', started); }, [started]);
  useEffect(() => () => markUnsaved('brief', false), []);
  const count = d.artist_count.trim() ? Number(d.artist_count) : null;
  const ok = d.theme.trim().length >= 2 && d.source.trim().length >= 5 && (count === null || (Number.isInteger(count) && count >= 1 && count <= 1000));
  const startEditing = () => {
    const start = current ? { theme: current.theme, venues: current.venues ?? '', artist_count: current.artist_count ? String(current.artist_count) : '', media: current.media ?? '', other_requirements: current.other_requirements ?? '', source: '' } : empty;
    setD(start);
    setInitial(start);
    setEditing(true);
  };
  const name = (id: string) => { const c = cases.find(x => x.id === id); return c ? (isAr ? c.arabic_name : c.name) : id; };
  const notSelected = decisions.filter(x => x.director_decision === 'DECLINED' || x.committee_recommendation === 'NOT_RECOMMENDED');
  const labels = reasonInBriefLabel(t);
  const tally = (v: ReasonInBrief | null) => notSelected.filter(x => (x.reason_in_brief ?? null) === v).length;
  const typeLabels = reasonTypeLabel(t);
  const typeTally = REASON_TYPES.map(r => [r, notSelected.filter(x => x.reason_types?.includes(r)).length] as const).filter(([, n]) => n > 0);
  const field = (label: string, value: string | number | null) => value ? <div><dt className="text-sm font-semibold text-[#5E554B]">{label}</dt><dd dir="auto" className="whitespace-pre-line">{value}</dd></div> : null;

  const form = <form className={`${ui.card} grid gap-4 ps-5 pe-5 py-5`} onSubmit={e => { e.preventDefault(); if (ok) void run(async () => {
    const { error } = await client!.from('sadu_event_briefs').insert({ event_id: eventId, theme: d.theme.trim(), venues: d.venues.trim() || null, artist_count: count,
      media: d.media.trim() || null, other_requirements: d.other_requirements.trim() || null, source: d.source.trim() });
    if (error) throw new Error(error.message);
    setEditing(false); setD(empty);
  }, t('Brief recorded. Earlier versions are kept.', 'سُجّلت التوجيهات، وتُحفظ النسخ السابقة.')); }}>
    <h3 className="font-serif text-xl">{current ? t('New version of the brief', 'نسخة جديدة من التوجيهات') : t('Record the festival brief', 'تسجيل توجيهات المهرجان')}</h3>
    <p className={ui.muted}>{t('Write down only what the festival management has decided. Leave a field empty if it has not been decided.', 'اكتب ما قررته إدارة المهرجان فقط، واترك الحقل فارغاً إن لم يُقرَّر بعد.')}</p>
    <label className={ui.label}>{t('Theme', 'الموضوع')}<input dir="auto" autoFocus maxLength={1000} className={ui.field} value={d.theme} onChange={e => setD({ ...d, theme: e.target.value })} /></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className={ui.label}>{t('Venues', 'أماكن العرض')}<input dir="auto" maxLength={1000} className={ui.field} value={d.venues} onChange={e => setD({ ...d, venues: e.target.value })} /></label>
      <label className={ui.label}>{t('Number of artists', 'عدد الفنانين')}<input type="number" min={1} max={1000} inputMode="numeric" className={ui.field} value={d.artist_count} onChange={e => setD({ ...d, artist_count: e.target.value })} /></label>
    </div>
    <label className={ui.label}>{t('Media and disciplines wanted', 'الوسائط والتخصصات المطلوبة')}<textarea rows={2} maxLength={2000} dir="auto" className={ui.field} value={d.media} onChange={e => setD({ ...d, media: e.target.value })} /></label>
    <label className={ui.label}>{t('Other requirements', 'متطلبات أخرى')}<textarea rows={3} maxLength={4000} dir="auto" className={ui.field} value={d.other_requirements} onChange={e => setD({ ...d, other_requirements: e.target.value })} /></label>
    <label className={ui.label}>{t('Who set this, and where (a meeting or an email, with its date)', 'من حدّدها وأين (اجتماع أو رسالة، مع التاريخ)')}<input dir="auto" maxLength={500} className={ui.field} value={d.source} onChange={e => setD({ ...d, source: e.target.value })} /></label>
    <div className="flex gap-3"><button type="submit" className={ui.button} disabled={busy || !ok}>{t('Record brief', 'تسجيل التوجيهات')}</button><button type="button" className={ui.quiet} onClick={() => setEditing(false)}>{t('Cancel', 'إلغاء')}</button></div>
  </form>;

  return <section className="space-y-6" aria-labelledby="brief-heading">
    <div className="flex flex-wrap items-end gap-3">
      <div className="me-auto"><h2 id="brief-heading" className="font-serif text-2xl">{t('Festival brief', 'توجيهات المهرجان')}</h2>
        <p className={`max-w-2xl ${ui.muted}`}>{t('What the festival management has decided, so artists and works are chosen against written requirements. Each case’s rationale says how it fits.', 'ما قررته إدارة المهرجان، لتُختار الأعمال والفنانون وفق متطلبات مكتوبة. وتبيّن مبررات كل ترشيح مدى توافقه معها.')}</p></div>
      {!editing && !readOnly && <button type="button" className={current ? ui.quiet : ui.button} onClick={startEditing}><Plus aria-hidden className="size-4" />{current ? t('New version', 'نسخة جديدة') : t('Record the brief', 'تسجيل التوجيهات')}</button>}
    </div>
    {editing && form}
    {current ? <div className={`${ui.card} space-y-3 ps-5 pe-5 py-5`}>
      <dl className="grid gap-3 sm:grid-cols-2">
        {field(t('Theme', 'الموضوع'), current.theme)}{field(t('Venues', 'أماكن العرض'), current.venues)}
        {field(t('Number of artists', 'عدد الفنانين'), current.artist_count)}{field(t('Media and disciplines', 'الوسائط والتخصصات'), current.media)}
        {field(t('Other requirements', 'متطلبات أخرى'), current.other_requirements)}
      </dl>
      <p className="text-xs text-[#6E6259]"><bdi>{current.source}</bdi> · {t('recorded', 'سُجّلت في')} <bdi dir="ltr">{current.recorded_at.slice(0, 10)}</bdi>{briefs.length > 1 ? ` · ${t(`version ${briefs.length}`, `النسخة ${briefs.length}`)}` : ''}</p>
      {briefs.length > 1 && <details className="text-sm"><summary className="cursor-pointer text-[#8B261E]">{t('Earlier versions', 'النسخ السابقة')}</summary>
        <ol className="mt-2 space-y-2">{briefs.slice(0, -1).reverse().map(b => <li key={b.id} className="rounded-lg bg-[#FBF7F0] ps-3 pe-3 py-2">
          <p dir="auto">{b.theme}{b.venues ? ` · ${b.venues}` : ''}{b.artist_count ? ` · ${b.artist_count}` : ''}{b.media ? ` · ${b.media}` : ''}{b.other_requirements ? ` · ${b.other_requirements}` : ''}</p>
          <p className="text-xs text-[#6E6259]"><bdi>{b.source}</bdi> · <bdi dir="ltr">{b.recorded_at.slice(0, 10)}</bdi></p></li>)}</ol></details>}
    </div> : !editing && <Empty icon={<ClipboardList aria-hidden className="size-6" />} title={t('No brief recorded yet', 'لم تُسجَّل التوجيهات بعد')}
      body={readOnly ? t('The theme, venues, number of artists and media the festival management sets appear here.', 'يظهر هنا ما تحدده إدارة المهرجان من موضوع وأماكن عرض وعدد الفنانين والوسائط.') : t('Before scouting, write down the theme, venues, number of artists and the media and disciplines the festival management has set, and who set them.', 'قبل بدء الرصد، دوّن الموضوع وأماكن العرض وعدد الفنانين والوسائط والتخصصات التي حددتها إدارة المهرجان، ومن حددها.')} />}

    <div className="space-y-3">
      <div><h3 className="font-serif text-xl">{t('Reasons nominations were not selected', 'أسباب عدم اختيار الترشيحات')}</h3>
        <p className={`max-w-2xl ${ui.muted}`}>{t('Each reason as the Committee or the Director gave it. Reasons that were not in the brief are requirements nobody had written down; review them with the General Exhibition Coordinator before the next round.', 'كل سبب كما ذكرته اللجنة أو المدير. والأسباب غير الواردة في التوجيهات متطلبات لم تُكتب من قبل؛ تُراجَع مع المنسقة العامة للمعارض قبل الدورة التالية.')}</p></div>
      {notSelected.length ? <>
        {typeTally.length > 0 && <p className="text-sm">{typeTally.map(([r, n]) => `${typeLabels[r]}: ${n}`).join(' · ')}</p>}
        <p className="text-sm">{[`${tally('IN_BRIEF')} ${t('in the brief', 'واردة في التوجيهات')}`, `${tally('NOT_IN_BRIEF')} ${t('not in the brief', 'غير واردة')}`, `${tally('NO_REASON_GIVEN')} ${t('without a reason', 'دون سبب')}`, `${tally(null)} ${t('not noted', 'غير مصنّفة')}`].join(' · ')}</p>
        <ul className="space-y-2">{notSelected.slice().reverse().map(x => <li key={x.id} className={`${ui.card} space-y-1 ps-4 pe-4 py-3`}>
          <p><button type="button" className="font-semibold text-[#8B261E] underline-offset-4 hover:underline" onClick={() => onOpenCase(x.dossier_id)}>{name(x.dossier_id)}</button> · <bdi dir="ltr">{x.decided_on}</bdi></p>
          <p dir="auto" className="whitespace-pre-line">{x.minute}</p>
          {!!x.reason_types?.length && <p className="text-xs text-[#6E6259]">{x.reason_types.map(r => typeLabels[r]).join(' · ')}</p>}
          <p className="text-xs text-[#6E6259]">{x.reason_in_brief ? labels[x.reason_in_brief] : t('Not noted against the brief', 'لم يُقارَن بالتوجيهات')}</p>
        </li>)}</ul>
      </> : <p className={ui.muted}>{t('No nomination has been declined or not recommended yet.', 'لا توجد بعد ترشيحات مرفوضة أو غير موصى بها.')}</p>}
    </div>
  </section>;
}
