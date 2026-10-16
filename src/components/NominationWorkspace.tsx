import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { pilotSupabase as client } from '../lib/pilotSupabase';
import { useUiText, UiText } from '../context/I18nContext';
import { NominationPresentation, presentationBlob } from './NominationPresentation';
import { buildDeck, deckFileName } from '../lib/nominationDeck';
import { canWriteToFolder, folderSink, sharedFolder, writeExport, zipSink, exportStamp, safeName } from '../lib/nominationExport';
import {
  acceptAttribute, acceptedExtension, CASE_COLUMNS, caseStage, linksFromText, MAX_WORKS, MIN_WORKS, missingForReady,
  signedUrls, uploadCaseFile, BUCKET,
  type CaseStage, type CaseWork, type MissingItem, type NominationCase, type NominationDecision, type NominationEvent,
} from '../lib/nominations';

const field = 'block w-full rounded border border-[#D9CEBA] bg-white ps-3 pe-3 py-2';
const button = 'rounded bg-[#8B261E] ps-4 pe-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed';
const quiet = 'rounded border border-[#8C8173] bg-white ps-4 pe-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed';
const panel = 'space-y-4 rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5';

type Draft = { name: string; arabic_name: string; nationality: string; base_city: string; category: string; medium: string; participation: string; biography: string; rationale: string; links: string };
const toDraft = (c: NominationCase): Draft => ({
  name: c.name, arabic_name: c.arabic_name, nationality: c.nationality, base_city: c.base_city ?? '', category: c.category, medium: c.medium,
  participation: c.participation ?? '', biography: c.biography ?? '', rationale: c.rationale ?? '', links: c.links.join('\n'),
});

