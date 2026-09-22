import React, { useState } from 'react';
import { Language, ExhibitionProgramme, WorkspaceTab } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Archive, ShieldCheck, CheckCircle2, Lock, Clock, Truck, AlertCircle } from 'lucide-react';

export interface ArchiveViewProps {
  lang?: Language;
  selectedProgramme?: ExhibitionProgramme;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = (props) => {
  const i18n = useI18n();
  const workspace = useWorkspace();
  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const { formatPercent, formatRatio } = i18n;
  const [returnManifestSigned, setReturnManifestSigned] = useState(false);
  const [archiveSealed, setArchiveSealed] = useState(false);

  const manifestItems = [
    { code: 'DOC-01', titleEn: 'Artist Nomination & Dossier Snapshot v1.0', titleAr: 'سجل ترشيح الفنان وملف المشاركة المعتمد v1.0', status: 'verified', authority: isAr ? 'استوديو الفنان والمنسق' : 'Curator & Artist Studio', checksum: 'SHA-256: 7b2a...e901' },
    { code: 'DOC-02', titleEn: 'Calligraphy Panel & Cultural Affairs Sign-Off', titleAr: 'محضر اعتماد لجنة تحكيم الخط ومدير الشؤون الثقافية', status: 'verified', authority: isAr ? 'لجنة التحكيم والشؤون الثقافية' : 'Jury & Cultural Affairs', checksum: 'SHA-256: 8f1c...3a44' },
    { code: 'DOC-03', titleEn: 'Approved Scope Frozen Revision v1.2', titleAr: 'النطاق الفني المعتمد والمجمد v1.2', status: 'verified', authority: isAr ? 'دائرة الثقافة بالشارقة' : 'Directorate of Cultural Affairs', checksum: 'SHA-256: 4c3d...9e12' },
    { code: 'DOC-04', titleEn: 'Executed Bilateral Solo Exhibition Contract', titleAr: 'عقد المعرض الشخصي الثنائي المعتمد رسمياً', status: 'verified', authority: isAr ? 'الشؤون القانونية والإدارة التنفيذية' : 'Legal & Executive Desk', checksum: 'SHA-256: 1a9b...7f88' },
    { code: 'DOC-05', titleEn: 'Handling & Installation Manual with Load Specs', titleAr: 'دليل إرشادات التركيب ومطابقة حمولة الأرضيات', status: 'verified', authority: isAr ? 'المكتب الفني وهندسة المتحف' : 'Technical Desk & Engineering', checksum: 'SHA-256: 5e6a...0b21' },
    { code: 'DOC-06', titleEn: 'Inbound Customs & Condition Intake Report', titleAr: 'محضر المعاينة الجمركية وفحص استلام الحالة', status: 'verified', authority: isAr ? 'مكتب الترميم وصيانة المقتنيات' : 'Chief Conservator', checksum: 'SHA-256: 3d7c...6e54' },
    { code: 'DOC-07', titleEn: 'Two-Part Commission Settlement Financial Audit', titleAr: 'سجل تسوية دفعات التكليف (30% مقدمة / 70% ختامية)', status: 'verified', authority: isAr ? 'قسم الحسابات المالية' : 'Accounts & Treasury Lead', checksum: 'SHA-256: 9b2d...4a11' },
    { code: 'DOC-08', titleEn: 'Outbound Repacking & Exit Condition Protocol', titleAr: 'محضر إعادة التغليف بالصناديق الأصلية وفحص المغادرة', status: 'verified', authority: isAr ? 'إدارة المعارض واللوجستيات' : 'Exhibition & Logistics Desk', checksum: 'SHA-256: 6a8f...1c90' },
    { code: 'DOC-09', titleEn: 'Signed Return Freight Manifest (Mandatory Closeout)', titleAr: 'محضر بوليصة الشحن وإرجاع الأعمال الفنية الموقع (إلزامي)', status: returnManifestSigned ? 'verified' : 'pending', authority: isAr ? 'شركة الشحن وتوقيع استلام الفنان' : 'Carrier & Artist Receipt Signature', checksum: returnManifestSigned ? 'SHA-256: e4f7...9a23' : (isAr ? 'معلق على التوقيع' : 'Pending Signature') },
  ];

  const verifiedCount = manifestItems.filter(item => item.status === 'verified').length;
  const totalCount = manifestItems.length;
  const progressPercent = Math.round((verifiedCount / totalCount) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-lg border border-sadu-gold bg-sadu-linen p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sadu-brick"><Archive className="h-4 w-4" /><span>{isAr ? 'الذاكرة المؤسسية والأرشيف السيادي' : 'Institutional Memory & Sovereign Archive'}</span></div>
            <h1 className="text-2xl font-editorial font-bold text-sadu-charcoal sm:text-3xl">{isAr ? 'محضر الإغلاق الأرشيفي الدائم' : 'Permanent Dossier Closeout & Manifest Register'}</h1>
            <p className="mt-1 text-xs text-sadu-muted sm:text-sm">{isAr ? 'حفظ السجلات الثقافية بروابط مشفرة تمنع التلاعب وتتيح الاسترجاع المستقبلي للأبحاث والمعارض القادمة' : 'Preserving cultural knowledge with tamper-evident cryptographic provenance for future scholarship.'}</p>
          </div>
          <span className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold ${archiveSealed ? 'border border-sadu-sage bg-sadu-sage/20 text-sadu-ink' : 'border border-amber-300 bg-amber-50 text-sadu-brick'}`}><Lock className="h-4 w-4" />{archiveSealed ? (isAr ? 'الأرشيف مغلق ومختوم' : 'Archive Sealed (Immutable)') : (isAr ? 'جاهز للختم الأرشيفي' : 'Ready for Closeout')}</span>
        </div>
      </section>

      <section className="rounded-lg border border-sadu-gold bg-sadu-linen p-4 shadow-xs sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-editorial font-bold text-sadu-charcoal">{isAr ? 'قائمة وثائق الإغلاق الإلزامية' : 'Mandatory Dossier Manifest Verification'}</h2><p className="text-xs text-sadu-muted">{isAr ? `${formatRatio(verifiedCount, totalCount)} وثائق تم التحقق من سلامة بصمتها الرقمية` : `${verifiedCount} of ${totalCount} Attributable Records Verified with Checksums`}</p></div><span className={`rounded border px-2.5 py-1 text-xs font-mono font-bold ${progressPercent === 100 ? 'border-sadu-sage bg-sadu-sage-light text-sadu-sage' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>{formatPercent(progressPercent)} {isAr ? 'مكتمل' : 'Complete'}</span></div>
        <div className="hidden w-full overflow-hidden rounded-lg border border-sadu-gold/50 md:block"><table className="w-full border-collapse text-start text-xs rtl:text-end"><thead><tr className="bg-sadu-ink text-white"><th className="p-3 font-semibold">{isAr ? 'الرمز والمسمى' : 'Document Code & Title'}</th><th className="p-3 font-semibold">{isAr ? 'جهة الاعتماد' : 'Issuing Authority'}</th><th className="p-3 font-semibold">{isAr ? 'حالة التدقيق' : 'Verification'}</th><th className="p-3 text-center font-semibold">{isAr ? 'فحص النزاهة' : 'Integrity'}</th></tr></thead><tbody className="divide-y divide-sadu-gold/40">{manifestItems.map(item => <tr key={item.code} className={item.status === 'pending' ? 'bg-amber-50/70' : 'bg-sadu-linen hover:bg-sadu-sand/60'}><td className="p-3 font-medium"><span className="block text-[10px] font-mono font-bold text-sadu-brick"><bdi dir="ltr">{item.code}</bdi></span><span className="text-sm font-bold text-sadu-charcoal">{isAr ? item.titleAr : item.titleEn}</span></td><td className="p-3 font-semibold text-sadu-ink">{item.authority}</td><td className="p-3">{item.status === 'verified' ? <span className="flex items-center gap-1 font-semibold text-sadu-sage"><CheckCircle2 className="h-3.5 w-3.5" />{isAr ? 'مطابق وموثق' : 'Verified'}</span> : <span className="flex items-center gap-1 font-semibold text-amber-800"><Clock className="h-3.5 w-3.5" />{isAr ? 'معلق على توقيع الإرجاع' : 'Pending Return Signature'}</span>}</td><td className="p-3 text-center font-mono text-[11px]"><bdi dir="ltr" className={item.status === 'verified' ? 'text-sadu-muted' : 'font-bold text-sadu-brick'}>{item.checksum}</bdi></td></tr>)}</tbody></table></div>
        <div className="space-y-3 md:hidden">{manifestItems.map(item => <article key={item.code} className={`rounded-lg border p-3 text-xs ${item.status === 'pending' ? 'border-amber-300 bg-amber-50/70' : 'border-sadu-gold/50 bg-sadu-linen'}`}><div className="flex items-start justify-between gap-3"><div><span className="block font-mono text-[10px] font-bold text-sadu-brick"><bdi dir="ltr">{item.code}</bdi></span><h3 className="mt-0.5 text-sm font-bold text-sadu-charcoal">{isAr ? item.titleAr : item.titleEn}</h3></div>{item.status === 'verified' ? <span className="flex shrink-0 items-center gap-1 font-semibold text-sadu-sage"><CheckCircle2 className="h-3.5 w-3.5" />{isAr ? 'موثق' : 'Verified'}</span> : <span className="flex shrink-0 items-center gap-1 font-semibold text-amber-800"><Clock className="h-3.5 w-3.5" />{isAr ? 'معلق' : 'Pending'}</span>}</div><div className="mt-3 border-t border-sadu-gold/40 pt-2"><span className="block text-[10px] font-bold uppercase tracking-wider text-sadu-muted">{isAr ? 'جهة الاعتماد' : 'Issuing Authority'}</span><span className="mt-0.5 block font-semibold text-sadu-ink">{item.authority}</span></div><div className="mt-2"><span className="block text-[10px] font-bold uppercase tracking-wider text-sadu-muted">{isAr ? 'فحص النزاهة' : 'Integrity'}</span><bdi dir="ltr" className={`mt-0.5 block font-mono text-[11px] ${item.status === 'verified' ? 'text-sadu-muted' : 'font-bold text-sadu-brick'}`}>{item.checksum}</bdi></div></article>)}</div>

        <div className={`mt-6 space-y-3 rounded-lg border p-4 text-xs ${returnManifestSigned ? 'border-sadu-sage bg-sadu-sage-light/60' : 'border-amber-300 bg-amber-50/80'}`}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div className="flex items-start gap-2.5"><Truck className={`mt-0.5 h-5 w-5 shrink-0 ${returnManifestSigned ? 'text-sadu-sage' : 'text-sadu-brick'}`} /><div><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-sadu-charcoal">{isAr ? 'بوابة شحن وإرجاع الأعمال الفنية' : 'Artwork Return Freight Manifest Gate'}</span><span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${returnManifestSigned ? 'bg-sadu-sage text-white' : 'bg-sadu-brick text-white'}`}>{isAr ? 'وثيقة إغلاق إلزامية' : 'Mandatory Blocker'}</span></div><p className="mt-1 text-[11px] leading-relaxed text-sadu-charcoal">{isAr ? 'يشترط الحصول على بوليصة الشحن ومحضر استلام الفنان الموقع قبل السماح بالختم الأرشيفي الدائم.' : 'The signed return freight manifest is the final required document before the archive can be permanently sealed.'}</p><div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-sadu-muted"><span>AWB: <strong>SHJ-EXP-2026-9082</strong></span><span>{isAr ? 'الوجهة: باريس، فرنسا' : 'Destination: Paris, France'}</span><span>{isAr ? 'الصناديق: CRATE-04 و CRATE-05' : 'Crates: CRATE-04 & CRATE-05'}</span></div></div></div><button type="button" onClick={() => setReturnManifestSigned(!returnManifestSigned)} className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-bold shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sadu-brick ${returnManifestSigned ? 'border border-sadu-gold bg-sadu-linen text-sadu-charcoal' : 'bg-sadu-brick text-white hover:bg-sadu-brick-dark'}`}><CheckCircle2 className="h-4 w-4" />{returnManifestSigned ? (isAr ? 'إلغاء التوقيع' : 'Revoke Signature') : (isAr ? 'توقيع واعتماد محضر الإرجاع' : 'Sign & Verify Return Manifest')}</button></div>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-4 border-t border-sadu-gold pt-6 sm:flex-row sm:items-center"><div className="max-w-lg text-xs">{!returnManifestSigned ? <span className="flex items-center gap-1.5 font-semibold text-sadu-brick"><AlertCircle className="h-4 w-4 shrink-0" />{isAr ? 'الختم الأرشيفي مقفل: يجب توقيع محضر الإرجاع أولاً.' : 'Archive sealing locked: validate the signed return freight manifest first.'}</span> : <span className="flex items-center gap-1.5 text-sadu-muted"><ShieldCheck className="h-4 w-4 shrink-0 text-sadu-sage" />{isAr ? 'يتم تجميد كافة السجلات كنسخة للقراءة فقط.' : 'Sealing locks the dossier into a permanent read-only institutional record.'}</span>}</div><button type="button" onClick={() => setArchiveSealed(true)} disabled={!returnManifestSigned || archiveSealed} className={`flex cursor-pointer items-center gap-2 rounded-md px-6 py-2.5 text-xs font-bold shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sadu-brick ${archiveSealed ? 'border border-sadu-gold bg-sadu-sand text-sadu-ink' : !returnManifestSigned ? 'cursor-not-allowed border border-sadu-gold/60 bg-sadu-gold/40 text-sadu-muted opacity-70' : 'bg-sadu-ink text-white hover:bg-sadu-ink-dark'}`}><Lock className="h-4 w-4" />{archiveSealed ? (isAr ? '✓ تم الختم الأرشيفي بنجاح' : '✓ Archive Locked & Certified') : (isAr ? 'اعتماد الإغلاق الأرشيفي الدائم' : 'Seal Permanent Archive Dossier')}</button></div>
      </section>
    </div>
  );
};
