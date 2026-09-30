import RoleSwitcher from './RoleSwitcher';
import ThemeWorkspace from './ThemeWorkspace';
import SpatialLedgerWorkspace from './SpatialLedgerWorkspace';
import SandboxRoleActions from './SandboxRoleActions';
import { SandboxProvider, useSandbox } from './SandboxProvider';
import React, { useEffect, useRef, useState } from 'react';
import '@fontsource/amiri/400.css';
import { executiveCases, openExecutiveDatabase, type ExecutiveNote } from '../data/executiveCases';
import { institutionalLogo } from '../lib/executiveMode';

export default function ExecutiveDashboard() {
  return <SandboxProvider><ExecutiveDashboardContent /></SandboxProvider>;
}

function ExecutiveDashboardContent() {
  const [workspace, setWorkspace] = useState<'artists' | 'theme' | 'spaces'>('artists');
  const [themeApprovalId, setThemeApprovalId] = useState<string | null>(null);
  const { state: sandbox, role } = useSandbox();
  const [editing, setEditing] = useState(false);
  const noteInput = useRef<HTMLTextAreaElement>(null);
  const noteButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (editing) noteInput.current?.focus(); }, [editing]);
  const [selected, setSelected] = useState<string>(executiveCases[0].id);
  const [db, setDb] = useState<IDBDatabase>();
  const [notes, setNotes] = useState<Record<string, ExecutiveNote>>({});
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const dossier = executiveCases.find(c => c.id === selected)!;
  useEffect(() => {
    document.title = 'SADU — Master Administration';
    let disposed = false; let connection: IDBDatabase | undefined;
    void openExecutiveDatabase().then(database => {
      connection = database;
      if (disposed) { database.close(); return; }
      const tx = database.transaction('notes', 'readonly');
      const read = tx.objectStore('notes').getAll();
      read.onsuccess = () => { if (!disposed) setNotes(Object.fromEntries(read.result.map((n: ExecutiveNote) => [n.caseId, n]))); };
      tx.oncomplete = () => { if (!disposed) setDb(database); };
      tx.onerror = () => { if (!disposed) setFailure('Local records could not be read.'); };
      database.onversionchange = () => { database.close(); setDb(undefined); setFailure('Reload to reconnect to local records.'); };
    }).catch(() => { if (!disposed) setFailure('Local storage is unavailable. Notes cannot be saved.'); });
    return () => { disposed = true; connection?.close(); };
  }, []);
  const dirty = draft.trim().length > 0;
  useEffect(() => { if (!dirty) return; const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  const select = (id: string) => { if (busy || (dirty && !window.confirm('Discard the unsaved note and open another dossier?'))) return; setSelected(id); setDraft(''); setMessage(''); setEditing(false); };
  const save = () => {
    if (!db || !draft.trim() || busy) return;
    const note = { caseId: selected, text: draft.trim(), recordedAt: new Date().toISOString() };
    setBusy(true); setMessage('');
    try {
      const tx = db.transaction('notes', 'readwrite'); tx.objectStore('notes').put(note);
      tx.oncomplete = () => { setNotes(n => ({ ...n, [note.caseId]: note })); setDraft(''); setMessage('Coordination note saved on this device. No approval or external message was issued.'); setBusy(false); };
      tx.onabort = () => { setMessage('Unable to save. Your note is still here; please retry.'); setBusy(false); };
    } catch { setMessage('Unable to save. Your note is still here; please retry.'); setBusy(false); }
  };
  const card = 'rounded-xl border border-[#DED5C4] bg-[#FFFDF9] p-5 md:p-7';
  const focus = 'focus-visible:outline-2 focus-visible:outline-[#8B261E] focus-visible:outline-offset-4';
  return <div className="min-h-screen bg-[#F7F1E6] text-[#111817]" lang="en">
    <a href={workspace === 'theme' ? '#theme-workspace' : workspace === 'spaces' ? '#spatial-workspace' : '#dossier'} className="sr-only focus:not-sr-only">Skip to active workspace</a>
    <header className="border-b border-[#DED5C4] px-6 py-4"><div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-5">
      <div className="flex items-center gap-4">{institutionalLogo && !logoFailed && <img src={institutionalLogo} onError={() => setLogoFailed(true)} alt="Sharjah Department of Culture" className="h-16 max-w-48 object-contain"/>}<div><p className="text-sm">Sharjah Department of Culture</p><strong style={{ fontFamily: 'Amiri, Noto Naskh Arabic, Georgia, serif' }} className="text-4xl text-[#8B261E]">SADU</strong></div></div>
      <RoleSwitcher />
    </div></header>
    <main className="mx-auto max-w-6xl p-5 md:p-8 space-y-7">
      <nav aria-label="Workspaces" className="flex flex-wrap gap-5 border-b border-[#DED5C4] pb-4">{(['artists','theme','spaces'] as const).map(w => <button key={w} aria-pressed={workspace === w} onClick={() => setWorkspace(w)} className={`text-sm pb-2 border-b-2 focus-visible:outline-2 focus-visible:outline-[#8B261E] ${workspace === w ? 'border-[#8B261E] text-[#8B261E] font-semibold' : 'border-transparent text-[#655D50]'}`}>{w === 'artists' ? 'Artist dossiers' : w === 'theme' ? 'Theme & Editorial' : 'Spaces & allocations'}</button>)}</nav>
      <div id="theme-workspace" tabIndex={-1} hidden={workspace !== 'theme'}><ThemeWorkspace onPlanningReady={setThemeApprovalId} /></div>
      <div id="spatial-workspace" tabIndex={-1} hidden={workspace !== 'spaces'}><SpatialLedgerWorkspace themeApprovalId={themeApprovalId} /></div>
      <div hidden={workspace !== 'artists'} className="space-y-7">
      <div><p className="text-sm uppercase tracking-widest text-[#8B261E]">Exhibition overview</p><h1 className="mt-2 text-3xl font-serif">Artist dossiers</h1><p className="mt-2 text-[#655D50]">Select an artist to review their next step and supporting information.</p></div>
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] items-start">
        <aside className="space-y-5"><section className="py-2"><h2 className="px-3 text-xs uppercase tracking-widest text-[#655D50]">Artists · {executiveCases.length}</h2><nav aria-label="Artist dossiers" className="mt-4 space-y-2">{executiveCases.map(c => <button key={c.id} aria-pressed={selected === c.id} disabled={busy} onClick={() => select(c.id)} className={`block w-full rounded-lg border p-3 text-start focus-visible:outline-2 focus-visible:outline-[#8B261E] focus-visible:outline-offset-2 ${selected === c.id ? 'bg-[#FFFDF9] border-[#8B261E]' : 'border-transparent hover:bg-[#EDE5D8]'}`}><span className="block font-semibold">{c.name}</span><span className="text-sm text-[#655D50]">{c.focus}</span></button>)}</nav></section>
        <details className="border-t border-[#DED5C4] px-3 pt-5"><summary className={`text-sm cursor-pointer ${focus}`}>System Connections</summary><dl className="mt-4 space-y-5 text-sm"><div><dt>Database &amp; State Engine</dt><dd className={db ? 'text-green-800' : 'text-amber-800'}>{db ? '✓ Active · this device' : failure ? '● Unavailable' : '● Connecting'}</dd></div><div><dt>UAE Pass Authentication</dt><dd className="text-amber-800">● Awaiting credentials &amp; integration validation</dd></div><div><dt>SDC Government Cloud Vault</dt><dd className="text-amber-800">● Awaiting endpoint &amp; integration validation</dd></div></dl><p className="mt-4 text-sm">Connections remain paused. Production activation requires security review and end-to-end testing.</p>{failure && <p role="alert">{failure}</p>}</details></aside>
        <section id="dossier" tabIndex={-1} className={`${card} min-w-0 scroll-mt-6`} aria-label="Active artist dossier">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#655D50]">{dossier.focus}</p>
            <span className="rounded-full bg-[#F7F1E6] px-3 py-1 text-xs font-medium text-[#7C3928]">{sandbox.dossiers[selected].status}</span>
          </div>
          <h2 className="mt-3 text-3xl font-serif md:text-4xl">{dossier.name}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#655D50]">{dossier.summary}</p>
          <SandboxRoleActions dossierId={selected} />
          <section aria-label="Artwork details">
            <h3 className="text-sm font-semibold">Artworks &amp; installation</h3>
            <ul className="mt-2 divide-y divide-[#E7DFD2]">{dossier.works.map(w => <li key={w} className="py-2 text-sm">{w}</li>)}</ul>
            <details key={selected} className="mt-3 border-t border-[#DED5C4] pt-4">
              <summary className={`cursor-pointer text-sm font-medium ${focus}`}>Source details &amp; outstanding evidence</summary>
              <ul className="mt-3 list-disc ps-5 space-y-2 text-sm leading-6">{dossier.facts.map(f => <li key={f}>{f}</li>)}</ul>
              <p className="mt-4 text-xs leading-5 text-[#655D50]">Case-study records from the supplied summaries. Original documents and current statuses have not been verified. No approvals are inferred.</p>
            </details>
          </section>
          <section hidden={role !== 'General_Exhibition_Coordinator'} className="mt-6 border-t border-[#DED5C4] pt-5" aria-label="Coordination notes">
            {!editing && <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[#655D50]">{notes[selected] ? 'A coordination note is saved on this device.' : 'Record the agreed next step when ready.'}</p><button ref={noteButton} type="button" aria-expanded={editing} aria-controls="coordination-note" onClick={() => setEditing(true)} className={`rounded-lg bg-[#8B261E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#701E18] ${focus}`}>Add coordination note</button></div>}
            {editing && <form id="coordination-note" onSubmit={e => { e.preventDefault(); save(); }}>
              <label htmlFor="note" className="text-sm font-semibold">Coordination note</label>
              <p id="note-help" className="mt-1 text-xs text-[#655D50]">Saved on this device. This does not issue an approval or contact the artist.</p>
              <textarea ref={noteInput} id="note" aria-describedby="note-help" value={draft} disabled={busy} onChange={e => setDraft(e.target.value)} maxLength={2000} rows={3} className={`mt-3 block w-full rounded-lg border border-[#8C8173] bg-white p-3 text-sm ${focus}`}/>
              <div className="mt-3 flex items-center gap-3"><button disabled={!db || !draft.trim() || busy} className={`rounded-lg bg-[#8B261E] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 ${focus}`}>{busy ? 'Saving…' : 'Save note'}</button><button type="button" disabled={busy} onClick={() => { if (dirty && !window.confirm('Discard this unsaved note?')) return; setDraft(''); setEditing(false); setMessage(''); requestAnimationFrame(() => noteButton.current?.focus()); }} className={`rounded-lg px-3 py-2.5 text-sm ${focus}`}>Close</button></div>
            </form>}
            {message && <p role="status" className="mt-3 text-sm">{message}</p>}
            {failure && <p role="alert" className="mt-3 text-sm text-[#8B261E]">{failure}</p>}
            {notes[selected] && <details key={`note-${selected}`} className="mt-4"><summary className={`cursor-pointer text-sm ${focus}`}>Latest saved note</summary><p className="mt-2 whitespace-pre-wrap break-words text-sm">{notes[selected].text}</p><p className="mt-2 text-xs text-[#655D50]">{new Date(notes[selected].recordedAt).toLocaleString('en-GB')}</p></details>}
          </section>
        </section>
      </div></div><footer className="text-sm text-[#655D50]">Executive presentation · Case-study records · <a className="underline" href="/overview">About SADU</a></footer>
    </main>
  </div>;
}
