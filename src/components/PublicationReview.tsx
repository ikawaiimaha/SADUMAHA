import { useEffect, useState } from 'react';
import SpatialPlanner from './SpatialPlanner';

type Account = { id: string; name: string; role: 'Artist' | 'General_Exhibition_Coordinator' | 'Director' };
type Revision = { number: number; status: string; content: { title: string; concept: string }; critique?: string };
type RecordView = {
  version: number; artistId: string; revisions: Revision[];
  events: { id: string; revision: number; action: string; note: string; actorRole: string; at: string }[];
  alerts: { id: string; message: string; resolved: boolean; revision: number }[];
  outbox: { id: string; revision: number; syncStatus: string; delivery: string }[];
  tasks: { revision: number; owner: string; title: string }[];
};
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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [actor, setActor] = useState<Account | null>(null);
  const [record, setRecord] = useState<RecordView | null>(null);
  const [draft, setDraft] = useState({ title: '', concept: '' });
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [spatialDirty, setSpatialDirty] = useState(false);
  const [spatialReload, setSpatialReload] = useState(0);
  const apply = (next: RecordView) => { setRecord(next); const r = next.revisions.at(-1); setDraft(r?.content ?? { title: '', concept: '' }); };
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
  const revision = record?.revisions.at(-1);
  const editable = actor?.role === 'Artist' && revision && ['Draft', 'Revision_Requested'].includes(revision.status);
  const dirty = Boolean(editable && (draft.title !== revision.content.title || draft.concept !== revision.content.concept));
  const act = (action: string) => run(async () => {
    if (!record || !revision) return;
    apply(await api<RecordView>('action', { action, version: record.version, revision: revision.number, ...(action === 'save' ? { content: draft } : { note }) }));
    setNote(''); setNotice(action === 'publish' ? 'Director approval saved. Publication is queued; external delivery remains paused.' : action === 'request_revision' ? 'Critique saved. A new artist revision and portal alert were created.' : 'Saved by the local backend.');
  });
  return <div dir="ltr" lang="en" className="min-h-screen bg-[#F7F1E6] text-[#2C2A29]">
    <header className="border-b border-[#D9CEBA] ps-5 pe-5 py-5 flex flex-wrap gap-4 items-center justify-between"><strong className="font-serif text-3xl text-[#8B261E]">SADU</strong><a className="underline" href="/">Return to the 14-task journey</a></header>
    <main className="mx-auto max-w-5xl ps-4 pe-4 py-6 space-y-6">
      <h1 className="font-serif text-3xl">Submission review and publication</h1>
      <p>Noura Al Mazrouei · Kufic Horizon · Fictional local accounts. Account selection simulates sign-in; it does not verify a real identity.</p>
      <p>Reviews and revisions are saved on this computer. The real application, email and government website remain paused. “Approve &amp; Publish” queues a local public snapshot only.</p>
      <section className={panel} aria-label="Account selection">
        <label>Fictional account<select className={input} value={actor?.id ?? ''} disabled={busy || dirty || spatialDirty} onChange={e => void choose(e.target.value)}><option value="" disabled>Choose an account</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        {actor && <p><strong>Active role:</strong> {label(actor.role)}</p>}
        {dirty && <p>Save your draft before switching accounts or refreshing.</p>}
        {spatialDirty && <p>Save or discard spatial changes before switching accounts or refreshing.</p>}
        <button className={button} disabled={busy || dirty || spatialDirty} onClick={() => void run(async () => {
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
        {actor && actor.role !== 'Director' && <SpatialPlanner key={`${actor.id}-${spatialReload}`} role={actor.role} onDirtyChange={setSpatialDirty}/>}
        <section className={panel}><h2 className="text-xl font-semibold">Outstanding tasks and alerts</h2>
          {record.tasks.length ? <ul>{record.tasks.map(t => <li key={t.revision}>{t.title} · {label(t.owner)} · Revision {t.revision}</li>)}</ul> : <p>No outstanding tasks for this view.</p>}
          <ul className="space-y-2">{record.alerts.filter(a => !a.resolved).map(a => <li key={a.id}>Revision {a.revision}: {a.message}</li>)}</ul>
        </section>
        <section className={panel} aria-label="Current submission">
          <h2 className="text-xl font-semibold">{revision ? `Revision ${revision.number} · ${label(revision.status)}` : 'No finalized records for executive review'}</h2>
          {!revision && <p>The Director receives a record only after the General Exhibition Coordinator marks it ready.</p>}
          {revision && <>
            {revision.critique && <aside className="rounded bg-amber-50 ps-4 pe-4 py-3"><strong>Coordinator critique:</strong><p className="whitespace-pre-wrap">{revision.critique}</p></aside>}
            {editable ? <><label className="block">Artwork title<input className={input} value={draft.title} maxLength={200} disabled={busy} onChange={e => setDraft({ ...draft, title: e.target.value })}/></label><label className="block">Artwork concept<textarea rows={5} className={input} value={draft.concept} maxLength={10000} disabled={busy} onChange={e => setDraft({ ...draft, concept: e.target.value })}/></label><div className="flex flex-wrap gap-3"><button className={button} disabled={busy || !draft.title.trim() || !draft.concept.trim()} onClick={() => void act('save')}>Save draft</button><button className={button} disabled={busy || dirty} onClick={() => void act('submit')}>Submit to Coordinator</button></div></> : <><h3 className="font-semibold">{revision.content.title}</h3><p className="whitespace-pre-wrap break-words">{revision.content.concept}</p></>}
            {((actor?.role === 'General_Exhibition_Coordinator' && revision.status === 'Coordinator_Review') || (actor?.role === 'Director' && revision.status === 'Executive_Review')) && <>
              <label className="block">Review or critique notes<textarea className={input} rows={3} maxLength={2000} value={note} disabled={busy} onChange={e => setNote(e.target.value)}/></label>
              <div className="flex flex-wrap gap-3">{actor.role === 'General_Exhibition_Coordinator' ? <><button className={button} disabled={busy || !note.trim()} onClick={() => void act('request_revision')}>Request Revision</button><button className={button} disabled={busy || !note.trim()} onClick={() => void act('ready')}>Ready for Executive Review</button></> : <button className={button} disabled={busy || !note.trim()} onClick={() => void act('publish')}>Approve &amp; Publish</button>}</div>
            </>}
            {revision.status === 'Publication_Approved' && <p>Approval is recorded against this exact revision. Its content is frozen.</p>}
          </>}
        </section>
        <section className={panel}><h2 className="text-xl font-semibold">Publication queue</h2>{record.outbox.length ? <ul>{record.outbox.map(row => <li key={row.id}>Revision {row.revision} · {row.syncStatus} · External delivery {row.delivery.toLowerCase()}</li>)}</ul> : <p>Nothing queued. Only Director approval can create a publication entry.</p>}</section>
        <section className={panel}><h2 className="text-xl font-semibold">Revision and decision history</h2><ol className="space-y-3">{record.events.map(event => <li key={event.id} className="border-t border-[#D9CEBA] pt-3"><strong>Revision {event.revision} · {label(event.action)}</strong><p>{label(event.actorRole)} · {new Date(event.at).toLocaleString('en-GB')}</p><p className="whitespace-pre-wrap break-words">{event.note}</p></li>)}</ol></section>
      </>}
    </main>
  </div>;
}
