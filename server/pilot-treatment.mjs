import { createHash, randomUUID } from 'node:crypto';

// SYNTHETIC conditional-treatment scenario (Laura / Mounir Fatmi). Local simulation only:
// nothing here emails, ships, pays or contacts anyone. Recorded external permission is a
// record of a decision made elsewhere; only SADU_APPROVAL is a decision performed in SADU.
export const TREATMENT_SCENARIO = 'SYNTHETIC_LAURA_MOUNIR';
export const TREATMENT_TASK = 'treatment-trial';
export const TREATMENT_KINDS = ['TREATMENT_SOURCE', 'TREATMENT_SAMPLE', 'TREATMENT_COMPLETION'];
const GEC = 'General_Exhibition_Coordinator';
export const TREATMENT_ROLES = [GEC, 'Technical', 'Artist', 'Museum_Operations', 'Finance'];
// Independent requirements. Each is cleared by its own existing role and is never inherited from another.
export const REQUIREMENT_ROLES = { VENUE: 'Museum_Operations', ENGINEERING: 'Technical', FINANCIAL: 'Finance', OTHER: GEC };
const evidenceRoles = { TREATMENT_SOURCE: [GEC, 'Technical'], TREATMENT_SAMPLE: [GEC, 'Technical', 'Artist'], TREATMENT_COMPLETION: [GEC, 'Technical', 'Artist'] };
export const treatmentEvidenceRoles = kind => evidenceRoles[kind];

const pair = (ar, en) => `${ar} / ${en}`;
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const text = (v, max = 1000) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const optionalText = (v, max = 1000) => v == null || v === '' || (typeof v === 'string' && v.length <= max);
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

const record = (s, id) => s.treatments?.[id] ?? null;
const current = t => t?.revisions.at(-1) ?? null;
const authFor = (t, cur) => cur ? t.authorizations.findLast(a => a.revision === cur.revision) ?? null : null;
const trialFor = (t, cur) => cur ? t.trials.findLast(x => x.revision === cur.revision && !x.supersededAt) ?? null : null;
const checkFor = (t, domain) => t.checks.findLast(c => c.domain === domain) ?? null;
const domainsOf = cur => [...new Set(cur.conditions.map(c => c.domain))];
const ownerTask = (s, id) => s.operationTasks?.[`${id}:${TREATMENT_TASK}`] ?? null;
const owns = (s, id, actor) => { const task = ownerTask(s, id); return !!task && task.ownerId === actor.id && task.acceptedBy === actor.id; };
const need = (s, id) => { const t = record(s, id), cur = current(t); if (!cur) fail(409, 'Record the treatment revision first.'); return { t, cur }; };

/** Why batch treatment is not yet allowed. Empty means every dependent approval and independent requirement is current. */
export function batchBlockers(s, id) {
  const t = record(s, id), cur = current(t), out = [];
  if (!cur) return [pair('لم يُسجَّل إصدار المعالجة بعد.', 'No treatment revision is recorded.')];
  if (!authFor(t, cur)) out.push(pair('لم يُسجَّل التفويض لهذا الإصدار من المعالجة.', 'Authorization for this exact treatment revision is not recorded.'));
  const trial = trialFor(t, cur);
  if (!trial) out.push(pair('لم تُرفع صورة العيّنة لهذا الإصدار.', 'No trial photograph is submitted for this revision.'));
  else if (trial.decision?.decision !== 'APPROVE') out.push(pair('لا توجد موافقة الفنان على صورة العيّنة الحالية.', 'The artist has not approved the current trial photograph.'));
  for (const d of domainsOf(cur)) if (!checkFor(t, d)) out.push(pair(`متطلب مستقل غير مستوفى: ${d}`, `Independent requirement not cleared: ${d}`));
  return out;
}

export function requireTreatmentAssignable(s, id) {
  const { t, cur } = need(s, id);
  if (!authFor(t, cur)) fail(409, 'Record authorization for the current treatment revision before assigning the trial.');
  if (t.completions.length) fail(409, 'This treatment is complete.');
}

/** Called before an evidence file is stored. Mirrors the checks repeated when the file is used. */
export function requireTreatmentUpload(s, actor, id, kind) {
  const { t, cur } = need(s, id);
  if (t.completions.length) fail(409, 'This treatment is complete; its evidence is closed.');
  if (kind === 'TREATMENT_SOURCE') return cur;
  if (!authFor(t, cur)) fail(409, 'Authorization for the current treatment revision is required first.');
  if (!owns(s, id, actor)) fail(409, 'Only the named technician who accepted the trial task can add this evidence.');
  if (kind === 'TREATMENT_COMPLETION') { const b = batchBlockers(s, id); if (b.length) fail(409, `Batch treatment is not cleared: ${b[0]}`); }
  return cur;
}
export const treatmentScope = (s, id) => { const cur = current(record(s, id)); return cur ? { scope: cur.hash, treatmentRevision: cur.revision } : { scope: null }; };

