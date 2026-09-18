import { useState } from 'react';
import { useArtistIntake } from '../context/ArtistIntakeContext';
import { useI18n } from '../context/I18nContext';

export function ProgrammeRoster() {
  const { roster, rosterProgrammes, createProgramme } = useArtistIntake();
  const { isAr } = useI18n(); const t = (en: string, ar: string) => isAr ? ar : en;
  const [titleEn, setTitleEn] = useState(''); const [titleAr, setTitleAr] = useState('');
  const [selected, setSelected] = useState<string[]>([]); const [message, setMessage] = useState<'created' | 'invalid' | ''>('');
  return <>
    <section className="lr-panel"><h2>{t('Create a programme draft from the roster', 'إنشاء مسودة برنامج من سجل الفنانين')}</h2>
      <p>{t('Three invented artists are pre-registered with a simulated verification status. New registrations await review. Select existing profiles to demonstrate reuse; no invitations are sent.', 'ثلاثة فنانين وهميين مسجلون مسبقاً بحالة تحقق محاكاة. تنتظر التسجيلات الجديدة المراجعة. اختر ملفات موجودة لعرض إعادة استخدامها؛ لا تُرسل دعوات.')}</p>
      <form noValidate onSubmit={event => { event.preventDefault(); const result = createProgramme(titleEn, titleAr, selected); setMessage(result ? 'created' : 'invalid'); if (result) { setTitleEn(''); setTitleAr(''); setSelected([]); } }}>
        <div className="intake-pair"><label className="intake-field">{t('Programme title · English', 'عنوان البرنامج · الإنجليزية')}<input dir="ltr" value={titleEn} maxLength={200} onChange={e => { setTitleEn(e.target.value); setMessage(''); }}/></label><label className="intake-field">{t('Programme title · Arabic', 'عنوان البرنامج · العربية')}<input dir="rtl" value={titleAr} maxLength={200} onChange={e => { setTitleAr(e.target.value); setMessage(''); }}/></label></div>
        <fieldset className="roster-pool"><legend>{t('Select existing artists', 'اختر فنانين من السجل')}</legend><div className="roster-grid">{roster.map(entry => <label key={entry.id} className={`roster-person ${selected.includes(entry.id) ? 'is-selected' : ''}`}>
          <span className="roster-person-top"><bdi>{entry.id}</bdi><input type="checkbox" disabled={entry.status !== 'verified-sample'} checked={selected.includes(entry.id)} onChange={e => { setSelected(ids => e.target.checked ? [...ids, entry.id] : ids.filter(id => id !== entry.id)); setMessage(''); }} aria-label={t('Select ', 'اختيار ') + entry.profile[isAr ? 'nameAr' : 'nameEn']}/></span>
          <strong dir="ltr">{entry.profile.nameEn}</strong><strong dir="rtl">{entry.profile.nameAr}</strong>
          <span className={`lr-status ${entry.status === 'verified-sample' ? 'is-clear' : 'is-waiting'}`}>{entry.status === 'verified-sample' ? t('Verified · simulated', 'تم التحقق · محاكاة') : t('Awaiting review', 'بانتظار المراجعة')}</span>
          <span className="roster-bio intake-prewrap">{entry.profile.bio}</span><small>{isAr ? entry.evidenceLabel.ar : entry.evidenceLabel.en}</small>
        </label>)}</div></fieldset>
        <p className="lr-small">{t('Choosing a profile is a programme-planning link, not artistic approval or delegated authority.', 'اختيار الملف ينشئ رابطاً لتخطيط البرنامج، ولا يمثل موافقة فنية أو صلاحية مفوّضة.')}</p>
        <div className="intake-navigation"><span>{t('Selected profiles', 'الملفات المختارة')}: {selected.length}</span><button type="submit" className="lr-primary">{t('Create sample programme draft', 'إنشاء مسودة برنامج تجريبي')}</button></div>
        {message && <p role={message === 'invalid' ? 'alert' : 'status'}>{message === 'created' ? t('Programme draft created with links to the existing artist records.', 'أُنشئت مسودة البرنامج بروابط إلى سجلات الفنانين الموجودة.') : t('Add both programme titles and select at least one simulated verified profile.', 'أضف عنواني البرنامج واختر ملفاً واحداً على الأقل بحالة تحقق محاكاة.')}</p>}
      </form>
    </section>
    {rosterProgrammes.length > 0 && <section className="lr-panel"><h2>{t('Programme drafts · this session', 'مسودات البرامج · هذه الجلسة')}</h2>{rosterProgrammes.map(programme => <article className="roster-programme" key={programme.id}><bdi>{programme.id}</bdi><div className="intake-pair"><h3 dir="ltr">{programme.titleEn}</h3><h3 dir="rtl">{programme.titleAr}</h3></div><ul>{programme.artistIds.map(id => { const artist = roster.find(item => item.id === id)!; return <li key={id}>{artist.profile[isAr ? 'nameAr' : 'nameEn']} · <bdi>{id}</bdi></li>; })}</ul></article>)}</section>}
  </>;
}
