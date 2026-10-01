import { randomUUID, createHash } from 'node:crypto';
import { hashUploadStream } from './file-integrity.mjs';
import { requireRecordAccess } from './acquisition.mjs';

const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const bounded = (v, max = 1000) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
export function dispatchView(state) {
  const a = state.artworks[0], r = state.revisions.find(x => x.id === a?.currentRevisionId);
  const report = (state.dispatchReports ?? []).filter(x => x.revisionHash === r?.versionHash).at(-1);
  const decision = (state.dispatchReviews ?? []).filter(x => x.reportId === report?.id).at(-1);
  const cancelled = (state.dispatchReviews ?? []).some(x => x.action === 'CANCEL');
  const blocker = cancelled ? 'Dispatch cancelled; substitution requires a separate reviewed artwork.'
    : a?.acquisition ? 'Return-loan dispatch is unavailable for an acquisition.'
    : a?.lifecycleStatus === 'ARCHIVED_CLOSED' ? 'Archived record is read-only.'
    : !r || r.state !== 'PUBLISHED' ? 'Publish the current artwork revision first.'
    : !state.agreement?.accepted || state.agreement.revisionId !== r.id ? 'Artist must accept the current agreement.'
    : !report ? 'Artist must submit pre-dispatch condition evidence.'
    : decision?.action === 'REPAIR' ? 'Artist must complete the requested repair and submit a new photograph.'
    : decision?.action !== 'CLEAR' ? report.damaged ? 'Damage hold: coordinator must request repair or cancel dispatch.' : 'Await coordinator review of the condition report.' : '';
  return { report: report ? { ...report, photo: { file_hash: report.photo.file_hash, byte_length: report.photo.byte_length } } : null, decision: decision ?? null, blocker, ready: !blocker, cancelled };
}

export function createPilotDispatch({ repository, storage, readObject }) {
  const scope = (s, actor, roles) => {
    const a = s.artworks[0], r = s.revisions.find(x => x.id === a?.currentRevisionId);
    if (!actor || actor.exhibitionId !== a?.exhibitionId || !roles.includes(actor.role) || (actor.role === 'Artist' && actor.id !== a.artistActorId)) fail(403, 'This role cannot access pre-dispatch evidence.');
    requireRecordAccess(actor, a);
    return { a, r };
  };
  const writable = (s, actor, command, roles) => {
    const result = scope(s, actor, roles);
    if (command.version !== s.version || command.versionHash !== result.r?.versionHash) fail(409, 'Shared record changed. Refresh before retrying.');
    if (!result.r || result.a.acquisition || result.a.lifecycleStatus === 'ARCHIVED_CLOSED' || !['Pending_Shipment','In_Transit','Customs_Clearance'].includes(result.a.physicalStatus) || dispatchView(s).cancelled) fail(409, 'This shipment is no longer editable.');
    if(result.r.state !== 'PUBLISHED' || !s.agreement?.accepted || s.agreement.revisionId !== result.r.id) fail(409,'Publish the current artwork and accept its agreement before pre-dispatch review.');
    return result;
  };
  const log = (s, actor, r, action, reportId) => s.decisions.push({id:randomUUID(),actorId:actor.id,targetId:r.artworkId,versionHash:r.versionHash,action,reportId,at:new Date().toISOString()});
  return {
    async submit(actor, command, stream) {
      const initial = repository.read(); writable(initial, actor, command, ['Artist']);
      const previous = dispatchView(initial);
      if (previous.report && previous.decision?.action !== 'REPAIR') fail(409, 'The submitted report is frozen pending review.');
      if (typeof command.damaged !== 'boolean' || !bounded(command.notes)) fail(422, 'Declare existing damage and describe the condition.');
      const logistics = command.logistics;
      if (!logistics || !['origin','destination','carrier','handling'].every(k => bounded(logistics[k],300)) || !Number.isFinite(logistics.gross_weight_kg) || logistics.gross_weight_kg <= 0 || logistics.gross_weight_kg > 100000) fail(422, 'Collection, destination, carrier reference, handling and positive gross weight are required.');
      const staged = await storage.openStaging();
      const integrity = await hashUploadStream(stream, staged.stream, { maxBytes: 20 * 1024 * 1024 });
      const bytes = await readObject(staged.objectId);
      if (bytes.subarray(0,8).toString('hex') !== '89504e470d0a1a0a') fail(422, 'Upload PNG condition evidence.');
      if (previous.report?.photo.file_hash === integrity.file_hash) fail(422, 'A repair requires a new condition photograph.');
      return repository.transaction(s => {
        const { r } = writable(s, actor, command, ['Artist']);
        const report = {id:randomUUID(),revisionHash:r.versionHash,revisionId:r.id,damaged:command.damaged,notes:command.notes.trim(),logistics:{origin:logistics.origin.trim(),destination:logistics.destination.trim(),carrier:logistics.carrier.trim(),handling:logistics.handling.trim(),gross_weight_kg:logistics.gross_weight_kg},photo:{objectId:staged.objectId,...integrity},actorId:actor.id,at:new Date().toISOString()};
        (s.dispatchReports ??= []).push(report); log(s,actor,r,'PRE_DISPATCH_SUBMITTED',report.id);
        return dispatchView(s);
      });
    },
    review(actor, command) {
      return repository.transaction(s => {
        const { r } = writable(s,actor,command,['General_Exhibition_Coordinator']);
        const view=dispatchView(s);
        if (!view.report || view.report.id !== command.reportId || view.decision) fail(409,'Refresh the pending condition report.');
        if (!['CLEAR','REPAIR','CANCEL'].includes(command.action) || !bounded(command.reason)) fail(422,'Choose a resolution and record its reason.');
        if (command.action === 'CLEAR' && view.report.damaged) fail(409,'Damage cannot be cleared without a new post-repair report. As-is acceptance is not enabled in this pilot.');
        (s.dispatchReviews ??= []).push({id:randomUUID(),reportId:view.report.id,action:command.action,reason:command.reason.trim(),actorId:actor.id,at:new Date().toISOString()});
        log(s,actor,r,`PRE_DISPATCH_${command.action}`,view.report.id);
        return dispatchView(s);
      });
    },
    async photo(actor) {
      const s=repository.read(); scope(s,actor,['Artist','General_Exhibition_Coordinator','Logistics','Director']);
      const report=dispatchView(s).report;
      const stored=(s.dispatchReports??[]).find(x=>x.id===report?.id);
      if (!stored) fail(404,'No current condition photograph.');
      const bytes=await readObject(stored.photo.objectId);
      if(createHash('sha256').update(bytes).digest('hex')!==stored.photo.file_hash) fail(409,'Condition evidence integrity check failed.');
      return bytes;
    }
  };
}
