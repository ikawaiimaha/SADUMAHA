import { useEffect, useRef, useState } from 'react';
import '@fontsource/amiri/400.css';
import { useDemoCheckpoint } from '../lib/useDemoCheckpoint';
import { acknowledgeGuidedProof, createGuidedSession, guidedCollection, guidedMainScenes, guidedNavigation, navigateGuidedSession, validGuidedSession, type GuidedCommand } from '../data/guidedPresentation';
import './GuidedPresentation.css';
import LocalHandoffRegister from './LocalHandoffRegister';
import { handoffPhase } from '../data/handoffRegister';
import { guidedCase, pilotBriefHtml } from '../data/guidedCase';
import { GuidedCaseReceipt, GuidedPackingEvidence } from './GuidedCaseDetails';

const scenes = [
  ['المشكلة', 'The collection problem'],
  ['المسؤول البديل', 'The handoff'],
  ['جاهزية الاستلام', 'Collection readiness'],
  ['النسخة الصحيحة', 'The right proof'],
  ['ما أثبته المثال', 'What the example proves'],
  ['الخطوة التالية', 'The next step'],
] as const;

export default function GuidedPresentation({ onExplore }: { onExplore: (hash: string) => void }) {
  const [session, setSession, warning] = useDemoCheckpoint('sadu:guided:ar:v1', createGuidedSession, validGuidedSession);
  const [error, setError] = useState<'date' | 'proof' | 'action' | ''>('');
  const [errorAttempt, setErrorAttempt] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const feedback = useRef<HTMLParagraphElement>(null);
  const [resumePrompt, setResumePrompt] = useState(() => session.scene > 0 || session.collection.stage !== 'unavailable');
  const [showCase, setShowCase] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const resetPanel = useRef<HTMLDivElement>(null);
  const casePanel = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const ar = session.language === 'ar';
  const t = (arabic: string, english: string) => ar ? arabic : english;
  const number = (n: number) => new Intl.NumberFormat(ar ? 'ar-AE' : 'en-GB').format(n);
  const c = session.collection;
  const navigation = guidedNavigation(session);
  const position = session.scene === 3 ? 4 : guidedMainScenes.findIndex(scene => scene === session.scene) + 1;
  const titles = [
    t('العنوان مؤكد. والعمل غير جاهز للاستلام.', 'The address is confirmed. The artwork is not ready.'),
    t('تعيين البديل لا يكفي حتى يقبل المهمة.', 'The backup must accept the handoff.'),
    c.stage === 'ready' ? t('اكتملت المتطلبات. العمل جاهز للاستلام.', 'The requirements are complete. Collection is ready.') : t('الموعد الصحيح لا يكفي إذا لم يكتمل التغليف.', 'A valid date is not enough without packing.'),
    t('المطبعة تحتاج النسخة المعتمدة الحالية.', 'The printer needs the current approved proof.'),
    t('نعرف الآن ما كان يعطّل الاستلام، ومن عالجه.', 'We can now see what held up collection—and who resolved it.'),
    t('نبدأ بمسار الاستلام، ونقيس إن كان يخفف العمل.', 'Start with collection and measure whether it reduces work.'),
  ];
  useEffect(() => {
    document.title = ar ? 'سدو — عرض موجّه' : 'SADU — Guided presentation';
  }, [ar]);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    heading.current?.focus({ preventScroll: true });
    heading.current?.closest('.sadu-guided')?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, [session.scene, session.paused, c.stage, session.print.supplierAck?.version]);
  useEffect(() => {
    if (error) { feedback.current?.focus({ preventScroll: true }); feedback.current?.scrollIntoView({ block: 'center', behavior: 'auto' }); }
  }, [error, errorAttempt]);
  useEffect(() => {
    if (showCase) { casePanel.current?.focus({ preventScroll: true }); casePanel.current?.scrollIntoView({ block: 'start', behavior: 'auto' }); }
  }, [showCase]);
  useEffect(() => {
    if (confirmReset) { resetPanel.current?.focus({ preventScroll: true }); resetPanel.current?.scrollIntoView({ block: 'center', behavior: 'auto' }); }
  }, [confirmReset]);
  function restart() {
    setConfirmReset(true);
  }
  function confirmRestart() {
    setSession({ ...createGuidedSession(), language: session.language });
    setError(''); setResumePrompt(false); setShowCase(false); setConfirmReset(false);
  }
  function downloadBrief() {
    const url = URL.createObjectURL(new Blob([pilotBriefHtml(c, ar)], { type: 'text/html;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `SADU-pilot-brief-${session.language}.html`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function move(scene: number) {
    setError('');
    setSession(s => navigateGuidedSession(s, scene));
  }
  function act(command: GuidedCommand, date?: string) {
    if (session.paused) return;
    try {
      setSession(s => ({ ...s, collection: guidedCollection(s.collection, command, new Date().toISOString(), date) }));
      setError('');
    } catch { setError(command === 'DATE' ? 'date' : 'action'); setErrorAttempt(n => n + 1); }
  }
  function acknowledge(version: number) {
    if (session.paused) return;
    const next = acknowledgeGuidedProof(session.print, version, new Date().toISOString());
    if (next === session.print) { setError('proof'); setErrorAttempt(n => n + 1); return; }
    setSession(s => ({ ...s, print: next }));
    setError('');
  }
  const errorText = error === 'date'
    ? t('المعرض مغلق من ١٠ إلى ١٥ أكتوبر. اختاري ١٦ أكتوبر لمتابعة المثال.', 'The gallery is closed from 10–15 October. Choose 16 October to continue.')
    : error === 'proof'
    ? t('هذه النسخة قديمة. يلزم تأكيد استلام النسخة ٢؛ لم تتغير حالة الطلب.', 'That proof is superseded. Acknowledge version 2; the job has not advanced.')
    : t('لم تُحفظ الخطوة. راجعي الحالة الحالية ثم حاولي مرة أخرى.', 'The step was not saved. Review the current state and retry.');
  const readyForNext = session.scene === 1 && !['unavailable', 'acceptance'].includes(c.stage);
  return <div className="sadu-guided" lang={session.language} dir={ar ? 'rtl' : 'ltr'}>
    <a className="guide-skip" href="#guided-scene">{t('انتقلي إلى العرض', 'Skip to the presentation')}</a>
    <header className="guide-header">
      <a className="guide-brand" href="#guided-scene" aria-label={t('سدو — العرض الحالي', 'SADU current presentation')}><span lang="ar">سدو</span><strong>SADU</strong></a>
      <span className="guide-duration">{t('حالة استلام واحدة · جرّبيها ثم نناقشها', 'One collection case · Try it, then discuss it')}</span>
      <button onClick={() => setSession(s => ({ ...s, language: ar ? 'en' : 'ar' }))} lang={ar ? 'en' : 'ar'}>{ar ? 'English' : 'العربية'}</button>
      <button onClick={() => setSession(s => ({ ...s, paused: !s.paused }))}>{session.paused ? t('متابعة العرض', 'Resume') : t('توقّف مؤقت', 'Pause')}</button>
    </header>
    <main id="presentation">
      {confirmReset && <div className="guide-resume" ref={resetPanel} role="region" aria-label={t('تأكيد إعادة العرض', 'Confirm restart')} tabIndex={-1}><p>{t('بدء عرض جديد؟ ستُستبدل خطوات هذه الحالة التجريبية فقط. لا يتغير أي سجل آخر.', 'Start a new presentation? Only this synthetic case’s steps will be replaced. No other record changes.')}</p><div className="guide-choices"><button className="guide-primary" onClick={confirmRestart}>{t('تأكيد بدء عرض جديد', 'Confirm new presentation')}</button><button onClick={() => { setConfirmReset(false); heading.current?.focus(); }}>{t('إلغاء والاحتفاظ بالخطوات', 'Cancel and keep progress')}</button></div></div>}
      {resumePrompt && <div className="guide-resume" role="region" aria-label={t('عرض محفوظ', 'Saved presentation')}><p>{t('لديكِ عرض محفوظ في هذا التبويب. تابعي من حيث توقفتِ، أو ابدئي عرضاً جديداً للحضور.', 'A presentation is saved in this tab. Continue where you left off, or start again for a new audience.')}</p><div className="guide-choices"><button className="guide-primary" onClick={() => { setResumePrompt(false); heading.current?.focus(); }}>{t('متابعة العرض المحفوظ', 'Continue saved presentation')}</button><button onClick={restart}>{t('بدء عرض جديد', 'Start a new presentation')}</button></div></div>}
      <div className="guide-progress" aria-label={t('موضعك في العرض', 'Your place in the presentation')}>
        <p>{session.scene === 3 ? t('مثال إضافي اختياري · الطباعة', 'Optional example · Printing') : <>{t('المرحلة', 'Stage')} {number(position)} {t('من', 'of')} {number(guidedMainScenes.length)} · {scenes[session.scene][ar ? 0 : 1]}</>}</p>
        <progress value={position} max={guidedMainScenes.length} aria-label={t('تقدم العرض', 'Presentation progress')}/>
      </div>
      <div className="guide-case-bar"><p><bdi>{guidedCase.id}</bdi> · {guidedCase.work[ar ? 'ar' : 'en']} <span>· {t('عمل وشخصيات تجريبية', 'Fictional artwork and people')}</span></p><button aria-expanded={showCase} aria-controls="guided-case-details" onClick={() => setShowCase(value => !value)}>{showCase ? t('إغلاق تفاصيل الحالة', 'Close case details') : t('تفاصيل هذه الحالة', 'View this case')}</button></div>
      {showCase && <div id="guided-case-details" className="guide-case-details" ref={casePanel} tabIndex={-1}><GuidedCaseReceipt record={c} ar={ar}/>{c.packing && <GuidedPackingEvidence record={c} ar={ar}/>}<p>{t('العنوان المؤكد: ١٢ شارع المثال، باريس. التوفر: ١–٣١ أكتوبر ٢٠٢٦، باستثناء ١٠–١٥ أكتوبر. هذه نفس الحالة والنسخة المعروضتان في الخطوات أدناه.', 'Confirmed address: 12 Example Lane, Paris. Available 1–31 October 2026, except 10–15 October. This is the same case and revision used in the steps below.')}</p><details><summary>{t('سجل الخطوات التجريبية', 'Synthetic step history')}</summary><ol>{c.history.map((entry, i) => <li key={i}><bdi>{entry.actor} · {entry.action} · {entry.at}</bdi></li>)}</ol></details><button onClick={() => { setShowCase(false); heading.current?.focus(); }}>{t('العودة إلى العرض', 'Return to the presentation')}</button></div>}
      <section id="guided-scene" className="guide-scene" aria-labelledby="guide-heading">
        <p className="guide-label">{t('مثال تجريبي — لا إرسال أو حجز أو دفع فعلي', 'Synthetic example — no real sending, booking or payment')}</p>
        <h1 id="guide-heading" ref={heading} tabIndex={-1}>{session.paused ? t('توقّفنا هنا. يمكنك المتابعة في أي وقت.', 'Paused here. Resume whenever you are ready.') : titles[session.scene]}</h1>
        {session.paused ? <p className="guide-intro">{t('مكانك محفوظ في هذه الصفحة. لا يوجد عدّ تنازلي ولا انتقال تلقائي.', 'Your place stays here. There is no countdown or automatic advancement.')}</p> : <>
          {session.scene === 0 && <>
            <p className="guide-intro">{t('مسؤول الاستلام في إجازة، والعمل بلا تغليف، والموعد لم يُحسم. من يتولى المهمة، وما الذي يجب تأكيده قبل طلب النقل؟', 'The officer is on leave. The work has no packing. The pickup date is still unresolved. Who takes over, and what must be confirmed before transport is requested?')}</p>
            <div className="guide-facts"><article><span>{t('مؤكد', 'Confirmed')}</span><h2>{t('عنوان الاستلام', 'Collection address')}</h2><p>{t('موقع تجريبي في باريس', 'Synthetic location in Paris')}</p></article><article><span>{t('يحتاج إجراءً', 'Action needed')}</span><h2>{t('المسؤول والتغليف', 'Ownership and packing')}</h2><p>{t('سنحلّهما خطوة بخطوة.', 'We will resolve them step by step.')}</p></article></div>
            <p className="guide-note">{t('جرّبي حلّ الحالة بنفسك: بديل يقبل المهمة، ثم موعد صالح، ثم دليل اكتمال التغليف. كل البيانات معدّة؛ لا حاجة للكتابة أو المعرفة التقنية.', 'Try resolving this case: an accepted backup, a valid date, then packing completion evidence. The data is prepared; no typing or technical knowledge is needed.')}</p>
          </>}
          {session.scene === 1 && <>
            <p className="guide-role" role="status">{c.stage === 'unavailable' ? t('أنتِ الآن على شاشة المنسقة.', 'You are viewing the Coordinator’s screen.') : c.stage === 'acceptance' ? t('تم تعيين البديل. نعرض الآن شاشة مسؤول الاستلام البديل ليقبل المهمة.', 'The backup is assigned. Now viewing the backup officer’s screen so they can accept.') : t('قبل المسؤول البديل المهمة. أصبحت المسؤولية واضحة.', 'The backup accepted. Responsibility is now clear.')}</p>
            <div className="guide-task">
              <h2>{c.stage === 'unavailable' ? t('المطلوب: تعيين مسؤول بديل', 'Next: assign a backup') : c.stage === 'acceptance' ? t('المطلوب: قبول المهمة', 'Next: accept responsibility') : t('تم قبول المهمة', 'Handoff accepted')}</h2>
              <p>{t('السبب المسجّل في المثال: المسؤول الأساسي في إجازة.', 'Prepared reason: the primary officer is on leave.')}<br/>{guidedCase.backup[ar ? 'ar' : 'en']}</p>
              {c.stage === 'unavailable' && <button className="guide-primary" onClick={() => act('ASSIGN')}>{t('تعيين مسؤول الاستلام البديل', 'Assign the backup officer')}</button>}
              {c.stage === 'acceptance' && <button className="guide-primary" onClick={() => act('ACCEPT')}>{t('قبول المهمة بصفتي المسؤول البديل', 'Accept as the backup officer')}</button>}
              {readyForNext && <p className="guide-success">{t('الخطوة التالية: اختيار موعد صالح وفحص التغليف.', 'Next: choose a valid date and check packing.')}</p>}
            </div>
            <p className="guide-note">{t('الأدوار هنا محاكاة. في التشغيل الفعلي، لكل شخص حساب وصلاحيات محددة.', 'Roles here are simulated. Production requires individual accounts and enforced permissions.')}</p>
          </>}
          {session.scene === 2 && <>
            <p className="guide-role">{t('نعرض شاشة مسؤول الاستلام البديل.', 'Viewing the backup collection officer’s screen.')}</p>
            {c.stage === 'pickup' && <div className="guide-task"><h2>{t('اختاري موعد الاستلام.', 'Choose a collection date.')}</h2><p>{t('الموقع متاح خلال أكتوبر ٢٠٢٦، ويغلق من ١٠ إلى ١٥ أكتوبر.', 'The location is available in October 2026, except 10–15 October.')}</p><div className="guide-choices"><button onClick={() => act('DATE', '2026-10-12')}>{t('١٢ أكتوبر ٢٠٢٦ — يوم إغلاق', '12 October 2026 — closed')}</button><button className="guide-primary" onClick={() => act('DATE', '2026-10-16')}>{t('١٦ أكتوبر ٢٠٢٦ — موعد متاح', '16 October 2026 — available')}</button></div></div>}
            {c.stage === 'packing' && <div className="guide-task"><h2>{t('الموعد صالح، لكن التغليف لم يُجهّز.', 'The date is valid, but packing is unresolved.')}</h2><p>{t('لتقصير العرض، سنحمّل خطة تجريبية أُعدّت مسبقاً: صندوق مخصص، مراجعة فنية، وموافقة المالية على ١٬٢٠٠ درهم. لا تُعدّ هذه موافقات حقيقية.', 'To keep the demo short, load a prepared fictional plan: a custom crate, technical review and Finance approval of AED 1,200. These are not real approvals.')}</p><button className="guide-primary" onClick={() => act('PREPARE_PACKING')}>{t('عرض خطة التغليف وموافقاتها التجريبية', 'Load the prepared packing example')}</button></div>}
            {c.stage === 'pack-evidence' && <div className="guide-task"><h2>{t('بقي تأكيد اكتمال التغليف.', 'Packing completion still needs confirmation.')}</h2><p>{t('المالية وافقت على التكلفة، والمختص راجع الخطة. مسؤول الاستلام يتحقق الآن من سجل الإكمال التجريبي.', 'Finance approved the cost and the specialist reviewed the plan. The collection officer now checks the synthetic completion record.')}</p><GuidedPackingEvidence record={c} ar={ar}/><button className="guide-primary" onClick={() => act('COMPLETE_PACKING')}>{t('تسجيل التحقق من الإكمال التجريبي', 'Record the synthetic completion check')}</button></div>}
            {c.stage === 'ready' && <GuidedCaseReceipt record={c} ar={ar}/>}
            {!['pickup','packing','pack-evidence','ready'].includes(c.stage) && <p>{t('ارجعي إلى المرحلة السابقة لإكمال تسليم المسؤولية.', 'Return to the previous stage to complete the handoff.')}</p>}
          </>}
          {session.scene === 3 && <>
            <p className="guide-intro">{t('مثال مستقل للطباعة: تغيّر تاريخ افتتاح المعرض. النسخة ٢ هي المعتمدة حالياً.', 'Separate print example: the opening date changed. Version 2 is the currently approved proof.')}</p>
            <div className="guide-proofs"><article><span>{t('النسخة ١ — محفوظة في السجل', 'Version 1 — retained in history')}</span><h2>{t('إيقاع الحرف', 'Rhythm of the Letter')}</h2><p>{t('الافتتاح: ١٢ أكتوبر ٢٠٢٦', 'Opening: 12 October 2026')}</p><strong>{t('قديمة — لا تستخدم للطباعة', 'Superseded — do not print')}</strong></article><article><span>{t('النسخة ٢ — المعتمدة الحالية', 'Version 2 — current approval')}</span><h2>{t('إيقاع الحرف', 'Rhythm of the Letter')}</h2><p>{t('الافتتاح: ١٦ أكتوبر ٢٠٢٦', 'Opening: 16 October 2026')}</p><strong>{session.print.supplierAck ? t('تأكد الاستلام في المثال', 'Acknowledged in this example') : t('بانتظار تأكيد المطبعة', 'Supplier acknowledgment required')}</strong></article></div>
            <p className="guide-note">{t('نموذج نصي تجريبي. أُعدّت المراجعة وموافقة رئيس الدائرة والإرسال التجريبي مسبقاً؛ لم تُرسل مطبوعات حقيقية.', 'Synthetic text proof. Review, Chairman approval and simulated dispatch were prepared in advance; nothing was actually sent.')}</p>
            <p className="guide-role">{t('نعرض شاشة مدير النشر: أي نسخة أكدت المطبعة استلامها؟', 'Viewing the publishing manager’s screen: which version did the supplier acknowledge?')}</p>
            {!session.print.supplierAck ? <div className="guide-choices"><button onClick={() => acknowledge(1)}>{t('تجربة تأكيد النسخة القديمة', 'Try the old version')}</button><button className="guide-primary" onClick={() => acknowledge(2)}>{t('تسجيل تأكيد النسخة ٢ — تجريبي', 'Record version 2 acknowledgment — demo')}</button></div> : <p className="guide-success" role="status">{t('تأكد استلام النسخة ٢ في المثال. بدء الطباعة وإكمالها يحتاجان تسجيلاً منفصلاً.', 'Version 2 acknowledgment recorded in the example. Printing and completion require separate records.')}</p>}
          </>}
          {session.scene === 4 && <>
            <GuidedCaseReceipt record={c} ar={ar}/>
            <p className="guide-note">{t('قبل: عنوان مؤكد، لكن المسؤول غائب، والموعد غير محسوم، والتغليف ناقص. النتيجة أعلاه تسجل من عالج كل نقطة.', 'Before: a confirmed address, but an unavailable officer, an unresolved date and missing packing. The receipt above records how each was resolved.')}</p>
            <p className="guide-intro">{t('قيمة سدو هنا: إظهار ما لم يُحسم ومن يتولاه، قبل أن يعطّل التنفيذ.', 'SADU makes unresolved handoffs visible before they become production problems.')}</p>
            <p className="guide-note">{t('هل سيقلّ الجهد والمتابعات فعلاً؟ هذا ما سنقيسه في تجربة محدودة. لم نثبت وفراً زمنياً أو مالياً بعد.', 'Will this reduce effort and follow-ups? That is what a bounded trial must measure. Time and cost savings have not yet been established.')}</p>
            <details><summary>{t('مثال إضافي اختياري: تسليم النسخة الصحيحة للمطبعة', 'Optional: apply the same idea to print release')}</summary><p>{t('مثال مستقل لا يغيّر سجل الاستلام.', 'A separate example that does not change the collection record.')}</p><button onClick={() => move(3)}>{t('فتح مثال الطباعة', 'Open the print example')}</button></details>
            <details id="technical"><summary>{t('التفاصيل التقنية — لفريق تقنية المعلومات', 'Technical details — for IT')}</summary><p>{t('الواجهة مبنية بـ React وTypeScript. العرض يحفظ الخطوات التجريبية في تبويب المتصفح عند توفر التخزين، ولا يرسلها إلى الخادم المحلي.', 'React and TypeScript power the interface. This presentation saves synthetic steps in the browser tab when storage is available; it does not send them to the local server.')}</p><p>{t('الخادم المحلي المنفصل يعمل بـ Node.js، ويتحقق من الأدوار التجريبية وإصدارات السجلات، ويستخدم قواعد التغليف نفسها. التخزين ملفات محلية في عملية واحدة، وليس قاعدة بيانات مؤسسية متعددة المستخدمين.', 'The separate Node.js local service checks simulated roles and record versions and shares the packing rules. Persistence uses local files in one process, not an institutional multi-user database.')}</p><p>{t('اختبارات الصلاحيات الفعلية، النسخ الاحتياطي والاستعادة، الربط والمراقبة والدعم جزء من خطة الإنتاج. البصمة الرقمية تكشف التغيير ولا تثبت الهوية أو التوقيع القانوني.', 'Production planning must cover real authorization, backup and restore tests, integrations, monitoring and support. A hash detects changes; it does not establish identity or a legal signature.')}</p></details>
          </>}
          {session.scene === 5 && <>
            <p className="guide-intro">{t('نطلب الاتفاق على تحديد تجربة لمسار الاستلام، بمسؤول تشغيلي وممثل لتقنية المعلومات.', 'We ask to scope a collection-workflow trial with an operational owner and an IT counterpart.')}</p>
            <ol className="guide-ask"><li>{t('نحدد المسؤول عن العنوان والموعد والتغليف، وكيف يقبل البديل المهمة.', 'Confirm who owns the address, date and packing, and how a backup accepts the handoff.')}</li><li>{t('نتفق على المدة والتكلفة والبيانات المسموح بها ومعايير النجاح قبل التكليف.', 'Agree duration, cost, permitted data and acceptance criteria before commissioning.')}</li><li>{t('نقارن وقت إكمال المهمة وعدد المتابعات بالطريقة الحالية، ثم نقرر: نتوسع، نعدّل، أو نتوقف.', 'Compare task completion time and follow-ups with the current process, then proceed, revise or stop.')}</li></ol>
            <div className="guide-task"><h2>{t('القرار اليوم: من يمثل التشغيل وتقنية المعلومات في جلسة تحديد النطاق؟', 'Today’s decision: who will represent operations and IT in a scoping meeting?')}</h2><p>{t('سمّوا الشخصين واتفقوا على موعد الجلسة. لا نطلب اعتماد تشغيل أو ميزانية اليوم.', 'Name the two counterparts and agree a meeting date. No rollout or budget approval is requested today.')}</p><button className="guide-primary" onClick={downloadBrief}>{t('تنزيل ملخص التجربة للمناقشة', 'Download the pilot discussion brief')}</button><p className="guide-note">{t('صفحة قابلة للطباعة: النطاق، ما سنقيسه، شروط التوقف، والقرارات التي تنتظر الاتفاق. التنزيل لا يسجل موافقة ولا يرسل شيئاً.', 'A printable page: scope, measures, stop conditions and decisions still to agree. Downloading records no approval and sends nothing.')}</p></div>
          </>}
          {error && <p className="guide-error" role="alert" ref={feedback} tabIndex={-1}>{errorText}</p>}
          {warning && <p className="guide-error" role="alert">{t('تعذّر حفظ الخطوات أو استعادتها في هذا التبويب. أبقي الصفحة مفتوحة؛ قد تحتاجين إلى بدء المثال مجدداً بعد التحديث.', 'Steps could not be saved or restored in this tab. Keep the page open; refreshing may require restarting the example.')}</p>}
        </>}
      </section>
      {(import.meta.env.DEV || import.meta.env.VITE_LOCAL_SOURCE_REGISTER === 'true') && <LocalHandoffRegister phase={session.scene === 3 ? 'print' : handoffPhase(c.stage)} isAr={ar}/>}
      <nav className="guide-controls" aria-label={t('التنقل في العرض', 'Presentation controls')}>
        <button disabled={navigation.previous === null} onClick={() => navigation.previous !== null && move(navigation.previous)}>{session.scene === 3 ? t('العودة إلى النتيجة', 'Back to the result') : t('السابق', 'Previous')}</button>
        <span>{session.paused ? t('العرض متوقف مؤقتاً', 'Presentation paused') : session.scene === 5 ? t('انتهى العرض — وقت الأسئلة', 'Presentation complete — questions') : navigation.next === null ? t('أكملي الإجراء الظاهر للمتابعة', 'Complete the action above to continue') : t('يمكنك المتابعة عندما تكونين مستعدة', 'Continue when you are ready')}</span>
        {session.scene < 5 && session.scene !== 3 && <button className="guide-primary" disabled={navigation.next === null} onClick={() => navigation.next !== null && move(navigation.next)}>{session.scene === 0 ? t('جرّبي حلّ حالة الاستلام', 'Try resolving this collection') : t('التالي: ', 'Next: ') + scenes[session.scene === 2 ? 4 : session.scene + 1][ar ? 0 : 1]}</button>}
      </nav>
      <footer className="guide-footer">
        <button onClick={restart}>{t('إعادة العرض من البداية', 'Restart this presentation')}</button>
        <details><summary>{t('أمثلة مستقلة وشرح موسع — اختياري', 'Separate examples and expanded explanation — optional')}</summary><p>{t('للاطلاع بعد العرض فقط: هذه أمثلة إنجليزية مستقلة لها سجلاتها الخاصة. خطوات الحالة الحالية محفوظة، ولا تُنقل إلى المثال الآخر.', 'For later exploration: these are separate English examples with their own records. This presentation remains saved; its steps are not transferred to the other example.')}</p><div className="guide-links"><button onClick={() => onExplore('#experience')}>{t('فتح مثال استلام مستقل — بالإنجليزية', 'Open separate collection example — English')}</button><button onClick={() => onExplore('#technical')}>{t('فتح الشرح التقني الموسع — بالإنجليزية', 'Open expanded technical explanation — English')}</button></div></details>
        <p>{t('سدو · نموذج للمناقشة، وليس اعتماداً حكومياً. الربط الخارجي متوقف.', 'SADU · Discussion prototype, not government endorsement. External integrations paused.')}</p>
      </footer>
    </main>
  </div>;
}
