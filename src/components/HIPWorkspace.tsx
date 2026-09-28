import { useLocalDraft, isText } from '../hooks/useLocalDraft';
import { useMockupText } from '../i18n/useMockupText';
import { useI18n } from '../context/I18nContext';
import React, { useState } from 'react';
import {
  ShieldAlert,
  Globe,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Lock,
  Send,
} from 'lucide-react';
import { ThemeItem } from './ChairmanWorkspace';

export type TranslationStatus = 'DRAFT' | 'PENDING_TRANSLATION' | 'PUBLISHED';

export interface HIPWorkspaceProps {
  themeStatus: string;
  themeEssayArabic?: string;
  themeEssayEnglish?: string;
  guidelinesEnglish?: string;
  guidelinesArabic?: string;
  translationStatus?: TranslationStatus;
  hipSubmissionTime?: string | null;
  onSubmitToEditorial?: (arabicText: string) => void;
  curatorialBrief?: string;
  onUpdateCuratorialBrief?: (brief: string) => void;
  blocklist: string[];
  restrictionPending?: boolean;
  restrictionAudit?: string[];
  onUpdateBlocklist: (tags: string[], reason: string) => void;
  ratifiedTheme?: ThemeItem | null;
  onBackToRoles?: () => void;
}

const PRESET_DIRECTIVES = [
  'Restricted Nationality: Country X',
  'Hazardous Medium: Open Flame',
  'Unverified Chemical Casting',
];