export function NominationWorkspace({ userId }: { userId: string }) {
  const { t, isAr } = useUiText();
  const [events, setEvents] = useState<NominationEvent[]>([]);
  const [eventId, setEventId] = useState('');
  const [cases, setCases] = useState<NominationCase[]>([]);
  const [works, setWorks] = useState<CaseWork[]>([]);
  const [decisions, setDecisions] = useState<NominationDecision[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  // t() is recreated on every render; read it through a ref so loading does not depend on it.
  const text = useRef(t);
  text.current = t;

  const stageLabel: Record<CaseStage, string> = {
    DRAFT: t('Draft', 'مسودة'), READY: t('Ready', 'جاهز'), SENT: t('Sent to Committee', 'أُرسل إلى اللجنة'),
    APPROVED: t('Approved', 'معتمد'), DECLINED: t('Declined', 'مرفوض'), OTHER: t('Other', 'أخرى'),
  };
  const missingLabel: Record<MissingItem, string> = {
    name: t('English name', 'الاسم بالإنجليزية'), arabic_name: t('Arabic name', 'الاسم بالعربية'), nationality: t('Nationality', 'الجنسية'),
    category: t('Category', 'الفئة'), medium: t('Medium', 'الوسيط الفني'), biography: t('Biography', 'النبذة التعريفية'),
    rationale: t('Rationale', 'مبررات الترشيح'), works: t(`At least ${MIN_WORKS} credited works`, `${MIN_WORKS} أعمال على الأقل مع ذكر المصدر`),
  };

  const load = useCallback(async (keepSelection = true) => {
    if (!client) return;
    const t = text.current;
    const ev = await client.from('sadu_events').select('id,name_en,name_ar,edition').eq('active', true).order('name_en');
    if (ev.error) { setMessage(t('Events could not be loaded.', 'تعذّر تحميل الفعاليات.')); return; }
    setEvents(ev.data as NominationEvent[]);
    const activeEvent = eventId || ev.data?.[0]?.id || '';
    if (!eventId && activeEvent) setEventId(activeEvent);
    if (!activeEvent) return;
    const cs = await client.from('artist_dossiers').select(CASE_COLUMNS).eq('event_id', activeEvent).order('created_at');
    if (cs.error) { setMessage(t('Cases could not be loaded.', 'تعذّر تحميل الترشيحات.')); return; }
    // Discarded drafts stay in the database but are hidden here.
    const list = (cs.data as unknown as NominationCase[]).filter(c => !c.discarded_at);
    const ids = list.map(c => c.id);
    const [ws, ds] = ids.length ? await Promise.all([
      client.from('sadu_case_works').select('*').in('dossier_id', ids).order('position').order('created_at'),
      client.from('sadu_nomination_decisions').select('*').in('dossier_id', ids).order('recorded_at'),
    ]) : [{ data: [], error: null }, { data: [], error: null }];
    setCases(list);
    setWorks((ws.data ?? []) as CaseWork[]);
    setDecisions((ds.data ?? []) as NominationDecision[]);
    setUrls(await signedUrls(client, (ws.data ?? []).map(w => (w as CaseWork).image_path)));
    if (!keepSelection) setSelectedId('');
  }, [eventId]);

  useEffect(() => { void load(); }, [load]);

  async function run(work: () => Promise<void>, success: string) {
    if (busy) return;
    setBusy(true); setMessage('');
    try { await work(); await load(); setMessage(success); }
    catch (error) { setMessage(error instanceof Error ? error.message : t('Something went wrong.', 'حدث خطأ.')); }
    finally { setBusy(false); }
  }

  const event = events.find(e => e.id === eventId);
  const selected = cases.find(c => c.id === selectedId);
  const worksFor = (id: string) => works.filter(w => w.dossier_id === id);
  const decisionsFor = (id: string) => decisions.filter(d => d.dossier_id === id);
  const readyUnsent = cases.filter(c => c.created_by === userId && caseStage(c) === 'READY');
  const approved = cases.filter(c => caseStage(c) === 'APPROVED');

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
        ? t(`Exported, but ${missing.length} file(s) could not be copied: ${missing.join('; ')}`, `صُدّر، لكن تعذّر نسخ ${missing.length} من الملفات: ${missing.join('؛ ')}`)
        : canWriteToFolder()
          ? t(`Exported ${subset.length} case(s) to the shared folder, in a new dated folder under “SADU export”.`, `صُدّر ${subset.length} من الترشيحات إلى المجلد المشترك، في مجلد جديد مؤرخ داخل «SADU export».`)
          : t('Export downloaded as a ZIP file. Unzip it into the shared folder.', 'نُزّل التصدير كملف ZIP. فك ضغطه في المجلد المشترك.'));
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      setMessage(aborted ? t('Export cancelled.', 'أُلغي التصدير.') : error instanceof Error ? error.message : t('The export failed.', 'تعذّر التصدير.'));
    } finally { setBusy(false); }
  }

  if (!client) return null;
  return <section className={panel} aria-labelledby="nominations-heading">
    <div className="flex flex-wrap items-end gap-3">
      <h2 id="nominations-heading" className="me-auto text-xl">{t('Nominations', 'الترشيحات')}</h2>
      {events.length > 1 && <label className="block text-sm">{t('Event', 'الفعالية')}
        <select className={field} value={eventId} onChange={e => { setEventId(e.target.value); setSelectedId(''); }}>
          {events.map(e => <option key={e.id} value={e.id}>{isAr ? e.name_ar : e.name_en}{e.edition ? ` · ${e.edition}` : ''}</option>)}
        </select></label>}
    </div>
    {event && <p className="text-sm text-[#5E554B]">{isAr ? event.name_ar : event.name_en} · {t('Build a case for each artist, send the Committee presentation by email, then record the decision here.', 'جهّز ملف ترشيح لكل فنان، وأرسل العرض إلى اللجنة بالبريد الإلكتروني، ثم سجّل القرار هنا.')}</p>}
    <p role="status" aria-live="polite" className="empty:hidden"><UiText value={message} /></p>

    <div className="flex flex-wrap gap-3">
      <button type="button" className={button} disabled={busy || !eventId} onClick={() => { setCreating(true); setSelectedId(''); }}>{t('New case', 'ترشيح جديد')}</button>
      {cases.length > 0 && <button type="button" className={quiet} disabled={busy} onClick={() => void exportCases(cases, 'ALL')}>{t('Export all to the shared folder', 'تصدير الكل إلى المجلد المشترك')}</button>}
      {cases.length > 0 && canWriteToFolder() && <button type="button" className="text-sm underline" disabled={busy} onClick={() => void exportCases(cases, 'ALL', true)}>{t('Choose a different folder', 'اختيار مجلد آخر')}</button>}
      {readyUnsent.length > 0 && <button type="button" className={quiet} disabled={busy}
        onClick={() => void run(async () => {
          const { error } = await client!.rpc('sadu_mark_nominations_sent', { case_ids: readyUnsent.map(c => c.id) });
          if (error) throw new Error(error.message);
        }, t('Marked as sent to the Committee.', 'سُجّل الإرسال إلى اللجنة.'))}>
        {t(`Mark ${readyUnsent.length} ready case(s) as sent to the Committee`, `تسجيل إرسال ${readyUnsent.length} من الترشيحات الجاهزة إلى اللجنة`)}</button>}
    </div>

    {creating && <NewCaseForm busy={busy} onCancel={() => setCreating(false)} onCreate={draft => void run(async () => {
      const { data, error } = await client!.from('artist_dossiers').insert({ event_id: eventId, name: draft.name.trim(), arabic_name: draft.arabic_name.trim(), nationality: draft.nationality.trim(), category: draft.category, medium: draft.medium.trim() }).select('id').single();
      if (error) throw new Error(error.message);
      setCreating(false); setSelectedId((data as { id: string }).id);
    }, t('Case created. Add the biography, rationale and works.', 'أُنشئ الترشيح. أضف النبذة التعريفية ومبررات الترشيح والأعمال.'))} />}

    {!cases.length && !creating && <p>{t('No cases for this event yet.', 'لا توجد ترشيحات لهذه الفعالية بعد.')}</p>}
    {cases.length > 0 && <ul className="divide-y divide-[#D9CEBA] rounded border border-[#D9CEBA] bg-white">
      {cases.map(c => {
        const stage = caseStage(c), missing = missingForReady(c, worksFor(c.id).length), mine = c.created_by === userId;
        return <li key={c.id}>
          <button type="button" aria-current={c.id === selectedId} onClick={() => { setSelectedId(c.id === selectedId ? '' : c.id); setCreating(false); }}
            className={`flex w-full flex-wrap items-center gap-x-4 gap-y-1 ps-4 pe-4 py-3 text-start ${c.id === selectedId ? 'bg-[#FFFAF0]' : ''}`}>
            <span className="me-auto min-w-0"><strong>{isAr ? c.arabic_name : c.name}</strong> <span className="text-sm text-[#5E554B]">· {isAr ? c.name : c.arabic_name} · {c.nationality}</span></span>
            <span className="rounded border border-[#CBB89F] ps-2 pe-2 text-sm">{stageLabel[stage]}</span>
            {stage === 'DRAFT' && <span className="text-sm">{missing.length ? t(`${missing.length} item(s) missing`, `ينقص ${missing.length}`) : t('Complete', 'مكتمل')}</span>}
            {!mine && <span className="text-sm text-[#5E554B]">{t('Another coordinator', 'منسق آخر')}</span>}
          </button>
        </li>;
      })}
    </ul>}

    {event && <NominationPresentation event={event} cases={cases} works={works} urls={urls} busy={busy} onMessage={setMessage}
      onExported={(ids, note) => { setMessage(note); void client!.from('sadu_export_log').insert({ event_id: event.id, kind: 'PRESENTATION', dossier_ids: ids }); }} />}

    {selected && <CaseDetail key={selected.id} onExport={() => void exportCases([selected], 'CASE')} c={selected} works={worksFor(selected.id)} decisions={decisionsFor(selected.id)} urls={urls}
      mine={selected.created_by === userId} busy={busy} run={run} missingLabel={missingLabel} stageLabel={stageLabel} />}

    <section className="space-y-2" aria-labelledby="invite-heading">
      <h3 id="invite-heading" className="text-lg">{t('Invite list', 'قائمة الدعوات')}</h3>
      {approved.length ? <ul className="list-inside list-disc">{approved.map(c => <li key={c.id}>{isAr ? c.arabic_name : c.name} · {c.nationality}</li>)}</ul>
        : <p className="text-sm">{t('Approved artists appear here, ready for the invitation step.', 'يظهر هنا الفنانون المعتمدون، جاهزين لخطوة الدعوة.')}</p>}
    </section>
  </section>;
}

