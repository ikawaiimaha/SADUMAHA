import { useRef, useState } from 'react';
import { FieldPath, useWatch } from 'react-hook-form';
import { Lock, FileCheck2 } from 'lucide-react';
import { useArtistIntake } from '../context/ArtistIntakeContext';
import { useI18n } from '../context/I18nContext';
import { ARTIST_ID, BUDGET_CATEGORIES, budgetTotal, IntakeAsset, IntakeDraft, IntakeIssue, IntakeSubmission, findIntakeProgramme, ProgrammeId, sampleProposal, validateIntake, validWebUrl } from '../data/artistIntake';
import { IntakeFiles } from './IntakeFiles';
import { IntakeFieldIssuesProvider, useIntakeFieldIssue } from './IntakeFieldIssues';
import './ArtistIntake.css';

const budgets = { materials: ['Materials', 'المواد'], equipment: ['Equipment / space rental', 'تأجير التجهيزات / المساحة'], shipping: ['Transport', 'النقل'], fees: ['Artist / workshop fees', 'أتعاب الفنان / الورشة'], other: ['Other costs', 'تكاليف أخرى'] } as const;
export function Field({ name, en, ar, dir, multiline = false, maxLength = 200, type = 'text' }: { name: FieldPath<IntakeDraft>; en: string; ar: string; dir?: 'ltr' | 'rtl'; multiline?: boolean; maxLength?: number; type?: string }) {
  const { form } = useArtistIntake(); const { isAr, formatNumber } = useI18n();
  const fieldLang = /Ar$/.test(name) ? 'ar' : /En$/.test(name) ? 'en' : undefined;
  const issue = useIntakeFieldIssue(name);
  const helpId = `${name}-help`; const errorId = `${name}-error`;
  const describedBy = [multiline ? helpId : '', issue ? errorId : ''].filter(Boolean).join(' ') || undefined;
  const accessibility = { 'aria-invalid': issue ? true : undefined, 'aria-describedby': describedBy } as const;
  return <div className="intake-field"><label htmlFor={name}>{isAr ? ar : en}</label>
    {multiline ? <textarea id={name} dir={dir} lang={fieldLang} rows={5} maxLength={maxLength} {...accessibility} {...form.register(name)}/> : <input id={name} dir={dir} lang={fieldLang} type={type} maxLength={maxLength} autoComplete="off" {...accessibility} {...form.register(name)}/>}
    <small id={helpId}>{multiline ? (isAr ? `الحد الأقصى للأحرف: ${formatNumber(maxLength)}` : `Up to ${maxLength} characters`) : ''}</small>
    {issue && <p id={errorId} className="intake-field-error">{isAr ? issue.ar : issue.en}</p>}
  </div>;
}
export function RepresentationFields() {
  const { form } = useArtistIntake(); const { isAr } = useI18n(); const representation = useWatch({ control: form.control, name: 'profile.representation' });
  const t = (en: string, ar: string) => isAr ? ar : en;
  return <>
    <fieldset className="intake-radio"><legend>{t('How are you represented?', 'كيف تتم إدارة تمثيلك؟')}</legend>{[['independent', 'Independent artist', 'فنان مستقل'], ['gallery', 'Gallery represented', 'تمثيل عبر صالة عرض'], ['agency', 'Agency managed', 'إدارة عبر وكالة']].map(([value, en, ar]) => <label key={value}><input type="radio" value={value} {...form.register('profile.representation')}/>{t(en, ar)}</label>)}</fieldset>
    {representation !== 'independent' && <Field name="profile.organisation" en="Gallery / agency name" ar="اسم الصالة / الوكالة"/>}
    <div className="intake-pair"><Field name="profile.contactName" en={representation === 'independent' ? 'Studio assistant name (optional)' : 'Representative name'} ar={representation === 'independent' ? 'اسم مساعد الاستوديو (اختياري)' : 'اسم الممثل'}/><Field name="profile.contactEmail" en={representation === 'independent' ? 'Studio assistant email (optional)' : 'Representative email'} ar={representation === 'independent' ? 'بريد مساعد الاستوديو (اختياري)' : 'بريد الممثل'} dir="ltr" type="email"/></div>
    <p className="intake-note">{t('Representation records a contact relationship. It does not grant signing, financial or condition-acceptance authority.', 'يسجل التمثيل علاقة تواصل، ولا يمنح صلاحية التوقيع أو التصرف المالي أو قبول حالة العمل.')}</p>
  </>;
}
function BudgetTotal({ programmeId }: { programmeId: ProgrammeId }) {
  const { form } = useArtistIntake(); const { isAr, formatNumber } = useI18n(); const proposal = useWatch({ control: form.control, name: `proposals.${programmeId}` });
  return <p className="intake-total">{isAr ? 'الإجمالي المطلوب' : 'Requested total'} <strong><bdi>{formatNumber(budgetTotal(proposal))} AED</bdi></strong></p>;
}
export function IntakeDossier({ draft, programmeId, assets }: { draft: IntakeDraft; programmeId: ProgrammeId; assets: IntakeAsset[] }) {
  const { isAr, formatNumber } = useI18n(); const t = (en: string, ar: string) => isAr ? ar : en; const p = draft.profile; const q = draft.proposals[programmeId]; const programme = findIntakeProgramme(draft, programmeId)!;
  const images = assets.filter(a => a.slot === programmeId && a.type.startsWith('image/'));
  return <div className="intake-dossier">
    <div><p className="lr-eyebrow">{t('PROPOSAL DOSSIER · REPORTED INFORMATION', 'ملف المقترح · معلومات مقدمة')}</p><bdi>{ARTIST_ID} · {programmeId}</bdi><h3>{isAr ? programme.ar : programme.en}</h3>
      <div className="intake-pair"><p lang="en" dir="ltr">{p.nameEn || '—'}</p><p lang="ar" dir="rtl">{p.nameAr || '—'}</p></div>
      <div className="intake-pair"><h3 lang="en" dir="ltr">{q.titleEn || '—'}</h3><h3 lang="ar" dir="rtl">{q.titleAr || '—'}</h3></div>
      <p lang="en" dir="ltr" className="intake-prewrap">{q.conceptEn || '—'}</p><p lang="ar" dir="rtl" className="intake-prewrap">{q.conceptAr || '—'}</p>
      {(p.translationHelp || q.translationHelp) && <p className="intake-note">{t('Translation support requested. Public wording is not yet cleared.', 'طُلبت مساعدة الترجمة. لم تُعتمد الصياغة للنشر بعد.')}</p>}
      <h4>{t('Technical needs', 'الاحتياجات الفنية')}</h4><p className="intake-prewrap">{q.technical || '—'}</p>
      <dl className="intake-budget-summary">{BUDGET_CATEGORIES.map(key => <div key={key}><dt>{budgets[key][isAr ? 1 : 0]}</dt><dd><bdi>{formatNumber(Number(q.budget[key]) || 0)} AED</bdi></dd></div>)}</dl><p className="intake-total">{t('Total requested', 'الإجمالي المطلوب')} <strong><bdi>{formatNumber(budgetTotal(q))} AED</bdi></strong></p>
    </div>
    <aside>{images[0] ? <figure><img src={images[0].url} alt={t('Artist-provided concept preview', 'معاينة الفكرة المقدمة من الفنان')}/><figcaption><bdi>{images[0].name}</bdi> · {t('Local preview', 'معاينة محلية')}</figcaption></figure> : <div className="intake-visual-empty"><strong>{t('Your concept, in your medium', 'فكرتك بالوسيط الذي تختاره')}</strong><p>{t('A written concept is welcome. Add an image, a document or a portfolio link when useful.', 'نرحب بالفكرة المكتوبة. أضف صورة أو مستنداً أو رابط أعمال عند الحاجة.')}</p></div>}
      {q.portfolioUrl && validWebUrl(q.portfolioUrl) && <a href={q.portfolioUrl} target="_blank" rel="noreferrer">{t('Open supplied portfolio link', 'فتح رابط الأعمال المقدم')} ↗</a>}
      <ul className="intake-asset-list">{assets.map(a => <li key={a.id}><a href={a.url} target="_blank" rel="noreferrer"><bdi>{a.name}</bdi></a><small>{t('Session file · not uploaded', 'ملف الجلسة · غير مرفوع')}</small></li>)}</ul>
      <p className="lr-small">{t('Original media and wording remain attributable to the submitter. A preview does not establish rights clearance or participation approval.', 'تبقى الوسائط والصياغة الأصلية منسوبة إلى مقدمها. لا تثبت المعاينة تسوية الحقوق أو قبول المشاركة.')}</p>
    </aside>
  </div>;
}
function CurrentDossier({ programmeId }: { programmeId: ProgrammeId }) {
  const { form, assets } = useArtistIntake(); useWatch({ control: form.control });
  return <IntakeDossier draft={form.getValues()} programmeId={programmeId} assets={assets.filter(a => a.slot === 'cv' || a.slot === 'portfolio' || a.slot === programmeId)}/>;
}
export function ArtistIntake({ onCoordinator }: { onCoordinator: () => void }) {
  const { form, programmeId, setProgrammeId, submissions, submit, availableProgrammes, canSubmit, workflow } = useArtistIntake(); const { isAr, formatNumber } = useI18n(); const t = (en: string, ar: string) => isAr ? ar : en;
  const [step, setStep] = useState(0); const [issues, setIssues] = useState<IntakeIssue[]>([]); const [confirmed, setConfirmed] = useState(false); const heading = useRef<HTMLHeadingElement>(null);
  const [bank, setBank] = useState({ bankName: '', accountHolder: '', iban: '', swift: '' });
  const [logistics, setLogistics] = useState({ passportFile: '', visaFile: '' });
  const programme = findIntakeProgramme(form.getValues(), programmeId)!; const latest = submissions.filter(s => s.programmeId === programmeId).at(-1); const locked = Boolean(latest && latest.status !== 'revision') || !canSubmit(programmeId);
  const activated = workflow.deliveries.find(d => d.proposalId === latest?.id);
  const stages = [t('Profile', 'الملف'), t('Representation', 'التمثيل'), t('Programme proposal', 'مقترح البرنامج'), t('Financial', 'المالية'), t('Logistics & Protocol', 'اللوجستيات والبروتوكول'), t('Review and submit', 'المراجعة والتقديم')];
  const advance = (next: number) => { setStep(next); setIssues([]); setConfirmed(false); window.setTimeout(() => heading.current?.focus(), 0); };
  const send = () => { const result = validateIntake(form.getValues(), programmeId); setIssues(result); if (result.length || !confirmed) return; submit(); };
  return <div className="artist-intake">
    <div className="intake-intro"><div><p className="lr-eyebrow">{t('ONE PROFILE · MORE THAN ONE PROGRAMME', 'ملف واحد · أكثر من برنامج')}</p><h2>{t('Bring your next idea into view', 'امنح فكرتك القادمة مساحة للظهور')}</h2><p>{t('Build your sample profile once, then shape a proposal for each brief. You can move between steps while your draft is incomplete.', 'أنشئ ملفك التجريبي مرة واحدة، ثم أعد مقترحاً لكل برنامج. يمكنك التنقل بين الخطوات قبل اكتمال المسودة.')}</p></div><bdi>{ARTIST_ID}</bdi></div>
    <div className="intake-programme"><label>{t('Choose a fictional programme', 'اختر برنامجاً افتراضياً')}<select value={programmeId} onChange={e => { setProgrammeId(e.target.value as ProgrammeId); advance(2); }}>{availableProgrammes.map(p => <option key={p.id} value={p.id}>{isAr ? p.ar : p.en}</option>)}</select></label><span>{t('Same profile; separate proposal and budget for each programme.', 'الملف نفسه؛ مقترح وميزانية مستقلان لكل برنامج.')}</span></div>
    {!canSubmit(programmeId) && <p role="status">{t('This programme requires your current profile to match a reviewed roster participant. Register or update the profile, then complete its simulated coordinator review before submitting.', 'يتطلب هذا البرنامج تطابق ملفك الحالي مع مشارك خضع لمراجعة السجل. سجّل الملف أو حدّثه ثم أكمل مراجعة المنسق التجريبية قبل التقديم.')}</p>}
    {latest && <section className="intake-receipt" aria-live="polite"><strong>{latest.status === 'received' ? t('Sample proposal received; coordinator check is next.', 'استُلم المقترح التجريبي؛ الخطوة التالية مراجعة المنسق.') : latest.status === 'revision' ? t('Revision requested. Edit and submit a new version.', 'طُلب تعديل. حرّر المقترح وأرسل إصداراً جديداً.') : t('Completeness checked; selection review remains separate.', 'رُوجع الاكتمال؛ تبقى مراجعة الاختيار مستقلة.')}</strong><p><bdi>{latest.id}</bdi> · {new Date(latest.at).toLocaleString(isAr ? 'ar-AE' : 'en-GB')}</p>{latest.note && <p>{latest.note}</p>}<button onClick={onCoordinator}>{t('Open coordinator review', 'فتح مراجعة المنسق')}</button><p className="lr-small">{t('Session receipt only. It does not confirm institutional registration, artistic selection, contract or payment.', 'إيصال للجلسة فقط. لا يؤكد التسجيل المؤسسي أو الاختيار الفني أو العقد أو الدفع.')}</p></section>}
    {activated && <p role="status">{t('Selection simulated; linked delivery created.', 'حُوكي الاختيار وأُنشئ سجل التنفيذ المرتبط.')} <bdi>{activated.id}</bdi> · {activated.record.acceptance ? t('Handover acknowledged', 'تم تأكيد التسليم') : t('Delivery in progress', 'التنفيذ جارٍ')}</p>}
    <nav className="intake-steps" aria-label={t('Intake steps', 'خطوات التقديم')}>{stages.map((label, index) => <button key={index} aria-current={step === index ? 'step' : undefined} onClick={() => advance(index)}><b>{formatNumber(index + 1)}</b>{label}</button>)}</nav>
    <section className="lr-panel intake-card"><h2 ref={heading} tabIndex={-1}>{stages[step]}</h2>
      {issues.length > 0 && <div className="intake-errors" role="alert"><strong>{t('Your draft is still here. Complete these items:', 'مسودتك ما زالت هنا. أكمل البنود التالية:')}</strong><ul>{issues.map(issue => <li key={issue.path + issue.en}><button onClick={() => { setStep(issue.path.startsWith('profile.') ? issue.path.includes('contact') || issue.path.includes('organisation') ? 1 : 0 : 2); window.setTimeout(() => form.setFocus(issue.path as FieldPath<IntakeDraft>), 0); }}>{isAr ? issue.ar : issue.en}</button></li>)}</ul></div>}
      <IntakeFieldIssuesProvider value={issues}><form noValidate onSubmit={e => { e.preventDefault(); if (step < 5) advance(step + 1); else send(); }}>
        <fieldset key={programmeId} disabled={locked} className="intake-form-body">
        {step === 0 && <><p>{t('Public display names can differ from a legal name. Keep the spelling and punctuation you use professionally.', 'قد تختلف أسماء العرض عن الاسم القانوني. احتفظ بالتهجئة وعلامات الترقيم التي تستخدمها مهنياً.')}</p><div className="intake-pair"><Field name="profile.nameEn" en="Display name · English" ar="اسم العرض · الإنجليزية" dir="ltr"/><Field name="profile.nameAr" en="Display name · Arabic" ar="اسم العرض · العربية" dir="rtl"/></div><label className="lr-checkbox"><input type="checkbox" {...form.register('profile.translationHelp')}/>{t('I need help preparing the other language.', 'أحتاج إلى مساعدة في إعداد النص باللغة الأخرى.')}</label><Field name="profile.bio" en="Short biography (optional)" ar="نبذة قصيرة (اختياري)" multiline maxLength={2000}/><div className="intake-pair"><Field name="profile.country" en="Studio country (optional)" ar="دولة الاستوديو (اختياري)"/><Field name="profile.city" en="Studio city (optional)" ar="مدينة الاستوديو (اختياري)"/></div><Field name="profile.email" en="Sample contact email" ar="بريد التواصل التجريبي" dir="ltr" type="email"/><Field name="profile.phone" en="Phone with country code (optional)" ar="الهاتف مع رمز الدولة (اختياري)" dir="ltr" type="tel"/><Field name="profile.website" en="Website (optional)" ar="الموقع الإلكتروني (اختياري)" dir="ltr"/><p className="intake-note">{t('Sample legal names can be entered on the separate roster page. Passport documents and payment information are collected later, in encrypted steps routed only to Finance and Protocol.', 'يمكن إدخال أسماء قانونية تجريبية في صفحة السجل المستقلة. تُجمع مستندات جواز السفر وبيانات الدفع لاحقاً ضمن خطوات مشفّرة تُوجّه حصرياً إلى المالية والبروتوكول.')}</p></>}
        {step === 1 && <><RepresentationFields/><IntakeFiles slot="cv" disabled={locked}/></>}
        {step === 2 && <><aside className="intake-brief"><bdi>{programme.id} · v1</bdi><h3>{isAr ? programme.ar : programme.en}</h3><p>{isAr ? programme.briefAr : programme.briefEn}</p><p>{t('Indoor sample space', 'مساحة داخلية تجريبية')}: <bdi>{programme.space}</bdi> · {t('Budget ceiling', 'سقف الميزانية')}: <bdi>AED {programme.budget}</bdi></p><p className="lr-small">{t('Demonstration brief: no live deadline, grant or institutional invitation. Safety, venue and rights checks remain required before any real activity.', 'موجز توضيحي: لا موعد تقديم فعلي أو منحة أو دعوة مؤسسية. تلزم مراجعات السلامة والموقع والحقوق قبل أي نشاط فعلي.')}</p></aside><div className="intake-pair"><Field name={`proposals.${programmeId}.titleEn`} en="Proposal title · English" ar="عنوان المقترح · الإنجليزية" dir="ltr"/><Field name={`proposals.${programmeId}.titleAr`} en="Proposal title · Arabic" ar="عنوان المقترح · العربية" dir="rtl"/><Field name={`proposals.${programmeId}.conceptEn`} en="Concept · English" ar="الفكرة · الإنجليزية" dir="ltr" multiline maxLength={3000}/><Field name={`proposals.${programmeId}.conceptAr`} en="Concept · Arabic" ar="الفكرة · العربية" dir="rtl" multiline maxLength={3000}/></div><label className="lr-checkbox"><input type="checkbox" {...form.register(`proposals.${programmeId}.translationHelp`)}/>{t('I need translation support for this proposal.', 'أحتاج إلى مساعدة في ترجمة هذا المقترح.')}</label><Field name={`proposals.${programmeId}.technical`} en="Space, equipment and delivery needs" ar="احتياجات المساحة والتجهيزات والتنفيذ" multiline maxLength={2000}/><h3>{t('Itemized budget · AED', 'الميزانية المفصلة · درهم')}</h3><div className="intake-budget">{BUDGET_CATEGORIES.map(key => <Field key={key} name={`proposals.${programmeId}.budget.${key}`} en={budgets[key][0]} ar={budgets[key][1]} dir="ltr" maxLength={12}/>)}</div><BudgetTotal programmeId={programmeId}/><Field name={`proposals.${programmeId}.portfolioUrl`} en="Portfolio or video URL (optional)" ar="رابط الأعمال أو الفيديو (اختياري)" dir="ltr" maxLength={1000}/><IntakeFiles slot={programmeId} disabled={locked}/></>}
        </fieldset>
        {step === 3 && <div className="intake-secure-section">
          <div className="intake-secure-badge intake-secure-badge--finance"><Lock className="intake-secure-icon"/><span>{t('Encrypted: Routes strictly to Finance', 'مشفّر: يُوجّه حصرياً إلى المالية')}</span></div>
          <p className="intake-note">{t('Banking details never appear in curatorial or committee dossiers. They are transmitted only to Finance, for honorarium disbursement.', 'لا تظهر البيانات المصرفية في ملفات التحكيم أو اللجنة. تُرسل حصرياً إلى إدارة المالية لغرض صرف المكافأة.')}</p>
          <div className="intake-pair">
            <label className="intake-field">{t('Bank name', 'اسم المصرف')}<input dir="ltr" value={bank.bankName} onChange={e => setBank(b => ({ ...b, bankName: e.target.value }))} maxLength={120}/></label>
            <label className="intake-field">{t('Account holder name', 'اسم صاحب الحساب')}<input dir="ltr" value={bank.accountHolder} onChange={e => setBank(b => ({ ...b, accountHolder: e.target.value }))} maxLength={120}/></label>
          </div>
          <div className="intake-pair">
            <label className="intake-field">{t('IBAN', 'رقم الآيبان')}<input dir="ltr" value={bank.iban} onChange={e => setBank(b => ({ ...b, iban: e.target.value.toUpperCase() }))} maxLength={34}/></label>
            <label className="intake-field">{t('SWIFT / BIC', 'رمز السويفت')}<input dir="ltr" value={bank.swift} onChange={e => setBank(b => ({ ...b, swift: e.target.value.toUpperCase() }))} maxLength={11}/></label>
          </div>
          <p className="lr-small">{t('Session-local demo field. No real bank transfer is initiated.', 'حقل تجريبي محلي للجلسة. لا يُنفَّذ أي تحويل مصرفي فعلي.')}</p>
        </div>}
        {step === 4 && <div className="intake-secure-section">
          <div className="intake-secure-badge intake-secure-badge--protocol"><Lock className="intake-secure-icon"/><span>{t('Encrypted: Routes strictly to Protocol', 'مشفّر: يُوجّه حصرياً إلى البروتوكول')}</span></div>
          <p className="intake-note">{t('Passport and visa files are transmitted only to the Protocol office, for travel clearance. They are not visible to curatorial or committee reviewers.', 'تُرسل ملفات جواز السفر والتأشيرة حصرياً إلى مكتب البروتوكول لإجراءات السفر. وهي غير مرئية لمراجعي التحكيم أو اللجنة.')}</p>
          <div className="intake-pair">
            <label className="intake-drop-mini">{t('Passport bio page (PDF/JPEG)', 'صفحة بيانات جواز السفر (PDF/JPEG)')}<input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => setLogistics(l => ({ ...l, passportFile: e.target.files?.[0]?.name ?? l.passportFile }))}/></label>
            <label className="intake-drop-mini">{t('Visa or entry permit (PDF/JPEG)', 'التأشيرة أو تصريح الدخول (PDF/JPEG)')}<input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => setLogistics(l => ({ ...l, visaFile: e.target.files?.[0]?.name ?? l.visaFile }))}/></label>
          </div>
          {(logistics.passportFile || logistics.visaFile) && <p className="lr-small"><FileCheck2 className="intake-secure-icon"/> {t('Received', 'تم الاستلام')}: {[logistics.passportFile, logistics.visaFile].filter(Boolean).join(' · ')}</p>}
          <p className="lr-small">{t('Session-local demo upload. Files are not transmitted or stored.', 'رفع تجريبي محلي للجلسة. لا تُنقل الملفات ولا تُخزَّن.')}</p>
        </div>}
        {step === 5 && <>{locked && latest ? <IntakeDossier draft={latest.snapshot} programmeId={programmeId} assets={latest.assets}/> : <CurrentDossier programmeId={programmeId}/>}<p className="intake-note">{t('Submitting creates a versioned item for the coordinator’s completeness check. It does not transfer copyright or grant publicity, shipping, spending or selection authority.', 'ينشئ التقديم بنداً محدد الإصدار لمراجعة الاكتمال لدى المنسق. لا ينقل حقوق المؤلف ولا يمنح صلاحية النشر أو الشحن أو الإنفاق أو الاختيار.')}</p>{!locked && <label className="lr-checkbox"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>{t('I reviewed this sample proposal and want to send it to the demo coordinator queue.', 'راجعت هذا المقترح التجريبي وأرغب في إرساله إلى قائمة المنسق التجريبية.')}</label>}</>}
        <div className="intake-navigation"><button type="button" disabled={step === 0} onClick={() => advance(step - 1)}>{t('Previous', 'السابق')}</button>{step < 5 ? <button className="lr-primary" type="submit">{t('Continue', 'متابعة')}</button> : <button className="lr-primary" type="submit" disabled={!confirmed || locked}>{t('Digitally Sign & Submit', 'توقيع رقمي وتقديم')}</button>}</div>
      </form></IntakeFieldIssuesProvider>
    </section>
    {!latest && <button className="lr-link" onClick={() => { form.setValue(`proposals.${programmeId}`, sampleProposal(programmeId), { shouldDirty: true }); advance(2); }}>{t('Load sample proposal (replaces this programme only)', 'تحميل مقترح تجريبي (لهذا البرنامج فقط)')}</button>}
  </div>;
}

