import { useEffect, useRef, useState } from 'react';
import { useWatch, type FieldPath } from 'react-hook-form';
import { useI18n } from '../context/I18nContext';
import { useArtistIntake } from '../context/ArtistIntakeContext';
import { useNavigation } from '../context/NavigationContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { ARTIST_ID, sampleIntakeDraft, type IntakeDraft, type IntakeIssue } from '../data/artistIntake';
import { DEMO_PROGRAMME } from '../data/livingRecord';
import { validateRegistration } from '../data/artistRoster';
import { Field, RepresentationFields } from './ArtistIntake';
import { IntakeFieldIssuesProvider } from './IntakeFieldIssues';
import { IntakeFiles } from './IntakeFiles';
import { IntakeDraftBackup } from './IntakeDraftBackup';
import { RosterNavLink } from './RosterNavLink';
import { ProgrammeRoster } from './ProgrammeRoster';
import './LivingRecordWorkspace.css';
import './RosterRegistration.css';

function RegistrationReview() {
  const { form, assets } = useArtistIntake(); const { isAr } = useI18n();
  const profile = useWatch({ control: form.control, name: 'profile' });
  const t = (en: string, ar: string) => isAr ? ar : en;
  return <div className="roster-review">
    <h3>{t('Legal name · sample only', 'الاسم القانوني · تجريبي فقط')}</h3>
    <div className="intake-pair"><p lang="en" dir="ltr">{profile.legalNameEn || '—'}</p><p lang="ar" dir="rtl">{profile.legalNameAr || '—'}</p></div>
    <h3>{t('Catalogue name', 'الاسم في الكتالوج')}</h3>
    <div className="intake-pair"><p lang="en" dir="ltr">{profile.nameEn || '—'}</p><p lang="ar" dir="rtl">{profile.nameAr || '—'}</p></div>
    {profile.translationHelp && <p>{t('Translation support requested.', 'طُلبت مساعدة الترجمة.')}</p>}
    <p className="intake-prewrap">{profile.bio}</p>
    <h3>{t('Contact and representation', 'التواصل والتمثيل')}</h3>
    <p><bdi>{profile.email || '—'}</bdi> · <bdi>{profile.phone || '—'}</bdi></p>
    <p>{profile.country || '—'} · {profile.city || '—'}</p>
    <p>{profile.representation === 'independent' ? t('Independent artist', 'فنان مستقل') : profile.representation === 'gallery' ? t('Gallery represented', 'تمثيل عبر صالة عرض') : t('Agency managed', 'إدارة عبر وكالة')} · {profile.representation !== 'independent' && profile.organisation}</p>
    <p>{profile.contactName} <bdi>{profile.contactEmail}</bdi></p>
    <h3>{t('Attached documents', 'المستندات المرفقة')}</h3>
    <ul>{assets.filter(a => a.slot === 'cv' || a.slot === 'portfolio').map(a => <li key={a.id}><bdi>{a.name}</bdi> · {a.slot === 'cv' ? t('CV', 'السيرة الذاتية') : t('Portfolio', 'ملف الأعمال')}</li>)}</ul>
    {!assets.some(a => a.slot === 'cv' || a.slot === 'portfolio') && <p>{t('No optional PDFs attached.', 'لم تُرفق أي ملفات PDF اختيارية.')}</p>}
  </div>;
}

