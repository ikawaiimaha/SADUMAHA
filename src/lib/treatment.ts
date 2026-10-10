import { accountLabel, roleLabels } from './operationalWorkspace';
// Presentation types for the SYNTHETIC conditional-treatment projection. The server rechecks every command.
export type TreatmentDomain = 'VENUE' | 'ENGINEERING' | 'FINANCIAL' | 'OTHER';
export type TreatmentStep = {
  key: string; state: 'done' | 'now' | 'waiting'; ownerRole: string; ownerId: string | null; canAct: boolean; blocker: string; evidenceIds: string[];
  dueAt?: string | null; overdue?: boolean; assign?: boolean; acceptance?: boolean; authModes?: ('EXTERNAL_PERMISSION' | 'SADU_APPROVAL')[]; domain?: TreatmentDomain; trialId?: string | null;
};
export type TreatmentRevision = {
  revision: number; workTitle: string; scope: string; method: string; sourceRef: string; hash: string; actorId: string; at: string;
  decisionMaker: { name: string; capacity: string; accountId: string | null };
  conditions: { id: string; domain: TreatmentDomain; text: string }[];
};
export type TreatmentAuthorization = { id: string; revision: number; mode: 'EXTERNAL_PERMISSION' | 'SADU_APPROVAL'; performedInSadu: boolean; actorId: string; at: string; reference?: string; grantor?: string; grantorCapacity?: string; approver?: string; approverCapacity?: string; evidenceId?: string };
export type TreatmentTrial = { id: string; revision: number; evidenceId: string; sampleHash: string; note: string | null; actorId: string; at: string; supersededAt: string | null; decision: null | { decision: 'APPROVE' | 'REQUEST_CHANGES'; note: string | null; actorId: string; at: string; evidenceId: string } };
export type TreatmentCheck = { id: string; domain: TreatmentDomain; clearedInRevision: number; reference: string | null; actorId: string; at: string };
export type TreatmentCompletion = { id: string; revision: number; evidenceId: string; lettersTreated: number; note: string | null; actorId: string; at: string };
export type TreatmentView = {
  scenario: string; synthetic: true; current: TreatmentRevision | null; revisions: TreatmentRevision[]; authorizations: TreatmentAuthorization[]; trials: TreatmentTrial[];
  checks: TreatmentCheck[]; completions: TreatmentCompletion[]; batch: { allowed: boolean; blockers: string[] };
  assignment: { ownerId: string | null; dueAt: string | null; accepted: boolean } | null; steps: TreatmentStep[];
};
const domainRoles: Record<TreatmentDomain, string> = { VENUE: 'Museum_Operations', ENGINEERING: 'Technical', FINANCIAL: 'Finance', OTHER: 'General_Exhibition_Coordinator' };
/**
 * One line for a selected treatment step that cannot be acted on yet: what is missing and who must act.
 * Presentation only. It never grants anything; the server rechecks every command.
 * Resolve each prerequisite's owner independently of the selected task's owner.
 */
export function treatmentBlocker(view: TreatmentView, step: TreatmentStep, accounts: { id: string; name: string; role: string }[], language: 'ar' | 'en'): string {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  const role = (key: string) => roleLabels[key]?.[language] ?? key;
  const who = (id: string | null | undefined, fallback: string) => {
    const account = accounts.find(a => a.id === id);
    return account ? accountLabel(account, language) : role(fallback);
  };
  const line = (missingAr: string, missingEn: string, whoAr: string, whoEn: string) => t(`الناقص: ${missingAr} — المطلوب من ${whoAr}.`, `Missing: ${missingEn} — ${whoEn}.`);
  if (step.canAct || step.state === 'done') return '';
  const cur = view.current;
  if (!cur) return line('سجل المعالجة', 'the treatment record', role('General_Exhibition_Coordinator'), `${role('General_Exhibition_Coordinator')} must record it`);
  const auth = view.authorizations.some(a => a.revision === cur.revision);
  const trial = view.trials.find(x => x.revision === cur.revision && !x.supersededAt);
  const technician = who(view.assignment?.ownerId, 'Technical');
  const artist = who(view.steps.find(s => s.key === 'tArtist')?.ownerId, 'Artist');
  const authorization = () => cur.decisionMaker.accountId
    ? line('تفويض هذا الإصدار', 'authorization of this revision', cur.decisionMaker.name, `${cur.decisionMaker.name} must approve it`)
    : line('تفويض هذا الإصدار', 'authorization of this revision', role('General_Exhibition_Coordinator'), `${role('General_Exhibition_Coordinator')} must record it`);
  const photo = () => line('صورة العيّنة', 'the trial photograph', technician, `${technician} must upload it`);
  const approval = () => line('موافقة الفنان على الصورة الحالية', 'the artist’s approval of the current photograph', artist, `${artist} must approve it`);
  const accept = () => line('قبول المهمة', 'acceptance of the task', technician, `${technician} must accept it`);
  const sample = () => {
    if (!auth) return authorization();
    if (!view.assignment?.ownerId) return line('فني مسمّى وموعد', 'a named technician and deadline', role('General_Exhibition_Coordinator'), `${role('General_Exhibition_Coordinator')} must assign them`);
    if (!view.assignment.accepted) return accept();
    return trial?.decision?.decision === 'REQUEST_CHANGES' ? line('صورة جديدة', 'a new photograph', technician, `${technician} must upload it`) : photo();
  };
  switch (step.key) {
    case 'tVenue': case 'tEngineering': case 'tFinancial': case 'tOther': {
      const domain = step.domain ?? 'OTHER';
      return line(`مراجعة ${treatmentDomains[domain].ar}`, `${treatmentDomains[domain].en.toLowerCase()} clearance`, role(domainRoles[domain]), `${role(domainRoles[domain])} must clear it`);
    }
    case 'tAuthorize': return authorization();
    case 'tSample': return sample();
    case 'tArtist': return !auth || !trial || trial.decision ? sample() : approval();
    case 'tComplete': {
      if (!auth) return authorization();
      if (!trial) return sample();
      if (trial.decision?.decision !== 'APPROVE') return trial.decision ? sample() : approval();
      for (const c of cur.conditions) if (!view.checks.some(x => x.domain === c.domain)) {
        const d = c.domain;
        return line(`مراجعة ${treatmentDomains[d].ar}`, `${treatmentDomains[d].en.toLowerCase()} clearance`, role(domainRoles[d]), `${role(domainRoles[d])} must clear it`);
      }
      return view.assignment?.accepted ? line('دليل الاكتمال', 'completion evidence', technician, `${technician} must record it`) : sample();
    }
    default: return '';
  }
}
export const treatmentDomains: Record<TreatmentDomain, { ar: string; en: string }> = {
  VENUE: { ar: 'الموقع', en: 'Venue' }, ENGINEERING: { ar: 'هندسي', en: 'Engineering' }, FINANCIAL: { ar: 'مالي', en: 'Financial' }, OTHER: { ar: 'شرط آخر', en: 'Other' },
};
