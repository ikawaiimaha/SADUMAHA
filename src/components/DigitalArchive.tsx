import { useEffect, useState } from 'react';
type Status = { state: string; eligible: boolean; blockers: string[]; version: string };
export default function DigitalArchive() {
  const [status, setStatus] = useState<Status>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = async () => { const r = await fetch('/api/review/archive/status'); if (!r.ok) throw new Error('Archive readiness could not be checked.'); setStatus(await r.json()); };
  useEffect(() => { void refresh().catch(e => setError(e.message)); }, []);
  return <section className="rounded-xl border border-[#D9CEBA] p-5 space-y-3"><h2 className="text-xl font-semibold">Exhibition archive</h2><p>Preserve approved cultural metadata after every artwork has return-freight clearance. Operational documents remain outside the archive.</p>
    <button disabled={busy} className="underline" onClick={() => { setError(''); void refresh().catch(e => setError(e.message)); }}>Refresh archive readiness</button>
    <ul className="list-disc ps-5">{status?.blockers.map(b => <li key={b}>{b}</li>)}</ul>
    <button className="block rounded bg-[#8B261E] text-white ps-4 pe-4 py-3 disabled:opacity-40" disabled={busy || !status?.eligible} onClick={async () => { setBusy(true); setError(''); try { const r = await fetch('/api/review/archive', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: status?.version }) }); const result = await r.json(); if (!r.ok) throw new Error(result.error); await refresh(); } catch(e) { setError((e as Error).message); } finally { setBusy(false); } }}>Archive Exhibition &amp; Generate Digital Twin</button>
    {status?.state === 'ARCHIVED_DIGITAL_TWIN' && <a className="underline" href="/api/v1/archive/biennial-2026">Open cultural archive JSON-LD</a>}
    <p role="alert">{error}</p><p className="text-sm">Private local archive. Public delivery remains paused. Schema.org metadata export; no CIDOC CRM mapping or virtual-tour renderer is claimed.</p>
  </section>;
}