function NewCaseForm({ busy, onCreate, onCancel }: { busy: boolean; onCreate: (d: Pick<Draft, 'name' | 'arabic_name' | 'nationality' | 'category' | 'medium'>) => void; onCancel: () => void }) {
  const { t } = useUiText();
  const [d, setD] = useState({ name: '', arabic_name: '', nationality: '', category: 'Emerging', medium: '' });
  const ok = d.name.trim() && d.arabic_name.trim() && d.nationality.trim() && d.medium.trim();
  return <form className="grid gap-3 rounded border border-[#D9CEBA] bg-white ps-4 pe-4 py-4 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); if (ok) onCreate(d); }}>
    <h3 className="text-lg sm:col-span-2">{t('New case', 'ترشيح جديد')}</h3>
    <label className="block">{t('Artist name (English)', 'اسم الفنان بالإنجليزية')}<input required dir="ltr" className={field} value={d.name} onChange={e => setD({ ...d, name: e.target.value })} /></label>
    <label className="block">{t('Artist name (Arabic)', 'اسم الفنان بالعربية')}<input required dir="rtl" lang="ar" className={field} value={d.arabic_name} onChange={e => setD({ ...d, arabic_name: e.target.value })} /></label>
    <label className="block">{t('Nationality', 'الجنسية')}<input required className={field} value={d.nationality} onChange={e => setD({ ...d, nationality: e.target.value })} /></label>
    <label className="block">{t('Medium / practice', 'الوسيط / الممارسة الفنية')}<input required className={field} value={d.medium} onChange={e => setD({ ...d, medium: e.target.value })} /></label>
    <label className="block">{t('Category', 'الفئة')}<select className={field} value={d.category} onChange={e => setD({ ...d, category: e.target.value })}>
      <option value="Emerging">{t('Emerging', 'ناشئ')}</option><option value="Established">{t('Established', 'متمرّس')}</option></select></label>
    <div className="flex items-end gap-3"><button className={button} disabled={busy || !ok}>{t('Create case', 'إنشاء الترشيح')}</button><button type="button" className={quiet} onClick={onCancel}>{t('Cancel', 'إلغاء')}</button></div>
  </form>;
}

