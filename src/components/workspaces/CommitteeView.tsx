import React, { useState } from 'react';
import { Language, ExhibitionProgramme, WorkspaceTab } from '../../types';
import { COMMITTEE_SUBMISSION, ARTWORKS } from '../../data/mockData';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { StatusProgressIndicator } from '../common/StatusProgressIndicator';
import { ArtistNominationBuilder } from '../ArtistNominationBuilder';
import { CuratorialCanvas } from './CuratorialCanvas';
import { ArtworkThumbnail } from '../common/ArtworkThumbnail';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  FileText, 
  AlertCircle, 
  Users, 
  Scale, 
  Check, 
  Eye,
  Info,
  BookOpen,
  Stamp,
  UserPlus,
  Lock,
  Unlock,
  Feather,
  AlertTriangle,
  GitMerge
} from 'lucide-react';

export interface CommitteeViewProps {
  lang?: Language;
  selectedProgramme?: ExhibitionProgramme;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export const CommitteeView: React.FC<CommitteeViewProps> = (props) => {
  const i18n = useI18n();
  const workspace = useWorkspace();

  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const { formatNumber, localizeDigits } = i18n;
  const selectedProgramme = props.selectedProgramme ?? workspace.selectedProgramme;
  const onNavigateTab = props.onNavigateTab ?? workspace.navigateTab;
  const currentRole = workspace.currentRole;
  
  const isCuratorOrCoordinator = currentRole === 'COORDINATOR' || currentRole === 'SDC_COORDINATOR' || (currentRole as string) === 'CURATOR';

  const sub = COMMITTEE_SUBMISSION;
  const [activeTab, setActiveTab] = useState<'proposal' | 'works' | 'scores' | 'conditions' | 'verification' | 'nomination' | 'canvas'>('scores');
  
  const [culturalTrack, setCulturalTrack] = useState<'AUTHENTIC_TRADITIONAL' | 'MODERN_CONTEMPORARY'>('MODERN_CONTEMPORARY');

  const [curatorialScores, setCuratorialScores] = useState({
    alignmentTheme: sub.committeeRubric?.alignmentTheme ?? 10,
    artisticQuality: sub.committeeRubric?.artisticQuality ?? 10,
    trackSpecificOne: sub.committeeRubric?.innovation ?? 9,
    trackSpecificTwo: sub.committeeRubric?.culturalValue ?? 10,
    artistProfile: sub.committeeRubric?.artistProfile ?? 5,
    exhibitionHistory: sub.committeeRubric?.exhibitionHistory ?? 5,
    strategicValue: sub.committeeRubric?.strategicValue ?? 5,
    trackSpecificThree: sub.committeeRubric?.calligraphyRelevance ?? 10,
  });

  const curatorialTotal = 
    curatorialScores.alignmentTheme +
    curatorialScores.artisticQuality +
    curatorialScores.trackSpecificOne +
    curatorialScores.trackSpecificTwo +
    curatorialScores.artistProfile +
    curatorialScores.exhibitionHistory +
    curatorialScores.strategicValue +
    curatorialScores.trackSpecificThree;

  const [sampleScriptReviewed, setSampleScriptReviewed] = useState(false);
  const [samplePoetryReviewed, setSamplePoetryReviewed] = useState(false);

  const isTextualVerificationComplete = sampleScriptReviewed && samplePoetryReviewed;

  return (
            <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-ink uppercase tracking-wider mb-1">
              <Scale className="w-4 h-4" />
              <span>{isAr ? 'لجنة الاختيار والتحكيم الفني للبينالي' : 'Biennial Curatorial & Selection Jury Panel'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'ملف القراءة والتقييم والتحقق الثقافي' : 'Curatorial Dossier & Cultural Verification Ledger'}
            </h1>
            <p className="text-xs sm:text-sm text-sadu-muted mt-1">
              {isAr
                ? 'ملف فني مجرد من البيانات المصرفية ووثائق السفر الخاصة · تدقيق أصيل للجدارة الفنية، التراثية، وضبط النصوص الشعرية'
                : 'Clean artistic dossier without sensitive identity or banking data · Pure focus on artistic merit, script fidelity, and classical transcriptions.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {isCuratorOrCoordinator && (
              <button
                onClick={() => setActiveTab(activeTab === 'nomination' ? 'verification' : 'nomination')}
                className={`px-3.5 py-2 text-xs font-bold rounded-md border transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                  activeTab === 'nomination'
                    ? 'bg-sadu-ink text-white border-sadu-ink'
                    : 'bg-sadu-sand text-sadu-brick border-sadu-gold hover:bg-sadu-sand-dark'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {activeTab === 'nomination'
                    ? (isAr ? 'العودة لملف التقييم' : 'Back to Dossiers')
                    : (isAr ? '+ منشئ ترشيح فنان' : '+ Artist Nomination Builder')}
                </span>
              </button>
            )}

            <StatusProgressIndicator
              id="committee-dossier-status"
              type="committee"
              currentStep={isTextualVerificationComplete ? 4 : 3}
              totalSteps={5}
              progressPercent={isTextualVerificationComplete ? 85 : 60}
              statusLevel={isTextualVerificationComplete ? "in_progress" : "at_risk"}
              labelEn={isTextualVerificationComplete ? "Sample reviews recorded" : "Sample review pending"}
              labelAr={isTextualVerificationComplete ? "سُجلت مراجعات تجريبية" : "بانتظار مراجعة تجريبية"}
              nextActionEn="Local sample reviews only; no signature, contract or payment authority."
              nextActionAr="مراجعات محلية تجريبية فقط؛ دون صلاحية توقيع أو تعاقد أو دفع."
              variant="compact"
              interactive={true}
            />
          </div>
        </div>

        <div className="mt-4 p-3 rounded-md bg-sadu-sand border border-sadu-gold text-xs text-sadu-ink flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sadu-brick shrink-0" />
            <span>
              {isAr
                ? "تستبعد معاينة المراجعة التجريبية مستندات الهوية والمصرف. هذا خيار عرض وليس ضبط وصول موثقاً؛ استخدم بيانات افتراضية فقط."
                : "Sample review view excludes identity and bank documents. This display choice is not authenticated access control; use fictional data only."}
            </span>
          </div>
          <span className="font-mono text-[11px] text-sadu-muted shrink-0 font-bold">
            {sub.id}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-sadu-gold/50 flex-wrap">
          {[
            { id: 'scores', labelEn: 'Dual-Track Juror Rubric', labelAr: 'معايير التقييم والملاحظات (Dual-Track)' },
            { id: 'canvas', labelEn: 'Curatorial Canvas', labelAr: 'المخطط التقييمي والفراغي' },
            { id: 'verification', labelEn: 'Cultural & Textual Verification', labelAr: 'التحقق الثقافي والنصوصي', badge: isTextualVerificationComplete ? '✓' : 'Blocker' },
            { id: 'proposal', labelEn: 'Proposal Concept', labelAr: 'بيان المقترح والرؤية' },
            { id: 'works', labelEn: 'Artwork Checklist (3)', labelAr: 'قائمة الأعمال المقترحة (3)' },
            { id: 'conditions', labelEn: 'Approval Conditions (3)', labelAr: 'شروط الاعتماد الملزمة (3)' },
            ...(isCuratorOrCoordinator
              ? [{ id: 'nomination', labelEn: '+ Nomination Builder', labelAr: '+ استمارة الترشيح', isAction: true }]
              : []),
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-sadu-brick text-white border-sadu-brick shadow-2xs'
                  : 'bg-sadu-linen text-sadu-charcoal border-sadu-gold hover:bg-sadu-sand-dark'
              }`}
            >
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              {'badge' in tab && tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  tab.badge === '✓'
                    ? 'bg-sadu-sage text-white'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'nomination' && isCuratorOrCoordinator ? (
        <ArtistNominationBuilder
          lang={lang}
          onSuccess={() => setActiveTab('verification')}
          onCancel={() => setActiveTab('scores')}
        />
      ) : (
        <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
          
          {activeTab === 'scores' && (
            <div className="space-y-6">
              <div className="border-b border-sadu-gold/40 pb-4">
                <span className="text-xs font-mono text-sadu-brick block uppercase tracking-wider mb-1">
                  {isAr ? 'التقييم الفني المباشر' : 'Active Evaluation Target'}
                </span>
                <h2 className="text-xl sm:text-2xl font-editorial font-bold text-sadu-charcoal">
                  {isAr ? sub.proposalTitleAr : sub.proposalTitleEn}
                </h2>
                <div className="flex items-center gap-2.5 flex-wrap mt-1">
                  <p className="text-sm font-semibold text-sadu-ink">
                    {isAr ? `الفنان المقترح: ${sub.artistNameAr}` : `Proposed Artist: ${sub.artistNameEn}`}
                  </p>
                </div>
              </div>

              {sub.hasPreviousParticipation && (
                <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-lg flex items-start gap-3 text-xs text-amber-950 shadow-2xs">
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-amber-900">
                        {isAr ? 'تاريخ مشاركة تجريبي' : 'Sample participation history'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-mono font-bold text-[10px]">
                        {isAr ? 'الدورة التاسعة / العاشرة' : '9th / 10th Edition'}
                      </span>
                    </div>
                    <p className="text-amber-900/90 leading-relaxed">
                      {isAr
                        ? 'تاريخ مشاركة افتراضي للمقارنة فقط. معايير الجدة وأوزان التقييم 65/35 خيارات تجريبية، وليست لائحة مؤسسية موثقة.'
                        : 'Fictional participation history for comparison only. Novelty criteria and the 65/35 scoring weights are demonstration choices, not verified institutional rules.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-sadu-gold bg-sadu-sand">
                <div>
                  <span className="font-bold text-sadu-charcoal flex items-center gap-1.5 mb-1 text-sm">
                    <GitMerge className="w-4 h-4 text-sadu-brick" />
                    {isAr ? 'تحديد الاتجاه الفني للمقترح (Dual-Track Evaluation)' : 'Select Artistic Governance Track'}
                  </span>
                  <span className="text-xs text-sadu-muted">
                    {isAr ? 'تتغير معايير التقييم تلقائياً لإنصاف الأصالة الكلاسيكية مقابل الابتكار المعاصر (الحروفية).' : 'Rubric metrics adapt dynamically to evaluate classical purity vs contemporary Hurufiyya fairly.'}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-sadu-linen p-1 rounded-md border border-sadu-gold shrink-0">
                  <button
                    onClick={() => setCulturalTrack('AUTHENTIC_TRADITIONAL')}
                    className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                      culturalTrack === 'AUTHENTIC_TRADITIONAL' 
                        ? 'bg-sadu-ink text-white shadow-xs' 
                        : 'text-sadu-charcoal hover:bg-sadu-sand'
                    }`}
                  >
                    {isAr ? 'الاتجاه الأصيل (Traditional)' : 'Authentic Direction'}
                  </button>
                  <button
                    onClick={() => setCulturalTrack('MODERN_CONTEMPORARY')}
                    className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                      culturalTrack === 'MODERN_CONTEMPORARY' 
                        ? 'bg-sadu-brick text-white shadow-xs' 
                        : 'text-sadu-charcoal hover:bg-sadu-sand'
                    }`}
                  >
                    {isAr ? 'الاتجاه المعاصر (Contemporary)' : 'Contemporary Avant-Garde'}
                  </button>
                </div>
              </div>

              <div className="p-5 bg-sadu-paper rounded-lg border border-sadu-gold space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sadu-gold/40 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-sadu-brick text-white font-mono font-bold text-xs">
                        {isAr ? 'مقياس تجريبي (65 نقطة)' : 'Sample rubric (65 Pts)'}
                      </span>
                      <h3 className="text-base font-editorial font-bold text-sadu-charcoal">
                        {isAr ? 'استمارة التقييم الفني والمفاهيمي المحكمة' : 'Curatorial & Artistic Merit Evaluation'}
                      </h3>
                    </div>
                  </div>
                  <div className="text-end bg-sadu-sand px-4 py-2 rounded-md border border-sadu-gold">
                    <span className="text-xs text-sadu-muted block">
                      {isAr ? 'مجموع البوابة الأولى' : 'Gate 1 Total Score'}
                    </span>
                    <span className="text-2xl font-editorial font-bold text-sadu-brick">
                      {localizeDigits(curatorialTotal)} <span className="text-sm font-sans font-normal text-sadu-muted">/ 65</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-6 pt-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sadu-ink uppercase tracking-wider">
                        {isAr ? 'أ. المعايير التقييمية والفنية (40 نقطة كحد أقصى)' : 'A. Curatorial & Conceptual Merit (Max 40 Points)'}
                      </span>
                      <span className="text-xs font-mono font-bold text-sadu-brick">
                        {localizeDigits(curatorialScores.alignmentTheme + curatorialScores.artisticQuality + curatorialScores.trackSpecificOne + curatorialScores.trackSpecificTwo)} / 40
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-sadu-sand/60 rounded-md border border-sadu-gold/60 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-sadu-charcoal">{isAr ? 'التوافق مع ثيمة البينالي' : 'Alignment with Biennale Theme'}</span>
                          <span className="font-mono font-bold text-sadu-brick">{curatorialScores.alignmentTheme} / 10</span>
                        </div>
                        <input type="range" min="0" max="10" value={curatorialScores.alignmentTheme} onChange={(e) => setCuratorialScores({ ...curatorialScores, alignmentTheme: Number(e.target.value) })} className="w-full accent-sadu-brick cursor-pointer" />
                      </div>

                      <div className="p-3 bg-sadu-sand/60 rounded-md border border-sadu-gold/60 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-sadu-charcoal">{isAr ? 'الجودة الفنية والتمكن البصري' : 'Artistic & Execution Quality'}</span>
                          <span className="font-mono font-bold text-sadu-brick">{curatorialScores.artisticQuality} / 10</span>
                        </div>
                        <input type="range" min="0" max="10" value={curatorialScores.artisticQuality} onChange={(e) => setCuratorialScores({ ...curatorialScores, artisticQuality: Number(e.target.value) })} className="w-full accent-sadu-brick cursor-pointer" />
                      </div>

                      <div className="p-3 bg-sadu-linen rounded-md border-2 border-sadu-ink/30 space-y-1.5 shadow-2xs">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-sadu-ink">
                            {culturalTrack === 'AUTHENTIC_TRADITIONAL' 
                              ? (isAr ? 'النسبة الهندسية (ميزان القلم)' : 'Geometric Proportion (Qalam)')
                              : (isAr ? 'الابتكار التجريدي (الحروفية)' : 'Abstract Innovation (Hurufiyya)')}
                          </span>
                          <span className="font-mono font-bold text-sadu-brick">{curatorialScores.trackSpecificOne} / 10</span>
                        </div>
                        <input type="range" min="0" max="10" value={curatorialScores.trackSpecificOne} onChange={(e) => setCuratorialScores({ ...curatorialScores, trackSpecificOne: Number(e.target.value) })} className="w-full accent-sadu-ink cursor-pointer" />
                      </div>

                      <div className="p-3 bg-sadu-linen rounded-md border-2 border-sadu-ink/30 space-y-1.5 shadow-2xs">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-sadu-ink">
                            {culturalTrack === 'AUTHENTIC_TRADITIONAL' 
                              ? (isAr ? 'إتقان الخطوط الكلاسيكية' : 'Classical Script Mastery')
                              : (isAr ? 'المعاصرة والارتباط الراهن' : 'Contemporary Relevance')}
                          </span>
                          <span className="font-mono font-bold text-sadu-brick">{curatorialScores.trackSpecificTwo} / 10</span>
                        </div>
                        <input type="range" min="0" max="10" value={curatorialScores.trackSpecificTwo} onChange={(e) => setCuratorialScores({ ...curatorialScores, trackSpecificTwo: Number(e.target.value) })} className="w-full accent-sadu-ink cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-sadu-gold/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sadu-ink uppercase tracking-wider">
                        {isAr ? 'ب. السيرة المهنية والتجربة (15 نقطة كحد أقصى)' : 'B. Artist Profile & Strategic Standing (Max 15 Points)'}
                      </span>
                      <span className="text-xs font-mono font-bold text-sadu-brick">
                        {localizeDigits(curatorialScores.artistProfile + curatorialScores.exhibitionHistory + curatorialScores.strategicValue)} / 15
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="p-3 bg-sadu-sand/60 rounded-md border border-sadu-gold/60 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-sadu-charcoal">{isAr ? 'المكانة والمسار الفني' : 'Career Standing'}</span>
                          <span className="font-mono font-bold text-sadu-brick">{curatorialScores.artistProfile} / 5</span>
                        </div>
                        <input type="range" min="0" max="5" value={curatorialScores.artistProfile} onChange={(e) => setCuratorialScores({ ...curatorialScores, artistProfile: Number(e.target.value) })} className="w-full accent-sadu-brick cursor-pointer" />
                      </div>

                      <div className="p-3 bg-sadu-sand/60 rounded-md border border-sadu-gold/60 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-sadu-charcoal">{isAr ? 'سجل المشاركات والمعارض' : 'Exhibition Track Record'}</span>
                          <span className="font-mono font-bold text-sadu-brick">{curatorialScores.exhibitionHistory} / 5</span>
                        </div>
                        <input type="range" min="0" max="5" value={curatorialScores.exhibitionHistory} onChange={(e) => setCuratorialScores({ ...curatorialScores, exhibitionHistory: Number(e.target.value) })} className="w-full accent-sadu-brick cursor-pointer" />
                      </div>

                      <div className="p-3 bg-sadu-sand/60 rounded-md border border-sadu-gold/60 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-sadu-charcoal">{isAr ? 'القيمة الاستراتيجية' : 'Strategic Value'}</span>
                          <span className="font-mono font-bold text-sadu-brick">{curatorialScores.strategicValue} / 5</span>
                        </div>
                        <input type="range" min="0" max="5" value={curatorialScores.strategicValue} onChange={(e) => setCuratorialScores({ ...curatorialScores, strategicValue: Number(e.target.value) })} className="w-full accent-sadu-brick cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-sadu-gold/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sadu-ink uppercase tracking-wider">
                        {isAr ? 'ج. الملاءمة لفن الخط العربي (10 نقاط كحد أقصى)' : 'C. Calligraphic Relevance (Max 10 Points)'}
                      </span>
                      <span className="text-xs font-mono font-bold text-sadu-brick">
                        {localizeDigits(curatorialScores.trackSpecificThree)} / 10
                      </span>
                    </div>

                    <div className="p-3 bg-sadu-linen rounded-md border-2 border-sadu-ink/30 space-y-1.5 shadow-2xs">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-sadu-ink">
                          {culturalTrack === 'AUTHENTIC_TRADITIONAL' 
                            ? (isAr ? 'تحضير الأحبار والورق التقليدي' : 'Traditional Ink/Paper Preparation')
                            : (isAr ? 'التجريب المادي للوسائط' : 'Material Experimentation')}
                        </span>
                        <span className="font-mono font-bold text-sadu-brick">{curatorialScores.trackSpecificThree} / 10</span>
                      </div>
                      <input type="range" min="0" max="10" value={curatorialScores.trackSpecificThree} onChange={(e) => setCuratorialScores({ ...curatorialScores, trackSpecificThree: Number(e.target.value) })} className="w-full accent-sadu-ink cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-sadu-charcoal">{isAr ? 'تعليقات مراجعين تجريبية مُعدّة مسبقاً — دون توقيعات:' : 'Seeded sample reviewer comments — no signatures:'}</h3>
                {sub.reviewerNotes.map((note, idx) => (
                  <div key={idx} className="p-4 bg-sadu-paper rounded-md border border-sadu-gold">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-sadu-ink">{note.reviewerName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-sadu-sage-light text-sadu-ink font-semibold">
                        {isAr ? 'لا يوجد تعارض مصالح' : 'Zero Conflict Declared'}
                      </span>
                    </div>
                    <p className="text-xs text-sadu-charcoal leading-relaxed italic">
                      "{isAr ? note.commentAr : note.commentEn}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'canvas' && (
            <div className="p-2 sm:p-6 bg-sadu-cream rounded-xl border border-sadu-gold/30 shadow-inner">
              <CuratorialCanvas />
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="space-y-6">
              <p className="text-xs text-sadu-muted leading-relaxed">
                {isAr ? 'مراجع نسبة النصوص فقط؛ ليست تحقيقاً للنقوش أو اعتماداً مؤسسياً. فُحصت في 20 سبتمبر 2026: ' : 'Text attribution references only; no inscription authentication or institutional approval. Checked 20 September 2026: '}
                <a className="underline" href="https://usul.ai/ar/t/diwan-86/153" target="_blank" rel="noreferrer">{isAr ? 'ديوان أبي فراس، ص 153' : 'Abu Firas Diwan, p. 153'}</a>
                {' · '}
                <a className="underline" href="https://www.hindawi.org/books/79072819/5.2/" target="_blank" rel="noreferrer">{isAr ? 'هنداوي، دراسة أدبية تورد بيت المتنبي' : 'Hindawi literary discussion reproducing the Al-Mutanabbi verse'}</a>
              </p>
              <div className={`p-4 rounded-lg border text-xs leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isTextualVerificationComplete
                  ? 'bg-sadu-sage-light border-sadu-sage text-sadu-ink'
                  : 'bg-amber-50/80 border-amber-300 text-amber-950'
              }`}>
                <div className="flex items-start gap-3">
                  {isTextualVerificationComplete ? (
                    <Unlock className="w-5 h-5 text-sadu-sage shrink-0 mt-0.5" />
                  ) : (
                    <Lock className="w-5 h-5 text-sadu-brick shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold text-sm block mb-1">
                      {isTextualVerificationComplete
                        ? (isAr ? '✓ سُجلت مراجعات تخصصية تجريبية' : '✓ Sample specialist reviews recorded')
                        : (isAr ? 'بانتظار مراجعة تخصصية تجريبية' : 'Sample specialist review pending')}
                    </span>
                    <p className="text-xs">
                      {isAr
                        ? 'مراجعة تخصصية تجريبية بأدوار افتراضية. لا تنشئ توقيعاً أو تعاقداً أو دفعة مالية؛ يلزم إثبات التفويض والسياسة قبل أي استخدام فعلي.'
                        : 'Sample specialist review by fictional roles. This creates no signature, contract or payment; applicable authority and policy remain unverified.'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className={`px-3 py-1.5 rounded text-xs font-bold font-mono inline-block border ${
                    isTextualVerificationComplete
                      ? 'bg-sadu-sage text-white border-sadu-sage'
                      : 'bg-sadu-brick text-white border-sadu-brick'
                  }`}>
                    {isTextualVerificationComplete
                      ? (isAr ? 'اكتملت المراجعات التجريبية' : 'Sample reviews complete')
                      : (isAr ? 'مراجعات تجريبية معلقة' : 'Sample reviews pending')}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-sadu-gold/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Feather className="w-4 h-4 text-sadu-brick" />
                    <h3 className="font-editorial text-base font-bold text-sadu-charcoal">
                      {isAr ? 'تدقيق النصوص الشعرية والخطوط الكلاسيكية المقترحة للمعرض' : 'Classical Arabic Poetry & Script Transcriptions Review'}
                    </h3>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-sadu-paper rounded-lg border border-sadu-gold space-y-3 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] text-sadu-brick font-bold block">WORK #1 · SCB-2026-YN-01</span>
                        <h4 className="font-bold text-sm text-sadu-charcoal">
                          {isAr ? 'أفق كوفي ومقامات النيلة (Kufic Horizon)' : 'Kufic Horizon & Indigo Tones'}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-sadu-sand text-sadu-ink font-bold font-mono text-[10px] border border-sadu-gold/40">
                        {isAr ? 'خط كوفي مشرقي' : 'Eastern Archaic Kufic'}
                      </span>
                    </div>
                    <div className="p-3 bg-sadu-linen rounded border border-sadu-gold/50 space-y-1">
                      <span className="text-[10px] font-bold text-sadu-muted uppercase block">
                        {isAr ? 'نقل شعري تجريبي — غير محقق:' : 'Sample classical transcription — not authenticated:'}
                      </span>
                      <p className="font-editorial text-sm font-semibold text-sadu-charcoal text-center py-1">
                        "مُعَلِّلَتي بالوَصلِ وَالمَوتُ دونَهُ · إِذا مِتُّ ظَمآناً فَلا نَزَلَ القَطرُ"
                      </p>
                      <span className="text-[10px] text-sadu-muted block text-center">
                        {isAr ? 'أبو فراس الحمداني · نقل تجريبي؛ بانتظار مراجعة تخصصية' : 'Abu Firas Al-Hamadani · sample transcription; specialist review pending'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-sadu-paper rounded-lg border border-sadu-gold space-y-3 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] text-sadu-brick font-bold block">WORK #2 · SCB-2026-YN-02</span>
                        <h4 className="font-bold text-sm text-sadu-charcoal">
                          {isAr ? 'تمتمات بحرية بخط الثلث الجلي' : 'Maritime Murmurs in Jali Thuluth'}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-sadu-sand text-sadu-ink font-bold font-mono text-[10px] border border-sadu-gold/40">
                        {isAr ? 'ثلث جلي مركب' : 'Composite Jali Thuluth'}
                      </span>
                    </div>
                    <div className="p-3 bg-sadu-linen rounded border border-sadu-gold/50 space-y-1">
                      <span className="text-[10px] font-bold text-sadu-muted uppercase block">
                        {isAr ? 'نقل شعري تجريبي — غير محقق:' : 'Sample classical transcription — not authenticated:'}
                      </span>
                      <p className="font-editorial text-sm font-semibold text-sadu-charcoal text-center py-1">
                        "أَنا الَّذي نَظَرَ الأَعمى إِلى أَدَبي · وَأَسمَعَت كَلِماتي مَن بِهِ صَمَمُ"
                      </p>
                      <span className="text-[10px] text-sadu-muted block text-center">
                        {isAr ? 'أبو الطيب المتنبي · نقل تجريبي؛ بانتظار مراجعة تخصصية' : 'Al-Mutanabbi · sample transcription; specialist review pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-sadu-gold/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Stamp className="w-4 h-4 text-sadu-brick" />
                    <h3 className="font-editorial text-base font-bold text-sadu-charcoal">
                      {isAr ? 'اعتمادات التحقق الملزمة (Sign-off Ledger)' : 'Mandatory Sign-off Ledger'}
                    </h3>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg border transition-all text-xs space-y-3 ${sampleScriptReviewed ? 'bg-sadu-sand/80 border-sadu-gold' : 'bg-white border-dashed border-sadu-gold'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-sadu-charcoal block text-sm">{isAr ? 'DEMO-SCRIPT · مراجع تجريبي' : 'DEMO-SCRIPT · sample reviewer'}</span>
                        <span className="text-[11px] text-sadu-muted">{isAr ? 'مراجعة خطية مقترحة' : 'Proposed script review'}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sampleScriptReviewed ? 'bg-sadu-sage-light text-sadu-ink border border-sadu-sage' : 'bg-amber-100 text-amber-900 border border-amber-300'}`}>
                        {sampleScriptReviewed ? (isAr ? '✓ سُجلت مراجعة تجريبية' : '✓ Sample review recorded') : (isAr ? 'قيد المراجعة' : 'Pending')}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-sadu-gold/50 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-sadu-muted">{sampleScriptReviewed ? 'DEMO-SCRIPT-REVIEW' : (isAr ? 'بانتظار مراجعة تجريبية' : 'Awaiting sample review')}</span>
                      <button type="button" onClick={() => setSampleScriptReviewed(!sampleScriptReviewed)} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${sampleScriptReviewed ? 'bg-sadu-sand text-sadu-ink border border-sadu-gold hover:bg-sadu-sand-dark' : 'bg-sadu-brick text-white hover:bg-sadu-brick-dark'}`}>
                        {sampleScriptReviewed ? (isAr ? 'إعادة ضبط المراجعة التجريبية' : 'Reset sample review') : (isAr ? 'تسجيل مراجعة خطية تجريبية' : 'Record sample script review')}
                      </button>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border transition-all text-xs space-y-3 ${samplePoetryReviewed ? 'bg-sadu-sand/80 border-sadu-gold' : 'bg-amber-50/40 border-dashed border-amber-300'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-sadu-charcoal block text-sm">{isAr ? 'DEMO-SPECIALIST · مراجع تجريبي' : 'DEMO-SPECIALIST · sample reviewer'}</span>
                        <span className="text-[11px] text-sadu-brick font-semibold">{isAr ? 'دور تخصصي مقترح' : 'Proposed specialist role'}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${samplePoetryReviewed ? 'bg-sadu-sage-light text-sadu-ink border border-sadu-sage' : 'bg-amber-100 text-amber-900 border border-amber-300'}`}>
                        {samplePoetryReviewed ? (isAr ? '✓ سُجلت مراجعة تجريبية' : '✓ Sample review recorded') : (isAr ? 'بانتظار مراجعة تجريبية' : 'Sample review pending')}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-sadu-gold/50 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-sadu-muted">{samplePoetryReviewed ? 'DEMO-SPECIALIST-REVIEW' : (isAr ? 'لا إجراء تعاقدي' : 'No contract action')}</span>
                      <button type="button" onClick={() => setSamplePoetryReviewed(!samplePoetryReviewed)} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${samplePoetryReviewed ? 'bg-sadu-sand text-sadu-ink border border-sadu-gold hover:bg-sadu-sand-dark' : 'bg-sadu-ink text-white hover:bg-sadu-ink-dark shadow-xs'}`}>
                        {samplePoetryReviewed ? (isAr ? 'إعادة ضبط المراجعة التجريبية' : 'Reset sample review') : (isAr ? 'تسجيل مراجعة تخصصية تجريبية' : 'Record sample specialist review')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-sadu-gold/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-sadu-muted">
                  {isTextualVerificationComplete ? (
                    <span className="text-sadu-sage font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {isAr ? 'سُجلت مراجعات تجريبية؛ لا اعتماد مؤسسياً.' : 'Sample reviews recorded; no institutional certification.'}
                    </span>
                  ) : (
                    <span className="text-sadu-brick flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {isAr ? 'مراجعة تخصصية تجريبية معلقة؛ لا توقيع أو دفع.' : 'Sample specialist review pending; no signature or payment.'}
                    </span>
                  )}
                </div>
                <button
                  disabled={!isTextualVerificationComplete}
                  onClick={() => onNavigateTab('contracts')}
                  className={`px-6 py-2.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 cursor-pointer ${
                    isTextualVerificationComplete
                      ? 'bg-sadu-brick text-white hover:bg-sadu-brick-dark shadow-xs'
                      : 'bg-sadu-sand text-sadu-muted border border-sadu-gold/50 cursor-not-allowed'
                  }`}
                >
                  <Stamp className="w-4 h-4" />
                  <span>
                    {isTextualVerificationComplete
                      ? (isAr ? 'الانتقال لتوليد العقد الثنائي ←' : 'Proceed to Bilateral Contract Generation →')
                      : (isAr ? 'العقد محظور (يتطلب التحقق)' : 'Sample reviews pending (Verification Required)')}
                  </span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'proposal' && (
            <div className="space-y-6">
              <div className="border-b border-sadu-gold/40 pb-4">
                <span className="text-xs font-mono text-sadu-brick block uppercase tracking-wider mb-1">
                  {isAr ? 'المقترح الفردي للبينالي' : 'Solo Biennial Application'}
                </span>
                <h2 className="text-xl sm:text-2xl font-editorial font-bold text-sadu-charcoal">
                  {isAr ? sub.proposalTitleAr : sub.proposalTitleEn}
                </h2>
                <div className="flex items-center gap-2.5 flex-wrap mt-1">
                  <p className="text-sm font-semibold text-sadu-ink">
                    {isAr ? `الفنان: ${sub.artistNameAr}` : `Artist: ${sub.artistNameEn}`}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-sadu-muted uppercase tracking-wider mb-2">
                  {isAr ? 'البيان الفني للمقترح (Concept Statement):' : 'Concept Statement:'}
                </h3>
                <p className="text-base sm:text-lg leading-relaxed text-sadu-charcoal font-editorial bg-sadu-paper p-5 rounded-md border border-sadu-gold">
                  "{isAr ? sub.conceptStatementAr : sub.conceptStatementEn}"
                </p>
              </div>
            </div>
          )}

          {/* WORKS TAB - ZERO DEAD LINKS ARCHITECTURE */}
          {activeTab === 'works' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-sadu-charcoal mb-2">
                {isAr ? 'الأعمال المقترحة المرفقة بالملف (معاينة فنية)' : 'Submitted Artwork Checklist for Selection'}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {ARTWORKS.slice(0, 2).map((art, idx) => (
                  <div key={art.id} className="p-4 bg-sadu-sand rounded-md border border-sadu-gold flex flex-col justify-between min-h-[160px] space-y-3">
                    <div className="flex gap-4">
                      
                      {/* PURE CSS MATHEMATICAL THUMBNAIL (NEVER BREAKS) */}
                      <ArtworkThumbnail 
                        canonicalCode={art.canonicalCode} 
                        mediumEn={art.mediumEn} 
                        mediumAr={art.mediumAr}
                        isAr={isAr}
                        className="w-20 h-20 shrink-0 shadow-sm" 
                      />
                      
                      <div className="space-y-2 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono text-sadu-brick font-bold block">
                              {isAr ? `العمل رقم ${formatNumber(idx + 1)} · ${art.canonicalCode}` : `Work #${idx + 1} · ${art.canonicalCode}`}
                            </span>
                            <h4 className="font-bold text-sm text-sadu-charcoal leading-snug mt-0.5">
                              {isAr ? art.titleAr : art.titleEn}
                            </h4>
                          </div>
                          <span className="px-2 py-0.5 text-[10px] rounded bg-sadu-linen border border-sadu-gold font-mono font-bold shrink-0">
                            {isAr ? `${formatNumber(art.insuranceValueUsd)} دولار` : `$${art.insuranceValueUsd.toLocaleString()}`}
                          </span>
                        </div>

                        <div className="text-xs space-y-1 text-sadu-charcoal">
                          <div><strong>{isAr ? 'الأبعاد والوزن:' : 'Dimensions & Weight:'}</strong> {localizeDigits(art.dimensionsCm)} · {isAr ? `${formatNumber(art.weightKg)} كجم` : `${art.weightKg} kg`}</div>
                          <div><strong>{isAr ? 'اشتراطات التثبيت:' : 'Mounting Specs:'}</strong> {isAr ? art.installationRequirementsAr : art.installationRequirementsEn}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-sadu-gold/50 flex items-center justify-between text-[11px]">
                      <span className="text-sadu-muted">{isAr ? 'حالة التقييم والاعتماد:' : 'Curatorial Ratification:'}</span>
                      <StatusProgressIndicator
                        id={`committee-art-status-${art.id}`}
                        type="committee"
                        currentStep={idx === 0 ? 5 : 4}
                        totalSteps={5}
                        progressPercent={idx === 0 ? 100 : 80}
                        statusLevel={idx === 0 ? 'completed' : 'in_progress'}
                        labelEn={idx === 0 ? 'Ratified (100%)' : 'Conditional (80%)'}
                        labelAr={idx === 0 ? 'معتمد ومثبت' : 'مشروط بالفحص'}
                        nextActionEn={idx === 0 ? 'Scope frozen into catalogue.' : 'Base plinth reinforcement sign-off required.'}
                        nextActionAr={idx === 0 ? 'مثبت ضمن كتالوج المعرض.' : 'يتطلب اعتماد تدعيم القاعدة الأرضية.'}
                        variant="compact"
                        size="xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'conditions' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-sadu-paper rounded-md border-s-4 border-sadu-brick text-xs">
                <span className="font-bold text-sadu-brick block mb-1">
                  {isAr ? 'شروط مراجعة تجريبية مقترحة (غير ملزمة):' : 'Proposed sample review conditions (not binding):'}
                </span>
                {isAr 
                  ? 'لا تثبت هذه المتطلبات التجريبية التزامات تعاقدية أو مؤسسية.'
                  : 'These sample dependencies do not establish contractual or institutional requirements.'}
              </div>

              <div className="space-y-3">
                {sub.conditionsEn.map((condEn, idx) => {
                  const conditionConfigs = [
                    { step: 5, total: 5, percent: 100, statusLevel: 'completed' as const, labelEn: 'Sample condition checked', labelAr: 'فُحص شرط تجريبي', nextEn: 'Sample condition marked complete; no engineering approval.', nextAr: 'أُكمل شرط تجريبي؛ دون اعتماد هندسي.' },
                    { step: 3, total: 4, percent: 75, statusLevel: 'in_progress' as const, labelEn: 'In Juror Proofing', labelAr: 'قيد التدقيق اللغوي', nextEn: 'Review of verse translations underway.', nextAr: 'تدقيق ترجمات الأبيات جارٍ.' },
                    { step: 2, total: 4, percent: 50, statusLevel: 'in_progress' as const, labelEn: 'Reconciliation Active', labelAr: 'تسوية الملاحظة جارية', nextEn: 'Conservator oxidation audit report required.', nextAr: 'يتطلب تقرير مختبر الترميم.' },
                  ];
                  const conf = conditionConfigs[idx] || conditionConfigs[0];

                  return (
                    <div key={idx} className="p-3.5 bg-sadu-sand rounded-md border border-sadu-gold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-sadu-brick text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {formatNumber(idx + 1)}
                        </div>
                        <p className="text-xs text-sadu-charcoal leading-relaxed max-w-xl">
                          {isAr ? sub.conditionsAr[idx] : condEn}
                        </p>
                      </div>

                      <div className="self-end sm:self-auto shrink-0">
                        <StatusProgressIndicator
                          id={`committee-cond-${idx + 1}`}
                          type="committee"
                          currentStep={conf.step} totalSteps={conf.total} progressPercent={conf.percent}
                          statusLevel={conf.statusLevel} labelEn={conf.labelEn} labelAr={conf.labelAr}
                          nextActionEn={conf.nextEn} nextActionAr={conf.nextAr} variant="compact" interactive={true}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-sadu-gold/40 flex items-center justify-between">
                <span className="text-xs text-sadu-muted">
                  {isAr ? `تاريخ اعتماد المحضر: ${localizeDigits('12 أغسطس 2026')}` : 'Minute Execution Date: 12 Aug 2026'}
                </span>
                <button onClick={() => onNavigateTab('approved-scope')} className="px-4 py-2 text-xs font-semibold rounded bg-sadu-brick text-white hover:bg-sadu-brick-dark transition-colors cursor-pointer">
                  {isAr ? 'سجل النطاق المعتمد ←' : 'View in Approved Scope Tab →'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
