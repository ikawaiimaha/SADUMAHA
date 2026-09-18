import React, { useState } from 'react';
import { Language, ExhibitionProgramme, WorkspaceTab } from '../../types';
import { COMMITTEE_SUBMISSION, ARTWORKS } from '../../data/mockData';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { StatusProgressIndicator } from '../common/StatusProgressIndicator';
import { ArtistNominationBuilder } from '../ArtistNominationBuilder';
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
  AlertTriangle
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
  const { formatNumber, formatPercent, formatRatio, formatCurrency, localizeDigits } = i18n;
  const selectedProgramme = props.selectedProgramme ?? workspace.selectedProgramme;
  const onNavigateTab = props.onNavigateTab ?? workspace.navigateTab;
  const currentRole = workspace.currentRole;
  const isCuratorOrCoordinator = currentRole === 'COORDINATOR' || (currentRole as string) === 'CURATOR';

  const sub = COMMITTEE_SUBMISSION;
  const [activeTab, setActiveTab] = useState<'proposal' | 'works' | 'scores' | 'conditions' | 'verification' | 'nomination'>('verification');
  const [jurorConfirmed, setJurorConfirmed] = useState(true);

  // 65-Point Curatorial & Artist Rubric State
  const [curatorialScores, setCuratorialScores] = useState({
    alignmentTheme: sub.committeeRubric?.alignmentTheme ?? 10,
    artisticQuality: sub.committeeRubric?.artisticQuality ?? 10,
    innovation: sub.committeeRubric?.innovation ?? 9,
    culturalValue: sub.committeeRubric?.culturalValue ?? 10,
    artistProfile: sub.committeeRubric?.artistProfile ?? 5,
    exhibitionHistory: sub.committeeRubric?.exhibitionHistory ?? 5,
    strategicValue: sub.committeeRubric?.strategicValue ?? 5,
    calligraphyRelevance: sub.committeeRubric?.calligraphyRelevance ?? 10,
  });

  const curatorialTotal = 
    curatorialScores.alignmentTheme +
    curatorialScores.artisticQuality +
    curatorialScores.innovation +
    curatorialScores.culturalValue +
    curatorialScores.artistProfile +
    curatorialScores.exhibitionHistory +
    curatorialScores.strategicValue +
    curatorialScores.calligraphyRelevance;

  // Cultural & Textual Verification Sign-Off States
  const [expertScriptVerified, setExpertScriptVerified] = useState(true);
  const [directorPoetryVerified, setDirectorPoetryVerified] = useState(false);

  const isTextualVerificationComplete = expertScriptVerified && directorPoetryVerified;

  return (
    <div className="space-y-6">
      {/* Committee Top Banner */}
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
              labelEn={isTextualVerificationComplete ? "Textual Verification Cleared" : "Blocked: Textual Verification Pending"}
              labelAr={isTextualVerificationComplete ? "تم اعتماد التحقق النصوصي" : "محظور: بانتظار التحقق النصوصي الإلزامي"}
              nextActionEn="MANDATORY BLOCKER: Cultural & Textual Verification by Mohammed Ibrahim Al Qaseer and Calligraphy Experts required before bilateral contract generation."
              nextActionAr="شرط إلزامي مانع: التحقق الثقافي والنصوصي من محمد إبراهيم القصير وخبراء الخط العربي مطلوب قبل توليد العقد النظامي."
              variant="compact"
              interactive={true}
            />
          </div>
        </div>

        {/* Privacy & Mandatory Blocker Notice */}
        <div className="mt-4 p-3 rounded-md bg-sadu-sand border border-sadu-gold text-xs text-sadu-ink flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sadu-brick shrink-0" />
            <span>
              {isAr
                ? 'ضمان الخصوصية المؤسسية: لا صلاحية للجنة للاطلاع على جوازات السفر، التأشيرات، أو أرقام الحسابات البنكية للمتقدمين.'
                : 'Zero Identity Leak Guarantee: Committee sessions have no access to passports, visa identity, or private bank account details.'}
            </span>
          </div>
          <span className="font-mono text-[11px] text-sadu-muted shrink-0 font-bold">
            {sub.id}
          </span>
        </div>

        {/* Dossier Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-sadu-gold/50 flex-wrap">
          {[
            { id: 'verification', labelEn: 'Cultural & Textual Verification', labelAr: 'التحقق الثقافي والنصوصي', badge: isTextualVerificationComplete ? '✓' : 'Blocker' },
            { id: 'proposal', labelEn: 'Proposal Concept', labelAr: 'بيان المقترح والرؤية' },
            { id: 'works', labelEn: 'Artwork Checklist (3)', labelAr: 'قائمة الأعمال المقترحة (3)' },
            { id: 'scores', labelEn: 'Juror Scores & Rubrics', labelAr: 'معايير التقييم والملاحظات' },
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

      {/* Tab Content Display */}
      {activeTab === 'nomination' && isCuratorOrCoordinator ? (
        <ArtistNominationBuilder
          lang={lang}
          onSuccess={() => setActiveTab('verification')}
          onCancel={() => setActiveTab('verification')}
        />
      ) : (
        <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
          {/* CULTURAL & TEXTUAL VERIFICATION TAB */}
          {activeTab === 'verification' && (
            <div className="space-y-6">
              {/* Mandatory Governance Blocker Banner */}
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
                        ? (isAr ? '✓ تم اجتياز بوابة التحقق الثقافي والنصوصي بنجاح' : '✓ Cultural & Textual Verification Certified')
                        : (isAr ? 'بوابة الحوكمة المانعة: التحقق الثقافي والنصوصي شرط إلزامي قبل التعاقد' : 'Mandatory Blocker: Cultural & Textual Verification Gate Active')}
                    </span>
                    <p className="text-xs">
                      {isAr
                        ? 'وفقاً للائحة بينالي الشارقة للخط، يُحظر توليد العقود النظامية أو صرف الدفعة المقدمة (30%) إلا بعد التحقق الصريح من أصالة الخط العربي الكلاسيكي وضبط نصوص الشعر العربي من قبل سعادة أ. محمد إبراهيم القصير وخبراء الخط.'
                        : 'Under Sharjah Calligraphy Biennial governance, bilateral contract generation and the 30% advance payment remain strictly locked until classical Arabic scripts and poetry transcriptions are certified by Calligraphy Experts and the Director of Cultural Affairs, Mohammed Ibrahim Al Qaseer.'}
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
                      ? (isAr ? 'العقد متاح للتوليد' : 'Contract Unlocked')
                      : (isAr ? 'العقد محظور نظامياً' : 'Contract Blocked')}
                  </span>
                </div>
              </div>

              {/* Classical Arabic Poetry & Script Inspection Panels */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-sadu-gold/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Feather className="w-4 h-4 text-sadu-brick" />
                    <h3 className="font-editorial text-base font-bold text-sadu-charcoal">
                      {isAr ? 'تدقيق النصوص الشعرية والخطوط الكلاسيكية المقترحة للمعرض' : 'Classical Arabic Poetry & Script Transcriptions Review'}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-sadu-muted">
                    {isAr ? 'المعرض: خرائط الصوت والحرف' : 'Dossier: Sound & Script'}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Artwork 1 Transcription Verification */}
                  <div className="p-4 bg-sadu-paper rounded-lg border border-sadu-gold space-y-3 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] text-sadu-brick font-bold block">
                          WORK #1 · SCB-2026-YN-01
                        </span>
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
                        {isAr ? 'النص الشعري المعتمد المنقوش:' : 'Transcribed Classical Poetry:'}
                      </span>
                      <p className="font-editorial text-sm font-semibold text-sadu-charcoal text-center py-1">
                        "مُعَلِّلَتي بالوَصلِ وَالمَوتُ دونَهُ · إِذا مِتُّ ظَمآناً فَلا نَزَلَ القَطرُ"
                      </p>
                      <span className="text-[10px] text-sadu-muted block text-center">
                        {isAr ? 'أبو فراس الحمداني · بحر الطويل (تدقيق الوزن اللغوي سليم)' : 'Abu Firas Al-Hamadani · Classical Bahr Al-Tawil (Prosody Confirmed)'}
                      </span>
                    </div>

                    <div className="text-[11px] text-sadu-charcoal space-y-1 pt-1">
                      <div><strong>{isAr ? 'قواعد التشكيل والضبط:' : 'Diacritics & Tashkeel:'}</strong> {isAr ? 'تام الضبط بنقاط الإعجام وحركات الإعراب الكوفية' : 'Full vocalization with authentic early Kufic vowel markers'}</div>
                      <div><strong>{isAr ? 'الوسيط الحامل:' : 'Substrate Medium:'}</strong> {isAr ? 'برونز مصبوب وقاعدة بازلتية معالجة' : 'Cast bronze with archival patination'}</div>
                    </div>
                  </div>

                  {/* Artwork 2 Transcription Verification */}
                  <div className="p-4 bg-sadu-paper rounded-lg border border-sadu-gold space-y-3 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] text-sadu-brick font-bold block">
                          WORK #2 · SCB-2026-YN-02
                        </span>
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
                        {isAr ? 'النص الشعري المعتمد المنقوش:' : 'Transcribed Classical Poetry:'}
                      </span>
                      <p className="font-editorial text-sm font-semibold text-sadu-charcoal text-center py-1">
                        "أَنا الَّذي نَظَرَ الأَعمى إِلى أَدَبي · وَأَسمَعَت كَلِماتي مَن بِهِ صَمَمُ"
                      </p>
                      <span className="text-[10px] text-sadu-muted block text-center">
                        {isAr ? 'أبو الطيب المتنبي · ديوان المتنبي (تحقيق معتمد من دار المخطوطات)' : 'Al-Mutanabbi · Authentic Diwan Verified by Sharjah Manuscripts House'}
                      </span>
                    </div>

                    <div className="text-[11px] text-sadu-charcoal space-y-1 pt-1">
                      <div><strong>{isAr ? 'سلامة النسب الخطية:' : 'Script Lineage Proportions:'}</strong> {isAr ? 'تناسب ميزان النقطة (ألف 7 نقاط، تسطير الحروف الصاعدة)' : 'Ratio: 7-dot Alif baseline with harmonious ascending strokes'}</div>
                      <div><strong>{isAr ? 'الوسيط الحامل:' : 'Substrate Medium:'}</strong> {isAr ? 'ورق توت يدوي مقهر بحبر الجوز والنيلة' : 'Ahar-sized mulberry paper with walnut ink & indigo'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TWO MANDATORY SIGN-OFF GATES */}
              <div className="space-y-4 pt-4 border-t border-sadu-gold/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Stamp className="w-4 h-4 text-sadu-brick" />
                    <h3 className="font-editorial text-base font-bold text-sadu-charcoal">
                      {isAr ? 'اعتمادات التحقق الملزمة (Sign-off Ledger)' : 'Mandatory Sign-off Ledger'}
                    </h3>
                  </div>
                  <span className="text-xs text-sadu-muted">
                    {isAr ? 'يتطلب توقيع الطرفين لرفع حظر التعاقد' : 'Both signatures mandatory to lift contract hold'}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Gate 1: Calligraphy Experts Panel */}
                  <div className={`p-4 rounded-lg border transition-all text-xs space-y-3 ${
                    expertScriptVerified
                      ? 'bg-sadu-sand/80 border-sadu-gold'
                      : 'bg-white border-dashed border-sadu-gold'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-sadu-charcoal block text-sm">
                          {isAr ? 'لجنة خبراء الخط العربي المعتمدين' : 'Calligraphy Experts Panel'}
                        </span>
                        <span className="text-[11px] text-sadu-muted">
                          {isAr ? 'تدقيق ميزان النقطة، النسب الشريفة، وضبط التراكيب' : 'Script Lineage, Proportion & Letterforms Verification'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        expertScriptVerified
                          ? 'bg-sadu-sage-light text-sadu-ink border border-sadu-sage'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {expertScriptVerified ? (isAr ? '✓ تم التدقيق الفني' : '✓ Certified') : (isAr ? 'قيد المراجعة' : 'Pending')}
                      </span>
                    </div>

                    <p className="text-[11px] text-sadu-charcoal leading-relaxed">
                      {isAr
                        ? 'أفاد الخبراء بسلامة رسم الحروف ومطابقتها للمدارس الأصيلة (الثلث الجلي والكوفي)، مع الالتزام باتساق التراكيب الخطية في اللوحتين.'
                        : 'Certified that all script proportions, ligatures, and diacritics adhere to classical institutional standards of Jali Thuluth and Archaic Kufic.'}
                    </p>

                    <div className="pt-2 border-t border-sadu-gold/50 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-sadu-muted">
                        {expertScriptVerified ? 'EXP-REV-SCB-914' : (isAr ? 'بانتظار التوقيع' : 'Awaiting Sign-off')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpertScriptVerified(!expertScriptVerified)}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                          expertScriptVerified
                            ? 'bg-sadu-sand text-sadu-ink border border-sadu-gold hover:bg-sadu-sand-dark'
                            : 'bg-sadu-brick text-white hover:bg-sadu-brick-dark'
                        }`}
                      >
                        {expertScriptVerified
                          ? (isAr ? 'إلغاء الاعتماد' : 'Revoke Sign-off')
                          : (isAr ? 'توقيع اعتماد خبراء الخط' : 'Sign-off Script Verification')}
                      </button>
                    </div>
                  </div>

                  {/* Gate 2: Director of Cultural Affairs (Mohammed Ibrahim Al Qaseer) */}
                  <div className={`p-4 rounded-lg border transition-all text-xs space-y-3 ${
                    directorPoetryVerified
                      ? 'bg-sadu-sand/80 border-sadu-gold'
                      : 'bg-amber-50/40 border-dashed border-amber-300'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-sadu-charcoal block text-sm">
                          {isAr ? 'أ. محمد إبراهيم القصير' : 'Mohammed Ibrahim Al Qaseer'}
                        </span>
                        <span className="text-[11px] text-sadu-brick font-semibold">
                          {isAr ? 'مدير إدارة الشؤون الثقافية · دائرة الثقافة' : 'Director of Cultural Affairs · Department of Culture'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        directorPoetryVerified
                          ? 'bg-sadu-sage-light text-sadu-ink border border-sadu-sage'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {directorPoetryVerified ? (isAr ? '✓ توقيع رسمي معتمد' : '✓ Signed by Director') : (isAr ? 'مطلوب التوقيع الصريح' : 'Signature Required')}
                      </span>
                    </div>

                    <p className="text-[11px] text-sadu-charcoal leading-relaxed">
                      {isAr
                        ? 'المصادقة الرسمية على استيفاء شروط الأصالة الشعرية والتراثية، والموافقة على إدراج نصوص المتنبي وأبي فراس الحمداني في كتالوج المعرض والعقد.'
                        : 'Official institutional verification certifying classical Arabic poetry authenticity and authorizing transcription inclusion in exhibition catalogue and contract.'}
                    </p>

                    <div className="pt-2 border-t border-sadu-gold/50 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-sadu-muted">
                        {directorPoetryVerified ? 'DIR-MIAQ-AUTH-2026' : (isAr ? 'مانع تعاقد نشط' : 'Contract Lock Active')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDirectorPoetryVerified(!directorPoetryVerified)}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                          directorPoetryVerified
                            ? 'bg-sadu-sand text-sadu-ink border border-sadu-gold hover:bg-sadu-sand-dark'
                            : 'bg-sadu-ink text-white hover:bg-sadu-ink-dark shadow-xs'
                        }`}
                      >
                        {directorPoetryVerified
                          ? (isAr ? 'سحب الاعتماد' : 'Revoke Signature')
                          : (isAr ? 'توقيع أ. محمد إبراهيم القصير' : 'Sign as Mohammed Ibrahim Al Qaseer')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Workflow Action Button */}
              <div className="pt-4 border-t border-sadu-gold/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-sadu-muted">
                  {isTextualVerificationComplete ? (
                    <span className="text-sadu-sage font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {isAr ? 'تم استيفاء كافة اشتراطات التحقق الثقافي والنصوصي بنجاح' : 'All cultural and textual verification criteria fully satisfied.'}
                    </span>
                  ) : (
                    <span className="text-sadu-brick flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {isAr ? 'توليد العقد النظامي محظور حتى يوقع مدير إدارة الشؤون الثقافية' : 'Contract generation remains blocked until Director of Cultural Affairs signs.'}
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
                      : (isAr ? 'العقد محظور (يتطلب التحقق)' : 'Contract Blocked (Verification Required)')}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* PROPOSAL TAB */}
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
                  {sub.isTakreem && (
                    <span 
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF9EE] text-[#8C601E] border border-sadu-ochre shadow-2xs"
                      title={isAr ? 'تكريم: فنان مكرّم في بينالي الشارقة للخط' : 'Takreem: Honored Artist in Sharjah Calligraphy Biennial'}
                    >
                      <Award className="w-3.5 h-3.5 text-sadu-ochre shrink-0" />
                      <span>تكريم (Honored Artist)</span>
                    </span>
                  )}
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

              <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-sadu-gold/40">
                <div className="p-3 bg-sadu-sand rounded-md">
                  <span className="text-xs text-sadu-muted block">{isAr ? 'عدد الأعمال المقترحة' : 'Proposed Artworks'}</span>
                  <span className="text-lg font-bold text-sadu-charcoal">{isAr ? `${formatNumber(sub.worksCount)} أعمال نحتية` : `${sub.worksCount} Sculptural Pieces`}</span>
                </div>
                <div className="p-3 bg-sadu-sand rounded-md">
                  <span className="text-xs text-sadu-muted block">{isAr ? 'المكافأة التقديرية المقترحة' : 'Honorarium Estimate'}</span>
                  <span className="text-lg font-bold text-sadu-charcoal font-mono">{isAr ? `${formatNumber(sub.proposedBudgetUsd)} دولار` : `$${sub.proposedBudgetUsd.toLocaleString()} USD`}</span>
                </div>
                <div className="p-3 bg-sadu-sand rounded-md">
                  <span className="text-xs text-sadu-muted block">{isAr ? 'التصنيف الخطّي والتقني' : 'Calligraphic Classification'}</span>
                  <span className="text-lg font-bold text-sadu-ink">{isAr ? 'جلي ديواني وكوفي' : 'Diwani & Kufic'}</span>
                </div>
              </div>
            </div>
          )}

          {/* WORKS TAB */}
          {activeTab === 'works' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-sadu-charcoal mb-2">
                {isAr ? 'الأعمال المقترحة المرفقة بالملف (معاينة فنية)' : 'Submitted Artwork Checklist for Selection'}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {ARTWORKS.slice(0, 2).map((art, idx) => (
                  <div key={art.id} className="p-4 bg-sadu-sand rounded-md border border-sadu-gold flex flex-col justify-between min-h-[160px] space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-sadu-brick font-bold block">
                            {isAr ? `العمل رقم ${formatNumber(idx + 1)} · ${art.canonicalCode}` : `Work #${idx + 1} · ${art.canonicalCode}`}
                          </span>
                          <h4 className="font-bold text-sm text-sadu-charcoal">
                            {isAr ? art.titleAr : art.titleEn}
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] rounded bg-sadu-linen border border-sadu-gold font-mono font-bold">
                          {isAr ? `${formatNumber(art.insuranceValueUsd)} دولار` : `$${art.insuranceValueUsd.toLocaleString()}`}
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-sadu-charcoal">
                        <div><strong>{isAr ? 'المواد:' : 'Medium:'}</strong> {isAr ? art.mediumAr : art.mediumEn}</div>
                        <div><strong>{isAr ? 'الأبعاد والوزن:' : 'Dimensions & Weight:'}</strong> {localizeDigits(art.dimensionsCm)} · {isAr ? `${formatNumber(art.weightKg)} كجم` : `${art.weightKg} kg`}</div>
                        <div><strong>{isAr ? 'اشتراطات التثبيت:' : 'Mounting Specs:'}</strong> {isAr ? art.installationRequirementsAr : art.installationRequirementsEn}</div>
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

          {/* SCORES TAB: 65-Point Gate 1 Rubric & Juror Scoring */}
          {activeTab === 'scores' && (
            <div className="space-y-6">
              {/* Previous Participation Warning Banner */}
              {sub.hasPreviousParticipation && (
                <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-lg flex items-start gap-3 text-xs text-amber-950 shadow-2xs">
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-amber-900">
                        {isAr ? 'تنبيه تدقيق: مشاركة سابقة في دورات بينالي الشارقة للخط' : 'Audit Notice: Prior Sharjah Calligraphy Biennial Participation'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-mono font-bold text-[10px]">
                        {isAr ? 'الدورة التاسعة / العاشرة' : '9th / 10th Edition'}
                      </span>
                    </div>
                    <p className="text-amber-900/90 leading-relaxed">
                      {isAr
                        ? 'تنبيه للجنة التحكيم: سبق للفنان المشاركة في دورات سابقة للبينالي. وفقاً للائحة المعايير المؤسسية، يُشترط تقديم مقترح يحمل "جدة بصرية ومفاهيمية جذرية" (Radical Novelty) لضمان عدم تكرار النمط أو الأسلوب المعتمد سابقاً.'
                        : 'Juror Guidance: This artist participated in previous biennial editions. Per institutional standards, evaluation must strictly scrutinize whether the new proposal offers radical visual/conceptual evolution rather than reiterating past repertoire.'}
                    </p>
                  </div>
                </div>
              )}

              {/* 65-Point Gate 1 Scoring Overview */}
              <div className="p-5 bg-sadu-paper rounded-lg border border-sadu-gold space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sadu-gold/40 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-sadu-brick text-white font-mono font-bold text-xs">
                        {isAr ? 'البوابة 1 (65 نقطة)' : 'Gate 1 (65 Pts)'}
                      </span>
                      <h3 className="text-base font-editorial font-bold text-sadu-charcoal">
                        {isAr ? 'استمارة التقييم الفني والمفاهيمي المحكمة (اللجنة والقيّم)' : 'Curatorial & Artistic Merit Evaluation (65-Point Rubric)'}
                      </h3>
                    </div>
                    <p className="text-xs text-sadu-muted mt-1">
                      {isAr
                        ? 'توزع على: المعايير الفنية والجمالية (40 نقطة) · ملف الفنان وخبرته (15 نقطة) · الملاءمة لفن الخط العربي (10 نقاط)'
                        : 'Breakdown: Curatorial & Artistic (40 pts) · Artist Profile & Experience (15 pts) · Calligraphy Relevance (10 pts)'}
                    </p>
                  </div>

                  <div className="text-end rtl:text-start bg-sadu-sand px-4 py-2 rounded-md border border-sadu-gold">
                    <span className="text-xs text-sadu-muted block">
                      {isAr ? 'مجموع البوابة الأولى' : 'Gate 1 Total Score'}
                    </span>
                    <span className="text-2xl font-editorial font-bold text-sadu-brick">
                      {localizeDigits(curatorialTotal)} <span className="text-sm font-sans font-normal text-sadu-muted">/ 65</span>
                    </span>
                  </div>
                </div>

                {/* Rubric Sliders Grid */}
                <div className="space-y-6 pt-2">
                  {/* Category A: Curatorial & Concept (40 pts) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sadu-ink uppercase tracking-wider">
                        {isAr ? 'أ. المعايير التقييمية والفنية (40 نقطة كحد أقصى)' : 'A. Curatorial & Conceptual Merit (Max 40 Points)'}
                      </span>
                      <span className="text-xs font-mono font-bold text-sadu-brick">
                        {localizeDigits(curatorialScores.alignmentTheme + curatorialScores.artisticQuality + curatorialScores.innovation + curatorialScores.culturalValue)} / 40
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Alignment with Theme */}
                      <div className="p-3 bg-sadu-sand/60 rounded-md border border-sadu-gold/60 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-sadu-charcoal">{isAr ? 'التوافق مع ثيمة البينالي' : 'Alignment with Biennale Theme'}</span>
                          <span className="font-mono font-bold text-sadu-brick">{curatorialScores.alignmentTheme} / 10</span>
                        </div>
                        <input dir="auto"
                          type="range"
                          min="0"
                          max="10"
                          value={curatorialScores.alignmentTheme}
                          onChange={(e) => setCuratorialScores({ ...curatorialScores, alignmentTheme: Number(e.target.value) })}
                          className="w-full accent-sadu-brick cursor-pointer"
                        />
                        <span className="text-[10px] text-sadu-muted block">
                          {isAr ? 'عمق المواءمة الفكرية مع شعار الدورة' : 'Intellectual resonance with curatorial thesis'}
                        </span>
                      </div>

                      {/* Artistic Quality */}
                      <div className="p-3 bg-sadu-sand/60 rounded-md border border-sadu-gold/60 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-sadu-charcoal">{isAr ? 'الجودة الفنية والتمكن البصري' : 'Artistic & Execution Quality'}</span>
                          <span className="font-mono font-bold text-sadu-brick">{curatorialScores.artisticQuality} / 10</span>
                        </div>
                        <input dir="auto"
                          type="range"
                          min="0"
                          max="10"
                          value={curatorialScores.artisticQuality}
                          onChange={(e) => setCuratorialScores({ ...curatorialScores, artisticQuality: Number(e.target.value) })}
                          className="w-full accent-sadu-brick cursor-pointer"
                        />
                        <span className="text-[10px] text-sadu-muted block">
                          {isAr ? 'الحرفية، البراعة، والنضج البصري' : 'Visual mastery and material execution'}
                        </span>
                      </div>

                      {/* Innovation & Originality */}
                      <div className="p-3 bg-sadu-sand/60 rounded-md border border-sadu-gold/60 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-sadu-charcoal">{isAr ? 'الابتكار والأصالة التعبيرية' : 'Innovation & Conceptual Originality'}</span>
                          <span className="font-mono font-bold text-sadu-brick">{curatorialScores.innovation} / 10</span>
                        </div>
                        <input dir="auto"
                          type="range"
                          min="0"
                          max="10"
                          value={curatorialScores.innovation}
                          onChange={(e) => setCuratorialScores({ ...curatorialScores, innovation: Number(e.target.value) })}
                          className="w-full accent-sadu-brick cursor-pointer"
                        />
                        <span className="text-[10px] text-sadu-muted block">
                          {isAr ? 'فرادة الرؤية وعدم تكرار الأساليب السابقة' : 'Original approach and distinct voice'}
                        </span>
                      </div>

                      {/* Cultural Value */}
                      <div className="p-3 bg-sadu-sand/60 rounded-md border border-sadu-gold/60 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-sadu-charcoal">{isAr ? 'القيمة الثقافية والرمزية' : 'Cultural & Heritage Depth'}</span>
                          <span className="font-mono font-bold text-sadu-brick">{curatorialScores.culturalValue} / 10</span>
                        </div>
                        <input dir="auto"
                          type="range"
                          min="0"
                          max="10"
                          value={curatorialScores.culturalValue}
                          onChange={(e) => setCuratorialScores({ ...curatorialScores, culturalValue: Number(e.target.value) })}
                          className="w-full accent-sadu-brick cursor-pointer"
                        />
                        <span className="text-[10px] text-sadu-muted block">
                          {isAr ? 'إثراء المشهد الثقافي لإمارة الشارقة' : 'Significance to the Sharjah artistic landscape'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category B: Artist Profile & Standing (15 pts) */}
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
                      {/* Artist Profile */}
                      <div className="p-3 bg-sadu-sand/60 rounded-md border border-sadu-gold/60 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-sadu-charcoal">{isAr ? 'المكانة والمسار الفني' : 'Career Standing'}</span>
                          <span className="font-mono font-bold text-sadu-brick">{curatorialScores.artistProfile} / 5</span>
                        </div>
                        <input dir="auto"
                          type="range"
                          min="0"
                          max="5"
                          value={curatorialScores.artistProfile}
                          onChange={(e) => setCuratorialScores({ ...curatorialScores, artistProfile: Number(e.target.value) })}
                          className="w-full accent-sadu-brick cursor-pointer"
                        />
                        <span className="text-[10px] text-sadu-muted block">
                          {isAr ? 'المكانة الإقليمية والدولية' : 'Regional & international recognition'}
                        </span>
                      </div>

                      {/* Exhibition History */}
                      <div className="p-3 bg-sadu-sand/60 rounded-md border border-sadu-gold/60 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-sadu-charcoal">{isAr ? 'سجل المشاركات والمعارض' : 'Exhibition Track Record'}</span>
                          <span className="font-mono font-bold text-sadu-brick">{curatorialScores.exhibitionHistory} / 5</span>
                        </div>
                        <input dir="auto"
                          type="range"
                          min="0"
                          max="5"
                          value={curatorialScores.exhibitionHistory}
                          onChange={(e) => setCuratorialScores({ ...curatorialScores, exhibitionHistory: Number(e.target.value) })}
                          className="w-full accent-sadu-brick cursor-pointer"
                        />
                        <span className="text-[10px] text-sadu-muted block">
                          {isAr ? 'المشاركات في متاحف وبيناليات مرموقة' : 'Institutional biennials and retrospectives'}
                        </span>
                      </div>

                      {/* Strategic Value */}
                      <div className="p-3 bg-sadu-sand/60 rounded-md border border-sadu-gold/60 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-sadu-charcoal">{isAr ? 'القيمة الاستراتيجية للترشيح' : 'Strategic Value to Edition'}</span>
                          <span className="font-mono font-bold text-sadu-brick">{curatorialScores.strategicValue} / 5</span>
                        </div>
                        <input dir="auto"
                          type="range"
                          min="0"
                          max="5"
                          value={curatorialScores.strategicValue}
                          onChange={(e) => setCuratorialScores({ ...curatorialScores, strategicValue: Number(e.target.value) })}
                          className="w-full accent-sadu-brick cursor-pointer"
                        />
                        <span className="text-[10px] text-sadu-muted block">
                          {isAr ? 'التنوع الجغرافي وتكريم الرواد' : 'Geographic balance and pioneer tribute'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category C: Calligraphy Relevance (10 pts) */}
                  <div className="space-y-3 pt-3 border-t border-sadu-gold/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sadu-ink uppercase tracking-wider">
                        {isAr ? 'ج. الملاءمة لفن الخط العربي (10 نقاط كحد أقصى)' : 'C. Calligraphic Relevance & Typography (Max 10 Points)'}
                      </span>
                      <span className="text-xs font-mono font-bold text-sadu-brick">
                        {localizeDigits(curatorialScores.calligraphyRelevance)} / 10
                      </span>
                    </div>

                    <div className="p-3 bg-sadu-sand/60 rounded-md border border-sadu-gold/60 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-sadu-charcoal">
                          {isAr ? 'أصالة الخط والتمكن من قواعد الحرف العربي' : 'Calligraphic Authenticity & Script Syntax'}
                        </span>
                        <span className="font-mono font-bold text-sadu-brick">{curatorialScores.calligraphyRelevance} / 10</span>
                      </div>
                      <input dir="auto"
                        type="range"
                        min="0"
                        max="10"
                        value={curatorialScores.calligraphyRelevance}
                        onChange={(e) => setCuratorialScores({ ...curatorialScores, calligraphyRelevance: Number(e.target.value) })}
                        className="w-full accent-sadu-brick cursor-pointer"
                      />
                      <span className="text-[10px] text-sadu-muted block">
                        {isAr ? 'انضباط القواعد، النسب الفاضلة، أو التفكيك المعاصر المرتكز على أسس سليمة' : 'Grammar of proportional scripts or grounded contemporary deconstruction'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recorded Deliberations & Signatures */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-sadu-charcoal">{isAr ? 'ملاحظات وتوقيعات السادة المحكمين:' : 'Recorded Juror Deliberations & Signatures:'}</h3>
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

          {/* CONDITIONS TAB */}
          {activeTab === 'conditions' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-sadu-paper rounded-md border-s-4 rtl:border-s-0 rtl:border-e-4 border-sadu-brick text-xs">
                <span className="font-bold text-sadu-brick block mb-1">
                  {isAr ? 'شروط اعتماد اللجنة الملزمة (تُلحق بنسخة النطاق المعتمد v1.2):' : 'Binding Committee Conditions (Attached to Approved Scope Revision v1.2):'}
                </span>
                {isAr 
                  ? 'لا يُعتبر النطاق سارياً إلا بعد استيفاء هذه الشروط من الفريق الفني والمنسق المختص.'
                  : 'Approved Scope remains conditional until technical verification and bilingual poetry texts are cleared.'}
              </div>

              <div className="space-y-3">
                {sub.conditionsEn.map((condEn, idx) => {
                  const conditionConfigs = [
                    {
                      step: 5,
                      total: 5,
                      percent: 100,
                      statusLevel: 'completed' as const,
                      labelEn: 'Condition Cleared',
                      labelAr: 'مستوفى بالكامل',
                      nextEn: 'Structural floor load signed off by Chief Engineer.',
                      nextAr: 'معتمد رسمياً من كبير مهندسي الموقع.',
                    },
                    {
                      step: 3,
                      total: 4,
                      percent: 75,
                      statusLevel: 'in_progress' as const,
                      labelEn: 'In Juror Proofing',
                      labelAr: 'قيد التدقيق اللغوي',
                      nextEn: 'Review of classical Diwani verse translations underway.',
                      nextAr: 'تدقيق ترجمات الأبيات الشعرية بالخط الديواني جارٍ.',
                    },
                    {
                      step: 2,
                      total: 4,
                      percent: 50,
                      statusLevel: 'in_progress' as const,
                      labelEn: 'Reconciliation Active',
                      labelAr: 'تسوية الملاحظة جارية',
                      nextEn: 'Conservator laboratory surface oxidation audit report required.',
                      nextAr: 'يتطلب تقرير مختبر الترميم بشأن الأكسدة السطحية.',
                    },
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
                          currentStep={conf.step}
                          totalSteps={conf.total}
                          progressPercent={conf.percent}
                          statusLevel={conf.statusLevel}
                          labelEn={conf.labelEn}
                          labelAr={conf.labelAr}
                          nextActionEn={conf.nextEn}
                          nextActionAr={conf.nextAr}
                          variant="compact"
                          interactive={true}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-sadu-gold/40 flex items-center justify-between">
                <span className="text-xs text-sadu-muted">
                  {isAr ? `تاريخ اعتماد محضر التحكيم: ${localizeDigits('12 أغسطس 2026')}` : 'Minute Execution Date: 12 August 2026'}
                </span>
                <button
                  onClick={() => onNavigateTab('approved-scope')}
                  className="px-4 py-2 text-xs font-semibold rounded bg-sadu-brick text-white hover:bg-sadu-brick-dark transition-colors cursor-pointer"
                >
                  {isAr ? 'الانتقال إلى سجل النطاق المعتمد ←' : 'View in Approved Scope Tab →'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