function findEvidence(s, id, evidenceId, kind) {
  const e = (s.operationalEvidence ?? []).find(x => x.id === evidenceId && x.artworkId === id && x.kind === kind);
  if (!e) fail(422, 'Select an uploaded file that belongs to this treatment and purpose.');
  return e;
}
function currentEvidence(s, id, evidenceId, kind, cur) {
  const e = findEvidence(s, id, evidenceId, kind);
  if (e.scope !== cur.hash) fail(409, 'This file belongs to an earlier treatment revision. Upload it again for the current one.');
  return e;
}

function recordRevision(s, actor, id, c, accounts, at) {
  if (actor.role !== GEC) fail(403, 'Only the General Exhibition Coordinator records the treatment case.');
  const t = record(s, id), cur = current(t);
  if (t?.completions.length) fail(409, 'A completed treatment cannot be revised. Open a new treatment case.');
  if (!Number.isInteger(c.baseRevision) || c.baseRevision !== (cur?.revision ?? 0)) fail(409, 'The treatment changed. Review the current revision before saving.');
  const dm = c.decisionMaker;
  if (!text(c.workTitle, 200) || !text(c.method, 1000) || !text(c.sourceRef, 500) || !dm || !text(dm.name, 200) || !text(dm.capacity, 200)) fail(422, 'Record the work, the exact treatment, its source reference and the named decision-maker.');
  let accountId = null;
  if (dm.accountId) {
    const account = accounts.find(a => a.id === dm.accountId && a.exhibitionId === actor.exhibitionId);
    if (!account || account.id === actor.id) fail(422, 'The decision-maker account must be another account in this exhibition.');
    accountId = account.id;
  }
  if (!Array.isArray(c.conditions) || c.conditions.length < 1 || c.conditions.length > 12 || c.conditions.some(x => !x || !Object.hasOwn(REQUIREMENT_ROLES, x.domain) || !text(x.text, 500))) fail(422, 'Each condition needs a known category and text.');
  const body = { workTitle: c.workTitle.trim(), scope: 'ONE_LETTER_TRIAL', method: c.method.trim(), sourceRef: c.sourceRef.trim(),
    decisionMaker: { name: dm.name.trim(), capacity: dm.capacity.trim(), accountId }, conditions: c.conditions.map(x => ({ domain: x.domain, text: x.text.trim() })) };
  const hash = digest(body);
  if (cur?.hash === hash) fail(409, 'These details match the current revision; nothing changed.');
  const next = (s.treatments ??= {})[id] ??= { revisions: [], authorizations: [], trials: [], checks: [], completions: [] };
  next.revisions.push({ revision: (cur?.revision ?? 0) + 1, artworkId: id, ...body, conditions: body.conditions.map(x => ({ id: randomUUID(), ...x })), hash, previousRevision: cur?.revision ?? null, actorId: actor.id, at });
}

async function authorize(s, actor, id, c, at, bytesFor) {
  const { t, cur } = need(s, id);
  if (t.completions.length) fail(409, 'This treatment is complete.');
  if (c.revision !== cur.revision) fail(409, 'Select the current treatment revision.');
  if (authFor(t, cur)) fail(409, 'This treatment revision is already authorized.');
  if (c.checked !== true) fail(422, 'Confirm the authorization you reviewed.');
  const base = { id: randomUUID(), revision: cur.revision, revisionHash: cur.hash, actorId: actor.id, at };
  if (c.mode === 'EXTERNAL_PERMISSION') {
    if (actor.role !== GEC) fail(403, 'Only the General Exhibition Coordinator records an external permission.');
    if (!text(c.reference, 500)) fail(422, 'Record the reference of the external permission.');
    const e = currentEvidence(s, id, c.evidenceId, 'TREATMENT_SOURCE', cur); await bytesFor(e);
    t.authorizations.push({ ...base, mode: 'EXTERNAL_PERMISSION', performedInSadu: false, grantor: cur.decisionMaker.name, grantorCapacity: cur.decisionMaker.capacity, reference: c.reference.trim(), evidenceId: e.id, evidenceHash: e.file_hash });
  } else if (c.mode === 'SADU_APPROVAL') {
    if (!cur.decisionMaker.accountId || actor.id !== cur.decisionMaker.accountId) fail(403, 'Only the named decision-maker account can approve in SADU.');
    if (actor.id === cur.actorId) fail(403, 'The person who recorded the treatment cannot approve it.');
    t.authorizations.push({ ...base, mode: 'SADU_APPROVAL', performedInSadu: true, approver: cur.decisionMaker.name, approverCapacity: cur.decisionMaker.capacity });
  } else fail(422, 'Choose recorded external permission or an approval performed in SADU.');
}

