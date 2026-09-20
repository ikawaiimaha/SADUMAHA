import React from 'react';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { editorialSamples, EDITORIAL_PROGRAMME_ID, EDITORIAL_VERSION } from '../../data/editorialSamples';
import { calculateDynamicWordCount } from '../../utils/metrics';

export const EditorialDashboard: React.FC = () => {
  const { isAr, formatNumber } = useI18n();
  const { selectedProgramme, editorialChecks, checkEditorial, currentRole } = useWorkspace();
  const t = (en: string, ar: string) => isAr ? ar : en;
  const entries = selectedProgramme?.id === EDITORIAL_PROGRAMME_ID ? editorialSamples : [];
  return <div className="space-y-6">
    <header className="bg-sadu-linen border border-sadu-gold rounded-lg p-6">
      <h1 className="text-2xl font-editorial font-bold">{t('Editorial, Translation & Catalogue Desk', 'مكتب التحرير والترجمة والكتالوج')}</h1>
      <p className="text-sm mt-2">{t('SADU-authored sample text. A sample editorial check is not peer review, rights clearance or Sharjah Government Press authorization. Checks last only in this session.', 'نص تجريبي من إعداد سدو. لا تمثل المراجعة التحريرية التجريبية تحكيماً علمياً أو تسوية حقوق أو إذناً من مطبعة حكومة الشارقة. تستمر المراجعات لهذه الجلسة فقط.')}</p>
      <p className="text-sm mt-2">{isAr ? selectedProgramme?.titleAr : selectedProgramme?.titleEn}</p>
    </header>
    {!entries.length && <p role="status">{t('No editorial sample records for the selected programme.', 'لا توجد سجلات تحرير تجريبية للبرنامج المختار.')}</p>}
    {entries.map(entry => {
      const key = `${EDITORIAL_PROGRAMME_ID}/${entry.id}/v${EDITORIAL_VERSION}`;
      const check = editorialChecks[key];
      return <article key={key} className="bg-white border border-sadu-gold rounded-lg p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sadu-gold pb-3">
          <div><bdi className="text-xs font-mono">{entry.artworkCode} · v{EDITORIAL_VERSION}</bdi><h2 className="font-bold">{isAr ? entry.titleAr : entry.titleEn}</h2><p className="text-sm">{isAr ? entry.artistAr : entry.artistEn}</p></div>
          {check ? <div role="status" className="text-sm"><strong>{t('Sample Editorial Check Recorded', 'سُجلت المراجعة التحريرية التجريبية')}</strong><p><bdi>{check.actor} · {check.at}</bdi></p></div> : <button disabled={currentRole !== 'EDITORIAL'} onClick={() => checkEditorial(entry.id)} className="px-4 py-2 rounded bg-sadu-brick text-white text-sm">{t('Record Sample Editorial Check', 'تسجيل مراجعة تحريرية تجريبية')}</button>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <section lang="ar" dir="rtl" className="p-4 rounded bg-sadu-linen/40 border border-sadu-gold/60 space-y-2"><h3 className="font-bold">النص القيّمي التجريبي · العربية</h3><span>{formatNumber(calculateDynamicWordCount(entry.curatorialStatementAr))} كلمة</span><p>{entry.curatorialStatementAr}</p></section>
          <section lang="en" dir="ltr" className="p-4 rounded bg-sadu-linen/40 border border-sadu-gold/60 space-y-2"><h3 className="font-bold">Sample curatorial statement · English</h3><span>{formatNumber(calculateDynamicWordCount(entry.curatorialStatementEn))} words</span><p>{entry.curatorialStatementEn}</p></section>
        </div>
      </article>;
    })}
  </div>;
};
