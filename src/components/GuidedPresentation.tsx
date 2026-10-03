import { useEffect, useRef, useState } from 'react';
import '@fontsource/amiri/400.css';
import { useDemoCheckpoint } from '../lib/useDemoCheckpoint';
import { acknowledgeGuidedProof, createGuidedSession, guidedCollection, guidedMainScenes, guidedNavigation, navigateGuidedSession, validGuidedSession, type GuidedCommand } from '../data/guidedPresentation';
import './GuidedPresentation.css';
import LocalHandoffRegister from './LocalHandoffRegister';
import { handoffPhase } from '../data/handoffRegister';

const scenes = [
  ['المشكلة', 'The collection problem'],
  ['المسؤول البديل', 'The handoff'],
  ['جاهزية الاستلام', 'Collection readiness'],
  ['النسخة الصحيحة', 'The right proof'],
  ['ما أثبته المثال', 'What the example proves'],
  ['الخطوة التالية', 'The next step'],
] as const;

export default function GuidedPresentation() {
  const [session, setSession, warning] = useDemoCheckpoint('sadu:guided:ar:v1', createGuidedSession, validGuidedSession);
  const [error, setError] = useState<'date' | 'proof' | 'action' | ''>('');
  const heading = useRef<HTMLHeadingElement>(null);
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
    t('الموعد الصحيح لا يكفي إذا لم يكتمل التغليف.', 'A valid date is not enough without packing.'),
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
  function move(scene: number) {
    setError('');
    setSession(s => navigateGuidedSession(s, scene));
  }
  function act(command: GuidedCommand, date?: string) {
    if (session.paused) return;
    try {
      setSession(s => ({ ...s, collection: guidedCollection(s.collection, command, new Date().toISOString(), date) }));
      setError('');
    } catch { setError(command === 'DATE' ? 'date' : 'action'); }
  }
  function acknowledge(version: number) {
    if (session.paused) return;
    const next = acknowledgeGuidedProof(session.print, version, new Date().toISOString());
    if (next === session.print) { setError('proof'); return; }
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
      <a className="guide-brand" href="/overview" aria-label={t('سدو — الصفحة الرئيسية', 'SADU home')}><span lang="ar">سدو</span><strong>SADU</strong></a>
      <span className="guide-duration">{t('حالة استلام واحدة · جرّبيها ثم نناقشها', 'One collection case · Try it, then discuss it')}</span>
      <button onClick={() => setSession(s => ({ ...s, language: ar ? 'en' : 'ar' }))} lang={ar ? 'en' : 'ar'}>{ar ? 'English' : 'العربية'}</button>
      <button onClick={() => setSession(s => ({ ...s, paused: !s.paused }))}>{session.paused ? t('متابعة العرض', 'Resume') : t('توقّف مؤقت', 'Pause')}</button>
    </header>
    <main id="presentation">
      <div className="guide-progress" aria-label={t('موضعك في العرض', 'Your place in the presentation')}>
        <p>{session.scene === 3 ? t('مثال إضافي اختياري · الطباعة', 'Optional example · Printing') : <>{t('المرحلة', 'Stage')} {number(position)} {t('من', 'of')} {number(guidedMainScenes.length)} · {scenes[session.scene][ar ? 0 : 1]}</>}</p>
        <progress value={position} max={guidedMainScenes.length} aria-label={t('تقدم العرض', 'Presentation progress')}/>
      </div>
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
              <p>{t('السبب المسجّل في المثال: المسؤول الأساسي في إجازة.', 'Prepared reason: the primary officer is on leave.')}</p>
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
            {c.stage === 'pack-evidence' && <div className="guide-task"><h2>{t('بقي تأكيد اكتمال التغليف.', 'Packing completion still needs confirmation.')}</h2><p>{t('المالية وافقت على التكلفة، والمختص راجع الخطة. مسؤول الاستلام يتحقق الآن من سجل الإكمال التجريبي.', 'Finance approved the cost and the specialist reviewed the plan. The collection officer now checks the synthetic completion record.')}</p><details><summary>{t('ماذا يتضمن سجل الإكمال؟', 'What does the completion record contain?')}</summary><p>{t('سجل تجريبي معدّ للعرض: اكتمل الصندوق والدعامات وفق الخطة. لا توجد صورة حقيقية أو شهادة فحص ميداني في هذا المثال.', 'Prepared demo record: the crate and supports match the plan. This example contains no actual photograph or independent inspection certificate.')}</p></details><button className="guide-primary" onClick={() => act('COMPLETE_PACKING')}>{t('تسجيل التحقق من الإكمال التجريبي', 'Record the synthetic completion check')}</button></div>}
            {c.stage === 'ready' && <div className="guide-task"><h2>{t('جاهز للاستلام.', 'Ready for collection.')}</h2><p className="guide-success">{t('الموعد صالح، المسؤول قبل المهمة، وأُثبت إكمال التغليف في المثال.', 'The date is valid, the owner accepted, and packing completion is recorded in the example.')}</p><p>{t('لم يُحجز النقل ولم يحدث استلام فعلي. الجاهزية خطوة مستقلة.', 'Transport is not booked and physical collection has not occurred. Readiness is a separate step.')}</p></div>}
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
            <div className="guide-facts"><article><h2>{t('قبل', 'Before')}</h2><p>{t('عنوان مؤكد، لكن المسؤول غائب، والموعد غير محسوم، والتغليف ناقص.', 'A confirmed address, but an unavailable officer, an unresolved date and missing packing.')}</p></article><article><h2>{t('بعد إكمال المثال', 'After completing the example')}</h2><p>{t('بديل قبل المهمة، وموعد صالح، وسجل إكمال التغليف. جاهز للاستلام؛ النقل لم يُحجز.', 'An accepted backup, a valid date and a packing completion record. Ready for collection; transport is not booked.')}</p></article></div>
            <p className="guide-intro">{t('قيمة سدو هنا: إظهار ما لم يُحسم ومن يتولاه، قبل أن يعطّل التنفيذ.', 'SADU makes unresolved handoffs visible before they become production problems.')}</p>
            <p className="guide-note">{t('هل سيقلّ الجهد والمتابعات فعلاً؟ هذا ما سنقيسه في تجربة محدودة. لم نثبت وفراً زمنياً أو مالياً بعد.', 'Will this reduce effort and follow-ups? That is what a bounded trial must measure. Time and cost savings have not yet been established.')}</p>
            <details><summary>{t('مثال إضافي اختياري: تسليم النسخة الصحيحة للمطبعة', 'Optional: apply the same idea to print release')}</summary><p>{t('مثال مستقل لا يغيّر سجل الاستلام.', 'A separate example that does not change the collection record.')}</p><button onClick={() => move(3)}>{t('فتح مثال الطباعة', 'Open the print example')}</button></details>
            <details id="technical"><summary>{t('التفاصيل التقنية — لفريق تقنية المعلومات', 'Technical details — for IT')}</summary><p>{t('الواجهة مبنية بـ React وTypeScript. العرض يحفظ الخطوات التجريبية في تبويب المتصفح عند توفر التخزين، ولا يرسلها إلى الخادم المحلي.', 'React and TypeScript power the interface. This presentation saves synthetic steps in the browser tab when storage is available; it does not send them to the local server.')}</p><p>{t('الخادم المحلي المنفصل يعمل بـ Node.js، ويتحقق من الأدوار التجريبية وإصدارات السجلات، ويستخدم قواعد التغليف نفسها. التخزين ملفات محلية في عملية واحدة، وليس قاعدة بيانات مؤسسية متعددة المستخدمين.', 'The separate Node.js local service checks simulated roles and record versions and shares the packing rules. Persistence uses local files in one process, not an institutional multi-user database.')}</p><p>{t('اختبارات الصلاحيات الفعلية، النسخ الاحتياطي والاستعادة، الربط والمراقبة والدعم جزء من خطة الإنتاج. البصمة الرقمية تكشف التغيير ولا تثبت الهوية أو التوقيع القانوني.', 'Production planning must cover real authorization, backup and restore tests, integrations, monitoring and support. A hash detects changes; it does not establish identity or a legal signature.')}</p></details>
          </>}
          {session.scene === 5 && <>
            <p className="guide-intro">{t('نطلب الاتفاق على تحديد تجربة لمسار الاستلام، بمسؤول تشغيلي وممثل لتقنية المعلومات.', 'We ask to scope a collection-workflow trial with an operational owner and an IT counterpart.')}</p>
            <ol className="guide-ask"><li>{t('نحدد المسؤول عن العنوان والموعد والتغليف، وكيف يقبل البديل المهمة.', 'Confirm who owns the address, date and packing, and how a backup accepts the handoff.')}</li><li>{t('نتفق على المدة والتكلفة والبيانات المسموح بها ومعايير النجاح قبل التكليف.', 'Agree duration, cost, permitted data and acceptance criteria before commissioning.')}</li><li>{t('نقارن وقت إكمال المهمة وعدد المتابعات بالطريقة الحالية، ثم نقرر: نتوسع، نعدّل، أو نتوقف.', 'Compare task completion time and follow-ups with the current process, then proceed, revise or stop.')}</li></ol>
            <div className="guide-task"><h2>{t('هل هذا يعالج مشكلة تواجه القسم؟', 'Does this address a problem your team faces?')}</h2><p>{t('هذا وقت الأسئلة. لا يُسجّل العرض موافقة أو التزاماً نيابة عنكِ.', 'This is time for questions. The presentation records no approval or commitment on your behalf.')}</p></div>
          </>}
          {error && <p className="guide-error" role="alert">{errorText}</p>}
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
        <details><summary>{t('الاستكشاف الكامل وإعادة العرض', 'Full exploration and replay')}</summary><p>{t('الشرح التقني بالعربية متاح في مرحلة «ما أثبته المثال». النسخة الموسعة أدناه باللغة الإنجليزية؛ لا تحتاجينها لإكمال العرض.', 'Arabic technical detail is in “What the example proves”. The expanded English experience below is optional.')}</p><div className="guide-links"><a href="/overview?view=explore#experience">{t('فتح حالة الاستلام بالتفصيل — بالإنجليزية', 'Open the full collection example — English')}</a><a href="/overview?view=explore#technical">{t('فتح الشرح التقني الموسع — بالإنجليزية', 'Open the expanded technical explanation — English')}</a><button onClick={() => { if (window.confirm(t('إعادة بدء هذا العرض التجريبي؟ ستُستبدل خطوات هذا العرض فقط.', 'Restart this guided example? Only this presentation’s saved steps will be replaced.'))) { setSession({ ...createGuidedSession(), language: session.language }); setError(''); } }}>{t('إعادة العرض من البداية', 'Restart this presentation')}</button></div></details>
        <p>{t('سدو · نموذج للمناقشة، وليس اعتماداً حكومياً. الربط الخارجي متوقف.', 'SADU · Discussion prototype, not government endorsement. External integrations paused.')}</p>
      </footer>
    </main>
  </div>;
}