function requireTechnician(s, id, actor) {
  if (actor.role !== 'Technical') fail(403, 'Only the assigned technician performs trial work.');
  if (!owns(s, id, actor)) fail(409, 'The named technician must accept the trial task first.');
}

async function submitSample(s, actor, id, c, at, bytesFor) {
  const { t, cur } = need(s, id);
  requireTechnician(s, id, actor);
  if (t.completions.length) fail(409, 'This treatment is complete.');
  if (c.revision !== cur.revision) fail(409, 'Select the current treatment revision.');
  if (!authFor(t, cur)) fail(409, 'Authorization for this exact revision is required before a trial can be submitted.');
  if (c.checked !== true) fail(422, 'Confirm the photograph shows the trial.');
  if (!optionalText(c.note)) fail(422, 'The note is too long.');
  const e = currentEvidence(s, id, c.evidenceId, 'TREATMENT_SAMPLE', cur);
  if (e.actorId !== actor.id) fail(403, 'Submit a photograph you uploaded yourself.');
  if (!/^image\//.test(e.mime)) fail(422, 'A trial needs an actual photograph, not a document.');
  await bytesFor(e);
  if (t.trials.some(x => x.evidenceId === e.id || x.sampleHash === e.file_hash)) fail(409, 'This photograph was already submitted. Take and upload a new one.');
  const open = trialFor(t, cur);
  if (open) open.supersededAt = at;
  t.trials.push({ id: randomUUID(), revision: cur.revision, revisionHash: cur.hash, evidenceId: e.id, sampleHash: e.file_hash, note: c.note?.trim() || null, decision: null, supersededAt: null, actorId: actor.id, at });
}

async function artistDecision(s, actor, id, c, at, bytesFor) {
  const { t, cur } = need(s, id);
  const artwork = s.artworks.find(a => a.id === id);
  if (actor.role !== 'Artist' || actor.id !== artwork?.artistActorId) fail(403, 'Only the artist of this work reviews the trial photograph.');
  if (c.revision !== cur.revision) fail(409, 'The treatment changed after you opened it. Review the current revision.');
  const trial = t.trials.find(x => x.id === c.trialId);
  if (!trial || trial.supersededAt || trial.revision !== cur.revision || trial.revisionHash !== cur.hash) fail(409, 'This photograph is no longer the current trial. Review the latest one.');
  if (c.evidenceId !== trial.evidenceId) fail(409, 'Decide on the exact photograph that is displayed.');
  if (trial.decision) fail(409, 'A decision is already recorded for this photograph.');
  if (!authFor(t, cur)) fail(409, 'Authorization for this treatment revision is no longer current.');
  if (!['APPROVE', 'REQUEST_CHANGES'].includes(c.decision) || c.checked !== true) fail(422, 'Confirm that you viewed this photograph and choose a decision.');
  if (!optionalText(c.note)) fail(422, 'The note is too long.');
  const e = findEvidence(s, id, trial.evidenceId, 'TREATMENT_SAMPLE'); await bytesFor(e);
  if (e.file_hash !== trial.sampleHash) fail(409, 'The recorded photograph changed.');
  trial.decision = { decision: c.decision, note: c.note?.trim() || null, revision: cur.revision, revisionHash: cur.hash, evidenceId: e.id, evidenceHash: e.file_hash, actorId: actor.id, at };
}

function requirement(s, actor, id, c, at) {
  const { t, cur } = need(s, id);
  if (!Object.hasOwn(REQUIREMENT_ROLES, c.domain) || !domainsOf(cur).includes(c.domain)) fail(422, 'This requirement is not part of the current treatment.');
  if (actor.role !== REQUIREMENT_ROLES[c.domain]) fail(403, 'This requirement is cleared by a different role.');
  if (t.completions.length) fail(409, 'This treatment is complete.');
  if (checkFor(t, c.domain)) fail(409, 'This requirement is already cleared.');
  if (c.checked !== true) fail(422, 'Confirm that you reviewed this requirement.');
  if (!optionalText(c.reference, 500)) fail(422, 'The reference is too long.');
  t.checks.push({ id: randomUUID(), domain: c.domain, clearedInRevision: cur.revision, reference: c.reference?.trim() || null, actorId: actor.id, at });
}

async function complete(s, actor, id, c, at, bytesFor) {
  const { t, cur } = need(s, id);
  requireTechnician(s, id, actor);
  if (t.completions.length) fail(409, 'Completion is already recorded.');
  if (c.revision !== cur.revision) fail(409, 'Select the current treatment revision.');
  const blockers = batchBlockers(s, id); if (blockers.length) fail(409, `Batch treatment is not cleared: ${blockers[0]}`);
  if (!Number.isSafeInteger(c.lettersTreated) || c.lettersTreated < 1 || c.lettersTreated > 100000) fail(422, 'Record how many letters were treated.');
  if (!optionalText(c.note)) fail(422, 'The note is too long.');
  const e = currentEvidence(s, id, c.evidenceId, 'TREATMENT_COMPLETION', cur);
  if (e.actorId !== actor.id) fail(403, 'Submit completion evidence you uploaded yourself.');
  await bytesFor(e);
  t.completions.push({ id: randomUUID(), revision: cur.revision, revisionHash: cur.hash, trialId: trialFor(t, cur).id, evidenceId: e.id, evidenceHash: e.file_hash, lettersTreated: c.lettersTreated, note: c.note?.trim() || null, actorId: actor.id, at });
}

export const TREATMENT_ACTIONS = ['TREATMENT_RECORD', 'TREATMENT_AUTHORIZE', 'TREATMENT_SUBMIT_SAMPLE', 'TREATMENT_ARTIST_DECISION', 'TREATMENT_REQUIREMENT', 'TREATMENT_COMPLETE'];
export async function applyTreatment({ s, actor, id, command, at, accounts, bytesFor }) {
  switch (command.action) {
    case 'TREATMENT_RECORD': return recordRevision(s, actor, id, command, accounts, at);
    case 'TREATMENT_AUTHORIZE': return authorize(s, actor, id, command, at, bytesFor);
    case 'TREATMENT_SUBMIT_SAMPLE': return submitSample(s, actor, id, command, at, bytesFor);
    case 'TREATMENT_ARTIST_DECISION': return artistDecision(s, actor, id, command, at, bytesFor);
    case 'TREATMENT_REQUIREMENT': return requirement(s, actor, id, command, at);
    case 'TREATMENT_COMPLETE': return complete(s, actor, id, command, at, bytesFor);
    default: return fail(422, 'Unknown treatment action.');
  }
}

/** Per-actor projection. Presentation only: every command is rechecked by applyTreatment. */
export function treatmentView(s, id, actor, nowIso) {
  if (!TREATMENT_ROLES.includes(actor.role)) return null;
  const t = record(s, id), cur = current(t), artwork = s.artworks.find(a => a.id === id);
  const task = ownerTask(s, id), auth = cur ? authFor(t, cur) : null, trial = cur ? trialFor(t, cur) : null;
  const blockers = cur ? batchBlockers(s, id) : [];
  const coordinator = actor.role === GEC, completed = t?.completions.at(-1) ?? null;
  const isOwner = !!task?.ownerId && task.ownerId === actor.id, accepted = isOwner && task.acceptedBy === actor.id;
  const overdue = !!task?.dueAt && Date.parse(nowIso) > Date.parse(task.dueAt);
  const steps = [];
  const step = (key, state, ownerRole, extra = {}) => steps.push({ key, state, ownerRole, ownerId: null, canAct: false, blocker: '', evidenceIds: [], ...extra });
  step('tRecord', cur ? 'done' : 'now', GEC, { canAct: coordinator && !cur });
  const dmAccount = cur?.decisionMaker.accountId ?? null;
  const authModes = [...(coordinator ? ['EXTERNAL_PERMISSION'] : []), ...(cur && dmAccount === actor.id && actor.id !== cur.actorId ? ['SADU_APPROVAL'] : [])];
  step('tAuthorize', !cur ? 'waiting' : auth ? 'done' : 'now', GEC, { ownerId: dmAccount, canAct: !!cur && !auth && !completed && authModes.length > 0, authModes, blocker: cur ? '' : pair('سجّل الإصدار أولاً.', 'Record the treatment revision first.'), evidenceIds: auth?.evidenceId ? [auth.evidenceId] : [] });
  if (cur) for (const d of domainsOf(cur)) {
    const check = checkFor(t, d);
    step(`t${d[0]}${d.slice(1).toLowerCase()}`, check ? 'done' : 'now', REQUIREMENT_ROLES[d], { domain: d, canAct: !check && !completed && actor.role === REQUIREMENT_ROLES[d] });
  }
  const assign = coordinator && !!auth && !task?.ownerId && !completed;
  const sampleReady = !!auth && accepted && !completed;
  const sampleDone = !!trial && trial.decision?.decision !== 'REQUEST_CHANGES';
  step('tSample', !auth ? 'waiting' : sampleDone || completed ? 'done' : 'now', 'Technical', {
    ownerId: task?.ownerId ?? null, dueAt: task?.dueAt ?? null, overdue: overdue && !sampleDone, assign,
    acceptance: !!auth && isOwner && !task.acceptedBy && !completed, canAct: sampleReady && !sampleDone,
    blocker: !auth ? pair('بانتظار تفويض هذا الإصدار.', 'Waiting for authorization of this revision.') : !task?.ownerId ? pair('تعيّن المنسقة فنياً وموعداً.', 'The Coordinator assigns a technician and deadline.') : !task.acceptedBy ? pair('بانتظار قبول الفني المسمّى.', 'Waiting for the named technician to accept.') : trial?.decision?.decision === 'REQUEST_CHANGES' ? pair('طلب الفنان تغييرات؛ ارفع صورة جديدة.', 'The artist asked for changes; upload a new photograph.') : '',
    evidenceIds: trial ? [trial.evidenceId] : [] });
  const isArtist = actor.role === 'Artist' && actor.id === artwork?.artistActorId;
  const artistState = !trial ? 'waiting' : trial.decision?.decision === 'APPROVE' ? 'done' : trial.decision ? 'waiting' : 'now';
  step('tArtist', artistState, 'Artist', { ownerId: artwork?.artistActorId ?? null, trialId: trial?.id ?? null, canAct: artistState === 'now' && isArtist && !completed, blocker: !trial ? pair('بانتظار صورة العيّنة من الفني.', 'Waiting for the technician’s trial photograph.') : trial.decision ? pair('بانتظار صورة جديدة.', 'Waiting for a new photograph.') : '', evidenceIds: trial ? [trial.evidenceId] : [] });
  step('tComplete', completed ? 'done' : blockers.length ? 'waiting' : 'now', 'Technical', {
    ownerId: task?.ownerId ?? null, canAct: !completed && blockers.length === 0 && accepted,
    blocker: completed ? '' : blockers[0] ?? (accepted ? '' : pair('بانتظار قبول الفني المسمّى.', 'Waiting for the named technician to accept.')), evidenceIds: completed ? [completed.evidenceId] : trial ? [trial.evidenceId] : [] });
  return { scenario: TREATMENT_SCENARIO, synthetic: true, current: cur, revisions: t?.revisions ?? [], authorizations: t?.authorizations ?? [], trials: t?.trials ?? [], checks: t?.checks ?? [], completions: t?.completions ?? [],
    batch: { allowed: !!cur && blockers.length === 0 && !completed, blockers }, assignment: task ? { ownerId: task.ownerId, dueAt: task.dueAt, accepted: !!task.acceptedBy } : null, steps };
}

const titles = { tRecord: pair('تسجيل المعالجة المشروطة', 'Record the conditional treatment'), tAuthorize: pair('تسجيل تفويض التجربة', 'Record trial authorization'), tVenue: pair('متطلب الموقع', 'Venue requirement'), tEngineering: pair('المتطلب الهندسي', 'Engineering requirement'), tFinancial: pair('المتطلب المالي', 'Financial requirement'), tOther: pair('شرط آخر', 'Other condition'), tSample: pair('تجربة حرف واحد وصورتها', 'One-letter trial and photograph'), tArtist: pair('مراجعة الفنان لصورة العيّنة', 'Artist review of the trial photograph'), tComplete: pair('تسجيل اكتمال المعالجة', 'Record batch completion') };
export function treatmentTasks(s, id, actor, nowIso) {
  const view = treatmentView(s, id, actor, nowIso);
  return (view?.steps ?? []).filter(x => x.state === 'now' && (x.canAct || x.acceptance || x.assign)).map(x => ({
    id: `${id}:treatment:${x.key}`, owner: x.ownerRole, ownerId: x.ownerId, title: titles[x.key] ?? x.key, blocker: x.blocker, dueAt: x.dueAt ?? null, overdue: !!x.overdue, href: '#treatment', treatment: true }));
}