export const HIPWorkspace: React.FC<HIPWorkspaceProps> = ({
  guidelinesArabic,
  themeStatus,
  themeEssayArabic,
  themeEssayEnglish,
  guidelinesEnglish,
  translationStatus,
  hipSubmissionTime,
  onSubmitToEditorial,
  curatorialBrief,
  onUpdateCuratorialBrief,
  blocklist,
  onUpdateBlocklist,
  restrictionPending,
  restrictionAudit = [],
  ratifiedTheme,
  onBackToRoles,
}) => {
  const tr = useMockupText();
  const { isAr } = useI18n();
  const [arabicText, setArabicText, saveFailed] = useLocalDraft<string>(`sadu:draft:v1:hip:${themeEssayArabic || ''}`, guidelinesArabic || curatorialBrief || '', isText);
  const [restrictionReason, setRestrictionReason] = useState('');
  const [newTagInput, setNewTagInput] = useState<string>('');

  const handleSubmitToEditorial = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !arabicText.trim() || !onSubmitToEditorial) return;
    onSubmitToEditorial?.(arabicText);
    onUpdateCuratorialBrief?.(arabicText);
  };

  const handleAddTag = (tagToAdd: string) => {
    if (!restrictionReason.trim() || restrictionPending) return;
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if (blocklist.some(t => t.toLowerCase() === trimmed.toLowerCase())) return;
    onUpdateBlocklist([...blocklist, trimmed], restrictionReason);
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!restrictionReason.trim() || restrictionPending) return;
    onUpdateBlocklist(blocklist.filter(t => t.toLowerCase() !== tagToRemove.toLowerCase()), restrictionReason);
  };

  const isLocked = themeStatus !== 'PUBLISHED_OFFICIAL';
  const lockReason = (() => {
    if (themeStatus === 'ARABIC_LOCKED') {
      return {
        title: isAr ? 'الحالة: بانتظار ترجمة قسم التحرير' : 'Status: Pending Editorial Translation',
        description: isAr ? 'بانتظار إكمال قسم التحرير للترجمة الإنجليزية ونشر الثيمة الرسمية.' : 'Waiting for Editorial to complete the English translation and publish the official theme.',
      };
    }
    if (themeStatus === 'CHAIRMAN_APPROVED' || themeStatus === 'PENDING_EDITORIAL_POLISH') {
      return {
        title: isAr ? 'الحالة: بانتظار الصياغة المؤسسية' : 'Status: Pending Editorial Refinement',
        description: isAr ? 'اعتمد رئيس الدائرة الثيمة. بانتظار قسم التحرير لإتمام الصياغة المؤسسية والنشر.' : 'The Chairman has ratified the theme. Waiting for Editorial to complete institutional refinement and publication.',
      };
    }
    return {
      title: isAr ? 'الحالة: بانتظار اعتماد ونشر الثيمة الرسمية' : 'Status: Pending Official Theme Ratification & Publication',
      description: isAr ? 'لم تكتمل إجراءات اعتماد الثيمة ونشرها. يُفتح إعداد الدليل بعد النشر الرسمي.' : 'Theme ratification and publication are not yet complete. Guidelines become available after official publication.',
    };
  })();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-sadu-gold bg-sadu-paper p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-sadu-gold/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sadu-brick text-white shadow-xs">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <span role="status" className="block text-sm text-[#736357]">{saveFailed ? (isAr ? 'تعذر حفظ المسودة محلياً' : 'Local draft save failed') : (isAr ? 'المسودة محفوظة في هذا المتصفح فقط' : 'Draft saved in this browser only')}</span><span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-brick uppercase tracking-wider border border-sadu-gold/60"> {isAr ? 'المرحلة 3 · التوجيهات الفنية' : 'Stage 3 · Curatorial guidelines'} </span>
              <h1 className="font-editorial text-2xl font-bold text-sadu-charcoal sm:text-3xl mt-1">
                {isAr ? 'منسق معرض عام' : 'Head of International Programs (HIP)'}
              </h1>
              <p className="text-xs font-semibold text-sadu-brick" dir="rtl">
                منسق معرض عام · صياغة الدليل التنسيقي والقائمة المحظورة
              </p>
            </div>
          </div>
          {onBackToRoles && (
            <button
              type="button"
              onClick={onBackToRoles}
              className="rounded-md border border-sadu-gold bg-sadu-sand px-3 py-1.5 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/20 cursor-pointer"
            > {tr("Back to Role Selection")} </button>
          )}
        </div>
      </div>
      {ratifiedTheme && (
        <div className="rounded-md border border-sadu-gold/50 bg-white p-3 text-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-sadu-muted block">{tr("Ratified Biennial Theme Reference")}</span>
            <span className="font-editorial text-sm font-bold text-sadu-charcoal">{isAr ? ratifiedTheme.arabicName : ratifiedTheme.englishName}</span>
            <span hidden={isAr} dir="rtl" className="text-xs font-semibold text-sadu-brick ms-2">{ratifiedTheme.arabicName}</span>
          </div>
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800"> {tr("Chairman Signed Off")} </span>
        </div>
      )}

      {ratifiedTheme && <section aria-labelledby="executive-directives-heading" className="mb-6 rounded-xl border border-[#D9D2C5] bg-[#F7F1E6] ps-6 pe-6 py-5 text-start">
        <h2 id="executive-directives-heading" className="text-xl font-bold">{isAr ? 'التوجيهات التنفيذية' : 'Executive Directives'}</h2>
        <dl className="mt-4 space-y-4">
          <div>
            <dt className="font-semibold text-[#736357]">{isAr ? 'ملاحظات مدير الملتقى' : 'Director’s Advice'}</dt>
            <dd dir="auto" className="mt-2 whitespace-pre-wrap text-start text-lg leading-relaxed">{ratifiedTheme.directorNotes?.trim() || (isAr ? 'لا توجد ملاحظات إضافية.' : 'No additional advice recorded.')}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[#8B261E]">{isAr ? 'توجيهات رئيس الدائرة' : 'Chairman’s Mandate'}</dt>
            <dd dir="auto" className="mt-2 whitespace-pre-wrap text-start text-lg leading-relaxed">{ratifiedTheme.chairmanNotes?.trim() || (isAr ? 'لا توجد توجيهات إضافية.' : 'No additional directives recorded.')}</dd>
          </div>
        </dl>
      </section>}

      {!isLocked && <section aria-labelledby="published-theme-reference" className="rounded-xl border border-sadu-gold bg-[#F7F1E6] ps-6 pe-6 py-5 text-start space-y-3">
        <h2 id="published-theme-reference" className="font-editorial text-lg font-bold">{isAr ? 'الثيمة الرسمية المنشورة — مرجع للقراءة فقط' : 'Published Official Theme — Read-only Reference'}</h2>
        <p dir="rtl" className="whitespace-pre-wrap text-start text-sm">{themeEssayArabic}</p>
        <p dir="ltr" className="whitespace-pre-wrap text-start text-sm">{themeEssayEnglish}</p>
      </section>}
      {translationStatus === 'PUBLISHED' && guidelinesEnglish && <section className="rounded-xl border border-sadu-gold bg-white ps-6 pe-6 py-5 text-start">
        <h2 className="font-bold">{isAr ? 'الدليل الثنائي اللغة المنشور' : 'Published Bilingual Guidelines'}</h2>
        <p dir="rtl" className="mt-3 whitespace-pre-wrap text-start">{guidelinesArabic}</p>
        <p dir="ltr" className="mt-3 whitespace-pre-wrap text-start">{guidelinesEnglish}</p>
      </section>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Curatorial Brief - Arabic Guidelines & Editorial Routing */}
        <div className="rounded-xl border border-sadu-gold bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-sadu-brick" />
              <div>
                <h2 className="font-editorial text-lg font-bold text-sadu-charcoal">{tr("Exhibition Guidelines (Arabic)")}</h2>
                <p className="text-xs text-sadu-muted">{tr("Drafted exclusively in Arabic · Requires Editorial Translation")}</p>
              </div>
            </div>
            {isLocked && (
              <span className="rounded bg-amber-100 ps-2 pe-2 py-0.5 text-start text-[10px] font-bold text-amber-900 border border-amber-300"> {lockReason.title} </span>
            )}
          </div>

          {translationStatus === 'PENDING_TRANSLATION' && <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 ps-4 pe-4 py-3 text-start text-emerald-900">
            <p className="font-semibold">{isAr ? 'تم الإرسال إلى قسم التحرير بنجاح' : 'Successfully Sent to Editorial'}</p>
            <span>{hipSubmissionTime}</span>
          </div>}
          <form onSubmit={handleSubmitToEditorial} className="space-y-3">
            <label htmlFor="exhibition-guidelines-arabic" className="block text-xs font-semibold text-sadu-charcoal">
              <span>{tr("Exhibition Guidelines (Arabic)")}</span>
              <span className="block font-normal text-[11px] text-sadu-muted mt-0.5"> {tr("HIP must draft the curatorial brief in Arabic before submitting to the Editorial Department.")} </span>
              <textarea
                id="exhibition-guidelines-arabic"
                dir="rtl"
                rows={7}
                required
                disabled={isLocked}
                value={arabicText}
                onChange={e => setArabicText(e.target.value)}
                placeholder="اكتب التوجيهات الفنية والمعايير التنسيقية للمعرض باللغة العربية حصراً..."
                className={`mt-1.5 w-full rounded-md border p-3 text-xs leading-relaxed ${
                  isLocked
                    ? 'border-gray-300 bg-gray-50 text-gray-700 cursor-not-allowed'
                    : 'border-sadu-gold/60 bg-white text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick'
                }`}
              />
            </label>

            {/* Locked Status Badge or Action Button */}
            {isLocked ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 ps-3 pe-3 py-3 text-start text-xs font-semibold text-amber-900 flex items-start gap-2.5">
                <Lock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">{lockReason.title}</strong>
                  <p className="text-[11px] text-amber-800 font-normal mt-0.5"> {lockReason.description} </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-sadu-muted">{arabicText.length} {tr("characters (Arabic)")}</span>
                <button
                  type="submit"
                  disabled={isLocked}
                  className="inline-flex items-center gap-1.5 rounded-md bg-sadu-brick px-4 py-2 text-xs font-bold text-white hover:bg-sadu-brick-dark disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{tr("Submit to Editorial for Translation")}</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Dynamic Blocklist */}
        <div className="rounded-xl border border-sadu-gold bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-sadu-brick" />
              <div>
                <h2 className="font-editorial text-lg font-bold text-sadu-charcoal">{tr("Dynamic Blocklist")}</h2>
                <p className="text-xs text-sadu-muted">{tr("Restricts nationalities, mediums or real-time directives")}</p>
              </div>
            </div>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">
              {blocklist.length} {tr("Blocked Tags")} </span>
          </div>

          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <strong className="block font-bold">{tr("Enforcement Gate:")}</strong> {tr("If a Coordinator submits an artist matching any active tag below, the system immediately rejects with:")} <span className="block mt-1 font-mono font-bold text-red-700 bg-white/70 px-2 py-0.5 rounded border border-red-200"> {tr("\"Submission blocked by current HIP security/administrative directives.\"")} </span>
            </div>
          </div>

          {/* Add Tag */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute start-3 top-2.5 h-3.5 w-3.5 text-sadu-muted" />
              <input
                type="text"
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(newTagInput);
                  }
                }}
                placeholder={tr("e.g. Restricted Nationality: Country X")}
                className="w-full rounded-md border border-sadu-gold/60 py-2 ps-9 pe-3 text-xs text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
              />
            </div>
            <button
              type="button"
              onClick={() => handleAddTag(newTagInput)}
              disabled={!newTagInput.trim() || restrictionPending || !restrictionReason.trim()}
              className="inline-flex items-center gap-1 rounded-md bg-sadu-brick px-3.5 py-2 text-xs font-bold text-white hover:bg-sadu-brick-dark disabled:opacity-50 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{tr("Add Tag")}</span>
            </button>
          </div>

          <label className="block text-sm">{isAr ? 'مبرر تعديل القيود — يتطلب موافقة المدير' : 'Restriction change reason — Director sign-off required'}<textarea value={restrictionReason} onChange={e => setRestrictionReason(e.target.value)} className="block w-full border border-sadu-gold ps-3 pe-3 py-2" /></label>
          <p role="status" className="text-sm">{restrictionPending ? (isAr ? 'طلب تعديل معلّق؛ القيود النشطة لم تتغير.' : 'Change pending; active restrictions remain unchanged.') : (isAr ? 'كل إضافة أو إزالة تُحال إلى المدير قبل التطبيق.' : 'Every addition or removal is proposed to the Director before activation.')}</p>
          {restrictionAudit.map((entry, index) => <p key={index} className="text-xs" dir="ltr">{entry}</p>)}
          {/* Quick Presets */}
          <div>
            <span className="block text-[11px] font-semibold text-sadu-muted mb-1">{tr("Quick Directives:")}</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_DIRECTIVES.map(preset => {
                const isAdded = blocklist.some(t => t.toLowerCase() === preset.toLowerCase());
                return (
                  <button
                    key={preset}
                    type="button"
                    disabled={isAdded || restrictionPending || !restrictionReason.trim()}
                    onClick={() => handleAddTag(preset)}
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                      isAdded
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        : 'bg-sadu-sand text-sadu-charcoal border border-sadu-gold/60 hover:bg-sadu-brick hover:text-white cursor-pointer'
                    }`}
                  >
                    + {tr(preset)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tags */}
          <div className="space-y-1.5">
            <span className="block text-xs font-bold text-sadu-charcoal uppercase tracking-wider"> {tr("Active Blocklist Tags (")}{blocklist.length})
            </span>
            {blocklist.length === 0 ? (
              <p className="rounded-md border border-dashed border-sadu-gold/60 p-3 text-center text-xs text-sadu-muted"> {tr("No active restrictions. All compliant nominations will be admitted.")} </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                {blocklist.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-900"
                  >
                    <ShieldAlert className="h-3 w-3 text-red-700" />
                    <span>{tr(tag)}</span>
                    <button
                      type="button"
                      disabled={restrictionPending || !restrictionReason.trim()}
                      onClick={() => handleRemoveTag(tag)}
                      className="ms-1 text-red-500 hover:text-red-800 cursor-pointer"
                      title={tr("Remove restriction")}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HIPWorkspace;
