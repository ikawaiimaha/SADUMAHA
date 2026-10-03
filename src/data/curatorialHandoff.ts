// Independent rehearsal stages; never mutate institutional ArtistStatus or ThemeStatus.
export type CuratorialStage = 'proposal' | 'completeness' | 'specialist' | 'committee' | 'executive' | 'approved' | 'invitation' | 'returned' | 'not-recommended';
export interface CuratorialHandoff {
  version: number; revision: number; stage: CuratorialStage;
  proposal: { title: string; rationale: string }; alternative: { title: string; rationale: string }; selectedCandidate: 'A' | 'B' | 'NONE' | null; specialistRequired: boolean; note: string;
  specialistReference: string; recommendation: string; decision: string;
  history: { action: string; actor: string; at: string; revision: number; note: string }[];
}
export const createCuratorialHandoff = (): CuratorialHandoff => ({ version: 1, revision: 1, stage: 'proposal', proposal: { title: 'Study in Blue', rationale: 'Exploring rhythm through calligraphic form.' }, alternative: { title: 'Rhythm Study', rationale: 'Exploring repetition and spacing in calligraphic form.' }, selectedCandidate: null, specialistRequired: false, note: '', specialistReference: '', recommendation: '', decision: '', history: [] });
export const curatorialOwner = (s: CuratorialHandoff) => s.stage === 'specialist' ? 'Specialist' : s.stage === 'committee' ? 'Committee' : s.stage === 'executive' ? 'Director' : 'Coordinator';
export type CuratorialCommand = { type: 'SUBMIT' | 'CHECK' | 'SPECIALIST' | 'RECOMMEND' | 'APPROVE' | 'RETURN' | 'REVISE' | 'PREPARE'; actor: string; version: number; at: string; note?: string; title?: string; rationale?: string; alternativeTitle?: string; alternativeRationale?: string; requiresSpecialist?: boolean; candidate?: 'A' | 'B' | 'NONE' };
export function curatorialTransition(s: CuratorialHandoff, c: CuratorialCommand): CuratorialHandoff {
  if (c.version !== s.version) throw new Error('This proposal changed. Review the current revision.');
  if (!Number.isFinite(Date.parse(c.at)) || c.actor !== curatorialOwner(s)) throw new Error('This action belongs to the named next owner.');
  const note = c.note?.trim() ?? '';
  let patch: Partial<CuratorialHandoff>;
  switch (c.type) {
    case 'SUBMIT':
      if (s.stage !== 'proposal' || !c.title?.trim() || !c.rationale?.trim()) throw new Error('A title and thematic rationale are required.');
      if (c.alternativeTitle !== undefined && !c.alternativeTitle.trim() || c.alternativeRationale !== undefined && !c.alternativeRationale.trim()) throw new Error('Candidate B needs a title and rationale.');
      patch = { stage: 'completeness', proposal: { title: c.title.trim(), rationale: c.rationale.trim() }, alternative: { title: c.alternativeTitle?.trim() ?? s.alternative.title, rationale: c.alternativeRationale?.trim() ?? s.alternative.rationale } }; break;
    case 'CHECK':
      if (s.stage !== 'completeness' || !note || typeof c.requiresSpecialist !== 'boolean') throw new Error('Record completeness findings and the specialist-review decision.');
      patch = { stage: c.requiresSpecialist ? 'specialist' : 'committee', specialistRequired: c.requiresSpecialist, note }; break;
    case 'SPECIALIST':
      if (s.stage !== 'specialist' || !note) throw new Error('A specialist finding and evidence reference are required.');
      patch = { stage: 'committee', specialistReference: note }; break;
    case 'RECOMMEND':
      if (s.stage !== 'committee' || !['A', 'B', 'NONE'].includes(c.candidate ?? '') || !note || (s.specialistRequired && !s.specialistReference)) throw new Error('Complete required reviews and record a reasoned comparison.');
      patch = { stage: c.candidate === 'NONE' ? 'not-recommended' : 'executive', selectedCandidate: c.candidate!, recommendation: note }; break;
    case 'APPROVE':
      if (s.stage !== 'executive' || !s.recommendation || !['A', 'B'].includes(s.selectedCandidate ?? '') || !note) throw new Error('Executive approval requires the recommendation and a decision reason.');
      patch = { stage: 'approved', decision: note }; break;
    case 'RETURN':
      if (!['completeness', 'specialist', 'committee', 'executive'].includes(s.stage) || !note) throw new Error('Record why this proposal is being returned.');
      patch = { stage: 'returned', note }; break;
    case 'REVISE':
      if (!['returned', 'approved', 'invitation', 'not-recommended'].includes(s.stage) || !note) throw new Error('An amendment reason is required.');
      patch = { stage: 'proposal', revision: s.revision + 1, note, specialistRequired: false, selectedCandidate: null, specialistReference: '', recommendation: '', decision: '' }; break;
    case 'PREPARE':
      if (s.stage !== 'approved' || !s.decision || !['A', 'B'].includes(s.selectedCandidate ?? '')) throw new Error('Only the current approved revision can prepare an invitation.');
      patch = { stage: 'invitation' }; break;
    default: throw new Error('Unknown curatorial action.');
  }
  return { ...s, ...patch, version: s.version + 1, history: [...s.history, { action: c.type, actor: c.actor, at: c.at, revision: s.revision, note: c.type === 'SUBMIT' ? JSON.stringify({ A: patch.proposal, B: patch.alternative }) : c.type === 'RECOMMEND' ? JSON.stringify({ candidate: c.candidate, rationale: note }) : note }] };
}

export const recommendedProposal = (s: CuratorialHandoff) => s.selectedCandidate === 'A' ? s.proposal : s.selectedCandidate === 'B' ? s.alternative : null;
