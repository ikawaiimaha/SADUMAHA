export const ARTIST_ID = 'DEMO-ART-001';
export interface IntakeProgramme { id: string; en: string; ar: string; briefEn: string; briefAr: string; budget: number; space: string; artistIds?: string[] }
export const INTAKE_PROGRAMMES: IntakeProgramme[] = [
  { id: 'DEMO-CALL-01', en: 'Material and Memory', ar: 'المادة والذاكرة', briefEn: 'Propose a small indoor installation exploring how materials carry memory.', briefAr: 'اقترح تركيباً فنياً داخلياً صغيراً يستكشف الذاكرة التي تحملها المواد.', budget: 15000, space: '3 × 3 × 2.5 m' },
  { id: 'DEMO-CALL-02', en: 'Shared Stories Workshop', ar: 'ورشة الحكايات المشتركة', briefEn: 'Propose a two-hour public workshop about objects and shared stories.', briefAr: 'اقترح ورشة عامة مدتها ساعتان عن الأشياء والحكايات المشتركة.', budget: 5000, space: '6 × 6 × 3 m' },
];
export type ProgrammeId = string;
export const BUDGET_CATEGORIES = ['materials', 'equipment', 'shipping', 'fees', 'other'] as const;
export type BudgetCategory = typeof BUDGET_CATEGORIES[number];
export interface ArtistProfile {
  id: string; legalNameEn: string; legalNameAr: string; nameEn: string; nameAr: string; translationHelp: boolean; bio: string; website: string;
  country: string; city: string; email: string; phone: string;
  representation: 'independent' | 'gallery' | 'agency'; organisation: string; contactName: string; contactEmail: string;
}
export interface ArtistProposal {
  profileId: string; programmeId: ProgrammeId; titleEn: string; titleAr: string; conceptEn: string; conceptAr: string;
  translationHelp: boolean; technical: string; portfolioUrl: string; budget: Record<BudgetCategory, string>;
}
export interface IntakeDraft { profile: ArtistProfile; proposals: Record<ProgrammeId, ArtistProposal>; programmeBriefs?: Record<string, IntakeProgramme> }
export interface IntakeAsset { id: string; slot: 'cv' | 'portfolio' | ProgrammeId; name: string; size: number; type: string; url: string }
export interface IntakeSubmission {
  id: string; version: number; at: string; programmeId: ProgrammeId; snapshot: IntakeDraft;
  assets: IntakeAsset[]; status: 'received' | 'revision' | 'checked'; note: string; reviewedAt?: string;
}
export function createIntakeDraft(): IntakeDraft {
  const proposal = emptyProposal;
  return { profile: { id: ARTIST_ID, legalNameEn: '', legalNameAr: '', nameEn: '', nameAr: '', translationHelp: false, bio: '', website: '', country: '', city: '', email: '', phone: '', representation: 'independent', organisation: '', contactName: '', contactEmail: '' }, proposals: { 'DEMO-CALL-01': proposal('DEMO-CALL-01'), 'DEMO-CALL-02': proposal('DEMO-CALL-02') } };
}
export const emptyProposal = (programmeId: ProgrammeId): ArtistProposal => ({ profileId: ARTIST_ID, programmeId, titleEn: '', titleAr: '', conceptEn: '', conceptAr: '', translationHelp: false, technical: '', portfolioUrl: '', budget: { materials: '', equipment: '', shipping: '', fees: '', other: '' } });
export function sampleIntakeDraft(): IntakeDraft {
  const draft = createIntakeDraft();
  Object.assign(draft.profile, { legalNameEn: 'Sample Legal Name', legalNameAr: 'اسم قانوني تجريبي', nameEn: 'Sample Artist', nameAr: 'فنان تجريبي', bio: 'A fictional artist exploring materials, everyday objects and shared memory.', email: 'artist@example.com', country: 'Sample country', city: 'Sample city' });
  Object.assign(draft.proposals['DEMO-CALL-01'], { titleEn: 'Layers of Memory', titleAr: 'طبقات الذاكرة', conceptEn: 'A freestanding arrangement of paper panels invites visitors to reflect on the stories carried by everyday materials.', conceptAr: 'يدعو ترتيب مستقل من الألواح الورقية الزوار إلى التأمل في الحكايات التي تحملها المواد اليومية.', technical: 'Footprint 2 × 2 m; height 2 m. No powered equipment. Installation method requires specialist review.', portfolioUrl: '', budget: { materials: '1200', equipment: '500', shipping: '300', fees: '2000', other: '0' } });
  return draft;
}
export function findIntakeProgramme(draft: IntakeDraft, id: string) { return INTAKE_PROGRAMMES.find(p => p.id === id) ?? draft.programmeBriefs?.[id]; }
export function sampleProposal(programmeId: string): ArtistProposal { return { ...sampleIntakeDraft().proposals['DEMO-CALL-01'], programmeId }; }
export const budgetTotal = (proposal: ArtistProposal) => BUDGET_CATEGORIES.reduce((sum, category) => sum + (Number(proposal.budget[category]) || 0), 0);
export const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export function validWebUrl(value: string) { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password; } catch { return false; } }
export type IntakeIssue = { path: string; en: string; ar: string };
export function validateIntake(draft: IntakeDraft, programmeId: ProgrammeId): IntakeIssue[] {
  const issues: IntakeIssue[] = []; const p = draft.profile; const q = draft.proposals[programmeId]; const programme = findIntakeProgramme(draft, programmeId);
  if (!q || !programme) return [{ path: 'programmeId', en: 'Choose an available programme.', ar: 'اختر برنامجاً متاحاً.' }];
  const require = (ok: boolean, path: string, en: string, ar: string) => { if (!ok) issues.push({ path, en, ar }); };
  const paired = (en: string, ar: string, help: boolean) => help ? Boolean(en.trim() || ar.trim()) : Boolean(en.trim() && ar.trim());
  for (const key of ['nameEn', 'nameAr', 'country', 'city', 'email', 'phone', 'website', 'organisation', 'contactName', 'contactEmail', 'bio'] as const) {
    const limit = key === 'bio' ? 2000 : 200;
    require(p[key].length <= limit, `profile.${key}`, `Shorten this profile field to ${limit} characters.`, `اختصر حقل الملف إلى ${limit} حرف.`);
  }
  for (const key of ['titleEn', 'titleAr', 'conceptEn', 'conceptAr', 'technical', 'portfolioUrl'] as const) {
    const limit = key.startsWith('concept') ? 3000 : key === 'technical' ? 2000 : key === 'portfolioUrl' ? 1000 : 200;
    require(q[key].length <= limit, `proposals.${programmeId}.${key}`, `Shorten this proposal field to ${limit} characters.`, `اختصر حقل المقترح إلى ${limit} حرف.`);
  }
  require(paired(p.nameEn, p.nameAr, p.translationHelp), 'profile.nameEn', 'Add both display names, or request translation support and add one.', 'أضف اسمي العرض أو اطلب مساعدة الترجمة وأضف أحدهما.');
  require(validEmail(p.email), 'profile.email', 'Add a valid sample contact email.', 'أضف بريداً تجريبياً صحيحاً للتواصل.');
  require(!p.phone || /^\+[1-9]\d{6,14}$/.test(p.phone.replace(/[\s()-]/g, '')), 'profile.phone', 'Use + and a country code for the optional phone number.', 'استخدم + ورمز الدولة لرقم الهاتف الاختياري.');
  require(!p.website || validWebUrl(p.website), 'profile.website', 'Use an http or https website address.', 'استخدم عنوان موقع يبدأ بـ http أو https.');
  if (p.representation !== 'independent') { require(Boolean(p.organisation.trim()), 'profile.organisation', 'Add the representing organisation.', 'أضف الجهة الممثلة.'); require(Boolean(p.contactName.trim()) && validEmail(p.contactEmail), 'profile.contactEmail', 'Add the representative’s name and valid email.', 'أضف اسم الممثل وبريداً صحيحاً.'); }
  else require(!p.contactEmail || validEmail(p.contactEmail), 'profile.contactEmail', 'Check the optional studio assistant email.', 'تحقق من بريد مساعد الاستوديو الاختياري.');
  require(paired(q.titleEn, q.titleAr, q.translationHelp), `proposals.${programmeId}.titleEn`, 'Add both proposal titles, or request translation support.', 'أضف عنواني المقترح أو اطلب مساعدة الترجمة.');
  require(paired(q.conceptEn, q.conceptAr, q.translationHelp), `proposals.${programmeId}.conceptEn`, 'Add the concept in both languages, or request translation support.', 'أضف الفكرة باللغتين أو اطلب مساعدة الترجمة.');
  require(Boolean(q.technical.trim()), `proposals.${programmeId}.technical`, 'Describe the space, equipment and installation or workshop needs.', 'صف المساحة والتجهيزات واحتياجات التركيب أو الورشة.');
  require(!q.portfolioUrl || validWebUrl(q.portfolioUrl), `proposals.${programmeId}.portfolioUrl`, 'Use an http or https portfolio address.', 'استخدم عنوان ملف أعمال يبدأ بـ http أو https.');
  const amounts = Object.values(q.budget); const budget = programme.budget;
  require(amounts.every(v => v === '' || /^\d+(\.\d{1,2})?$/.test(v)) && amounts.some(v => v !== ''), `proposals.${programmeId}.budget.materials`, 'Enter non-negative amounts with up to two decimal places; enter 0 for no cost.', 'أدخل مبالغ غير سالبة بمنزلتين عشريتين كحد أقصى؛ أدخل 0 إن لم توجد تكلفة.');
  require(budgetTotal(q) <= budget, `proposals.${programmeId}.budget.materials`, `The sample budget limit is AED ${budget}.`, `حد الميزانية التجريبية ${budget} درهم.`);
  return issues;
}
// Explicit allowlist for device backups. No contact details, files or review outcomes.
export function recoverableDraft(input: IntakeDraft): IntakeDraft {
  const safe = createIntakeDraft(); const p = input.profile;
  for (const key of ['nameEn', 'nameAr', 'bio', 'website', 'country', 'city', 'organisation'] as const) safe.profile[key] = p[key];
  safe.profile.translationHelp = p.translationHelp; safe.profile.representation = p.representation;
  for (const [id, proposal] of Object.entries(input.proposals)) {
    safe.proposals[id] = emptyProposal(id);
    for (const key of ['titleEn', 'titleAr', 'conceptEn', 'conceptAr', 'technical', 'portfolioUrl'] as const) safe.proposals[id][key] = proposal[key];
    safe.proposals[id].translationHelp = proposal.translationHelp;
    for (const key of BUDGET_CATEGORIES) safe.proposals[id].budget[key] = proposal.budget[key];
  }
  if (input.programmeBriefs) safe.programmeBriefs = Object.fromEntries(Object.entries(input.programmeBriefs).map(([id, p]) => [id, { id, en: p.en, ar: p.ar, briefEn: p.briefEn, briefAr: p.briefAr, budget: p.budget, space: p.space, artistIds: [...(p.artistIds ?? [])] }]));
  return safe;
}
// Reject corrupt, incompatible or oversized local drafts before form hydration.
export function isIntakeDraft(value: unknown): value is IntakeDraft {
  if (!value || typeof value !== 'object') return false;
  const v = value as IntakeDraft; const base = createIntakeDraft();
  if (!v.profile || !v.proposals || v.profile.id !== ARTIST_ID || !['independent', 'gallery', 'agency'].includes(v.profile.representation)) return false;
  for (const key of Object.keys(base.profile) as (keyof ArtistProfile)[]) if (typeof v.profile[key] !== typeof base.profile[key] || (typeof v.profile[key] === 'string' && v.profile[key].length > 4000)) return false;
  if (Object.keys(v.proposals).length > 50 || INTAKE_PROGRAMMES.some(p => !v.proposals[p.id])) return false;
  if (v.programmeBriefs && (typeof v.programmeBriefs !== 'object' || Object.keys(v.programmeBriefs).length > 48)) return false;
  for (const [id, p] of Object.entries(v.programmeBriefs ?? {})) {
    if (!/^DEMO-PROGRAMME-[a-zA-Z0-9-]+$/.test(id) || !p || p.id !== id || !Number.isFinite(p.budget) || p.budget < 0) return false;
    for (const key of ['en', 'ar', 'briefEn', 'briefAr', 'space'] as const) if (typeof p[key] !== 'string' || p[key].length > 3000) return false;
    if (!Array.isArray(p.artistIds) || p.artistIds.length > 50 || p.artistIds.some(id => typeof id !== 'string' || !/^DEMO-[a-zA-Z0-9-]+$/.test(id))) return false;
  }
  for (const id of Object.keys(v.proposals)) { if (!/^DEMO-(CALL|PROGRAMME)-[a-zA-Z0-9-]+$/.test(id) || !findIntakeProgramme(v, id)) return false; const q = v.proposals[id]; if (!q || q.profileId !== ARTIST_ID || q.programmeId !== id || typeof q.translationHelp !== 'boolean' || !q.budget) return false; for (const key of ['titleEn', 'titleAr', 'conceptEn', 'conceptAr', 'technical', 'portfolioUrl'] as const) if (typeof q[key] !== 'string' || q[key].length > 5000) return false; for (const key of BUDGET_CATEGORIES) if (typeof q.budget[key] !== 'string' || q.budget[key].length > 20) return false; }
  return true;
}
export function reviewSubmission(submission: IntakeSubmission, actor: string, outcome: 'checked' | 'revision', note: string, at: string): IntakeSubmission {
  if (actor !== 'COORDINATOR' || submission.status !== 'received' || !['checked', 'revision'].includes(outcome) || !Number.isFinite(Date.parse(at)) || (outcome === 'revision' && !note.trim())) return submission;
  return { ...submission, status: outcome, note: note.trim().slice(0, 1000), reviewedAt: at };
}
