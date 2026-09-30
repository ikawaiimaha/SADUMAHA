import ConnectedPilot from './ConnectedPilot';
import { ConnectedBudgetGauge } from './MuseumCare';
import DigitalArchive from './DigitalArchive';
import SmartCuration, { type CuratedArtwork } from './SmartCuration';
import { useEffect, useState } from 'react';
import CrateTracking from './CrateTracking';
import SpatialPlanner from './SpatialPlanner';

type Account = { id: string; name: string; role: 'Artist' | 'General_Exhibition_Coordinator' | 'Director' };
type LabelFields = { artistName: string; width_cm: number; height_cm: number; year: number; profileUrl?: string };
type Revision = { number: number; status: string; content: { title: string; concept: string; label?: LabelFields }; critique?: string; profileVerification?: { url: string } };
type RecordView = {
  curationArtworks: CuratedArtwork[];
  currentRevision: number; labelTestMode: boolean;
  version: number; artistId: string; revisions: Revision[];
  events: { id: string; revision: number; action: string; note: string; actorRole: string; at: string }[];
  alerts: { id: string; message: string; resolved: boolean; revision: number }[];
  outbox: { id: string; revision: number; syncStatus: string; delivery: string }[];
  tasks: { revision: number; owner: string; title: string }[];
  labels: { id: string; revision: number; status: string; current: boolean; sha256: string }[];
};
const toDraft = (content?: Revision['content']) => ({ title: content?.title ?? '', concept: content?.concept ?? '', artistName: content?.label?.artistName ?? 'Noura Al Mazrouei', width: content?.label?.width_cm == null ? '' : String(content.label.width_cm), height: content?.label?.height_cm == null ? '' : String(content.label.height_cm), year: content?.label?.year == null ? '' : String(content.label.year), profileUrl: content?.label?.profileUrl ?? '' });
const label = (value: string) => value.replaceAll('_', ' ');
const panel = 'rounded-xl border border-[#D9CEBA] bg-white ps-5 pe-5 py-5 space-y-4';
const input = 'mt-1 block w-full rounded border border-[#8C8173] bg-white ps-3 pe-3 py-2';
const button = 'rounded bg-[#8B261E] text-white ps-4 pe-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2';
async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/review/${path}`, { credentials: 'same-origin', ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('The local review backend is unavailable. Run npm run start:rehearsal, then open http://127.0.0.1:3013/review.');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Request failed.');
  return data;
}
export default function PublicationReview() {
  const [mode,setMode]=useState<string>();
  useEffect(()=>{void fetch('/api/review/session').then(r=>r.json()).then(s=>setMode(s.mode)).catch(()=>setMode('legacy'));},[]);
  if (!mode) return <p role="status">Connecting to the shared dossier…</p>;
  return mode==='connected-local-pilot' ? <ConnectedPilot/> : <LegacyPublicationReview/>;
}
function LegacyPublicationReview() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [actor, setActor] = useState<Account | null>(null);
  const [record, setRecord] = useState<RecordView | null>(null);
  const [draft, setDraft] = useState(() => toDraft());
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [spatialDirty, setSpatialDirty] = useState(false);
  const [crateGuard, setCrateGuard] = useState(false);
  const [spatialReload, setSpatialReload] = useState(0);
  const apply = (next: RecordView) => { setRecord(next); const r = next.revisions.at(-1); setDraft(toDraft(r?.content)); };
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const session = await api<{ accounts: Account[]; actor: Account | null }>('session');
        const next = session.actor ? await api<RecordView>('record') : null;
        if (active) { setAccounts(session.accounts); setActor(session.actor); if (next) apply(next); }
      } catch (e) { if (active) setError((e as Error).message); }
      finally { if (active) setBusy(false); }
    })();
    return () => { active = false; };
  }, []);
  const run = async (work: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { await work(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const choose = (accountId: string) => run(async () => {
    // Clear the previous desk's projection immediately, including on a failed refresh.
    setRecord(null); setActor(null); setNote('');
    const session = await api<{ actor: Account }>('session', { accountId });
    const next = await api<RecordView>('record'); setActor(session.actor); apply(next);
    setNotice('Fictional account selected. Permissions are checked by the local server.');
  });
  const revision = record?.revisions.find(r => r.number === record.currentRevision);
  const historicalCount = record?.revisions.filter(r => r.number !== record.currentRevision).length ?? 0;
  const editable = actor?.role === 'Artist' && revision && ['Draft', 'Revision_Requested'].includes(revision.status);
  const dirty = Boolean(editable && JSON.stringify(draft) !== JSON.stringify(toDraft(revision.content)));
  useEffect(() => {
    if (!(dirty || spatialDirty || crateGuard)) return;
    const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty, spatialDirty, crateGuard]);
  const act = (action: string) => run(async () => {
    if (!record || !revision) return;
    apply(await api<RecordView>('action', { action, version: record.version, revision: revision.number, ...(action === 'save' ? { content: { title: draft.title, concept: draft.concept, label: { artistName: draft.artistName, width_cm: Number(draft.width), height_cm: Number(draft.height), year: Number(draft.year), profileUrl: draft.profileUrl } } } : { note }) }));
    setNote(''); setNotice(action === 'publish' ? 'Director approval saved. Publication is queued; external delivery remains paused.' : action === 'request_revision' ? 'Critique saved. A new artist revision and portal alert were created.' : 'Saved by the local backend.');
  });
  const download = (path: string, filename: string) => run(async () => {
    const response = await fetch(`/api/review/labels/${path}`, { credentials: 'same-origin' });
    if (!response.ok) throw new Error((await response.json()).error ?? 'Download failed.');
    const url = URL.createObjectURL(await response.blob()); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('PDF downloaded. Print at actual size, 150 × 100 mm. This is a fictional rehearsal.');
  });
  return <div dir="ltr" lang="en" className="min-h-screen bg-[#F7F1E6] text-[#2C2A29]">
    <header className="border-b border-[#D9CEBA] ps-5 pe-5 py-5 flex flex-wrap gap-4 items-center justify-between"><strong className="font-serif text-3xl text-[#8B261E]">SADU</strong><a className="underline" href="/journey">Return to the 14-task journey</a><a className="underline" href="/overview">Executive overview</a></header>
    <main className="mx-auto max-w-5xl ps-4 pe-4 py-6 space-y-6">
        {actor?.role === "Director" && <DigitalArchive key={actor.id}/>}
        {actor && ["Director", "General_Exhibition_Coordinator"].includes(actor.role) && <details><summary>Exhibition budget</summary><ConnectedBudgetGauge key={actor.id}/></details>}
      <h1 className="font-serif text-3xl">Submission review and publication</h1>
      <p>Noura Al Mazrouei · Kufic Horizon · Fictional local accounts. Account selection simulates sign-in; it does not verify a real identity.</p>
      <p>Reviews and revisions are saved on this computer. The real application, email and government website remain paused. “Approve &amp; Publish” queues a local public snapshot only.</p>
      <section className={panel} aria-label="Account selection">
        <label>Fictional account<select className={input} value={actor?.id ?? ''} disabled={busy || dirty || spatialDirty || crateGuard} onChange={e => void choose(e.target.value)}><option value="" disabled>Choose an account</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        {actor && <p><strong>Active role:</strong> {label(actor.role)}</p>}
        {dirty && <p>Save your draft before switching accounts or refreshing.</p>}
        {crateGuard && <p>Finish saving or discard shipment changes, and stop scanning, before switching accounts or refreshing.</p>}
        {spatialDirty && <p>Finish loading/saving or discard spatial changes before switching accounts or refreshing.</p>}
        <button className={button} disabled={busy || dirty || spatialDirty || crateGuard} onClick={() => void run(async () => {
          const session = await api<{ accounts: Account[]; actor: Account | null }>('session');
          setAccounts(session.accounts); setActor(session.actor); setRecord(null);
          if (session.actor) apply(await api<RecordView>('record'));
          setSpatialReload(value => value + 1);
          setNotice('Latest server record loaded.');
        })}>Refresh server record</button>
      </section>
      {error && <p role="alert" className="rounded border border-red-800 bg-red-50 ps-4 pe-4 py-3">{error}</p>}
      <p role="status" aria-live="polite">{busy ? 'Saving or loading…' : notice}</p>
      {record && <>
        <section className={panel}><h2 className="text-xl font-semibold">Outstanding tasks and alerts</h2>
          {record.tasks.length ? <ul>{record.tasks.map(t => <li key={t.revision}>{t.title} · {label(t.owner)} · Revision {t.revision}</li>)}</ul> : <p>No outstanding tasks for this view.</p>}
          <ul className="space-y-2">{record.alerts.filter(a => !a.resolved).map(a => <li key={a.id}>Revision {a.revision}: {a.message}</li>)}</ul>
        </section>
        <section className={panel} aria-label="Current submission">
          <h2 className="text-xl font-semibold">{revision ? `Revision ${revision.number} · ${label(revision.status)}` : 'No finalized records for executive review'}</h2>
          {!revision && <p>The current revision is not available for executive action. The Director receives it only after Coordinator review.</p>}
          {!revision && historicalCount > 0 && <p>{historicalCount} earlier finalized revision(s) remain in history; their approvals do not apply to the new revision.</p>}
          {revision && <>
            {revision.critique && <aside className="rounded bg-amber-50 ps-4 pe-4 py-3"><strong>Coordinator critique:</strong><p className="whitespace-pre-wrap">{revision.critique}</p></aside>}
            {editable ? <><label className="block">Artwork title<input className={input} value={draft.title} maxLength={200} disabled={busy} onChange={e => setDraft({ ...draft, title: e.target.value })}/></label><label className="block">Artwork concept<textarea rows={5} className={input} value={draft.concept} maxLength={10000} disabled={busy} onChange={e => setDraft({ ...draft, concept: e.target.value })}/></label></> : <><h3 className="font-semibold">{revision.content.title}</h3><p className="whitespace-pre-wrap break-words">{revision.content.concept}</p></>}
            {editable && <fieldset disabled={busy} className="space-y-3"><legend className="font-semibold">Gallery label fields</legend>
              <label className="block">Artist display name<input className={input} maxLength={120} value={draft.artistName} onChange={e => setDraft({ ...draft, artistName: e.target.value })}/></label>
              <div className="grid gap-3 sm:grid-cols-3"><label>Artwork width (cm)<input className={input} type="number" min="0.01" step="any" value={draft.width} onChange={e => setDraft({ ...draft, width: e.target.value })}/></label><label>Artwork height (cm)<input className={input} type="number" min="0.01" step="any" value={draft.height} onChange={e => setDraft({ ...draft, height: e.target.value })}/></label><label>Artwork year<input className={input} type="number" min="1000" max="9999" step="1" value={draft.year} onChange={e => setDraft({ ...draft, year: e.target.value })}/></label></div>
              <label className="block">SDC artist-profile URL (optional until verified)<input className={input} type="url" maxLength={256} value={draft.profileUrl} onChange={e => setDraft({ ...draft, profileUrl: e.target.value })}/></label>
              <p className="text-sm">Use the approved artwork dimensions, not the separate wall-study dimensions. Save the draft below after completing these fields. In local test mode, the QR uses the configured SDC base URL plus this artist’s ID and is marked as a test URL.</p>
            </fieldset>}
            {editable && <div className="flex flex-wrap gap-3"><button className={button} disabled={busy || !draft.title.trim() || !draft.concept.trim()} onClick={() => void act('save')}>Save draft</button><button className={button} disabled={busy || dirty} onClick={() => void act('submit')}>Submit to Coordinator</button></div>}
            {!editable && revision.content.label && <p>Label: {revision.content.label.artistName} · {revision.content.label.height_cm} × {revision.content.label.width_cm} cm (H × W) · {revision.content.label.year}. {revision.profileVerification ? 'Profile verification recorded.' : 'No live profile verification. Test mode can generate a marked test QR; otherwise the label stays a draft.'}</p>}
            {((actor?.role === 'General_Exhibition_Coordinator' && revision.status === 'Coordinator_Review') || (actor?.role === 'Director' && revision.status === 'Executive_Review')) && <>
              <label className="block">Review or critique notes<textarea className={input} rows={3} maxLength={2000} value={note} disabled={busy} onChange={e => setNote(e.target.value)}/></label>
              <div className="flex flex-wrap gap-3">{actor.role === 'General_Exhibition_Coordinator' ? <><button className={button} disabled={busy || !note.trim()} onClick={() => void act('request_revision')}>Request Revision</button><button className={button} disabled={busy || !note.trim()} onClick={() => void act('ready')}>Ready for Executive Review</button></> : <button className={button} disabled={busy || !note.trim()} onClick={() => void act('publish')}>Approve &amp; Publish</button>}</div>
              {actor.role === 'General_Exhibition_Coordinator' && revision.content.label?.profileUrl && <><p className="break-words">Submitted profile URL: {revision.content.label.profileUrl}</p><p className="text-sm">Record verification only after checking that this exact official page belongs to this artist. Enter the verification basis in the review notes; this records a human check, not an automated website verification.</p><button className={button} disabled={busy || !note.trim() || Boolean(revision.profileVerification)} onClick={() => void act('verify_profile')}>Record profile verification</button></>}
            </>}
            {revision.status === 'Publication_Approved' && <p>Approval is recorded against this exact revision. Its content is frozen.</p>}
            {actor?.role === 'General_Exhibition_Coordinator' && ['Publication_Approved', 'Executive_Review'].includes(revision.status) && <><label className="block">Correction or new revision reason<textarea className={input} maxLength={2000} value={note} onChange={e => setNote(e.target.value)}/></label><button className={button} disabled={busy || !note.trim()} onClick={() => void act(revision.status === 'Publication_Approved' ? 'amend' : 'request_revision')}>Request a new artist revision</button></>}
          </>}
        </section>
        {actor && actor.role !== 'Director' && <section className={panel} aria-label="Related exhibition tools"><h2 className="text-xl font-semibold">Related exhibition tools</h2><p>Submission, wall-study and crate records are separate local modules. Their statuses do not complete the 14-task checklist.</p>
          {actor.role === 'General_Exhibition_Coordinator' && <details><summary className="cursor-pointer py-3 font-semibold">Thematic curation</summary><SmartCuration key={`curation-${actor.id}-${revision?.number}`} artworks={record.curationArtworks ?? []} busy={busy} onExtractExisting={() => void act('tag_existing')}/></details>}
          <details><summary className="cursor-pointer py-3 font-semibold">Crate tracking and manifests</summary><CrateTracking key={`crate-${actor.id}-${spatialReload}`} role={actor.role} onGuardChange={setCrateGuard}/></details>
          <details><summary className="cursor-pointer py-3 font-semibold">Wall-space planning</summary><SpatialPlanner key={`${actor.id}-${spatialReload}`} role={actor.role} onDirtyChange={setSpatialDirty}/></details>
        </section>}
        <section className={panel}><h2 className="text-xl font-semibold">Publication queue</h2>{record.outbox.length ? <ul>{record.outbox.map(row => <li key={row.id}>Revision {row.revision} · {row.syncStatus} · External delivery {row.delivery.toLowerCase()}</li>)}</ul> : <p>Nothing queued. Only Director approval can create a publication entry.</p>}</section>
        {actor?.role === 'General_Exhibition_Coordinator' && <section className={panel}><h2 className="text-xl font-semibold">Approved gallery labels</h2><p>Vector PDF, 150 × 100 mm. Test-ready labels use a generated SDC URL and explicitly state that it is not live-verified. Drafts and historical versions are excluded from the batch.</p>
          {!record.labels?.length && <p>No labels generated yet. Earlier approvals are preserved; request a new artist revision to add label metadata.</p>}
          <ul className="space-y-3">{record.labels?.map(row => <li key={row.id}>Revision {row.revision} · {label(row.status)} · {row.current ? 'Current' : 'Historical'} <button className={button} disabled={busy} onClick={() => void download(`${encodeURIComponent(row.id)}.pdf`, `SADU-label-r${row.revision}.pdf`)}>Download revision {row.revision} PDF</button></li>)}</ul>
          <button className={button} disabled={busy || !record.labels?.some(row => row.current && (row.status === 'Ready' || (record.labelTestMode && row.status === 'Test_Ready')))} onClick={() => void download('batch.pdf', 'SADU-approved-labels.pdf')}>Download all print-ready labels (rehearsal)</button>
        </section>}
        <section className={panel}><h2 className="text-xl font-semibold">Revision and decision history</h2><ol className="space-y-3">{record.events.map(event => <li key={event.id} className="border-t border-[#D9CEBA] pt-3"><strong>Revision {event.revision} · {label(event.action)}</strong><p>{label(event.actorRole)} · {new Date(event.at).toLocaleString('en-GB')}</p><p className="whitespace-pre-wrap break-words">{event.note}</p></li>)}</ol></section>
      </>}
    </main>
  </div>;
}