function RegistrationForm({ onProposal }: { onProposal: () => void }) {
  const { isAr, formatNumber } = useI18n(); const t = (en: string, ar: string) => isAr ? ar : en;
  const { form, registerRoster, roster, submissions } = useArtistIntake(); const { navigate } = useNavigation();
  const [step, setStep] = useState(0); const [issues, setIssues] = useState<IntakeIssue[]>([]);
  const [confirmed, setConfirmed] = useState(false); const [editing, setEditing] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null); const errors = useRef<HTMLDivElement>(null);
  const stages = [t('Names and contact', 'الأسماء والتواصل'), t('Representation and documents', 'التمثيل والمستندات'), t('Review registration', 'مراجعة التسجيل')];
  const registered = roster.find(entry => entry.id === ARTIST_ID);
  const advance = (next: number) => { setStep(next); setIssues([]); setConfirmed(false); window.setTimeout(() => heading.current?.focus(), 0); };
  const submit = () => {
    const next = validateRegistration(form.getValues().profile); setIssues(next);
    if (next.length) { window.setTimeout(() => errors.current?.focus(), 0); return; }
    if (confirmed && registerRoster()) { setEditing(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };
  if (registered && !editing) return <section className="lr-panel intake-receipt" role="status">
    <p className="lr-eyebrow">{t('ROSTER REGISTRATION · SAMPLE RECEIPT', 'التسجيل في السجل · إيصال تجريبي')}</p>
    <h2>{registered.status === 'verified-sample' ? t('Sample profile review recorded.', 'سُجلت مراجعة الملف التجريبي.') : t('Profile received. Coordinator review is next.', 'استُلم الملف. الخطوة التالية مراجعة المنسق.')}</h2>
    <p><bdi>{registered.id}</bdi> · {new Date(registered.registeredAt).toLocaleString(isAr ? 'ar-AE' : 'en-GB')}</p>
    <p>{isAr ? registered.evidenceLabel.ar : registered.evidenceLabel.en}</p>
    <div className="lr-actions"><button className="lr-primary" onClick={onProposal}>{t('Explore sample programme proposals', 'استكشاف مقترحات البرامج التجريبية')}</button><button onClick={() => navigate('/roster')}>{t('View demo roster', 'عرض السجل التجريبي')}</button><button onClick={() => { form.setValue('profile', structuredClone(registered.profile)); setEditing(true); advance(0); }}>{t('Edit sample profile', 'تعديل الملف التجريبي')}</button></div>
    <p className="lr-small">{t('This receipt and registration last only in this browser session. Optional device backup preserves selected draft text, not registration status or files.', 'يستمر الإيصال والتسجيل في جلسة المتصفح هذه فقط. يحفظ النسخ الاختياري على الجهاز نصوصاً محددة من المسودة، ولا يحفظ حالة التسجيل أو الملفات.')}</p>
  </section>;
  return <>
    <IntakeDraftBackup visible/>
    <nav className="intake-steps roster-steps" aria-label={t('Roster registration steps', 'خطوات التسجيل في سجل الفنانين')}>{stages.map((label, index) => <button key={index} aria-current={step === index ? 'step' : undefined} onClick={() => advance(index)}><b>{formatNumber(index + 1)}</b>{label}</button>)}</nav>
    <section className="lr-panel intake-card">
      <h2 ref={heading} tabIndex={-1}>{stages[step]}</h2>
      {!!issues.length && <div className="intake-errors" role="alert" tabIndex={-1} ref={errors}><strong>{t('Your draft is still here. Check these fields:', 'مسودتك ما زالت هنا. تحقق من الحقول التالية:')}</strong><ul>{issues.map(issue => <li key={issue.path + issue.en}><button onClick={() => {
        setStep(/contact|organisation/.test(issue.path) ? 1 : 0); setConfirmed(false);
        window.setTimeout(() => form.setFocus(issue.path as FieldPath<IntakeDraft>), 0);
      }}>{isAr ? issue.ar : issue.en}</button></li>)}</ul></div>}
      <IntakeFieldIssuesProvider value={issues}><form noValidate onSubmit={event => { event.preventDefault(); if (step < 2) advance(step + 1); else submit(); }}>
        {step === 0 && <>
          <p>{t('Use invented details for this demonstration. A legal name and a catalogue name are separate records; neither is automatically verified.', 'استخدم بيانات وهمية لهذا العرض. الاسم القانوني والاسم في الكتالوج سجلان منفصلان؛ ولا يتم التحقق من أي منهما تلقائياً.')}</p>
          <h3 className="roster-section-title">{t('Legal name · sample only', 'الاسم القانوني · تجريبي فقط')}</h3>
          <p className="lr-small">{t('Enter a sample full name in at least one language. Preserve its spelling; no passport or identity document is requested.', 'أدخل اسماً كاملاً تجريبياً بلغة واحدة على الأقل. احتفظ بتهجئته؛ لا يُطلب جواز سفر أو مستند هوية.')}</p>
          <div className="intake-pair"><Field name="profile.legalNameEn" en="Legal name · English" ar="الاسم القانوني · الإنجليزية" dir="ltr"/><Field name="profile.legalNameAr" en="Legal name · Arabic" ar="الاسم القانوني · العربية" dir="rtl"/></div>
          <h3 className="roster-section-title">{t('Name for catalogues and wall labels', 'الاسم للكتالوجات وبطاقات العرض')}</h3>
          <div className="intake-pair"><Field name="profile.nameEn" en="Catalogue name · English" ar="الاسم في الكتالوج · الإنجليزية" dir="ltr"/><Field name="profile.nameAr" en="Catalogue name · Arabic" ar="الاسم في الكتالوج · العربية" dir="rtl"/></div>
          <label className="lr-checkbox"><input type="checkbox" {...form.register('profile.translationHelp')}/>{t('I need help preparing the other language.', 'أحتاج إلى مساعدة في إعداد النص باللغة الأخرى.')}</label>
          <Field name="profile.bio" en="Short biography (optional)" ar="نبذة قصيرة (اختياري)" multiline maxLength={2000}/>
          <div className="intake-pair"><Field name="profile.country" en="Studio country (optional)" ar="دولة الاستوديو (اختياري)"/><Field name="profile.city" en="Studio city (optional)" ar="مدينة الاستوديو (اختياري)"/></div>
          <Field name="profile.email" en="Sample contact email" ar="بريد التواصل التجريبي" dir="ltr" type="email"/>
          <Field name="profile.phone" en="Phone with country code (optional)" ar="الهاتف مع رمز الدولة (اختياري)" dir="ltr" type="tel"/>
          <Field name="profile.website" en="Website (optional)" ar="الموقع الإلكتروني (اختياري)" dir="ltr"/>
        </>}
        {step === 1 && <><RepresentationFields/><IntakeFiles slot="cv"/><IntakeFiles slot="portfolio"/></>}
        {step === 2 && <><RegistrationReview/><p className="intake-note">{t('This creates a sample roster profile only. Exhibition concepts, budgets and programme-specific files belong to the separate proposal stage.', 'ينشئ هذا ملفاً تجريبياً في سجل الفنانين فقط. تأتي أفكار المعارض والميزانيات والملفات الخاصة بالبرامج في مرحلة المقترح المنفصلة.')}</p><label className="lr-checkbox"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>{t('I reviewed these fictional details and want to register this sample profile.', 'راجعت هذه البيانات الوهمية وأرغب في تسجيل هذا الملف التجريبي.')}</label></>}
        <div className="intake-navigation"><button type="button" disabled={step === 0} onClick={() => advance(step - 1)}>{t('Previous', 'السابق')}</button><button type="submit" className="lr-primary" disabled={step === 2 && !confirmed}>{step < 2 ? t('Continue', 'متابعة') : t('Register sample profile', 'تسجيل الملف التجريبي')}</button></div>
      </form></IntakeFieldIssuesProvider>
    </section>
    {!registered && submissions.length === 0 && <button className="lr-link" onClick={() => { const sample = sampleIntakeDraft(); form.setValue('profile', sample.profile, { shouldDirty: true }); advance(0); }}>{t('Fill sample profile (replaces current profile text)', 'تعبئة ملف تجريبي (يحل محل نص الملف الحالي)')}</button>}
  </>;
}

export function RosterRegistration({ rosterView = false }: { rosterView?: boolean }) {
  const { lang, isAr, toggleLang } = useI18n(); const t = (en: string, ar: string) => isAr ? ar : en;
  const { navigate } = useNavigation(); const { switchRole, setSelectedProgramme, setExperienceMode } = useWorkspace();
  const title = rosterView ? t('A roster ready for the next programme', 'سجل جاهز للبرنامج القادم') : t('Join the institutional artist roster', 'انضم إلى سجل الفنانين المؤسسي');
  useEffect(() => { document.title = `${title} | SADU`; return () => { document.title = 'SADU — The Living Record'; }; }, [title]);
  const openProposals = () => { switchRole('ARTIST'); setSelectedProgramme(DEMO_PROGRAMME); setExperienceMode('platform'); navigate('/'); };
  return <div className="living-record roster-page" lang={lang} dir={isAr ? 'rtl' : 'ltr'}>
    <header className="lr-toolbar"><div><strong className="lr-brand">{t('SADU', 'سدو')}</strong><span>{t('The Living Record', 'السجل الحي')}</span></div><nav aria-label={t('Global navigation', 'التنقل العام')}><RosterNavLink/><button onClick={() => { setExperienceMode('story'); navigate('/'); }}>{t('Presentation', 'العرض التقديمي')}</button><button onClick={toggleLang}>{isAr ? 'English' : 'العربية'}</button></nav></header>
    <main className="lr-main artist-intake roster-main">
      <div className="intake-intro"><div><p className="lr-eyebrow">{t('INSTITUTIONAL ROSTER · FICTIONAL DEMONSTRATION', 'سجل الفنانين المؤسسي · عرض افتراضي')}</p><h1>{title}</h1><p>{rosterView ? t('Start a sample programme with existing profiles. Artist identities remain linked across programme drafts.', 'ابدأ برنامجاً تجريبياً بملفات موجودة. تبقى هويات الفنانين مرتبطة عبر مسودات البرامج.') : t('Introduce your practice once. Keep your profile ready for future invitations, with a separate proposal for each programme.', 'عرّف بممارستك الفنية مرة واحدة. جهّز ملفك للدعوات المستقبلية، مع مقترح مستقل لكل برنامج.')}</p></div><bdi>{rosterView ? 'DEMO ROSTER' : ARTIST_ID}</bdi></div>
      <div className="roster-switch"><button className="lr-link" onClick={() => navigate(rosterView ? '/join' : '/roster')}>{rosterView ? t('Back to artist registration', 'العودة إلى تسجيل الفنان') : t('Demo roster & programme setup', 'السجل التجريبي وإعداد البرامج')}</button><span className="lr-small">{t('Session data · no real registration or invitations', 'بيانات الجلسة · لا تسجيل أو دعوات فعلية')}</span></div>
      {rosterView ? <ProgrammeRoster onProposal={openProposals}/> : <RegistrationForm onProposal={openProposals}/>}
    </main>
  </div>;
}
