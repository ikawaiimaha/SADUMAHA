import React, { useEffect, useState } from 'react';
import '@fontsource/amiri/400.css';
import { executiveCases, openExecutiveDatabase, type ExecutiveNote } from '../data/executiveCases';
import { institutionalLogo } from '../lib/executiveMode';

export default function ExecutiveDashboard() {
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
  const select = (id: string) => { if (busy || (dirty && !window.confirm('Discard the unsaved note and open another dossier?'))) return; setSelected(id); setDraft(''); setMessage(''); };
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
  const card = 'rounded-2xl border border-[#DED5C4] bg-white p-6';
  return <div className="min-h-screen bg-[#F7F1E6] text-[#111817]" lang="en">
    <a href="#dossier" className="sr-only focus:not-sr-only">Skip to active dossier</a>
    <header className="border-b border-[#DED5C4] px-6 py-5"><div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-5">
      <div className="flex items-center gap-4">{institutionalLogo && !logoFailed && <img src={institutionalLogo} onError={() => setLogoFailed(true)} alt="Sharjah Department of Culture" className="h-16 max-w-48 object-contain"/>}<div><p className="text-sm">Sharjah Department of Culture</p><strong style={{ fontFamily: 'Amiri, Noto Naskh Arabic, Georgia, serif' }} className="text-4xl text-[#8B261E]">SADU</strong></div></div>
      <div className="text-start"><p className="font-semibold">Master Administration</p><p className="text-sm text-[#655D50]">Exhibitions · Coordination &amp; oversight</p></div>
    </div></header>
    <main className="mx-auto max-w-7xl p-5 md:p-8 space-y-6">
      <div><p className="text-sm uppercase tracking-widest text-[#8B261E]">Exhibition overview</p><h1 className="mt-2 text-3xl font-serif">The right action. In one place.</h1><p className="mt-2 text-[#655D50]">Review the active dossier, confirm missing evidence and record the next coordination decision.</p></div>
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-5"><section className={card}><h2 className="font-semibold">Active Dossier</h2><nav aria-label="Artist dossiers" className="mt-4 space-y-2">{executiveCases.map(c => <button key={c.id} aria-pressed={selected === c.id} disabled={busy} onClick={() => select(c.id)} className={`block w-full rounded-xl border p-3 text-start focus-visible:outline-2 focus-visible:outline-offset-2 ${selected === c.id ? 'bg-[#F7F1E6] border-[#8B261E]' : 'border-transparent hover:bg-[#F7F1E6]'}`}><span className="block font-semibold">{c.name}</span><span className="text-sm text-[#655D50]">{c.focus}</span></button>)}</nav></section>
        <details className={card}><summary className="font-semibold cursor-pointer">System Connections</summary><dl className="mt-4 space-y-5 text-sm"><div><dt>Database &amp; State Engine</dt><dd className={db ? 'text-green-800' : 'text-amber-800'}>{db ? '✓ Active · this device' : failure ? '● Unavailable' : '● Connecting'}</dd></div><div><dt>UAE Pass Authentication</dt><dd className="text-amber-800">● Awaiting credentials &amp; integration validation</dd></div><div><dt>SDC Government Cloud Vault</dt><dd className="text-amber-800">● Awaiting endpoint &amp; integration validation</dd></div></dl><p className="mt-4 text-sm">Connections remain paused. Production activation requires security review and end-to-end testing.</p>{failure && <p role="alert">{failure}</p>}</details></aside>
        <section id="dossier" className="space-y-5" aria-label="Active artist dossier"><div className={card}><p className="text-sm text-[#655D50]">{dossier.focus}</p><h2 className="text-3xl font-serif mt-2">{dossier.name}</h2><p className="mt-3">{dossier.summary}</p><div className="mt-5 rounded-xl bg-[#F7F1E6] p-5"><p className="text-sm font-semibold text-[#8B261E]">Needs attention · {dossier.owner}</p><h3 className="mt-2 text-xl font-semibold">{dossier.next}</h3><p className="mt-2">{dossier.request}</p><a href="#coordination-note" className="inline-block mt-4 rounded-lg bg-[#8B261E] text-white px-4 py-3 font-semibold">Record coordination note</a></div></div>
        <div className={card}><h3 className="font-semibold">Artworks &amp; installation</h3><ul className="mt-3 space-y-2">{dossier.works.map(w => <li key={w} className="border-b border-[#DED5C4] pb-2">{w}</li>)}</ul><details className="mt-4"><summary className="cursor-pointer font-semibold">Source details &amp; outstanding evidence</summary><ul className="mt-3 list-disc ps-5 space-y-2">{dossier.facts.map(f => <li key={f}>{f}</li>)}</ul><p className="mt-4 text-sm text-[#655D50]">Case-study records from the supplied summaries. Original documents and current statuses have not been verified. No approvals are inferred.</p></details></div>
        <form id="coordination-note" className={card} onSubmit={e => { e.preventDefault(); save(); }}><label htmlFor="note" className="font-semibold">Coordination note</label><p className="text-sm mt-2">Record a next step for this dossier. This does not issue an approval or contact the artist.</p><textarea id="note" value={draft} disabled={busy} onChange={e => setDraft(e.target.value)} maxLength={2000} rows={3} className="mt-3 block w-full rounded-lg border border-[#8C8173] p-3"/><button disabled={!db || !draft.trim() || busy} className="mt-3 rounded-lg bg-[#8B261E] text-white px-4 py-3 disabled:opacity-40">{busy ? 'Saving…' : 'Save note'}</button><p role="status" className="mt-3 text-sm">{message}</p>{notes[selected] && <details className="mt-4"><summary className="cursor-pointer">Latest saved note</summary><p className="mt-2 whitespace-pre-wrap break-words">{notes[selected].text}</p><p className="text-sm">{new Date(notes[selected].recordedAt).toLocaleString('en-GB')}</p></details>}</form></section>
      </div><footer className="text-sm text-[#655D50]">Executive presentation · Case-study records · <a className="underline" href="/overview">About SADU</a></footer>
    </main>
  </div>;
}
