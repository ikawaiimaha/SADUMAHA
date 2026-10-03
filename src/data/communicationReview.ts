import { pickupError } from './collectionReadiness';
export type CommunicationStep = 'captured' | 'linked' | 'clarification' | 'proposed' | 'confirmed' | 'applied';
export interface CommunicationReview {
  version: number; step: CommunicationStep; checkedTranscript: boolean; target: string;
  original: { reference: string; text: string; transcript: string; sender: string };
  correction: { reference: string; date: string } | null;
  history: { actor: string; action: string; reference: string; at: string }[];
}
export const createCommunicationReview = (): CommunicationReview => ({ version: 1, step: 'captured', checkedTranscript: false, target: '', original: { reference: 'SYNTHETIC-VOICE-01', text: 'Please collect on 3 December 2026.', transcript: 'Please collect on 3 December 2026.', sender: 'Demo gallery representative' }, correction: null, history: [] });
export type CommunicationCommand = { type: 'CHECK_TRANSCRIPT' | 'LINK' | 'CLARIFY' | 'PROPOSE' | 'CONFIRM' | 'APPLY'; actor: string; version: number; at: string; reference?: string; date?: string };
export function communicationTransition(s: CommunicationReview, c: CommunicationCommand): CommunicationReview {
  if (c.version !== s.version) throw new Error('The message review changed. Review the current version.');
  if (c.actor !== 'Assigned Logistics' || !Number.isFinite(Date.parse(c.at))) throw new Error('Only the assigned Logistics reviewer can record this action.');
  let patch: Partial<CommunicationReview>;
  switch (c.type) {
    case 'CHECK_TRANSCRIPT':
      if (s.step !== 'captured' || s.checkedTranscript) throw new Error('Transcript check is not pending.');
      patch = { checkedTranscript: true }; break;
    case 'LINK':
      if (s.step !== 'captured' || !s.checkedTranscript || c.reference !== 'DEMO-001') throw new Error('Check the source and select the matching collection record first.');
      patch = { step: 'linked', target: c.reference }; break;
    case 'CLARIFY':
      if (s.step !== 'linked') throw new Error('Link the source before opening clarification.');
      patch = { step: 'clarification' }; break;
    case 'PROPOSE':
      if (s.step !== 'clarification' || !c.reference?.trim() || c.reference === s.original.reference) throw new Error('A separate correction-response reference is required.');
      if (pickupError(c.date ?? '')) throw new Error(pickupError(c.date ?? ''));
      patch = { step: 'proposed', correction: { reference: c.reference.trim(), date: c.date! } }; break;
    case 'CONFIRM':
      if (s.step !== 'proposed' || !s.correction) throw new Error('Review the proposed correction first.');
      patch = { step: 'confirmed' }; break;
    case 'APPLY':
      if (s.step !== 'confirmed' || !s.correction) throw new Error('Confirmation is required before updating collection.');
      patch = { step: 'applied' }; break;
  }
  return { ...s, ...patch, version: s.version + 1, history: [...s.history, { actor: c.actor, action: c.type, reference: c.reference ?? s.correction?.reference ?? s.original.reference, at: c.at }] };
}
