import React, { useState } from 'react';
import { Language } from '../types';
import { useI18n } from '../context/I18nContext';
import { 
  UserPlus, 
  UploadCloud, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Globe, 
  Instagram, 
  ArrowRight, 
  ArrowLeft,
  Stamp,
  AlertCircle,
  Paperclip,
  Check
} from 'lucide-react';

export interface ProposedArtworkDraft {
  id: string;
  titleEn: string;
  titleAr: string;
  mediumEn: string;
  mediumAr: string;
  dimensions: string;
}

export interface ArtistNominationBuilderProps {
  lang?: Language;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ArtistNominationBuilder: React.FC<ArtistNominationBuilderProps> = ({
  lang: propLang,
  onSuccess,
  onCancel,
}) => {
  const i18n = useI18n();
  const lang = propLang ?? i18n.lang;
  const isAr = lang === 'ar';
  const { formatNumber, localizeDigits } = i18n;

  // Form State
  // 1. Identity
  const [nameEn, setNameEn] = useState('Nour Al-Huda Al-Bahrani');
  const [nameAr, setNameAr] = useState('نور الهدى البحراني');
  const [nationality, setNationality] = useState('Bahraini');
  const [residence, setResidence] = useState('Manama, Kingdom of Bahrain');

  // 2. Digital Footprint
  const [primaryMedium, setPrimaryMedium] = useState('Contemporary Thuluth & Natural Indigo Pigments');
  const [instagram, setInstagram] = useState('@nour_albahrani_art');
  const [website, setWebsite] = useState('https://nouralbahrani.art');

  // 3. Archival Documents
  const [cvFile, setCvFile] = useState<{ name: string; size: string } | null>({
    name: 'Nour_AlHuda_Curatorial_CV_2026.pdf',
    size: '1.8 MB',
  });
  const [portfolioFile, setPortfolioFile] = useState<{ name: string; size: string } | null>({
    name: 'AlBahrani_Selected_Calligraphic_Works_2020_2025.pdf',
    size: '14.2 MB',
  });

  // 4. Proposed Artworks Dynamic List
  const [proposedArtworks, setProposedArtworks] = useState<ProposedArtworkDraft[]>([
    {
      id: 'art-draft-1',
      titleEn: 'Murmurs of the Ocean in Jali Thuluth',
      titleAr: 'تمتمات البحر بخط الثلث الجلي',
      mediumEn: 'Handmade Mulberry paper, Persian indigo, walnut ink, gold leaf',
      mediumAr: 'ورق توت يدوي، نيلة فارسية، حبر جوز، ورق ذهب خالص',
      dimensions: '210 × 140 × 6 cm',
    },
    {
      id: 'art-draft-2',
      titleEn: 'Echoes of the Gulf (Sculptural Bronze Diwani)',
      titleAr: 'أصداء الخليج (ديواني برونزي مجسم)',
      mediumEn: 'Cast marine bronze with green patina on Syrian basalt plinth',
      mediumAr: 'برونز بحري مصبوب مع طبقة أكسيد خضراء وقاعدة من البازلت السوري',
      dimensions: '95 × 60 × 60 cm',
    },
  ]);

  // Submission State
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState('');

  const handleAddArtwork = () => {
    const newArt: ProposedArtworkDraft = {
      id: `art-draft-${Date.now()}`,
      titleEn: '',
      titleAr: '',
      mediumEn: '',
      mediumAr: '',
      dimensions: '',
    };
    setProposedArtworks([...proposedArtworks, newArt]);
  };

  const handleRemoveArtwork = (id: string) => {
    if (proposedArtworks.length <= 1) return;
    setProposedArtworks(proposedArtworks.filter((a) => a.id !== id));
  };

  const handleUpdateArtwork = (id: string, field: keyof ProposedArtworkDraft, value: string) => {
    setProposedArtworks(
      proposedArtworks.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedId = `NOM-SCB-${Date.now().toString().slice(-6)}`;
    setSubmissionId(generatedId);
    setIsSubmitted(true);
  };

  // Success Screen
  if (isSubmitted) {
    return (
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 sm:p-8 shadow-xs animate-in fade-in duration-300">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-sadu-sage-light border-2 border-sadu-sage mx-auto flex items-center justify-center text-sadu-ink shadow-xs">
            <Stamp className="w-8 h-8 text-sadu-sage" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded bg-sadu-sand text-sadu-brick text-xs font-mono font-bold border border-sadu-gold/60">
              {submissionId}
            </span>
            <h2 className="text-2xl sm:text-3xl font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'تم إنشاء معاينة ترشيح تجريبية' : 'Sample nomination preview created'}
            </h2>
            <p className="text-sm text-sadu-charcoal leading-relaxed max-w-xl mx-auto">
              {isAr ? <>تم إنشاء معاينة محلية لترشيح <strong>{nameAr}</strong>. لم يُرسل الملف إلى أي مسؤول أو لجنة.</> : <>A local nomination preview for <strong>{nameEn}</strong> was created. Nothing was sent to an official or committee.</>}
            </p>
          </div>

          {/* Institutional Audit Receipt Card */}
          <div className="bg-sadu-sand rounded-lg border border-sadu-gold p-4 text-xs text-start space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-sadu-gold/50 pb-2">
              <span className="font-bold text-sadu-charcoal flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sadu-sage" />
                {isAr ? 'مرجع محلي تجريبي — لم يُرسل' : 'Local sample reference — not dispatched'}
              </span>
              <span className="text-[11px] font-mono text-sadu-muted">
                {isAr ? 'الحالة: معاينة محلية فقط' : 'Status: local preview only'}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-sadu-charcoal">
              <div>
                <span className="text-sadu-muted block text-[11px]">{isAr ? 'المرشح المقترح:' : 'Candidate:'}</span>
                <span className="font-bold">{isAr ? nameAr : nameEn}</span> ({nationality})
              </div>
              <div>
                <span className="text-sadu-muted block text-[11px]">{isAr ? 'عدد الأعمال المقترحة:' : 'Proposed Works:'}</span>
                <span className="font-bold">{formatNumber(proposedArtworks.length)} {isAr ? 'أعمال فنية' : 'artworks'}</span>
              </div>
              <div>
                <span className="text-sadu-muted block text-[11px]">{isAr ? 'الوثائق المرفقة:' : 'Attached Dossiers:'}</span>
                <span className="font-mono text-[11px] text-sadu-ink">
                  {cvFile?.name ? '✓ CV' : ''} {portfolioFile?.name ? '· ✓ Portfolio' : ''}
                </span>
              </div>
              <div>
                <span className="text-sadu-muted block text-[11px]">{isAr ? 'دور المراجعة المقترح:' : 'Proposed review role:'}</span>
                <span className="font-semibold text-sadu-brick">
                  {isAr ? 'DEMO-SPECIALIST · دور مراجعة مقترح' : 'DEMO-SPECIALIST · proposed review role'}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-sadu-linen rounded border border-sadu-gold/40 text-[11px] text-sadu-muted flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-sadu-brick shrink-0" />
              <span>
                {isAr
                  ? 'معاينة محلية فقط. لا تُنشئ استلاماً مؤسسياً أو مراجعة أو توقيعاً أو عقداً أو دفعة.'
                  : 'Local preview only. No institutional receipt, review, signature, contract or payment is created.'}
              </span>
            </div>
          </div>

          {/* Action Controls */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setIsSubmitted(false);
                setNameEn('');
                setNameAr('');
              }}
              className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-sadu-charcoal bg-sadu-sand border border-sadu-gold rounded-md hover:bg-sadu-sand-dark transition-colors cursor-pointer"
            >
              {isAr ? 'ترشيح فنان آخر' : 'Nominate Another Artist'}
            </button>

            <button
              onClick={() => {
                if (onSuccess) onSuccess();
                else if (onCancel) onCancel();
              }}
              className="w-full sm:w-auto px-6 py-2 text-xs font-bold text-white bg-sadu-brick hover:bg-sadu-brick-dark rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>{isAr ? 'العودة لملفات القراءة والتقييم' : 'Return to Curatorial Dossiers'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Form
  return (
    <form onSubmit={handleSubmit} className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs space-y-8">
      {/* Header Banner */}
      <div className="border-b border-sadu-gold/50 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
              <UserPlus className="w-4 h-4" />
              <span>{isAr ? 'بوابة القيم الفني · ترشيح فنان جديد' : 'Curator Workspace · Artist Nomination Builder'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'بناء ملف ترشيح فنان لبينالي الشارقة للخط' : 'Sharjah Calligraphy Biennial — Artist Nomination Dossier'}
            </h2>
            <p className="text-xs text-sadu-muted mt-1">
              {isAr
                ? 'ترشيح فني تجريبي · معاينة محلية؛ دون إحالة خارجية'
                : 'Sample curatorial nomination · local preview; no external routing.'}
            </p>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="self-start sm:self-center px-3 py-1.5 text-xs text-sadu-muted hover:text-sadu-charcoal border border-sadu-gold rounded transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء وعودة' : 'Cancel & Back'}
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: IDENTITY */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-sadu-gold/30 pb-2">
          <span className="w-6 h-6 rounded-full bg-sadu-brick text-white text-xs font-bold flex items-center justify-center font-mono">
            {formatNumber(1)}
          </span>
          <h3 className="font-editorial text-base font-bold text-sadu-charcoal">
            {isAr ? 'بيانات الهوية الفنية (Identity & Official Profile)' : 'Section 1: Artist Identity & Official Profile'}
          </h3>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-sadu-charcoal block mb-1">
              {isAr ? 'اسم الفنان بالإنجليزية' : 'Artist Name (English)'} *
            </label>
            <input
              type="text"
              required
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Nour Al-Huda Al-Bahrani"
              className="w-full p-2.5 bg-sadu-sand/40 border border-sadu-gold rounded-md focus:border-sadu-brick focus:outline-hidden text-sadu-charcoal"
            />
          </div>

          <div>
            <label className="font-semibold text-sadu-charcoal block mb-1">
              {isAr ? 'اسم الفنان بالعربية' : 'Artist Name (Arabic)'} *
            </label>
            <input
              type="text"
              required
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="مثال: نور الهدى البحراني"
              className="w-full p-2.5 bg-sadu-sand/40 border border-sadu-gold rounded-md focus:border-sadu-brick focus:outline-hidden text-sadu-charcoal"
            />
          </div>

          <div>
            <label className="font-semibold text-sadu-charcoal block mb-1">
              {isAr ? 'الجنسية' : 'Nationality'} *
            </label>
            <input
              type="text"
              required
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              placeholder="e.g. Bahraini / بحرينية"
              className="w-full p-2.5 bg-sadu-sand/40 border border-sadu-gold rounded-md focus:border-sadu-brick focus:outline-hidden text-sadu-charcoal"
            />
            <p className="text-[11px] text-sadu-brick font-medium mt-1">
              {isAr
                ? 'حقل تجريبي فقط. لا توجد معالجة تأشيرات أو إحالة خارجية.'
                : 'Sample field only. No visa processing or external routing.'}
            </p>
          </div>

          <div>
            <label className="font-semibold text-sadu-charcoal block mb-1">
              {isAr ? 'بلد الإقامة الحالي' : 'Current Residence'} *
            </label>
            <input
              type="text"
              required
              value={residence}
              onChange={(e) => setResidence(e.target.value)}
              placeholder="e.g. Manama, Kingdom of Bahrain"
              className="w-full p-2.5 bg-sadu-sand/40 border border-sadu-gold rounded-md focus:border-sadu-brick focus:outline-hidden text-sadu-charcoal"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: DIGITAL FOOTPRINT */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-sadu-gold/30 pb-2">
          <span className="w-6 h-6 rounded-full bg-sadu-brick text-white text-xs font-bold flex items-center justify-center font-mono">
            {formatNumber(2)}
          </span>
          <h3 className="font-editorial text-base font-bold text-sadu-charcoal">
            {isAr ? 'البصمة الرقمية ومجال التخصص (Digital Footprint & Practice)' : 'Section 2: Digital Footprint & Practice'}
          </h3>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-sadu-charcoal block mb-1">
              {isAr ? 'الوسيط الفني الأساسي' : 'Primary Medium / Discipline'} *
            </label>
            <input
              type="text"
              required
              value={primaryMedium}
              onChange={(e) => setPrimaryMedium(e.target.value)}
              placeholder="e.g. Classical Thuluth / Contemporary Calligraffiti"
              className="w-full p-2.5 bg-sadu-sand/40 border border-sadu-gold rounded-md focus:border-sadu-brick focus:outline-hidden text-sadu-charcoal"
            />
          </div>

          <div>
            <label className="font-semibold text-sadu-charcoal block mb-1 flex items-center gap-1">
              <Instagram className="w-3.5 h-3.5 text-sadu-brick" />
              <span>{isAr ? 'حساب إنستغرام' : 'Instagram Handle'}</span>
            </label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@artist_handle"
              className="w-full p-2.5 bg-sadu-sand/40 border border-sadu-gold rounded-md focus:border-sadu-brick focus:outline-hidden text-sadu-charcoal"
            />
          </div>

          <div>
            <label className="font-semibold text-sadu-charcoal block mb-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-sadu-ink" />
              <span>{isAr ? 'الموقع الإلكتروني / المعرض الرقمي' : 'Website Portfolio'}</span>
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://artistportfolio.com"
              className="w-full p-2.5 bg-sadu-sand/40 border border-sadu-gold rounded-md focus:border-sadu-brick focus:outline-hidden text-sadu-charcoal"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: ARCHIVAL DOCUMENTS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-sadu-gold/30 pb-2">
          <span className="w-6 h-6 rounded-full bg-sadu-brick text-white text-xs font-bold flex items-center justify-center font-mono">
            {formatNumber(3)}
          </span>
          <h3 className="font-editorial text-base font-bold text-sadu-charcoal">
            {isAr ? 'الوثائق الأرشيفية المرفقة (Archival Documents)' : 'Section 3: Archival Documents'}
          </h3>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* CV Attachment Box */}
          <div
            onClick={() => {
              if (!cvFile) {
                setCvFile({ name: `${nameEn.replace(/\s+/g, '_')}_Curatorial_CV.pdf`, size: '2.1 MB' });
              }
            }}
            className={`p-4 rounded-lg border-2 border-dashed transition-all cursor-pointer flex flex-col justify-between min-h-[120px] ${
              cvFile
                ? 'border-sadu-sage bg-sadu-sage-light/40'
                : 'border-sadu-gold bg-sadu-sand/30 hover:bg-sadu-sand/60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FileText className={`w-5 h-5 ${cvFile ? 'text-sadu-sage' : 'text-sadu-brick'}`} />
                <div>
                  <span className="font-bold text-xs text-sadu-charcoal block">
                    {isAr ? 'السيرة الذاتية الفنية والمعارض السابقة (CV)' : 'Curatorial Curriculum Vitae (CV)'}
                  </span>
                  <span className="text-[11px] text-sadu-muted">
                    {isAr ? 'ملف PDF تجريبي؛ لم يُتحقق من المحتوى أو الأصالة' : 'PDF sample; content and authenticity unchecked'}
                  </span>
                </div>
              </div>
              {cvFile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCvFile(null);
                  }}
                  className="text-sadu-muted hover:text-sadu-brick text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {cvFile ? (
              <div className="mt-2 flex items-center justify-between text-xs font-mono text-sadu-ink bg-white/70 p-2 rounded border border-sadu-sage/40">
                <span className="truncate max-w-[200px]">{cvFile.name}</span>
                <span className="text-[10px] text-sadu-sage font-bold">✓ {cvFile.size}</span>
              </div>
            ) : (
              <div className="mt-2 text-center text-xs text-sadu-muted flex items-center justify-center gap-1.5 py-2">
                <UploadCloud className="w-4 h-4 text-sadu-brick" />
                <span>{isAr ? 'اضغط لربط السيرة الذاتية (PDF)' : 'Click to attach CV (PDF)'}</span>
              </div>
            )}
          </div>

          {/* Portfolio Attachment Box */}
          <div
            onClick={() => {
              if (!portfolioFile) {
                setPortfolioFile({ name: `${nameEn.replace(/\s+/g, '_')}_Portfolio_Selected_Works.pdf`, size: '12.4 MB' });
              }
            }}
            className={`p-4 rounded-lg border-2 border-dashed transition-all cursor-pointer flex flex-col justify-between min-h-[120px] ${
              portfolioFile
                ? 'border-sadu-sage bg-sadu-sage-light/40'
                : 'border-sadu-gold bg-sadu-sand/30 hover:bg-sadu-sand/60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FileText className={`w-5 h-5 ${portfolioFile ? 'text-sadu-sage' : 'text-sadu-brick'}`} />
                <div>
                  <span className="font-bold text-xs text-sadu-charcoal block">
                    {isAr ? 'ملف الأعمال الفنية السابقة (Previous Works Portfolio)' : 'Previous Works Portfolio (PDF)'}
                  </span>
                  <span className="text-[11px] text-sadu-muted">
                    {isAr ? 'كتالوج نماذج الخط والتجهيزات السابقة' : 'Dossier of prior calligraphy & installations'}
                  </span>
                </div>
              </div>
              {portfolioFile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPortfolioFile(null);
                  }}
                  className="text-sadu-muted hover:text-sadu-brick text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {portfolioFile ? (
              <div className="mt-2 flex items-center justify-between text-xs font-mono text-sadu-ink bg-white/70 p-2 rounded border border-sadu-sage/40">
                <span className="truncate max-w-[200px]">{portfolioFile.name}</span>
                <span className="text-[10px] text-sadu-sage font-bold">✓ {portfolioFile.size}</span>
              </div>
            ) : (
              <div className="mt-2 text-center text-xs text-sadu-muted flex items-center justify-center gap-1.5 py-2">
                <UploadCloud className="w-4 h-4 text-sadu-brick" />
                <span>{isAr ? 'اضغط لربط ملف الأعمال (PDF)' : 'Click to attach Portfolio (PDF)'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: PROPOSED ARTWORKS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sadu-brick text-white text-xs font-bold flex items-center justify-center font-mono">
              {formatNumber(4)}
            </span>
            <h3 className="font-editorial text-base font-bold text-sadu-charcoal">
              {isAr ? 'قائمة الأعمال الفنية المقترحة للبينالي (Proposed Artworks)' : 'Section 4: Proposed Artworks for Biennial'}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleAddArtwork}
            className="px-3 py-1.5 text-xs font-semibold text-sadu-brick hover:bg-sadu-sand rounded border border-sadu-brick/40 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? '+ إضافة عمل فني' : '+ Add Artwork'}</span>
          </button>
        </div>

        <div className="space-y-4">
          {proposedArtworks.map((artwork, idx) => (
            <div
              key={artwork.id}
              className="p-4 bg-sadu-sand/40 border border-sadu-gold rounded-lg space-y-3 relative text-xs"
            >
              <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-2">
                <span className="font-bold text-sadu-ink flex items-center gap-1.5 font-mono">
                  <span>{isAr ? 'العمل الفني #' : 'Artwork #'}</span>
                  <span>{formatNumber(idx + 1)}</span>
                </span>

                {proposedArtworks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveArtwork(artwork.id)}
                    className="text-sadu-muted hover:text-red-700 flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'حذف' : 'Remove'}</span>
                  </button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-sadu-charcoal block mb-1">
                    {isAr ? 'عنوان العمل (إنجليزي)' : 'Title (English)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={artwork.titleEn}
                    onChange={(e) => handleUpdateArtwork(artwork.id, 'titleEn', e.target.value)}
                    placeholder="e.g. Diwani Transcriptions of Ocean Verses"
                    className="w-full p-2 bg-white border border-sadu-gold rounded focus:border-sadu-brick focus:outline-hidden text-sadu-charcoal"
                  />
                </div>

                <div>
                  <label className="font-semibold text-sadu-charcoal block mb-1">
                    {isAr ? 'عنوان العمل (عربي)' : 'Title (Arabic)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={artwork.titleAr}
                    onChange={(e) => handleUpdateArtwork(artwork.id, 'titleAr', e.target.value)}
                    placeholder="مثال: نقوش ديوانية في مديح البحر"
                    className="w-full p-2 bg-white border border-sadu-gold rounded focus:border-sadu-brick focus:outline-hidden text-sadu-charcoal"
                  />
                </div>

                <div>
                  <label className="font-semibold text-sadu-charcoal block mb-1">
                    {isAr ? 'الوسيط والمواد' : 'Medium & Technique'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={artwork.mediumEn}
                    onChange={(e) => handleUpdateArtwork(artwork.id, 'mediumEn', e.target.value)}
                    placeholder="e.g. Bronze casting, mulberry paper, natural ink"
                    className="w-full p-2 bg-white border border-sadu-gold rounded focus:border-sadu-brick focus:outline-hidden text-sadu-charcoal"
                  />
                </div>

                <div>
                  <label className="font-semibold text-sadu-charcoal block mb-1">
                    {isAr ? 'الأبعاد التقديرية (سم)' : 'Estimated Dimensions (cm)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={artwork.dimensions}
                    onChange={(e) => handleUpdateArtwork(artwork.id, 'dimensions', e.target.value)}
                    placeholder="e.g. 180 × 120 × 8 cm"
                    className="w-full p-2 bg-white border border-sadu-gold rounded focus:border-sadu-brick focus:outline-hidden text-sadu-charcoal font-mono"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SUBMISSION FOOTER */}
      <div className="pt-4 border-t border-sadu-gold flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-sadu-muted">
          <span className="font-semibold text-sadu-charcoal block">
            {isAr ? 'المسار الإداري المباشر:' : 'Direct Institutional Routing:'}
          </span>
          {isAr
            ? 'يُنشئ معاينة محلية تجريبية فقط؛ دون إرسال أو مراجعة رسمية.'
            : 'Creates a local sample preview only; no transmission or formal review.'}
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto px-8 py-3 text-xs font-bold text-white bg-sadu-brick hover:bg-sadu-brick-dark rounded-md transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <Stamp className="w-4 h-4" />
          <span>{isAr ? 'إحالة للتحقق الثقافي' : 'Route for Cultural Verification'}</span>
        </button>
      </div>
    </form>
  );
};
