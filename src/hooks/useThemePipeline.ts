import { useState } from 'react';
import type { InstitutionalRole } from '../App';
import { isThemeBatchComplete, type CommitteeThemeDraft } from '../components/CommitteeThemeWorkspace';
import type { ThemeItem } from '../components/ChairmanWorkspace';
import type { TranslationStatus } from '../components/GeneralCoordinatorWorkspace';
import type { ThemePolishStatus } from '../components/EditorialWorkspace';
import type { Boundaries } from '../data/curatorialBoundaries';

const INITIAL_GUIDELINES_AR = 'دليل المعرض التوجيهي لبينالي الشارقة للخط: التأكيد على الحوار الجمالي الرصين بين النسب الفاضلة للخط العربي الأصيل والتجليات المعمارية المعاصرة. يتوجب على كافة الفنانين المرشحين تقديم أعمال تستند إلى أصالة السطر الكوفي والثلث مع استكشاف أبعاد الوسائط الحديثة والفراغية.';
const INITIAL_GUIDELINES_EN = 'Exhibition Curatorial Guidelines: Emphasize the aesthetic dialogue between the sacred proportions of classical calligraphy and contemporary architectural manifestations. All nominated artists must ground their proposals in classical scripts while exploring modern spatial media.';
const INITIAL_BRIEF = 'Sharjah Calligraphy Biennial Curatorial Directive: Emphasize the dialogue between classical proportion and avant-garde architectural manifestation. All nominated artists must balance aesthetic script lineage with rigorous spatial experimentation.';

/**
 * Stages 1–3 of the workbench rehearsal: Committee theme proposals, Director review, Chairman
 * ratification and budget, Editorial bilingual polish, and the General Exhibition Coordinator's
 * curatorial guidelines and boundaries. Every handler re-checks the acting role and stage, so a
 * desk switch can never skip a gate.
 */
