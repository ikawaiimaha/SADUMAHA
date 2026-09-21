import React, { useId, useState } from 'react';
import { NativeModal } from './common/NativeModal';
import { Language, ExhibitionProgramme } from '../types';
import { ARTWORKS, INSTITUTIONAL_INFO } from '../data/mockData';
import { useI18n } from '../context/I18nContext';
import { LOCALES } from '../i18n/locales';
import { SignaturePanel } from './common/dashboard';
import { 
  FileSignature, 
  X, 
  CheckCircle2, 
  DollarSign, 
  ShieldCheck, 
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface NewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  selectedProgramme: ExhibitionProgramme;
  onContractCreated?: (contractData: {
    id: string;
    titleEn: string;
    titleAr: string;
    artistEn: string;
    artistAr: string;
  }) => void;
  onNavigateTab: (tab: 'contracts' | 'approved-scope') => void;
}

export const NewContractModal: React.FC<NewContractModalProps> = ({
  isOpen,
  onClose,
  lang,
  selectedProgramme,
  onContractCreated,
  onNavigateTab,
}) => {
  const titleId = useId();
  const i18n = useI18n();
  const currentLang = lang || i18n.lang;
  const isAr = currentLang === 'ar';
  const dict = LOCALES[currentLang].contracts;
  const common = LOCALES[currentLang].common;

  const [contractType, setContractType] = useState<'master' | 'schedule' | 'covenant' | 'milestone' | 'logistics'>('master');
  const [selectedArtist, setSelectedArtist] = useState('Youssef Nabhan');
  const [selectedArtwork, setSelectedArtwork] = useState(ARTWORKS[0].id);
  const [advancePercent, setAdvancePercent] = useState('30');
  const [honorariumAmount, setHonorariumAmount] = useState('45,000');
  const [hasExclusionClause, setHasExclusionClause] = useState(true);
  const [hasTechnicalConditionGate, setHasTechnicalConditionGate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedContractId, setGeneratedContractId] = useState('');
  const [signatureToast, setSignatureToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const contractTypes = [
    {
      id: 'master' as const,
      title: dict.types.master.title,
      desc: dict.types.master.desc,
      codePrefix: dict.types.master.codePrefix,
    },
    {
      id: 'schedule' as const,
      title: dict.types.schedule.title,
      desc: dict.types.schedule.desc,
      codePrefix: dict.types.schedule.codePrefix,
    },
    {
      id: 'covenant' as const,
      title: dict.types.covenant.title,
      desc: dict.types.covenant.desc,
      codePrefix: dict.types.covenant.codePrefix,
    },
    {
      id: 'milestone' as const,
      title: dict.types.milestone.title,
      desc: dict.types.milestone.desc,
      codePrefix: dict.types.milestone.codePrefix,
    },
    {
      id: 'logistics' as const,
      title: dict.types.logistics.title,
      desc: dict.types.logistics.desc,
      codePrefix: dict.types.logistics.codePrefix,
    },
  ];

  const currentTypeMeta = contractTypes.find(t => t.id === contractType) || contractTypes[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const contractCode = `${currentTypeMeta.codePrefix}-${randomSuffix}`;
    setGeneratedContractId(contractCode);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      onContractCreated?.({
        id: contractCode,
        titleEn: LOCALES.en.contracts.types[contractType].title,
        titleAr: LOCALES.ar.contracts.types[contractType].title,
        artistEn: selectedArtist,
        artistAr: selectedArtist === 'Youssef Nabhan' ? 'يوسف نبهان' : selectedArtist,
      });
    }, 600);
  };

  const handleFinish = () => {
    setIsSuccess(false);
    onClose();
    onNavigateTab('contracts');
  };

  const showSignatureToast = (message: string) => {
    setSignatureToast(message);
    window.setTimeout(() => setSignatureToast(null), 3500);
  };

  const handleUaePass = () => {
    showSignatureToast(isAr ? 'تمت محاكاة التحقق من الهوية عبر UAE PASS للتجربة' : 'UAE PASS Identity Check Simulated for Demo');
  };

  const handleGlobalEcdsa = () => {
    showSignatureToast(isAr ? 'تم بدء بوابة التوقيع الإلكتروني العالمي للتجربة' : 'Global e-Signature Gateway Initiated');
  };

  return (
    <NativeModal isOpen={isOpen} onClose={onClose} labelledBy={titleId} className="max-w-2xl" returnFocusSelector="[data-workspace-search]">
      <div 
        className="w-full max-w-2xl bg-sadu-linen border-2 border-sadu-gold rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-sadu-sand border-b border-sadu-gold px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-md bg-sadu-brick text-white shrink-0">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sadu-brick leading-relaxed">
                  {dict.modalBadge}
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-sadu-linen border border-sadu-gold text-sadu-ink">
                  {dict.institutionalTag}
                </span>
              </div>
              <h2 id={titleId} className="text-lg font-editorial font-bold text-sadu-charcoal leading-snug">
                {dict.modalTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            data-modal-close
            aria-label={common.close}
            className="p-2 rounded-md text-sadu-muted hover:text-sadu-charcoal hover:bg-sadu-linen transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {signatureToast && (
          <div
            role="status"
            aria-live="polite"
            className="mx-6 mt-4 flex items-center gap-2 rounded-md border border-sadu-sage bg-sadu-sage-light px-3 py-2 text-xs font-semibold text-sadu-ink"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-sadu-sage" />
            <span>{signatureToast}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {isSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-sadu-sage-light border-2 border-sadu-sage text-sadu-sage flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="font-mono font-bold text-xs text-sadu-ink bg-sadu-sand px-3 py-1 rounded border border-sadu-gold">
                  {generatedContractId}
                </span>
                <h3 className="text-lg font-editorial font-bold text-sadu-charcoal mt-2">
                  {onContractCreated ? dict.successTitle : (isAr ? 'تم إعداد معاينة الطلب التجريبي' : 'Sample request preview prepared')}
                </h3>
                <p className="text-xs text-sadu-muted max-w-md mx-auto mt-1 leading-relaxed">
                  {onContractCreated ? dict.successDesc : (isAr ? 'هذه معاينة مؤقتة؛ لم يُحفظ عقد ولم يُرسل طلب اعتماد.' : 'This is a temporary preview. No contract was saved or sent for approval.')}
                </p>
              </div>

              <div className="p-4 bg-sadu-sand rounded-lg border border-sadu-gold text-start max-w-md mx-auto space-y-2">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-sadu-muted">{dict.firstPartyLabel}</span>
                  <span className="font-bold text-sadu-ink">{isAr ? INSTITUTIONAL_INFO.directorAr : INSTITUTIONAL_INFO.directorEn}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-sadu-muted">{dict.secondPartyLabel}</span>
                  <span className="font-bold text-sadu-brick">{selectedArtist}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-sadu-muted">{dict.initialStateLabel}</span>
                  <span className="font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                    {dict.initialStateVal}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-5 py-2.5 bg-sadu-ink text-white font-bold rounded-lg hover:bg-sadu-ink-dark transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span>{dict.jumpToLedgerBtn}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Target Programme Context */}
              <div className="p-3 bg-sadu-sand rounded-lg border border-sadu-gold flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-sadu-muted uppercase block">{dict.targetProgrammeLabel}</span>
                  <span className="font-bold text-sadu-charcoal text-sm">{isAr ? selectedProgramme.titleAr : selectedProgramme.titleEn}</span>
                </div>
                <span className="font-mono text-[11px] text-sadu-brick bg-sadu-linen px-2 py-1 rounded border border-sadu-gold">
                  {selectedProgramme.id}
                </span>
              </div>

              {/* Step 1: Instrument Type Selector */}
              <fieldset className="min-w-0">
                <legend className="font-bold text-sadu-charcoal block mb-2">
                  {dict.step1Title}
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {contractTypes.map((type) => (
                    <label
                      key={type.id}
                      className={`contract-instrument p-3 rounded-lg border text-start transition-all cursor-pointer ${
                        contractType === type.id
                          ? 'bg-sadu-sand border-sadu-brick ring-2 ring-sadu-brick/40 shadow-xs'
                          : 'bg-sadu-linen border-sadu-gold hover:border-sadu-ink/50'
                      }`}
                    >
                      <input type="radio" className="sr-only" name={`${titleId}-instrument`} value={type.id}
                        checked={contractType === type.id} onChange={() => setContractType(type.id)}
                        aria-labelledby={`${titleId}-${type.id}-label`} aria-describedby={`${titleId}-${type.id}-description`}/>
                      <div className="flex items-center justify-between mb-1">
                        <span id={`${titleId}-${type.id}-label`} className="font-bold text-sadu-charcoal">{type.title}</span>
                        {contractType === type.id && <CheckCircle2 className="w-4 h-4 text-sadu-brick shrink-0" />}
                      </div>
                      <p id={`${titleId}-${type.id}-description`} className="text-[11px] text-sadu-muted leading-relaxed">
                        {type.desc}
                      </p>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Step 2: Participating Artist & Artwork Anchor */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${titleId}-artist`} className="font-bold text-sadu-charcoal block mb-1">
                    {dict.step2Title}
                  </label>
                  <select
                    id={`${titleId}-artist`}
                    value={selectedArtist}
                    onChange={(e) => setSelectedArtist(e.target.value)}
                    className="w-full p-2.5 rounded-md bg-sadu-sand border border-sadu-gold text-sadu-charcoal text-xs font-semibold focus:outline-hidden focus:border-sadu-brick"
                  >
                    <option value="Youssef Nabhan">{isAr ? 'يوسف نبهان (معرض شخصي)' : 'Youssef Nabhan (Solo Exhibition)'}</option>
                    <option value="Dr. Najat Makki">{isAr ? 'د. نجاة مكي (تكليف بينالي)' : 'Dr. Najat Makki (Biennial Commission)'}</option>
                    <option value="Abdul Qader Al Rais">{isAr ? 'عبد القادر الريس (مقتنيات دائمة)' : 'Abdul Qader Al Rais (Permanent Collection)'}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={`${titleId}-artwork`} className="font-bold text-sadu-charcoal block mb-1">
                    {dict.artworkAnchorLabel}
                  </label>
                  <select
                    id={`${titleId}-artwork`}
                    value={selectedArtwork}
                    onChange={(e) => setSelectedArtwork(e.target.value)}
                    className="w-full p-2.5 rounded-md bg-sadu-sand border border-sadu-gold text-sadu-charcoal text-xs font-semibold focus:outline-hidden focus:border-sadu-brick"
                  >
                    {ARTWORKS.map(art => (
                      <option key={art.id} value={art.id}>
                        {art.canonicalCode} · {isAr ? art.titleAr : art.titleEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 3: Fiscal & Disbursement Clauses */}
              <div className="p-4 bg-sadu-sand/60 rounded-lg border border-sadu-gold space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sadu-charcoal flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-sadu-brick" />
                    <span>{dict.step3Title}</span>
                  </span>
                  <span className="text-[11px] font-mono text-sadu-muted">
                    AED / USD Gated
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={`${titleId}-honorarium`} className="text-[11px] text-sadu-muted block mb-1">{dict.totalHonorariumLabel}</label>
                    <div className="relative">
                      <input
                        type="text"
                        id={`${titleId}-honorarium`}
                        value={honorariumAmount}
                        onChange={(e) => setHonorariumAmount(e.target.value)}
                        className="w-full p-2 rounded bg-sadu-linen border border-sadu-gold text-sadu-charcoal font-mono font-bold text-xs"
                      />
                      <span className="absolute end-2.5 top-2 text-[10px] text-sadu-muted font-mono font-bold">USD</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`${titleId}-advance`} className="text-[11px] text-sadu-muted block mb-1">{dict.advanceHoldLabel}</label>
                    <select
                      id={`${titleId}-advance`}
                      value={advancePercent}
                      onChange={(e) => setAdvancePercent(e.target.value)}
                      className="w-full p-2 rounded bg-sadu-linen border border-sadu-gold text-sadu-charcoal font-mono font-bold text-xs"
                    >
                      <option value="20">{dict.advanceOption20}</option>
                      <option value="30">{dict.advanceOption30}</option>
                      <option value="50">{dict.advanceOption50}</option>
                    </select>
                  </div>
                </div>

                {/* Scenario checkboxes */}
                <div className="pt-2 space-y-2 border-t border-sadu-gold/40">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasExclusionClause}
                      onChange={(e) => setHasExclusionClause(e.target.checked)}
                      className="mt-1 rounded text-sadu-brick focus:ring-sadu-brick"
                    />
                    <span className="text-[11px] text-sadu-charcoal leading-relaxed">
                      <strong>{dict.section4Title}</strong> · {dict.section4Desc}
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasTechnicalConditionGate}
                      onChange={(e) => setHasTechnicalConditionGate(e.target.checked)}
                      className="mt-1 rounded text-sadu-brick focus:ring-sadu-brick"
                    />
                    <span className="text-[11px] text-sadu-charcoal leading-relaxed">
                      <strong>{dict.gateMilestone2Title}</strong> · {dict.gateMilestone2Desc}
                    </span>
                  </label>
                </div>
              </div>

              <SignaturePanel
                titleEn="Digital Signature"
                titleAr="التوقيع الرقمي"
                lang={currentLang}
                onUaePass={handleUaePass}
                onGlobalEcdsa={handleGlobalEcdsa}
              />

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                <span className="text-[11px] text-sadu-muted flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sadu-sage shrink-0" />
                  <span>{dict.validationNotice}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-md bg-sadu-sand border border-sadu-gold text-sadu-charcoal font-semibold hover:bg-sadu-gold/20 transition-colors cursor-pointer"
                  >
                    {dict.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-md bg-sadu-brick text-white font-bold hover:bg-sadu-brick-dark transition-colors cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>{dict.submittingBtn}</span>
                    ) : (
                      <>
                        <FileSignature className="w-4 h-4" />
                        <span>{dict.submitBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </NativeModal>
  );
};
