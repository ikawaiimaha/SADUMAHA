// Read-only context for recovery. This never authorizes a transition or trusts a
// client-supplied baseline. Keep the projection within the workflow's read scope.
export const draftWorkflowRoles = {
  collection: ['Logistics', 'Technical', 'Finance', 'General_Exhibition_Coordinator'],
  print: ['Exhibition_Coordinator', 'Editorial', 'Technical', 'Chairman', 'General_Exhibition_Coordinator'],
};
const value = v => v == null ? '' : String(v);
const check = v => v ? 'complete' : 'pending';

export function draftContext(state, id, kind) {
  const fields = {};
  const put = (key, v) => { fields[key] = value(v); };
  if (kind === 'collection') {
    const r = state.collectionRevisions?.filter(r => r.artworkId === id).at(-1);
    const a = state.collectionAssignments?.[id] ?? {primaryId:'pilot-Logistics', activeId:'pilot-Logistics'};
    for (const key of ['address','city','country','contact','sourceRef','timezone']) put(key, r?.[key]);
    put('start', r?.availability?.start); put('end', r?.availability?.end);
    put('closures', JSON.stringify(r?.closures ?? [])); put('conflict', !!r?.conflict);
    put('pickupDate', r?.plan?.pickupDate); put('specification', r?.packing?.specification);
    put('packingOwner', r?.packing?.owner); put('amount', r?.packing?.amount);
    put('technical', r?.packing ? r.packing.requiresTechnical ? 'yes' : 'no' : '');
    put('technicalReason', r?.packing?.technicalReason);
    for (const key of ['primaryId','backupId','activeId','acceptedBy']) put(key, a[key]);
    put('sourceCheck', check(r?.confirmation));
    put('technicalCheck', r?.packing?.requiresTechnical === false ? 'notRequired' : check(r?.packing?.technicalReference));
    put('costCheck', check(r?.packing?.costReference));
    put('packingCheck', check(r?.packing?.evidenceFileId));
  } else {
    const job = state.printJobs?.[id], pkg = job?.packages.find(p => p.revision === job.record.version);
    put('printRevision', job?.record.version); put('evidenceId', pkg?.proofId);
    for (const key of ['supplier','quantity','size','stock','finishing','profile','deliveryDate']) put(key, pkg?.spec[key]);
    put('preflightCheck', pkg?.preflight ? pkg.preflight.passed ? 'complete' : 'hold' : 'pending');
    put('editorialCheck', check(job?.record.review)); put('executiveCheck', check(job?.record.decision));
    put('supplierCheck', check(job?.record.supplierAck)); put('correctionReason', job?.record.correction?.reason);
  }
  const cycle = state.renewalCycles?.findLast(c => c.artworkId === id && c.kind === kind && !c.supersededAt);
  for (const task of cycle?.tasks ?? []) {
    put(`task.${task.key}.ownerId`, task.ownerId); put(`task.${task.key}.dueAt`, task.dueAt);
    put(`task.${task.key}.status`, task.status);
  }
  for (const [key, taskKey] of kind === 'collection' ? [['technical','packing-technical'],['cost','packing-cost']] : [['editorial','print-review']]) {
    if (cycle?.tasks.some(t => t.key === key)) continue;
    const task = state.operationTasks?.[`${id}:${taskKey}`];
    put(`task.${key}.ownerId`, task?.ownerId); put(`task.${key}.dueAt`, task?.dueAt);
    put(`task.${key}.status`, !task?.ownerId ? 'UNASSIGNED' : task.acceptedBy ? 'ACCEPTED' : 'ASSIGNED');
  }
  return {fields};
}

export function compareDraftContext(baseline, current, version) {
  return {currentVersion:version, baselineAvailable:!!baseline,
    changes:baseline ? [...new Set([...Object.keys(baseline.fields), ...Object.keys(current.fields)])]
      .filter(key => (baseline.fields[key] ?? '') !== (current.fields[key] ?? ''))
      .map(key => ({key, before:baseline.fields[key] ?? '', current:current.fields[key] ?? ''})) : []};
}
