// Independent rehearsal stages; never mutate institutional ArtistStatus or ThemeStatus.
export type CuratorialStage = 'proposal' | 'completeness' | 'specialist' | 'committee' | 'executive' | 'approved' | 'invitation' | 'returned';
export interface CuratorialHandoff {
  version: number; revision: number; stage: CuratorialStage;
  proposal: { title: string; rationale: string }; specialistRequired: boolean; note: string;
  specialistReference: string; recommendation: string; decision: string;
  history: { action: string; actor: string; at: string; revision: number; note: string }[];
}
export const createCuratorialHandoff = (): CuratorialHandoff => ({ version: 1, revision: 1, stage: 'proposal', proposal: { title: 'Study in Blue', rationale: 'Exploring rhythm through calligraphic form.' }, specialistRequired: false, note: '', specialistReference: '', recommendation: '', decision: '', history: [] });
export const curatorialOwner = (s: CuratorialHandoff) => s.stage === 'specialist' ? 'Specialist' : s.stage === 'committee' ? 'Committee' : s.stage === 'executive' ? 'Director' : 'Coordinator';
export type CuratorialCommand = { type: 'SUBMIT' | 'CHECK' | 'SPECIALIST' | 'RECOMMEND' | 'APPROVE' | 'RETURN' | 'REVISE' | 'PREPARE'; actor: string; version: number; at: string; note?: string; title?: string; rationale?: string; requiresSpecialist?: boolean };
export function curatorialTransition(s: CuratorialHandoff, c: CuratorialCommand): CuratorialHandoff {
  if (c.version !== s.version) throw new Error('This proposal changed. Review the current revision.');
  if (!Number.isFinite(Date.parse(c.at)) || c.actor !== curatorialOwner(s)) throw new Error('This action belongs to the named next owner.');
  const note = c.note?.trim() ?? '';
  let patch: Partial<CuratorialHandoff>;
  switch (c.type) {
    case 'SUBMIT':
      if (s.stage !== 'proposal' || !c.title?.trim() || !c.rationale?.trim()) throw new Error('A title and thematic rationale are required.');
      patch = { stage: 'completeness', proposal: { title: c.title.trim(), rationale: c.rationale.trim() } }; break;
    case 'CHECK':
      if (s.stage !== 'completeness' || !note || typeof c.requiresSpecialist !== 'boolean') throw new Error('Record completeness findings and the specialist-review decision.');
      patch = { stage: c.requiresSpecialist ? 'specialist' : 'committee', specialistRequired: c.requiresSpecialist, note }; break;
    case 'SPECIALIST':
      if (s.stage !== 'specialist' || !note) throw new Error('A specialist finding and evidence reference are required.');
      patch = { stage: 'committee', specialistReference: note }; break;
    case 'RECOMMEND':
      if (s.stage !== 'committee' || !note || (s.specialistRequired && !s.specialistReference)) throw new Error('Complete required reviews and record a reasoned comparison.');
      patch = { stage: 'executive', recommendation: note }; break;
    case 'APPROVE':
      if (s.stage !== 'executive' || !s.recommendation || !note) throw new Error('Executive approval requires the recommendation and a decision reason.');
      patch = { stage: 'approved', decision: note }; break;
    case 'RETURN':
      if (!['completeness', 'specialist', 'committee', 'executive'].includes(s.stage) || !note) throw new Error('Record why this proposal is being returned.');
      patch = { stage: 'returned', note }; break;
    case 'REVISE':
      if (!['returned', 'approved', 'invitation'].includes(s.stage) || !note) throw new Error('An amendment reason is required.');
      patch = { stage: 'proposal', revision: s.revision + 1, note, specialistReference: '', recommendation: '', decision: '' }; break;
    case 'PREPARE':
      if (s.stage !== 'approved' || !s.decision) throw new Error('Only the current approved revision can prepare an invitation.');
      patch = { stage: 'invitation' }; break;
  }
  return { ...s, ...patch, version: s.version + 1, history: [...s.history, { action: c.type, actor: c.actor, at: c.at, revision: s.revision, note: c.type === 'SUBMIT' ? JSON.stringify(patch.proposal) : note }] };
}
