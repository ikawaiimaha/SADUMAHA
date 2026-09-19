import { PortraitHierarchy } from './PortraitHierarchy';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, LoaderCircle, LockKeyhole, RotateCcw, X } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useLivingRecord } from '../context/LivingRecordContext';
import { CASE_ID, DemoActor, DemoEvent, selectLivingRecord } from '../data/livingRecord';
import { PROGRAMMES } from '../data/mockData';
import { RoleKey } from '../types';
import { DirectorateOversight } from './DirectorateOversight';
import { ChairmanBrief } from './ChairmanBrief';
import { SignatureJourneyPreview } from './SignatureJourneyPreview';
import { PublishingCase } from './PublishingCase';
import { ArtistIntake, ArtistIntakeQueue } from './ArtistIntake';
import { IntakeDraftBackup } from './IntakeDraftBackup';
import { RosterNavLink } from './RosterNavLink';
import { useNavigation } from '../context/NavigationContext';
import './LivingRecordWorkspace.css';

const roles: { actor: DemoActor; role: RoleKey; en: string; ar: string }[] = [
  { actor: 'CHAIRMAN', role: 'DIRECTORATE', en: 'Chairman', ar: 'رئيس الدائرة' },
  { actor: 'DIRECTORATE', role: 'DIRECTORATE', en: 'Directorate', ar: 'إدارة الشؤون الثقافية' },
  { actor: 'MANAGER', role: 'DIRECTORATE', en: 'Exhibition manager', ar: 'مدير المعارض' },
  { actor: 'LOGISTICS', role: 'LOGISTICS', en: 'Logistics', ar: 'اللوجستيات' },
  { actor: 'TECHNICAL', role: 'SAF_TECHNICIAN', en: 'Technical', ar: 'الفريق الفني' },
  { actor: 'COORDINATOR', role: 'SDC_COORDINATOR', en: 'Coordination', ar: 'التنسيق' },
  { actor: 'FINANCE', role: 'FINANCE', en: 'Finance', ar: 'المالية' },
  { actor: 'PUBLISHING_MANAGER', role: 'EDITORIAL', en: 'Publishing manager', ar: 'مدير النشر' },
  { actor: 'ARTIST', role: 'ARTIST', en: 'Artist intake', ar: 'تقديم الفنان' },
];
const eventLabels: Record<DemoEvent['kind'], [string, string]> = {
  'print-proof': ['Sample print proof attached', 'أُرفقت البروفة التجريبية'],
  'print-routed': ['Publishing manager routed the reviewed proof', 'أحال مدير النشر البروفة المراجعة'],
  'print-decision': ['Sample executive decision recorded for this proof version', 'سُجل القرار التنفيذي التجريبي لهذا الإصدار'],
  'print-dispatch': ['Sample print dispatch recorded', 'سُجل الإرسال التجريبي للطباعة'],
  receipt: ['Arrival recorded; technical inspection is next', 'سُجل الوصول؛ الخطوة التالية هي الفحص الفني'],
  'receipt-issue': ['Receipt stopped: identity or seal mismatch', 'توقف الاستلام: عدم تطابق الهوية أو الختم'],
  condition: ['Condition evidence recorded', 'سُجلت أدلة الحالة'],
  handover: ['Demo handover acknowledged', 'تم تأكيد التسليم التجريبي'],
  'statement-missing': ['Artist statement flagged as missing', 'سُجل بيان الفنان ضمن المستندات الناقصة'],
  'statement-task': ['Statement follow-up assigned to Coordination', 'أُسندت متابعة بيان الفنان إلى التنسيق'],
  'statement-restored': ['Sample artist statement restored', 'أُرفق بيان الفنان التجريبي مجدداً'],
  'finance-pack': ['Sample finance pack submitted for review', 'أُرسل الملف المالي التجريبي للمراجعة'],
  'finance-escalated': ['Finance exception escalated for executive review', 'رُفع الاستثناء المالي للمراجعة التنفيذية'],
  'delivery-escalated': ['Manager raised a schedule risk for Directorate oversight', 'رفع المدير مخاطر الجدول للمتابعة من الإدارة'],
};

