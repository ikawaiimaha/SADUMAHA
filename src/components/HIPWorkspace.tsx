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
  guidelinesArabic?: string;
  translationStatus?: TranslationStatus;
  onSubmitToEditorial?: (arabicText: string) => void;
  curatorialBrief?: string;
  onUpdateCuratorialBrief?: (brief: string) => void;
  blocklist: string[];
  onUpdateBlocklist: (tags: string[]) => void;
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
  translationStatus = 'DRAFT',
  onSubmitToEditorial,
  curatorialBrief,
  onUpdateCuratorialBrief,
  blocklist,
  onUpdateBlocklist,
  ratifiedTheme,
  onBackToRoles,
}) => {
  const [arabicText, setArabicText] = useState<string>(
    guidelinesArabic || curatorialBrief || ''
  );
  const [status, setStatus] = useState<TranslationStatus>(translationStatus);
  const [newTagInput, setNewTagInput] = useState<string>('');

  const handleSubmitToEditorial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!arabicText.trim()) return;
    setStatus('PENDING_TRANSLATION');
    onSubmitToEditorial?.(arabicText);
    onUpdateCuratorialBrief?.(arabicText);
  };

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if (blocklist.some(t => t.toLowerCase() === trimmed.toLowerCase())) return;
    onUpdateBlocklist([...blocklist, trimmed]);
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateBlocklist(blocklist.filter(t => t.toLowerCase() !== tagToRemove.toLowerCase()));
  };

  const isLocked = status === 'PENDING_TRANSLATION' || status === 'PUBLISHED';

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
              <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-brick uppercase tracking-wider border border-sadu-gold/60">
                Stage 2: Curatorial Directives & Dynamic Blocklists
              </span>
              <h1 className="font-editorial text-2xl font-bold text-sadu-charcoal sm:text-3xl mt-1">
                Head of International Programs (HIP)
              </h1>
              <p className="text-xs font-semibold text-sadu-brick" dir="rtl">
                منسق معرض عام · إدارة التوجيهات والقائمة المحظورة
              </p>
            </div>
          </div>
          {onBackToRoles && (
            <button
              type="button"
              onClick={onBackToRoles}
              className="rounded-md border border-sadu-gold bg-sadu-sand px-3 py-1.5 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/20 cursor-pointer"
            >
              Back to Role Selection
            </button>
          )}
        </div>
      </div>
      {ratifiedTheme && (
        <div className="rounded-md border border-sadu-gold/50 bg-white p-3 text-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-sadu-muted block">Ratified Biennial Theme Reference</span>
            <span className="font-editorial text-sm font-bold text-sadu-charcoal">{ratifiedTheme.englishName}</span>
            <span dir="rtl" className="text-xs font-semibold text-sadu-brick ml-2">{ratifiedTheme.arabicName}</span>
          </div>
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            Chairman Signed Off
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Curatorial Brief - Arabic Guidelines & Editorial Routing */}
        <div className="rounded-xl border border-sadu-gold bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-sadu-brick" />
              <div>
                <h2 className="font-editorial text-lg font-bold text-sadu-charcoal">Exhibition Guidelines (Arabic)</h2>
                <p className="text-xs text-sadu-muted">Drafted exclusively in Arabic &middot; Requires Editorial Translation</p>
              </div>
            </div>
            {isLocked && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                Status: Pending Editorial Translation
              </span>
            )}
          </div>

          <form onSubmit={handleSubmitToEditorial} className="space-y-3">
            <label htmlFor="exhibition-guidelines-arabic" className="block text-xs font-semibold text-sadu-charcoal">
              <span>Exhibition Guidelines (Arabic)</span>
              <span className="block font-normal text-[11px] text-sadu-muted mt-0.5">
                HIP must draft the curatorial brief in Arabic before submitting to the Editorial Department.
              </span>
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
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900 flex items-start gap-2.5">
                <Lock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Status: Pending Editorial Translation</strong>
                  <p className="text-[11px] text-amber-800 font-normal mt-0.5">
                    Draft is locked. The Editorial Department is now authorized to draft the official English translation and publish the bilingual brief.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-sadu-muted">{arabicText.length} characters (Arabic)</span>
                <button
                  type="submit"
                  disabled={!arabicText.trim()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-sadu-brick px-4 py-2 text-xs font-bold text-white hover:bg-sadu-brick-dark disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit to Editorial for Translation</span>
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
                <h2 className="font-editorial text-lg font-bold text-sadu-charcoal">Dynamic Blocklist</h2>
                <p className="text-xs text-sadu-muted">Restricts nationalities, mediums or real-time directives</p>
              </div>
            </div>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">
              {blocklist.length} Blocked Tags
            </span>
          </div>

          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <strong className="block font-bold">Enforcement Gate:</strong>
              If a Coordinator submits an artist matching any active tag below, the system immediately rejects with:
              <span className="block mt-1 font-mono font-bold text-red-700 bg-white/70 px-2 py-0.5 rounded border border-red-200">
                "Submission blocked by current HIP security/administrative directives."
              </span>
            </div>
          </div>

          {/* Add Tag */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-sadu-muted" />
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
                placeholder="e.g. Restricted Nationality: Country X"
                className="w-full rounded-md border border-sadu-gold/60 py-2 pl-9 pr-3 text-xs text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
              />
            </div>
            <button
              type="button"
              onClick={() => handleAddTag(newTagInput)}
              disabled={!newTagInput.trim()}
              className="inline-flex items-center gap-1 rounded-md bg-sadu-brick px-3.5 py-2 text-xs font-bold text-white hover:bg-sadu-brick-dark disabled:opacity-50 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Tag</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="block text-[11px] font-semibold text-sadu-muted mb-1">Quick Directives:</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_DIRECTIVES.map(preset => {
                const isAdded = blocklist.some(t => t.toLowerCase() === preset.toLowerCase());
                return (
                  <button
                    key={preset}
                    type="button"
                    disabled={isAdded}
                    onClick={() => handleAddTag(preset)}
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                      isAdded
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        : 'bg-sadu-sand text-sadu-charcoal border border-sadu-gold/60 hover:bg-sadu-brick hover:text-white cursor-pointer'
                    }`}
                  >
                    + {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tags */}
          <div className="space-y-1.5">
            <span className="block text-xs font-bold text-sadu-charcoal uppercase tracking-wider">
              Active Blocklist Tags ({blocklist.length})
            </span>
            {blocklist.length === 0 ? (
              <p className="rounded-md border border-dashed border-sadu-gold/60 p-3 text-center text-xs text-sadu-muted">
                No active restrictions. All compliant nominations will be admitted.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                {blocklist.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-900"
                  >
                    <ShieldAlert className="h-3 w-3 text-red-700" />
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-red-500 hover:text-red-800 cursor-pointer"
                      title="Remove restriction"
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