type RunFn = (work: () => Promise<void>, success: string) => Promise<void>;

function CaseDetail({ c, works, decisions, urls, mine, busy, run, missingLabel, stageLabel, onExport }: {
  c: NominationCase; works: CaseWork[]; decisions: NominationDecision[]; urls: Record<string, string>; mine: boolean; busy: boolean;
  run: RunFn; missingLabel: Record<MissingItem, string>; stageLabel: Record<CaseStage, string>; onExport: () => void;
}) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const { t, isAr } = useUiText();
  const stage = caseStage(c);
  const editable = mine && stage === 'DRAFT';
  const [draft, setDraft] = useState<Draft>(() => toDraft(c));
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(toDraft(c)), [draft, c]);
  const missing = missingForReady({ ...c, ...draft }, works.length);
  const set = (k: keyof Draft) => (e: { target: { value: string } }) => setDraft({ ...draft, [k]: e.target.value });

  const persist = async () => {
    const { error } = await client!.from('artist_dossiers').update({
      name: draft.name.trim(), arabic_name: draft.arabic_name.trim(), nationality: draft.nationality.trim(), base_city: draft.base_city.trim() || null,
      category: draft.category, medium: draft.medium.trim(), participation: draft.participation || null,
      biography: draft.biography.trim() || null, rationale: draft.rationale.trim() || null, links: linksFromText(draft.links),
    }).eq('id', c.id);
    if (error) throw new Error(error.message);
  };
  const save = () => run(persist, t('Case saved.', 'حُفظ الترشيح.'));

  const markReady = () => run(async () => {
    if (dirty) await persist();
    const { data, error } = await client!.from('artist_dossiers').update({ status: 'PENDING_COMMITTEE_REVIEW' }).eq('id', c.id).select('id');
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error(t('The case could not be made ready for the Committee. Refresh and try again.', 'تعذّر تجهيز الترشيح للجنة. حدّث الصفحة وحاول مجدداً.'));
  }, t('The case is ready for the Committee and locked. Include it in the Committee presentation.', 'أصبح الترشيح جاهزاً للجنة وقُفل. أدرجه في العرض التقديمي للجنة.'));

  return <article className="space-y-4 rounded border border-[#D9CEBA] bg-white ps-4 pe-4 py-4" aria-label={isAr ? c.arabic_name : c.name}>
    <header className="flex flex-wrap items-baseline gap-3">
      <h3 className="me-auto text-lg">{isAr ? c.arabic_name : c.name} <span className="text-[#5E554B]">· {isAr ? c.name : c.arabic_name}</span></h3>
      <span className="rounded border border-[#CBB89F] ps-2 pe-2 text-sm">{stageLabel[stage]}</span>
      <button type="button" className="text-sm underline" disabled={busy} onClick={onExport}>{t('Export this case', 'تصدير هذا الترشيح')}</button>
    </header>
    {!editable && stage === 'DRAFT' && <p className="text-sm">{t('Only the coordinator who created this case can edit it.', 'لا يعدّل هذا الترشيح إلا المنسق الذي أنشأه.')}</p>}

    {editable ? <div className="grid gap-3 sm:grid-cols-2">
      <label className="block">{t('Artist name (English)', 'اسم الفنان بالإنجليزية')}<input dir="ltr" className={field} value={draft.name} onChange={set('name')} /></label>
      <label className="block">{t('Artist name (Arabic)', 'اسم الفنان بالعربية')}<input dir="rtl" lang="ar" className={field} value={draft.arabic_name} onChange={set('arabic_name')} /></label>
      <label className="block">{t('Nationality', 'الجنسية')}<input className={field} value={draft.nationality} onChange={set('nationality')} /></label>
      <label className="block">{t('Base city', 'مدينة الإقامة')}<input className={field} value={draft.base_city} onChange={set('base_city')} /></label>
      <label className="block">{t('Category', 'الفئة')}<select className={field} value={draft.category} onChange={set('category')}>
        <option value="Emerging">{t('Emerging', 'ناشئ')}</option><option value="Established">{t('Established', 'متمرّس')}</option></select></label>
      <label className="block">{t('Medium / practice', 'الوسيط / الممارسة الفنية')}<input className={field} value={draft.medium} onChange={set('medium')} /></label>
      <label className="block sm:col-span-2">{t('Proposed participation', 'المشاركة المقترحة')}<select className={field} value={draft.participation} onChange={set('participation')}>
        <option value="">{t('Not decided yet', 'لم تُحدد بعد')}</option><option value="EXISTING_WORK">{t('Existing work', 'عمل قائم')}</option><option value="NEW_COMMISSION">{t('New commission', 'تكليف بعمل جديد')}</option></select></label>
      <label className="block sm:col-span-2">{t('Biography', 'النبذة التعريفية')}<textarea rows={4} maxLength={6000} dir="auto" className={field} value={draft.biography} onChange={set('biography')} /></label>
      <label className="block sm:col-span-2">{t('Rationale: why this artist for this festival', 'مبررات الترشيح: لماذا هذا الفنان لهذا المهرجان')}<textarea rows={4} maxLength={6000} dir="auto" className={field} value={draft.rationale} onChange={set('rationale')} /></label>
      <label className="block sm:col-span-2">{t('Links (one per line)', 'روابط (رابط في كل سطر)')}<textarea rows={2} dir="ltr" className={field} value={draft.links} onChange={set('links')} /></label>
      <div className="sm:col-span-2"><button type="button" className={quiet} disabled={busy || !dirty} onClick={() => void save()}>{t('Save changes', 'حفظ التغييرات')}</button></div>
    </div> : <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
      {[[t('Nationality', 'الجنسية'), c.nationality], [t('Base city', 'مدينة الإقامة'), c.base_city], [t('Category', 'الفئة'), c.category === 'Emerging' ? t('Emerging', 'ناشئ') : c.category === 'Established' ? t('Established', 'متمرّس') : c.category], [t('Medium / practice', 'الوسيط / الممارسة الفنية'), c.medium],
        [t('Proposed participation', 'المشاركة المقترحة'), c.participation === 'EXISTING_WORK' ? t('Existing work', 'عمل قائم') : c.participation === 'NEW_COMMISSION' ? t('New commission', 'تكليف بعمل جديد') : '']].map(([k, v]) =>
        <div key={k}><dt className="text-sm text-[#5E554B]">{k}</dt><dd dir="auto">{v || '—'}</dd></div>)}
      <div className="sm:col-span-2"><dt className="text-sm text-[#5E554B]">{t('Biography', 'النبذة التعريفية')}</dt><dd dir="auto" className="whitespace-pre-line">{c.biography || '—'}</dd></div>
      <div className="sm:col-span-2"><dt className="text-sm text-[#5E554B]">{t('Rationale', 'مبررات الترشيح')}</dt><dd dir="auto" className="whitespace-pre-line">{c.rationale || '—'}</dd></div>
    </dl>}

    <WorksSection c={c} works={works} urls={urls} editable={editable} busy={busy} run={run} />
    {editable && <CvUpload c={c} busy={busy} run={run} />}

    {editable && <div className="space-y-2 rounded border border-[#CBB89F] bg-[#FFFAF0] ps-4 pe-4 py-3">
      {missing.length ? <><p>{t('Still needed before this case is ready for the Committee:', 'مطلوب قبل أن يصبح الترشيح جاهزاً للجنة:')}</p>
        <ul className="list-inside list-disc">{missing.map(m => <li key={m}>{missingLabel[m]}</li>)}</ul></>
        : <p>{t('Everything required is in place. Pressing “Ready for Committee” locks the case.', 'اكتمل كل المطلوب. عند الضغط على «جاهز للجنة» يُقفل الترشيح.')}</p>}
      <button type="button" className={button} disabled={busy || missing.length > 0} onClick={() => void markReady()}>{t('Ready for Committee', 'جاهز للجنة')}</button>
    </div>}

    {editable && <div className="flex flex-wrap items-center gap-3 border-t border-[#D9CEBA] pt-3">
      {!confirmDiscard ? <button type="button" className="text-sm text-[#8B261E] underline" disabled={busy} onClick={() => setConfirmDiscard(true)}>{t('Discard this draft', 'استبعاد هذه المسودة')}</button>
        : <><p className="text-sm">{t('Discard this case? It disappears from the list and can no longer be edited or submitted.', 'استبعاد هذا الترشيح؟ سيختفي من القائمة ولن يمكن تعديله أو إرساله.')}</p>
          <button type="button" className={button} disabled={busy} onClick={() => void run(async () => {
            const { data, error } = await client!.from('artist_dossiers').update({ discarded_at: new Date().toISOString() }).eq('id', c.id).select('id');
            if (error) throw new Error(error.message);
            if (!data?.length) throw new Error(t('The case could not be discarded.', 'تعذّر استبعاد الترشيح.'));
          }, t('Draft discarded.', 'استُبعدت المسودة.'))}>{t('Discard', 'استبعاد')}</button>
          <button type="button" className={quiet} onClick={() => setConfirmDiscard(false)}>{t('Keep it', 'إبقاء')}</button></>}
    </div>}

    {mine && (stage === 'READY' || stage === 'SENT') && <DecisionForm c={c} busy={busy} run={run} />}
    {decisions.length > 0 && <DecisionHistory decisions={decisions} />}
  </article>;
}