export function LivingRecordWorkspace() {
  const { navigate } = useNavigation();
  const { isAr, lang, toggleLang, formatNumber } = useI18n();
  const { currentRole, switchRole, setExperienceMode, setSelectedProgramme } = useWorkspace();
  const { state, dispatch, leadershipView, setLeadershipView } = useLivingRecord();
  const [modal, setModal] = useState<'handover' | 'report' | 'finance' | 'reset' | 'signature-preview' | null>(null);
  const [reviewVersion, setReviewVersion] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [crateId, setCrateId] = useState('');
  const [sealMatches, setSealMatches] = useState(false);
  const [conditionOutcome, setConditionOutcome] = useState<'clear' | 'issue'>('clear');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const t = (en: string, ar: string) => isAr ? ar : en;
  const actor: DemoActor = currentRole === 'DIRECTORATE' || currentRole === 'LEADERSHIP' ? leadershipView
    : currentRole === 'LOGISTICS' ? 'LOGISTICS' : ['SAF_TECHNICIAN', 'TECHNICAL', 'TECHNICAL_MUSEUM'].includes(currentRole) ? 'TECHNICAL'
    : ['SDC_COORDINATOR', 'COORDINATOR'].includes(currentRole) ? 'COORDINATOR' : currentRole === 'FINANCE' ? 'FINANCE' : currentRole === 'EDITORIAL' ? 'PUBLISHING_MANAGER' : currentRole === 'ARTIST' ? 'ARTIST' : 'OBSERVER';
  const metrics = selectLivingRecord(state);
  const evidenceReport = modal === 'handover' ? state.conditionHistory.find(report => report.version === reviewVersion) : state.condition;
  const roleLabel = (role: DemoActor | null) => role ? (isAr ? roles.find(item => item.actor === role)?.ar : roles.find(item => item.actor === role)?.en) ?? t('Observer', 'مراقب') : t('Handover complete', 'اكتمل التسليم');
  const time = (value: string) => new Date(value).toLocaleString(isAr ? 'ar-AE-u-nu-arab' : 'en-GB', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Dubai' });
  const envelope = () => ({ actor, at: new Date().toISOString() });
  const exportSessionLog = () => {
    const snapshot = {
      schemaVersion: 1,
      scope: 'fictional-demo-session',
      exportedAt: new Date().toISOString(),
      clockSource: 'browser',
      authenticatedActors: false,
      tamperProtected: false,
      digitalSignatures: false,
      events: state.events,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'SADU-demo-session-log.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const closeDossier = () => { setIsConfirming(false); setModal(null); };
  const go = (target: DemoActor) => {
    const role = roles.find(item => item.actor === target);
    if (!role) return;
    if (target === 'CHAIRMAN' || target === 'DIRECTORATE' || target === 'MANAGER') setLeadershipView(target);
    switchRole(role.role);
    closeDossier();
  };
  const openReview = () => { setReviewVersion(state.condition?.version ?? 0); setAcknowledged(false); setModal('handover'); };
  useEffect(() => {
    const dialog = dialogRef.current;
    if (modal && !dialog?.open) dialog?.showModal();
    else if (!modal && dialog?.open) dialog.close();
    if (modal) dialog?.querySelector<HTMLButtonElement>('.lr-dialog-top button')?.focus();
  }, [modal]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [actor]);
  const conditionLink = <button className="lr-link" onClick={() => setModal('report')}>{t('View condition report', 'عرض تقرير الحالة')} <bdi>DEMO-CR-04 / v{state.condition?.version ?? 1}</bdi></button>;
  const status = state.acceptance ? t('Handover acknowledged', 'تم تأكيد التسليم') : state.receiptIssue ? t('Stopped: identity / seal mismatch', 'متوقف: عدم تطابق الهوية أو الختم') : !state.receipt ? t('Expected at loading bay', 'متوقع في منطقة الاستلام') : !state.condition ? t('On site · inspection required', 'في الموقع · بانتظار الفحص') : state.condition.outcome === 'issue' ? t('Condition exception · on hold', 'استثناء في الحالة · معلق') : t('Evidence ready · review required', 'الأدلة جاهزة · بانتظار المراجعة');
  const canReview = !state.acceptance && state.condition?.outcome === 'clear' && Boolean(state.receipt) && !state.receiptIssue;
  useEffect(() => {
    if (!isConfirming) return;
    if (modal !== 'handover' || actor !== 'MANAGER' || !canReview || !acknowledged || reviewVersion !== state.condition?.version) {
      setIsConfirming(false);
      return;
    }
    // A visible demo pause, not credential verification or a signing service.
    const timer = window.setTimeout(() => {
      dispatch({ type: 'ACCEPT', actor, at: new Date().toISOString(), reportVersion: reviewVersion, acknowledged });
      setIsConfirming(false);
      setModal(null);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [isConfirming, modal, actor, canReview, acknowledged, reviewVersion, state.condition?.version, dispatch]);
  const newEvent = state.events.at(-1);
  const leadership = actor === 'CHAIRMAN' || actor === 'DIRECTORATE';
  return <div className="living-record" lang={lang} dir={isAr ? 'rtl' : 'ltr'}>
    <header className="lr-toolbar">
      <div><strong className="lr-brand">{t('SADU', 'سدو')}</strong><span>{t('The Living Record', 'السجل الحي')}</span></div>
      <nav aria-label={t('Global navigation', 'التنقل العام')}><RosterNavLink/><button onClick={() => setExperienceMode('story')}>{t('Presentation', 'العرض التقديمي')}</button><button onClick={toggleLang}>{isAr ? 'English' : 'العربية'}</button></nav>
    </header>
    <main className="lr-main">
      <div className="lr-context">{actor === 'ARTIST' ? <span>{t('ARTIST INTAKE · FICTIONAL PROGRAMMES', 'تقديم الفنان · برامج افتراضية')}</span> : actor === 'CHAIRMAN' ? <span>{t('SDC INTERNAL OPERATIONS · PROPOSED VIEW', 'العمليات الداخلية لدائرة الثقافة · عرض مقترح')}</span> : actor === 'PUBLISHING_MANAGER' ? <span>{t('SDC PUBLISHING · FICTIONAL ISSUE', 'النشر في دائرة الثقافة · عدد افتراضي')}</span> : actor === 'DIRECTORATE' ? <span>{t('CULTURAL PORTFOLIO · PROPOSED VIEW', 'محفظة البرامج الثقافية · عرض مقترح')}</span> : <><span>{t('FICTIONAL CASE · SESSION ONLY', 'حالة افتراضية · لهذه الجلسة فقط')}</span><bdi>{CASE_ID}</bdi><span>{t('Mounir Fatmi — demonstration scenario', 'منير فاطمي — سيناريو توضيحي')}</span></>}</div>
      <nav className="lr-roles" aria-label={t('Demonstration roles', 'الأدوار التجريبية')}>
        {roles.map(role => <button key={role.actor} aria-pressed={actor === role.actor} onClick={() => go(role.actor)}>{isAr ? role.ar : role.en}</button>)}
      </nav>
      <header className={`lr-anchor ${leadership ? '' : 'lr-anchor--work'}`}>
        {leadership && <div className="lr-portrait"><PortraitHierarchy rank={actor === 'CHAIRMAN' ? 'chairman' : 'director'} isAr={isAr} compact/></div>}
        <div><p className="lr-eyebrow">{t('SHARJAH DEPARTMENT OF CULTURE', 'دائرة الثقافة في الشارقة')}</p>
          <h1>{actor === 'CHAIRMAN' ? t('His Excellency Abdullah bin Mohammed Al Owais', 'سعادة عبد الله بن محمد العويس') : actor === 'DIRECTORATE' ? t('Mr. Mohammed Ibrahim Al Qaseer', 'الأستاذ محمد إبراهيم القصير') : roleLabel(actor)}</h1>
          <p className="lr-subtitle">{actor === 'CHAIRMAN' ? t('Chairman of the Department of Culture · SDC internal oversight', 'رئيس دائرة الثقافة · متابعة العمليات الداخلية') : actor === 'DIRECTORATE' ? t('Director of Cultural Affairs · Cultural portfolio oversight', 'مدير إدارة الشؤون الثقافية · متابعة البرامج الثقافية') : actor === 'MANAGER' ? t('Assigned delivery management · sample role', 'إدارة التنفيذ المكلفة · دور تجريبي') : t('One record. A clear next action.', 'سجل واحد وخطوة تالية واضحة.')}</p>
          <p className="lr-small">{leadership ? t('Proposed workspace; actions are attributed to sample roles, never to the named officials.', 'مساحة عمل مقترحة؛ تُنسب الإجراءات إلى أدوار تجريبية، ولا تُنسب إلى المسؤولين المذكورين.') : t('Sample evidence only. Nothing is uploaded or sent outside this browser session.', 'أدلة تجريبية فقط. لا يُرفع أو يُرسل أي شيء خارج جلسة المتصفح هذه.')}</p>
        </div>
      </header>

      <IntakeDraftBackup visible={actor === 'ARTIST'}/>
      {actor === 'COORDINATOR' && <><section className="lr-panel"><h2>{t('Artist roster and programme planning', 'سجل الفنانين وتخطيط البرامج')}</h2><p>{t('Reuse pre-registered fictional profiles when creating a new sample programme.', 'أعد استخدام الملفات الوهمية المسجلة مسبقاً عند إنشاء برنامج تجريبي جديد.')}</p><button onClick={() => navigate('/roster')}>{t('Open demo roster & programme setup', 'فتح السجل التجريبي وإعداد البرامج')}</button></section><ArtistIntakeQueue/></>}
      {actor === 'ARTIST' ? <ArtistIntake onCoordinator={() => go('COORDINATOR')}/> : actor === 'CHAIRMAN' ? <ChairmanBrief onDirectorate={() => go('DIRECTORATE')} onPublishing={() => go('PUBLISHING_MANAGER')} onFinance={() => setModal('finance')}/> : actor === 'DIRECTORATE' ? <DirectorateOversight/> : actor === 'PUBLISHING_MANAGER' ? <section className="lr-panel"><h2>{t('Studies and Publishing · sample pipeline', 'الدراسات والنشر · مسار تجريبي')}</h2><PublishingCase actor={actor}/></section> : <>
        <section className="lr-panel lr-ledger"><div className="lr-section-title"><h2>{t('Delivery and handover', 'التنفيذ والتسليم')}</h2><span className="lr-status">{t('One shared case', 'حالة مشتركة واحدة')}</span></div>
          <ol className="lr-steps" aria-label={t('Custody sequence', 'تسلسل التسليم')}>
            {[[t('Arrival', 'الوصول'), Boolean(state.receipt)], [t('Condition evidence', 'أدلة الحالة'), Boolean(state.condition)], [t('Handover review', 'مراجعة التسليم'), Boolean(state.acceptance)]].map(([label, done], index) => <li key={index} className={done ? 'is-clear' : ''}><span>{done ? <Check aria-label={t('Recorded', 'مسجل')}/> : formatNumber(index + 1)}</span>{label}{index < 2 && <ArrowRight className="lr-direction" aria-hidden="true"/>}</li>)}
          </ol>
          <div className="lr-table-wrap"><table><caption className="sr-only">{t('Asset, status, evidence, and next responsible role', 'الأصل والحالة والأدلة والدور المسؤول التالي')}</caption><thead><tr>{[t('Asset', 'الأصل'), t('Location / status', 'الموقع / الحالة'), t('Blocker / evidence', 'المعوق / الأدلة'), t('Next responsible role', 'الدور المسؤول التالي')].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
            <tbody><tr><th scope="row">{t('Mounir Fatmi · Crate 4', 'منير فاطمي · الصندوق ٤')}<bdi>{CASE_ID}</bdi></th><td>{status}</td><td>{state.condition ? conditionLink : t('Condition report not yet recorded', 'لم يُسجل تقرير الحالة بعد')}{state.condition?.outcome === 'issue' && <p className="lr-issue">{t('Specialist review required before handover', 'تلزم مراجعة مختصة قبل التسليم')}</p>}</td><td><strong>{roleLabel(metrics.nextActor)}</strong>{actor === 'MANAGER' && !state.acceptance && <button className="lr-primary" disabled={!canReview} onClick={openReview}>{t('Review Handover', 'مراجعة التسليم')}</button>}{metrics.nextActor && metrics.nextActor !== actor && <button className="lr-link" onClick={() => go(metrics.nextActor!)}>{t('Open responsible workspace', 'فتح مساحة الدور المسؤول')}<ArrowRight/></button>}</td></tr></tbody></table></div>
          {state.acceptance && <p className="lr-confirmed"><LockKeyhole aria-hidden="true"/>{t('Demo handover recorded · read-only', 'سُجل التسليم التجريبي · للقراءة فقط')} — <bdi>DEMO-MANAGER</bdi> · {time(state.acceptance.at)} · <bdi>{state.acceptance.reportId}/v{state.acceptance.reportVersion}</bdi></p>}
        </section>
        {actor === 'LOGISTICS' && <section className="lr-panel"><h2>{t('Record physical arrival', 'تسجيل الوصول الفعلي')}</h2><p className="lr-small">{t('Match the expected crate identity and exterior seal before recording arrival. A mismatch stops the handover.', 'طابق هوية الصندوق المتوقعة والختم الخارجي قبل تسجيل الوصول. عدم التطابق يوقف التسليم.')}</p>
          <form className="lr-form" onSubmit={event => { event.preventDefault(); dispatch({ type: 'RECEIVE', ...envelope(), crateId, sealMatches }); }}>
            <label>{t('Crate identity', 'هوية الصندوق')}<input dir="ltr" value={crateId} onChange={event => setCrateId(event.target.value)} placeholder={CASE_ID} required disabled={Boolean(state.receipt)}/></label>
            <label className="lr-checkbox"><input type="checkbox" checked={sealMatches} onChange={event => setSealMatches(event.target.checked)} disabled={Boolean(state.receipt)}/>{t('Exterior and seal match the sample packing record', 'الخارج والختم مطابقان لسجل التغليف التجريبي')}</label>
            <button className="lr-primary" disabled={Boolean(state.receipt)}>{state.receipt ? t('Arrival recorded', 'سُجل الوصول') : t('Record arrival', 'تسجيل الوصول')}</button>
          </form>{state.receiptIssue && <p role="alert" className="lr-issue">{t('Stop. Keep the crate closed and refer the mismatch to the logistics supervisor. Enter corrected sample details only after resolution.', 'توقف. أبقِ الصندوق مغلقاً وأحل عدم التطابق إلى مشرف اللوجستيات. أدخل التفاصيل التجريبية المصححة بعد المعالجة فقط.')}</p>}
        </section>}
        {actor === 'TECHNICAL' && <section className="lr-panel"><h2>{t('Condition evidence', 'أدلة الحالة')}</h2><p>{t('Attach the prepared sample report to this crate. The demonstration does not perform a real inspection.', 'أرفق التقرير التجريبي المعد مسبقاً بهذا الصندوق. لا يُجري النموذج فحصاً فعلياً.')}</p>
          <div className="lr-form"><label>{t('Sample report outcome', 'نتيجة التقرير التجريبي')}<select value={conditionOutcome} onChange={event => setConditionOutcome(event.target.value as 'clear' | 'issue')} disabled={Boolean(state.acceptance)}><option value="clear">{t('No discrepancy reported in sample', 'لا اختلاف مسجل في العينة')}</option><option value="issue">{t('Condition exception — stop handover', 'استثناء في الحالة — إيقاف التسليم')}</option></select></label>
            <button className="lr-primary" disabled={!state.receipt || Boolean(state.acceptance)} onClick={() => dispatch({ type: 'CONDITION', ...envelope(), outcome: conditionOutcome })}>{t('Attach sample condition report', 'إرفاق تقرير الحالة التجريبي')}</button></div>
          {!state.receipt && <p className="lr-small">{t('Blocked until Logistics records arrival.', 'معلق حتى تسجل اللوجستيات الوصول.')}</p>}{state.condition && conditionLink}
        </section>}
        {actor === 'MANAGER' && <section className="lr-panel"><h2>{t('Exceptions requiring an assigned next action', 'استثناءات تتطلب إسناد الإجراء التالي')}</h2><div className="lr-exceptions">
          <div><h3>{t('Artist statement', 'بيان الفنان')}</h3><p>{state.statementPresent ? t('Present in the sample record', 'موجود في السجل التجريبي') : state.statementTask ? t('Follow-up assigned · Coordination', 'أُسندت المتابعة · التنسيق') : t('Missing · assign Coordination to obtain it', 'ناقص · إسناد توفيره إلى التنسيق')}</p><button disabled={state.statementPresent || state.statementTask} onClick={() => dispatch({ type: 'ASSIGN_STATEMENT', ...envelope() })}>{t('Assign statement follow-up', 'إسناد متابعة البيان')}</button></div>
          <div><h3>{t('Finance exception', 'الاستثناء المالي')}</h3><p>{state.finance === 'draft' ? t('Waiting for Finance evidence pack', 'بانتظار ملف أدلة المالية') : state.finance === 'submitted' ? t('Sample pack ready for manager review', 'الملف التجريبي جاهز لمراجعة المدير') : t('Sent to executive review queue', 'أُرسل إلى قائمة المراجعة التنفيذية')}</p><button disabled={state.finance !== 'submitted'} onClick={() => setModal('finance')}>{t('Review finance pack', 'مراجعة الملف المالي')}</button></div>
        </div></section>}
        {actor === 'COORDINATOR' && <section className="lr-panel"><h2>{t('Evidence completeness', 'اكتمال الأدلة')}</h2><p>{state.statementPresent ? t('Sample artist statement is present.', 'بيان الفنان التجريبي موجود.') : state.statementTask ? t('Your follow-up task is assigned. Restore the prepared sample statement to complete it.', 'أُسندت إليك المتابعة. أعد إرفاق البيان التجريبي المعد لإكمالها.') : t('Missing statement flagged. The exhibition manager assigns follow-up.', 'سُجل البيان الناقص. يسند مدير المعارض المتابعة.')}</p><div className="lr-actions"><button disabled={!state.statementPresent} onClick={() => dispatch({ type: 'FLAG_STATEMENT', ...envelope() })}>{t('Flag missing artist statement', 'تسجيل نقص بيان الفنان')}</button><button className="lr-primary" disabled={state.statementPresent || !state.statementTask} onClick={() => dispatch({ type: 'RESTORE_STATEMENT', ...envelope() })}>{t('Restore sample statement', 'إعادة إرفاق البيان التجريبي')}</button></div></section>}
        {actor === 'FINANCE' && <section className="lr-panel"><h2>{t('Prepare an executive exception', 'إعداد استثناء للمراجعة التنفيذية')}</h2><p>{t('Sample procurement pack: scope, budget comparison, and contract review references. No real vendor, amount, threshold, or signature is used.', 'ملف مشتريات تجريبي: النطاق ومقارنة الميزانية ومراجع مراجعة العقد. لا يُستخدم مورد أو مبلغ أو حد مالي أو توقيع حقيقي.')}</p><div className="lr-actions"><button onClick={() => setModal('finance')}>{t('View sample finance pack', 'عرض الملف المالي التجريبي')}</button><button className="lr-primary" disabled={state.finance !== 'draft'} onClick={() => dispatch({ type: 'SUBMIT_FINANCE', ...envelope() })}>{t('Submit sample pack to manager', 'إرسال الملف التجريبي إلى المدير')}</button></div></section>}
        <details className="lr-panel lr-log"><summary>{t('Session activity log', 'سجل نشاط الجلسة')} · {formatNumber(state.events.length)}</summary>
          <p className="lr-small">{t('Sample roles and browser timestamps, shown in UAE time. Refreshing or resetting clears this history. It is not an authenticated, permanent, or tamper-protected audit record.', 'أدوار تجريبية وتوقيت المتصفح، معروض بتوقيت الإمارات. يُمسح السجل عند تحديث الصفحة أو إعادة التجربة. ليس سجل تدقيق موثّقاً أو دائماً أو محمياً من التعديل.')}</p>
          <div className="lr-actions"><button disabled={!state.events.length} onClick={exportSessionLog}>{t('Download session log (JSON)', 'تنزيل سجل الجلسة (JSON)')}</button></div>
          {state.events.length > 0 && <p className="lr-small lr-log-scroll-hint">{t('Scroll the table sideways to view all four columns.', 'مرّر الجدول أفقياً لعرض الأعمدة الأربعة.')}</p>}
          {state.events.length ? <div className="lr-table-wrap" role="region" aria-label={t('Session activity table', 'جدول نشاط الجلسة')} tabIndex={0}><table className="lr-log-table">
            <caption>{t('Recorded demo transitions; navigation and rejected actions are not logged.', 'انتقالات الحالة التجريبية المسجلة؛ لا يُسجل التنقل أو الإجراءات المرفوضة.')}</caption>
            <thead><tr><th scope="col">{t('Event / time', 'الحدث / الوقت')}</th><th scope="col">{t('Action', 'الإجراء')}</th><th scope="col">{t('Sample role', 'الدور التجريبي')}</th><th scope="col">{t('Record / version reference', 'مرجع السجل / الإصدار')}</th></tr></thead>
            <tbody>{state.events.map(event => <tr key={event.id}>
              <th scope="row"><bdi>{event.id}</bdi><time dateTime={event.at}>{time(event.at)}</time></th>
              <td>{eventLabels[event.kind][isAr ? 1 : 0]}<bdi>{event.kind}</bdi></td>
              <td>{roleLabel(event.actor)}<bdi>DEMO-{event.actor}</bdi></td>
              <td><bdi>{event.reference}</bdi></td>
            </tr>)}</tbody>
          </table></div> : <p>{t('No actions recorded in this session.', 'لم تُسجل إجراءات في هذه الجلسة.')}</p>}
        </details>
      </>}
      {actor === 'COORDINATOR' ? <section className="lr-panel"><h2>{t('Publishing handover · sample', 'تسليم النشر · تجريبي')}</h2><PublishingCase actor={actor}/></section> : null}
      {actor === 'MANAGER' && <section className="lr-panel"><h2>{t('Escalate a schedule risk', 'تصعيد مخاطر الجدول')}</h2><p>{t('Raise an impact on installation readiness for Directorate attention. Operational follow-up stays with the exhibition manager and assigned team.', 'ارفع أثر المخاطر على الجاهزية للتركيب إلى الإدارة. تبقى المتابعة التشغيلية لدى مدير المعارض والفريق المكلف.')}</p><button className="lr-primary" disabled={Boolean(state.acceptance) || state.deliveryEscalated} onClick={() => dispatch({ type: 'ESCALATE_DELIVERY', ...envelope() })}>{state.acceptance ? t('Delivery dependency resolved', 'عولج متطلب التنفيذ') : state.deliveryEscalated ? t('Schedule risk raised', 'رُفعت مخاطر الجدول') : t('Raise schedule risk to Directorate', 'رفع مخاطر الجدول إلى الإدارة')}</button></section>}
      <p className="lr-announcement" role="status">{actor === 'ARTIST' ? t('Your profile supports separate proposals. The assigned coordinator checks submitted versions.', 'يدعم ملفك مقترحات مستقلة. يراجع المنسق المكلف الإصدارات المقدمة.') : actor === 'DIRECTORATE' ? t('Manager reports update this overview. Operational actions remain in the assigned workspaces.', 'تحدّث تقارير المديرين هذه النظرة العامة. تبقى الإجراءات التشغيلية في مساحات العمل المكلفة.') : newEvent ? t('Latest record: ', 'آخر سجل: ') + eventLabels[newEvent.kind][isAr ? 1 : 0] : t('Explore department oversight, then switch to the assigned manager and delivery roles.', 'استكشف متابعة الأقسام، ثم انتقل إلى المدير المكلف وأدوار التنفيذ.')}</p>
      <footer className="lr-bottom"><span>{t('Proposed workflow · institutional delegation requires validation', 'مسار عمل مقترح · يلزم التحقق من التفويض المؤسسي')}</span><div>{actor !== 'ARTIST' && <button onClick={() => setModal('reset')}><RotateCcw/>{t('Reset delivery and publishing demo', 'إعادة تجربة التنفيذ والنشر')}</button>}<button onClick={() => setSelectedProgramme(PROGRAMMES[0])}>{t('Other sample workspaces', 'مساحات العمل التجريبية الأخرى')}</button></div></footer>
    </main>

    <dialog ref={dialogRef} className="lr-dialog" aria-labelledby="lr-dialog-title" onCancel={closeDossier} onClose={closeDossier}>
      <div className="lr-dialog-top"><p className="lr-eyebrow">{t('DEMONSTRATION DOSSIER', 'ملف تجريبي')}</p><button autoFocus onClick={closeDossier} aria-label={t('Close dossier', 'إغلاق الملف')}><X/></button></div>
      <h2 id="lr-dialog-title">{modal === 'signature-preview' ? t('Proposed UAE PASS journey', 'مسار الهوية الرقمية المقترح') : modal === 'reset' ? t('Reset this demonstration?', 'إعادة هذه التجربة؟') : modal === 'finance' ? t('Finance exception · review pack', 'استثناء مالي · ملف مراجعة') : modal === 'report' ? t('Sample condition report', 'تقرير حالة تجريبي') : t('Review Handover', 'مراجعة التسليم')}</h2>
      {modal === 'signature-preview' ? <SignatureJourneyPreview isAr={isAr} onBack={() => setModal('handover')}/>
      : modal === 'reset' ? <><p>{t('This clears only the fictional actions recorded in this session.', 'يؤدي ذلك إلى مسح الإجراءات الافتراضية المسجلة في هذه الجلسة فقط.')}</p><div className="lr-actions"><button onClick={() => setModal(null)}>{t('Cancel', 'إلغاء')}</button><button className="lr-primary" onClick={() => { dispatch({ type: 'RESET' }); setCrateId(''); setSealMatches(false); setAcknowledged(false); setConditionOutcome('clear'); go('CHAIRMAN'); }}>{t('Reset fictional case', 'إعادة الحالة الافتراضية')}</button></div></>
      : modal === 'finance' ? <><p><bdi>DEMO-FIN-01 / v1</bdi></p><ul><li>{t('Scope: exhibition support package (sample)', 'النطاق: خدمات دعم المعرض (تجريبي)')}</li><li>{t('Budget comparison: exception identified (sample)', 'مقارنة الميزانية: استثناء محدد (تجريبي)')}</li><li>{t('Contract review reference: DEMO-LEGAL-01', 'مرجع مراجعة العقد: DEMO-LEGAL-01')}</li><li>{t('Delegated signatory and threshold: not established', 'صاحب تفويض التوقيع والحد المالي: غير محددين')}</li></ul><p className="lr-issue">{t('Review queue only. Signature and expenditure authorization are unavailable in this mockup.', 'قائمة مراجعة فقط. التوقيع وإجازة الإنفاق غير متاحين في النموذج.')}</p>{actor === 'MANAGER' && state.finance === 'submitted' && <button className="lr-primary" onClick={() => { dispatch({ type: 'ESCALATE_FINANCE', ...envelope() }); setModal(null); }}>{t('Record review & escalate sample', 'تسجيل المراجعة ورفع الملف التجريبي')}</button>}</>
      : <><p><strong>{t('Mounir Fatmi · Crate 4', 'منير فاطمي · الصندوق ٤')}</strong> · <bdi>{CASE_ID}</bdi></p>
        <div className="lr-dossier-evidence"><h3>{t('Evidence record · demo', 'سجل الأدلة · تجريبي')}</h3>
          {evidenceReport ? <>
            <dl className="lr-evidence-metadata">
              <dt>{t('Record / version', 'السجل / الإصدار')}</dt><dd><bdi>{evidenceReport.id} / v{evidenceReport.version}</bdi></dd>
              <dt>{t('Recorded by', 'سجّله')}</dt><dd>{roleLabel(evidenceReport.actor)} · <bdi>DEMO-{evidenceReport.actor}</bdi></dd>
              <dt>{t('Recorded at · browser clock', 'وقت التسجيل · ساعة المتصفح')}</dt><dd><time dateTime={evidenceReport.at}>{time(evidenceReport.at)}</time></dd>
              <dt>{t('Review status', 'حالة المراجعة')}</dt><dd>{state.acceptance?.reportVersion === evidenceReport.version ? t('Acknowledged in this session', 'تم الإقرار في هذه الجلسة') : evidenceReport.outcome === 'issue' ? t('Specialist review required', 'تلزم مراجعة مختصة') : t('Awaiting demo manager review', 'بانتظار مراجعة المدير التجريبي')}</dd>
              {state.acceptance?.reportVersion === evidenceReport.version && <><dt>{t('Acknowledged by / at', 'صاحب الإقرار / وقته')}</dt><dd><bdi>DEMO-{state.acceptance.actor}</bdi> · <time dateTime={state.acceptance.at}>{time(state.acceptance.at)}</time></dd></>}
            </dl>
            <p>{evidenceReport.outcome === 'issue' ? t('Sample observation: a condition discrepancy requires specialist review.', 'ملاحظة تجريبية: اختلاف في الحالة يتطلب مراجعة مختصة.') : t('Sample observation: identity reconciled; no discrepancy reported in the prepared example.', 'ملاحظة تجريبية: طُوبقت الهوية؛ لم يُسجل اختلاف في المثال المعد.')}</p>
          </> : <p>{t('No condition record is available.', 'لا يتوفر سجل للحالة.')}</p>}
          <a href="/demo/condition-report.html" target="_blank" rel="noreferrer">{t('Open bilingual illustrative report ↗', 'فتح التقرير التوضيحي ثنائي اللغة ↖')}</a>
          <p className="lr-small">{t('The linked illustration is not a signed file or a versioned export of this record. No real inspection or condition photographs are represented.', 'المثال المرتبط ليس ملفاً موقّعاً أو تصديراً لإصدار هذا السجل. لا يمثل فحصاً حقيقياً أو صوراً للحالة.')}</p>
          <details><summary>{t('Verification status', 'حالة التحقق')}</summary><dl className="lr-evidence-metadata">
            <dt>{t('File hash', 'بصمة الملف')}</dt><dd>{t('Not calculated', 'لم تُحسب')}</dd>
            <dt>{t('Provider signature receipt', 'إثبات التوقيع من مزوّد الخدمة')}</dt><dd>{t('Not available · UAE PASS not connected', 'غير متوفر · لا يوجد ربط مع الهوية الرقمية')}</dd>
            <dt>{t('Record protection', 'حماية السجل')}</dt><dd>{t('Session only · not tamper-protected', 'ضمن الجلسة فقط · غير محمي من التعديل')}</dd>
          </dl></details>
        </div>
        {modal === 'report' && state.conditionHistory.length > 1 && <details className="lr-report-history"><summary>{t('Earlier report versions', 'إصدارات التقرير السابقة')}</summary><ul>{state.conditionHistory.slice(0, -1).map(report => <li key={report.version}><bdi>{report.id}/v{report.version}</bdi> · {report.outcome === 'issue' ? t('Condition exception', 'استثناء في الحالة') : t('No discrepancy reported', 'لا اختلاف مسجل')} · {time(report.at)}</li>)}</ul></details>}
        {modal === 'handover' && <>
          <p className="lr-signing-label">{t('Manager acknowledgement · demo only', 'إقرار المدير · للعرض التجريبي فقط')}</p>
          <button className="lr-link" disabled={isConfirming} onClick={() => { setAcknowledged(false); setModal('signature-preview'); }}>{t('Preview proposed UAE PASS journey', 'معاينة مسار الهوية الرقمية المقترح')}</button>
          <label className="lr-checkbox lr-declaration"><input type="checkbox" checked={acknowledged} disabled={isConfirming} onChange={event => setAcknowledged(event.target.checked)}/>{t('I have reviewed this sample report and acknowledge the proposed handover for demonstration purposes. This records no legal custody or digital signature.', 'راجعت هذا التقرير التجريبي وأؤكد التسليم المقترح لأغراض العرض. لا يسجل ذلك حيازة قانونية أو توقيعاً رقمياً.')}</label>
          <p className="lr-small">{t('Recorded as DEMO-MANAGER · declaration DEMO-ACK-1 · browser time. Sample manager role only; no official signature is recorded.', 'يُسجل باسم DEMO-MANAGER · الإقرار DEMO-ACK-1 · توقيت المتصفح. دور مدير تجريبي فقط؛ لا يُسجل أي توقيع رسمي.')}</p>
          <div className="lr-actions">
            <button onClick={closeDossier}>{t('Cancel', 'إلغاء')}</button>
            <button className="lr-primary lr-sign-action" aria-busy={isConfirming} disabled={isConfirming || !acknowledged || actor !== 'MANAGER' || !canReview || reviewVersion !== state.condition?.version} onClick={() => setIsConfirming(true)}>
              {isConfirming && <LoaderCircle className="lr-progress-icon" aria-hidden="true"/>}
              {isConfirming ? t('Recording demo acknowledgement…', 'جارٍ تسجيل الإقرار التجريبي…') : t('Confirm demo handover', 'تأكيد التسليم التجريبي')}
            </button>
          </div>
          <p className="lr-signing-status lr-small" role="status">{isConfirming ? t('Recording in this session. Cancel stops confirmation.', 'جارٍ التسجيل في هذه الجلسة. الإلغاء يوقف التأكيد.') : ''}</p>
        </>}
      </>}
    </dialog>
  </div>;
}
