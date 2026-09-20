import React, { useState } from 'react';
import { Language, ExhibitionProgramme, WorkspaceTab } from '../../types';
import { ARTWORKS, INSTITUTIONAL_INFO } from '../../data/mockData';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { StatusProgressIndicator } from '../common/StatusProgressIndicator';
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  FileSignature
} from 'lucide-react';

export interface ScopeContractsViewProps {
  lang?: Language;
  selectedProgramme?: ExhibitionProgramme;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export const ScopeContractsView: React.FC<ScopeContractsViewProps> = (props) => {
  const i18n = useI18n();
  const workspace = useWorkspace();

  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const { formatNumber, localizeDigits } = i18n;
  const activeTab = workspace.activeTab;

  const [selectedRevision, setSelectedRevision] = useState<'v1.2' | 'v1.1'>('v1.2');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* VIEW 1: APPROVED SCOPE */}
      {activeTab === 'approved-scope' && (
        <>
          <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
                  <Lock className="w-4 h-4" />
                  <span>{isAr ? "نطاق تجريبي ومراجعة عقد" : "Sample Scope & Contract Review"}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-sadu-charcoal">
                  {isAr ? 'سجل النطاق والعقد التجريبي' : 'Sample Scope & Contract Register'}
                </h1>
                <p className="text-xs sm:text-sm text-sadu-muted mt-1">
                  {isAr
                    ? 'مسودات سيناريو افتراضي؛ لم يُوثق اتفاق نافذ أو تفويض مؤسسي.'
                    : 'Fictional scenario drafts; no executed agreement or institutional authority verified.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded bg-sadu-sage-light border border-sadu-sage text-xs font-bold text-sadu-ink flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-sadu-sage" />
                  <span>{isAr ? 'مسودة تجريبية (v1.2)' : 'Sample Draft (v1.2)'}</span>
                </span>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-md bg-sadu-sand border-s-4 border-sadu-brick text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sadu-brick shrink-0" />
                <span className="font-bold text-sadu-brick text-sm">
                  {isAr ? "بنود عقد توضيحية · لم تُوثق قابلية التطبيق أو التفويض:" : "Illustrative contract terms · applicability and delegation unverified:"}
                </span>
              </div>
              <p className="text-sadu-charcoal font-medium">
                {isAr
                  ? 'تتطلب بنود السيناريو مراجعة الاتفاق المنطبق. تتناول المادة الرابعة في العقد المصدر التزامات الطرف الأول، ولا تُثبت قاعدة الاستبعاد التي عُرضت سابقاً هنا.'
                  : 'Scenario terms require review against the applicable agreement. The source contract’s section 4 concerns first-party obligations; it does not establish the exclusion rule previously shown here.'}
              </p>
            </div>
          </div>

          <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">
                {isAr ? 'نسخ النطاق التجريبي' : 'Sample scope revisions'}
              </h2>
            </div>

            <div className="p-4 bg-sadu-sand rounded-md border border-sadu-gold space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-sadu-gold/50 pb-2">
                <div>
                  <span className="font-bold text-sadu-charcoal text-sm">ApprovedScope_Revision_v1.2_LinesOfInk.json</span>
                  <span className="text-sadu-muted block text-[11px] mt-0.5">
                    {isAr ? 'DEMO-SCOPE · نسخة تجريبية؛ الاعتماد المؤسسي غير موثق' : 'DEMO-SCOPE · sample revision; institutional approval unverified'}
                  </span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-1">
                {ARTWORKS.slice(0, 2).map((art, idx) => (
                  // FIXED: Added min-h-[140px] and flex structure to lock card heights
                  <div key={art.id} className="p-3 bg-sadu-linen rounded-md border border-sadu-gold flex flex-col justify-between min-h-[140px]">
                    <div>
                      <div className="flex items-start justify-between font-bold text-sadu-charcoal mb-1">
                        <span className="line-clamp-2 pe-2">{isAr ? `العمل رقم ${formatNumber(idx + 1)}: ` : `Item #${idx + 1}: `} {isAr ? art.titleAr : art.titleEn}</span>
                        <span className="font-mono text-sadu-brick shrink-0">{isAr ? `${formatNumber(art.insuranceValueUsd)} دولار` : `$${art.insuranceValueUsd.toLocaleString()}`}</span>
                      </div>
                      <div className="text-sadu-muted">{art.canonicalCode} · {localizeDigits(art.dimensionsCm)}</div>
                      <div className="text-[11px] text-sadu-ink font-medium mt-1">{isAr ? art.mediumAr : art.mediumEn}</div>
                    </div>
                    
                    <div className="pt-2 mt-2 border-t border-sadu-gold/40 flex items-center justify-between">
                      <span className="text-[11px] text-sadu-muted shrink-0">
                        {isAr ? 'حالة التوثيق:' : 'Annex Status:'}
                      </span>
                      <StatusProgressIndicator
                        type="contract"
                        currentStep={5} totalSteps={5} progressPercent={100}
                        statusLevel="completed" variant="compact" size="xs"
                        labelEn="Annex Cleared" labelAr="مرفق بالعقد"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: CONTRACTS & LEGAL */}
      {activeTab === 'contracts' && (
        <>
          <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-0.5">
                  <FileSignature className="w-4 h-4" />
                  <span>{isAr ? 'سجل العقود والملاحق التجريبية' : 'Sample contract and annex register'}</span>
                </div>
                <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">
                  {isAr ? 'العقود الثنائية والبنود التشغيلية' : 'Legal Agreements & Real-Time Contract Rows'}
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'SCB-CTR-2026-088',
                  titleEn: 'Solo Exhibition Master Participation Agreement',
                  titleAr: 'عقد المشاركة الفنية الرئيسي بالمعرض الشخصي',
                  partyEn: 'Sample institution & sample artist',
                  partyAr: 'مؤسسة افتراضية وفنان تجريبي',
                  step: 5, total: 5, percent: 100, statusLevel: 'completed' as const,
                  labelEn: 'Sample draft — no execution', labelAr: 'مسودة تجريبية — غير نافذة',
                  nextEn: "Read-only sample; no durable institutional archive.", nextAr: "مثال للقراءة فقط؛ لا أرشيف مؤسسي دائم.",
                },
                {
                  id: 'SCB-ANX-01',
                  titleEn: 'Form 1(B): Sample Artwork Schedule & Image Specifications',
                  titleAr: 'ملحق رقم 1 (ب): جدول الأعمال الفنية والمواصفات التجريبية',
                  partyEn: 'Curatorial Committee & Artist',
                  partyAr: 'لجنة التحكيم والاختيار والفنان',
                  step: 5, total: 5, percent: 100, statusLevel: 'completed' as const,
                  labelEn: 'Sample annex — unapproved', labelAr: 'ملحق تجريبي غير معتمد',
                  nextEn: 'No applicable clause or delegation verified.', nextAr: 'لم يُوثق بند منطبق أو تفويض.',
                }
              ].map((contract) => (
                // FIXED: Added min-h-[96px] to the row to prevent jumping
                <div key={contract.id} className="p-3.5 bg-sadu-sand rounded-lg border border-sadu-gold flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs min-h-[96px]">
                  <div className="space-y-1 w-full md:max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="font-mono font-bold text-sadu-ink px-2 py-0.5 rounded bg-sadu-linen border border-sadu-gold">{contract.id}</span>
                      <span className="text-sadu-muted line-clamp-1">{isAr ? contract.partyAr : contract.partyEn}</span>
                    </div>
                    {/* FIXED: Title locked to h-10 to prevent collapsing */}
                    <h3 className="font-bold text-sadu-charcoal text-sm h-10 line-clamp-2 leading-snug">{isAr ? contract.titleAr : contract.titleEn}</h3>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-auto w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-sadu-gold/40 md:border-none justify-between md:justify-end">
                    <StatusProgressIndicator
                      id={`status-contract-${contract.id}`}
                      type="contract"
                      currentStep={contract.step}
                      totalSteps={contract.total}
                      progressPercent={contract.percent}
                      statusLevel={contract.statusLevel}
                      labelEn={contract.labelEn}
                      labelAr={contract.labelAr}
                      nextActionEn={contract.nextEn}
                      nextActionAr={contract.nextAr}
                      variant="compact"
                      interactive={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
