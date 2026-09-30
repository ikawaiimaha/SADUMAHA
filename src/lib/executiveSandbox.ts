import { executiveCases } from '../data/executiveCases';

export const sandboxRoles = {
  Committee: 'Preparatory Committee',
  Chairman: 'Chairman',
  Editorial: 'Editorial',
  Director: 'Director',
  General_Exhibition_Coordinator: 'Master Administration',
  Logistics_Officer: 'Logistics Officer',
  PR_Officer: 'PR Officer',
  Artist_Portal: 'Artist Portal',
} as const;
export type SandboxRole = keyof typeof sandboxRoles;
export type SandboxAction = 'SUBMIT' | 'REQUEST_REVISION' | 'READY' | 'VERIFY_PR' | 'COLLECTION' | 'PUBLISH';
export type SandboxDossier = {
  revision: number;
  status: 'Awaiting submission' | 'Under coordinator review' | 'Revision requested' | 'Executive review' | 'Published in sandbox';
  submission: string;
  critique: string;
  prRevision: number;
  collectionRevision: number;
  collection: { address: string; date: string; packing: string } | null;
};
export type SandboxEvent = {
  id: string; at: string; dossierId: string; role: SandboxRole; action: SandboxAction;
  expectedRevision: number; fields: Record<string, string>;
};
export type SandboxDecision = Pick<SandboxEvent, 'id' | 'at' | 'dossierId' | 'role' | 'action'> & { revision: number };
export type SandboxState = { dossiers: Record<string, SandboxDossier>; decisions: SandboxDecision[] };
const owners: Record<SandboxAction, SandboxRole> = {
  SUBMIT: 'Artist_Portal', REQUEST_REVISION: 'General_Exhibition_Coordinator',
  READY: 'General_Exhibition_Coordinator', VERIFY_PR: 'PR_Officer',
  COLLECTION: 'Logistics_Officer', PUBLISH: 'Director',
};
export function emptySandbox(): SandboxState {
  return { dossiers: Object.fromEntries(executiveCases.map(c => [c.id, {
    revision: 0, status: 'Awaiting submission', submission: '', critique: '',
    prRevision: 0, collectionRevision: 0, collection: null,
  }])), decisions: [] };
}
export function sandboxBlock(d: SandboxDossier, role: SandboxRole, action: SandboxAction): string {
  if (owners[action] !== role) return 'This action belongs to another role.';
  if (d.status === 'Published in sandbox') return 'This revision is published in the sandbox and locked.';
  if (action === 'SUBMIT') return ['Awaiting submission', 'Revision requested'].includes(d.status) ? '' : 'The submission is locked. The Coordinator must request a revision first.';
  if (d.revision === 0) return 'Waiting for the Artist to submit the artwork information.';
  if (action === 'REQUEST_REVISION') return ['Under coordinator review', 'Executive review'].includes(d.status) ? '' : 'A submitted, unpublished revision is required.';
  if (action === 'READY') return d.status === 'Under coordinator review' ? '' : 'Waiting for an artist submission or revision.';
  if (action === 'PUBLISH') {
    if (d.status !== 'Executive review') return 'Waiting for Coordinator approval.';
    if (d.prRevision !== d.revision) return 'Waiting for PR evidence on this revision.';
    if (d.collectionRevision !== d.revision) return 'Waiting for Logistics collection details on this revision.';
    return '';
  }
  if (!['Under coordinator review', 'Executive review'].includes(d.status)) return 'Evidence can be recorded while a submitted revision is under review.';
  if (action === 'VERIFY_PR' && d.prRevision === d.revision) return 'PR evidence is recorded for this revision.';
  return '';
}
export function applySandboxEvent(state: SandboxState, event: SandboxEvent): SandboxState {
  const d = state.dossiers[event.dossierId];
  if (!d || !Object.hasOwn(owners, event.action) || !Object.hasOwn(sandboxRoles, event.role)) throw new Error('Unknown dossier or action.');
  if (!event.id || !Number.isFinite(Date.parse(event.at)) || !Number.isInteger(event.expectedRevision)) throw new Error('Invalid event metadata.');
  if (state.decisions.some(x => x.id === event.id)) throw new Error('This action has already been recorded.');
  if (d.revision !== event.expectedRevision) throw new Error('The revision changed. Review the current information before continuing.');
  const blocked = sandboxBlock(d, event.role, event.action);
  if (blocked) throw new Error(blocked);
  const field = (name: string, minimum = 1) => {
    const value = event.fields?.[name];
    if (typeof value !== 'string' || value.trim().length < minimum || value.length > 2000) throw new Error('Complete all required fields.');
    return value.trim();
  };
  const next = { ...d };
  switch (event.action) {
    case 'SUBMIT':
      next.submission = field('submission', 10); next.revision++; next.status = 'Under coordinator review';
      next.prRevision = 0; next.collectionRevision = 0; break;
    case 'REQUEST_REVISION': next.critique = field('critique', 5); next.status = 'Revision requested'; break;
    case 'READY': next.status = 'Executive review'; break;
    case 'VERIFY_PR':
      if (field('identity') !== 'confirmed' || field('travel') !== 'confirmed') throw new Error('Confirm both simulated evidence checks.');
      next.prRevision = next.revision; break;
    case 'COLLECTION': {
      const date = field('date');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error('Enter a valid collection date.');
      next.collection = { address: field('address', 5), date, packing: field('packing', 5) };
      next.collectionRevision = next.revision; break;
    }
    case 'PUBLISH': next.status = 'Published in sandbox'; break;
  }
  // Only operational metadata enters the decision log; never form bodies or identity documents.
  const decision: SandboxDecision = { id: event.id, at: event.at, dossierId: event.dossierId, role: event.role, action: event.action, revision: next.revision };
  return { dossiers: { ...state.dossiers, [event.dossierId]: next }, decisions: [...state.decisions, decision] };
}
export function restoreSandbox(raw: string | null): { state: SandboxState; events: SandboxEvent[] } {
  if (!raw) return { state: emptySandbox(), events: [] };
  const value = JSON.parse(raw);
  if (value.version !== 1 || !Array.isArray(value.events) || value.events.length > 1000) throw new Error('Invalid sandbox session.');
  return { state: value.events.reduce(applySandboxEvent, emptySandbox()), events: value.events };
}