function SubmissionReview({ submission }: { submission: IntakeSubmission }) {
  const { review } = useArtistIntake(); const { isAr } = useI18n(); const t = (en: string, ar: string) => isAr ? ar : en; const [note, setNote] = useState(''); const [checked, setChecked] = useState(false);
  return <details className="intake-review-item"><summary><bdi>{submission.id}</bdi> · {submission.snapshot.profile[isAr ? 'nameAr' : 'nameEn'] || submission.snapshot.profile.nameEn} · {submission.status === 'received' ? t('Completeness review required', 'تلزم مراجعة الاكتمال') : submission.status === 'revision' ? t('Revision requested', 'طُلب تعديل') : t('Completeness checked', 'رُوجع الاكتمال')}</summary><IntakeDossier draft={submission.snapshot} programmeId={submission.programmeId} assets={submission.assets}/>{submission.status === 'received' ? <><label className="intake-field">{t('Feedback (required when returning)', 'الملاحظات (مطلوبة عند الإعادة)')}<textarea value={note} onChange={e => setNote(e.target.value)} maxLength={1000}/></label><label className="lr-checkbox"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}/>{t('I checked this version for completeness. Selection and publication permissions remain separate.', 'راجعت اكتمال هذا الإصدار. تبقى صلاحيات الاختيار والنشر مستقلة.')}</label><div className="lr-actions"><button disabled={!note.trim()} onClick={() => review(submission.id, 'revision', note)}>{t('Request revision', 'طلب تعديل')}</button><button className="lr-primary" disabled={!checked} onClick={() => review(submission.id, 'checked', note)}>{t('Record completeness check', 'تسجيل مراجعة الاكتمال')}</button></div></> : <p>{submission.note || t('No additional feedback.', 'لا ملاحظات إضافية.')} · <bdi>DEMO-COORDINATOR</bdi> · {submission.reviewedAt && new Date(submission.reviewedAt).toLocaleString(isAr ? 'ar-AE' : 'en-GB')}</p>}</details>;
}
export function ArtistIntakeQueue() {
  const { submissions } = useArtistIntake(); const { isAr } = useI18n();
  return <section className="lr-panel artist-intake"><h2>{isAr ? 'مقترحات الفنانين · مراجعة المنسق' : 'Artist proposals · coordinator review'}</h2><p className="lr-small">{isAr ? 'سجلات تجريبية للجلسة. الاستلام ومراجعة الاكتمال لا يعنيان الاختيار أو التحقق من الهوية.' : 'Session-only sample records. Receipt and completeness checks do not mean selection or identity verification.'}</p>{submissions.length ? submissions.map(s => <SubmissionReview key={s.id} submission={s}/>) : <p>{isAr ? 'لا توجد مقترحات مقدمة في هذه الجلسة.' : 'No proposals submitted in this session.'}</p>}</section>;
}