function WorksSection({ c, works, urls, editable, busy, run }: { c: NominationCase; works: CaseWork[]; urls: Record<string, string>; editable: boolean; busy: boolean; run: RunFn }) {
  const { t } = useUiText();
  const empty = { title: '', year: '', medium: '', dimensions: '', source_credit: '' };
  const [w, setW] = useState(empty);
  const [file, setFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const ext = file ? acceptedExtension(file, 'work') : null;
  const canAdd = editable && works.length < MAX_WORKS && !!ext && w.title.trim() && w.source_credit.trim().length >= 2;

  const add = () => run(async () => {
    const path = await uploadCaseFile(client!, c.id, 'works', file!, ext!);
    const { error } = await client!.from('sadu_case_works').insert({ dossier_id: c.id, position: works.length + 1, title: w.title.trim(), year: w.year.trim() || null, medium: w.medium.trim() || null, dimensions: w.dimensions.trim() || null, source_credit: w.source_credit.trim(), image_path: path });
    if (error) throw new Error(error.message);
    setW(empty); setFile(null); setInputKey(k => k + 1);
  }, t('Work added.', 'أُضيف العمل.'));

  const remove = (id: string) => run(async () => {
    const { error } = await client!.from('sadu_case_works').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }, t('Work removed from the case.', 'أُزيل العمل من الترشيح.'));

  return <section className="space-y-3" aria-label={t('Selected works', 'الأعمال المختارة')}>
    <h4 className="font-semibold">{t(`Selected works (${works.length} of ${MAX_WORKS}; at least ${MIN_WORKS})`, `الأعمال المختارة (${works.length} من ${MAX_WORKS}؛ ${MIN_WORKS} على الأقل)`)}</h4>
    {works.length > 0 && <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{works.map(work => <li key={work.id} className="space-y-1 rounded border border-[#D9CEBA] ps-2 pe-2 py-2">
      {urls[work.image_path] ? <img src={urls[work.image_path]} alt={work.title} className="aspect-[4/3] w-full rounded object-cover" /> : <div className="aspect-[4/3] w-full rounded bg-[#F1E7D6]" />}
      <p dir="auto" className="font-semibold">{work.title}{work.year ? `, ${work.year}` : ''}</p>
      <p className="text-sm">{[work.medium, work.dimensions].filter(Boolean).join(' · ')}</p>
      <p className="text-sm text-[#5E554B]">{t('Credit', 'المصدر')}: <bdi>{work.source_credit}</bdi></p>
      {editable && <button type="button" className="text-sm text-[#8B261E] underline" disabled={busy} onClick={() => void remove(work.id)}>{t('Remove', 'إزالة')}</button>}
    </li>)}</ul>}
    {editable && works.length < MAX_WORKS && <form className="grid gap-3 rounded border border-dashed border-[#CBB89F] ps-3 pe-3 py-3 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); if (canAdd) void add(); }}>
      <label className="block sm:col-span-2">{t('Image (JPEG, PNG or WebP, up to 20 MB)', 'الصورة (JPEG أو PNG أو WebP، حتى 20 ميغابايت)')}
        <input key={inputKey} type="file" accept={acceptAttribute.work} className={field} onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>
      {file && !ext && <p role="alert" className="text-[#8B261E] sm:col-span-2">{t('This file type or size is not accepted.', 'نوع الملف أو حجمه غير مقبول.')}</p>}
      <label className="block">{t('Title', 'العنوان')}<input className={field} value={w.title} onChange={e => setW({ ...w, title: e.target.value })} /></label>
      <label className="block">{t('Year', 'السنة')}<input className={field} value={w.year} onChange={e => setW({ ...w, year: e.target.value })} /></label>
      <label className="block">{t('Medium', 'الوسيط')}<input className={field} value={w.medium} onChange={e => setW({ ...w, medium: e.target.value })} /></label>
      <label className="block">{t('Dimensions', 'الأبعاد')}<input className={field} value={w.dimensions} onChange={e => setW({ ...w, dimensions: e.target.value })} /></label>
      <label className="block sm:col-span-2">{t('Image source / credit (required)', 'مصدر الصورة / حقوقها (مطلوب)')}<input className={field} value={w.source_credit} onChange={e => setW({ ...w, source_credit: e.target.value })} /></label>
      <div className="sm:col-span-2"><button className={quiet} disabled={busy || !canAdd}>{t('Add work', 'إضافة العمل')}</button></div>
    </form>}
  </section>;
}

function CvUpload({ c, busy, run }: { c: NominationCase; busy: boolean; run: RunFn }) {
  const { t } = useUiText();
  const [file, setFile] = useState<File | null>(null);
  const ext = file ? acceptedExtension(file, 'cv') : null;
  return <div className="space-y-2">
    <label className="block">{t('CV (optional; PDF or Word)', 'السيرة الذاتية (اختياري؛ PDF أو Word)')}
      <input type="file" accept={acceptAttribute.cv} className={field} onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>
    {c.cv_url && <p className="text-sm">{t('A CV is attached. Uploading another replaces it in the case.', 'سيرة ذاتية مرفقة. رفع ملف آخر يستبدلها في الترشيح.')}</p>}
    {file && !ext && <p role="alert" className="text-[#8B261E]">{t('This file type or size is not accepted.', 'نوع الملف أو حجمه غير مقبول.')}</p>}
    <button type="button" className={quiet} disabled={busy || !ext} onClick={() => void run(async () => {
      const path = await uploadCaseFile(client!, c.id, 'cv', file!, ext!);
      const { error } = await client!.from('artist_dossiers').update({ cv_url: path }).eq('id', c.id);
      if (error) throw new Error(error.message);
      setFile(null);
    }, t('CV attached.', 'أُرفقت السيرة الذاتية.'))}>{t('Attach CV', 'إرفاق السيرة الذاتية')}</button>
  </div>;
}

function DecisionForm({ c, busy, run }: { c: NominationCase; busy: boolean; run: RunFn }) {
  const { t } = useUiText();
  const today = new Date().toISOString().slice(0, 10);
  const [d, setD] = useState({ committee: '', director: '', decided_on: today, email_reference: '', minute: '' });
  const [file, setFile] = useState<File | null>(null);
  const ext = file ? acceptedExtension(file, 'evidence') : null;
  const ok = d.committee && d.director && d.decided_on && d.decided_on <= today && d.email_reference.trim().length >= 5 && d.minute.trim().length >= 10 && !!ext;
  const radio = (name: 'committee' | 'director', value: string, label: string) =>
    <label className="flex items-center gap-2"><input type="radio" name={`${name}-${c.id}`} value={value} checked={d[name] === value} onChange={() => setD({ ...d, [name]: value })} />{label}</label>;

  return <form className="space-y-3 rounded border border-[#CBB89F] bg-[#FFFAF0] ps-4 pe-4 py-3" onSubmit={e => { e.preventDefault(); if (ok) void run(async () => {
    const path = await uploadCaseFile(client!, c.id, 'decision-evidence', file!, ext!);
    const { error } = await client!.from('sadu_nomination_decisions').insert({ dossier_id: c.id, committee_recommendation: d.committee, director_decision: d.director, decided_on: d.decided_on, email_reference: d.email_reference.trim(), minute: d.minute.trim(), evidence_path: path });
    if (error) throw new Error(error.message);
  }, t('Decision recorded.', 'سُجّل القرار.')); }}>
    <h4 className="font-semibold">{t('Record decision from email', 'تسجيل القرار الوارد بالبريد الإلكتروني')}</h4>
    <p className="text-sm">{t('Enter the outcome exactly as it came back from the Committee and the Director. It cannot be changed once recorded.', 'أدخل القرار كما ورد من اللجنة والمدير. لا يمكن تعديله بعد تسجيله.')}</p>
    <fieldset className="space-y-1"><legend>{t('Committee recommendation', 'توصية اللجنة')}</legend>
      {radio('committee', 'RECOMMENDED', t('Recommended', 'موصى به'))}{radio('committee', 'NOT_RECOMMENDED', t('Not recommended', 'غير موصى به'))}</fieldset>
    <fieldset className="space-y-1"><legend>{t('Director’s decision', 'قرار المدير')}</legend>
      {radio('director', 'APPROVED', t('Approved', 'معتمد'))}{radio('director', 'DECLINED', t('Declined', 'مرفوض'))}{radio('director', 'RETURNED', t('Returned for more information', 'أُعيد لاستكمال المعلومات'))}</fieldset>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block">{t('Decision date', 'تاريخ القرار')}<input type="date" max={today} className={field} value={d.decided_on} onChange={e => setD({ ...d, decided_on: e.target.value })} /></label>
      <label className="block">{t('Email reference (sender, date, subject)', 'مرجع البريد (المرسل، التاريخ، الموضوع)')}<input className={field} value={d.email_reference} onChange={e => setD({ ...d, email_reference: e.target.value })} /></label>
    </div>
    <label className="block">{t('Minute or reason (at least 10 characters)', 'المحضر أو السبب (10 أحرف على الأقل)')}<textarea rows={3} maxLength={4000} className={field} value={d.minute} onChange={e => setD({ ...d, minute: e.target.value })} /></label>
    <label className="block">{t('The decision email, saved as PDF, .msg or .eml', 'رسالة القرار محفوظة بصيغة PDF أو ‎.msg أو ‎.eml')}
      <input type="file" accept={acceptAttribute.evidence} className={field} onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>
    {file && !ext && <p role="alert" className="text-[#8B261E]">{t('This file type or size is not accepted.', 'نوع الملف أو حجمه غير مقبول.')}</p>}
    <button className={button} disabled={busy || !ok}>{t('Record decision', 'تسجيل القرار')}</button>
  </form>;
}

function DecisionHistory({ decisions }: { decisions: NominationDecision[] }) {
  const { t } = useUiText();
  const outcome = { APPROVED: t('Approved', 'معتمد'), DECLINED: t('Declined', 'مرفوض'), RETURNED: t('Returned for more information', 'أُعيد لاستكمال المعلومات') };
  const rec = { RECOMMENDED: t('Recommended', 'موصى به'), NOT_RECOMMENDED: t('Not recommended', 'غير موصى به') };
  return <section className="space-y-2" aria-label={t('Decision history', 'سجل القرارات')}>
    <h4 className="font-semibold">{t('Decision history', 'سجل القرارات')}</h4>
    <ol className="space-y-2">{decisions.map(d => <li key={d.id} className="rounded border border-[#D9CEBA] ps-3 pe-3 py-2">
      <p><strong>{outcome[d.director_decision]}</strong> · {t('Committee', 'اللجنة')}: {rec[d.committee_recommendation]} · <bdi dir="ltr">{d.decided_on}</bdi></p>
      <p dir="auto" className="whitespace-pre-line">{d.minute}</p>
      <p className="text-sm text-[#5E554B]">{t('Recorded from email by the coordinator', 'سجّله المنسق من البريد الإلكتروني')} · <bdi>{d.email_reference}</bdi></p>
    </li>)}</ol>
  </section>;
}
