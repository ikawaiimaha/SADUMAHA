import { collectionTasks, collectionView } from './pilot-collection.mjs';
import { dispatchView } from './pilot-dispatch.mjs';
/** Read-only projection. Authorization remains in the mutation handlers. */
export function pilotActions(state, role, actor) {
  const artwork = state.artworks[0];
  if (!artwork || artwork.lifecycleStatus === 'ARCHIVED_CLOSED') return [];
  const revision = state.revisions.find(r => r.id === artwork.currentRevisionId);
  const tasks = actor ? collectionTasks(state, actor) : [];
  const add = (owner, title, blocker = '') => {
    if (owner === role) tasks.push({ owner, title, blocker });
  };
  if (!revision) {
    add('Artist', 'Submit artwork package');
    if (role !== 'Artist') add(role, 'Await artist submission', 'Artist must submit the artwork package first.');
    return tasks;
  }
  if (artwork.acquisition) {
    add(role, 'Continue acquisition closeout', 'Use the acquisition panel; the return-loan workflow no longer applies.');
    return tasks;
  }
  const dispatch=dispatchView(state);
  if(!dispatch.report&&revision.state==='PUBLISHED'&&state.agreement?.accepted) add('Artist','Submit pre-dispatch condition evidence',state.collectionWorkflowEnabled?collectionView(state,artwork.id).blocker:'');
  else if(!dispatch.decision) add('General_Exhibition_Coordinator','Review pre-dispatch condition evidence');
  else if(dispatch.decision.action==='REPAIR') add('Artist','Repair and submit a new condition report');
  const current = approval => approval?.hash === revision.versionHash;
  const placed = state.placements.some(p => p.revisionId === revision.id);
  if (!revision.approvals.venue) add('Museum_Operations', 'Review venue conservation capability', !placed ? 'Coordinator must save the spatial placement first.' : '');
  if (revision.state === 'EDITORIAL_DRAFT') add('Editorial', 'Verify bilingual text');
  if (!placed) add('General_Exhibition_Coordinator', 'Position artwork on the assigned wall');
  if (!current(revision.approvals.coordinator)) add('General_Exhibition_Coordinator', 'Prepare Director review', revision.state !== 'EXECUTIVE_REVIEW' ? 'Editorial must verify the current bilingual text.' : !placed ? 'Save the current spatial placement first.' : '');
  if (!state.agreement) add('General_Exhibition_Coordinator', 'Record the sample agreement');
  if (!state.agreement?.accepted) add('Artist', 'Review and accept the sample agreement', !state.agreement ? 'Coordinator must record the agreement first.' : '');
  if (!current(revision.approvals.pr)) add('PR', 'Review identity and travel evidence');
  if (!current(revision.approvals.technical)) add('Technical', 'Review technical evidence', !placed ? 'Coordinator must save the artwork placement first.' : '');
  if (revision.state !== 'PUBLISHED') add('Director', 'Review publication', !current(revision.approvals.coordinator) ? 'Await coordinator endorsement of this revision.' : '');
  if (!state.returnClearance) add('Logistics', 'Reconcile receipt, condition and return', artwork.physicalStatus === 'Pending_Shipment' ? dispatch.blocker || 'Receipt and condition evidence are still outstanding.' : '');
  const tranche = [0, 1, 2].find(n => !state.payments.some(p => p.tranche === n));
  if (tranche !== undefined) {
    const blocker = !state.agreement?.accepted || state.agreement.revisionId !== revision.id ? 'Await artist acceptance of the current agreement.'
      : !current(revision.approvals.pr) || !current(revision.approvals.technical) ? 'Await current PR and Technical evidence.'
      : tranche === 1 && state.conditionClearance?.revisionId !== revision.id ? 'Await receipt and condition reconciliation.'
      : tranche === 2 && state.returnClearance?.revisionId !== revision.id ? 'Await safe return reconciliation.' : '';
    add('Finance', `Authorize ${['advance', 'delivery', 'completion'][tranche]} tranche`, blocker);
  }
  if (state.returnClearance && state.payments.length === 3) add('Director', 'Archive and close dossier');
  return tasks;
}