export function useThemePipeline({ activeRole, setActiveRole, onReturnedToCommittee }: {
  activeRole: InstitutionalRole;
  setActiveRole: (role: InstitutionalRole) => void;
  onReturnedToCommittee: () => void;
}) {
  const [submittedThemes, setSubmittedThemes] = useState<CommitteeThemeDraft[] | undefined>(undefined);
  const [directorThemes, setDirectorThemes] = useState<CommitteeThemeDraft[]>([]);
  const [chairmanDocketRevision, setChairmanDocketRevision] = useState(0);
  const [assignedBudget, setAssignedBudget] = useState<number | null>(null);
  const [ratifiedTheme, setRatifiedTheme] = useState<ThemeItem | null>(null);

  // Stage 1 & 2: theme ratification and Editorial polish.
  const [themePolishStatus, setThemePolishStatus] = useState<ThemePolishStatus>('PENDING_CHAIRMAN_APPROVAL');
  const [arabicLocked, setArabicLocked] = useState(false);
  const [themeEssayArabic, setThemeEssayArabic] = useState<string>('');
  const [themeEssayEnglish, setThemeEssayEnglish] = useState<string>('');

  // Stage 3: General Exhibition Coordinator guidelines, translation and boundaries.
  const [guidelinesArabic, setGuidelinesArabic] = useState<string>(INITIAL_GUIDELINES_AR);
  const [guidelinesEnglish, setGuidelinesEnglish] = useState<string>(INITIAL_GUIDELINES_EN);
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus>('DRAFT');
  const [guidelinesSubmittedAt, setGuidelinesSubmittedAt] = useState<string | null>(null);
  const [curatorialBrief, setCuratorialBrief] = useState<string>(INITIAL_BRIEF);
  const [publishedBoundaries, setPublishedBoundaries] = useState<Boundaries | null>(null);
  const [restrictionProposal, setRestrictionProposal] = useState<{ tags: string[]; reason: string } | null>(null);
  const [restrictionAudit, setRestrictionAudit] = useState<string[]>([]);
  const [blocklist, setBlocklist] = useState<string[]>([
    'Restricted Nationality: Country X',
    'Hazardous Medium: Open Flame',
  ]);

  const handleSubmitCommitteeThemes = (themes: CommitteeThemeDraft[]) => {
    if (activeRole !== 'PREP_COMMITTEE' || ratifiedTheme || directorThemes.length || submittedThemes || !isThemeBatchComplete(themes)) return false;
    setDirectorThemes(themes.map(theme => ({ ...theme })));
    setSubmittedThemes(undefined);
    return true;
  };

  const handleReturnToCommittee = () => {
    if (activeRole !== 'BIENNIAL_DIRECTOR' || ratifiedTheme) return;
    setDirectorThemes([]);
    setSubmittedThemes(undefined);
    onReturnedToCommittee();
    setActiveRole('PREP_COMMITTEE');
  };

  const handlePresentToChairman = (themes: CommitteeThemeDraft[]) => {
    if (activeRole !== 'BIENNIAL_DIRECTOR' || ratifiedTheme || submittedThemes || !isThemeBatchComplete(themes)) return;
    // Director may append advice, but cannot replace the Committee's proposal text.
    if (!isThemeBatchComplete(directorThemes) || themes.some((theme, index) => {
      const source = directorThemes[index];
      return theme.arabicName !== source.arabicName || theme.englishName !== source.englishName ||
        theme.aestheticFramework !== source.aestheticFramework || theme.contemporaryRelevance !== source.contemporaryRelevance ||
        theme.curatorialJustification !== source.curatorialJustification;
    })) return;
    setChairmanDocketRevision(revision => revision + 1);
    setSubmittedThemes(directorThemes.map((theme, index) => ({ ...theme, directorNotes: themes[index].directorNotes })));
  };

  const handleBudgetAssigned = (amount: number, theme: ThemeItem) => {
    if (activeRole !== 'CHAIRMAN' || ratifiedTheme || !submittedThemes || !isThemeBatchComplete(submittedThemes) || !submittedThemes.some(candidate => candidate.arabicName === theme.arabicName && candidate.curatorialJustification === theme.curatorialJustification) || !Number.isFinite(amount) || amount <= 0) return;
    setAssignedBudget(amount);
    // Preserve the complete executive record, including both sets of notes.
    const selected = submittedThemes.find(candidate => candidate.arabicName === theme.arabicName)!;
    setRatifiedTheme({ ...selected, chairmanNotes: theme.chairmanNotes });
    setArabicLocked(false);
    setThemeEssayArabic('');
    setThemeEssayEnglish('');
    setThemePolishStatus('PENDING_EDITORIAL_POLISH');
  };

  const handlePublishOfficialTheme = ({ themeEssayArabic: essayAr, themeEssayEnglish: essayEn }: { themeEssayArabic: string; themeEssayEnglish: string }) => {
    if (activeRole !== 'EDITORIAL' || !ratifiedTheme || !arabicLocked || themePolishStatus !== 'PENDING_EDITORIAL_POLISH' || essayAr !== themeEssayArabic || essayAr.trim().length <= 10 || essayEn.trim().length <= 10) return false;
    setThemeEssayArabic(essayAr);
    setThemeEssayEnglish(essayEn);
    setThemePolishStatus('PUBLISHED_OFFICIAL');
    return true;
  };

  const handleSubmitToEditorial = (arabicText: string) => {
    if (publishedBoundaries || activeRole !== 'GENERAL_COORDINATOR' || themePolishStatus !== 'PUBLISHED_OFFICIAL' || !['DRAFT', 'REQUEST_REVISION'].includes(translationStatus) || !arabicText.trim()) return;
    setGuidelinesArabic(arabicText.trim());
    setGuidelinesEnglish('');
    setTranslationStatus('PENDING_TRANSLATION');
    setGuidelinesSubmittedAt(new Date().toLocaleTimeString('ar-AE'));
  };

  const handlePublishBrief = (englishText: string, arabicSource: string) => {
    if (activeRole !== 'EDITORIAL' || themePolishStatus !== 'PUBLISHED_OFFICIAL'
      || translationStatus !== 'PENDING_TRANSLATION' || arabicSource !== guidelinesArabic || !englishText.trim()) return;
    setGuidelinesEnglish(englishText.trim());
    setTranslationStatus('PUBLISHED');
    setCuratorialBrief(`${englishText}\n\n[Arabic Original]: ${guidelinesArabic}`);
  };

  return {
    submittedThemes, setSubmittedThemes, directorThemes, chairmanDocketRevision, assignedBudget, ratifiedTheme,
    themePolishStatus, setThemePolishStatus, arabicLocked, setArabicLocked,
    themeEssayArabic, setThemeEssayArabic, themeEssayEnglish, setThemeEssayEnglish,
    guidelinesArabic, guidelinesEnglish, setGuidelinesEnglish, translationStatus, setTranslationStatus, guidelinesSubmittedAt,
    curatorialBrief, publishedBoundaries, setPublishedBoundaries, restrictionProposal, setRestrictionProposal,
    restrictionAudit, setRestrictionAudit, blocklist, setBlocklist,
    handleSubmitCommitteeThemes, handleReturnToCommittee, handlePresentToChairman, handleBudgetAssigned,
    handlePublishOfficialTheme, handleSubmitToEditorial, handlePublishBrief,
  };
}
