import { ARTIST_ID, createIntakeDraft, validateIntake, type ArtistProfile, type IntakeAsset, type IntakeIssue } from './artistIntake';

export interface RosterEntry {
  id: string;
  profile: ArtistProfile;
  status: 'verified-sample' | 'pending-review';
  registeredAt: string;
  evidenceLabel: { en: string; ar: string };
  assets: IntakeAsset[];
}
export interface RosterProgramme {
  id: string; titleEn: string; titleAr: string; artistIds: string[]; createdAt: string;
}
// Entirely invented examples. "Verified" is a staged demo state, never an institutional assertion.
export function seedRoster(): RosterEntry[] {
  return [
    ['DEMO-ROSTER-101', 'Sample Artist · Paper', 'فنان تجريبي · الورق', 'Paper installation and material studies.', 'تركيبات ورقية ودراسات المواد.'],
    ['DEMO-ROSTER-102', 'Sample Artist · Letterform', 'فنان تجريبي · الحرف', 'Contemporary lettering and book arts.', 'فن الحروف المعاصر وفنون الكتاب.'],
    ['DEMO-ROSTER-103', 'Sample Artist · Community', 'فنان تجريبي · المجتمع', 'Participatory workshops and shared stories.', 'ورش تشاركية وحكايات مشتركة.'],
  ].map(([id, nameEn, nameAr, en, ar]) => ({
    id, profile: { ...createIntakeDraft().profile, id, nameEn, nameAr, bio: `${en}\n${ar}`, email: `${id.toLowerCase()}@example.com` },
    status: 'verified-sample', registeredAt: '2026-09-19T08:00:00Z', assets: [],
    evidenceLabel: { en: 'Seeded demonstration only; no identity or document verification performed.', ar: 'مثال معدّ للعرض فقط؛ لم يُجرَ تحقق من الهوية أو المستندات.' },
  }));
}
export function validateRegistration(profile: ArtistProfile): IntakeIssue[] {
  // Reuse the shared profile rules without requiring any programme proposal.
  const draft = createIntakeDraft(); draft.profile = profile;
  const issues = validateIntake(draft, 'DEMO-CALL-01').filter(issue => issue.path.startsWith('profile.'));
  if (!profile.legalNameEn.trim() && !profile.legalNameAr.trim()) issues.push({ path: 'profile.legalNameEn', en: 'Add a sample legal name in at least one language.', ar: 'أضف اسماً قانونياً تجريبياً بلغة واحدة على الأقل.' });
  for (const key of ['legalNameEn', 'legalNameAr'] as const) if (profile[key].length > 200) issues.push({ path: `profile.${key}`, en: 'Keep the sample legal name within 200 characters.', ar: 'اجعل الاسم القانوني التجريبي في حدود ٢٠٠ حرف.' });
  return issues;
}
export function registerProfile(roster: RosterEntry[], profile: ArtistProfile, assets: IntakeAsset[], at: string): RosterEntry[] {
  if (profile.id !== ARTIST_ID || validateRegistration(profile).length || !Number.isFinite(Date.parse(at))) return roster;
  const entry: RosterEntry = {
    id: profile.id, profile: structuredClone(profile), status: 'pending-review', registeredAt: at,
    evidenceLabel: { en: 'Self-reported sample profile. Coordinator review pending.', ar: 'ملف تجريبي مقدّم ذاتياً. بانتظار مراجعة المنسق.' },
    assets: assets.filter(a => a.slot === 'cv' || a.slot === 'portfolio').map(a => ({ ...a })),
  };
  return [...roster.filter(item => item.id !== entry.id), entry];
}
export function createRosterProgramme(roster: RosterEntry[], input: Omit<RosterProgramme, 'artistIds'> & { artistIds: string[] }): RosterProgramme | null {
  const artistIds = [...new Set(input.artistIds)];
  if (!input.titleEn.trim() || !input.titleAr.trim() || input.titleEn.length > 200 || input.titleAr.length > 200 || !artistIds.length || !Number.isFinite(Date.parse(input.createdAt))) return null;
  if (artistIds.some(id => !roster.some(entry => entry.id === id && entry.status === 'verified-sample'))) return null;
  return { ...input, titleEn: input.titleEn.trim(), titleAr: input.titleAr.trim(), artistIds };
}
