import { useCallback, useEffect, useState, type ReactNode } from 'react';

/** sessionStorage is a display hint only; the server cookie is always verified. */
export default function GlobalPasswordGate({ children }: { children: ReactNode }) {
  const [verified, setVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const check = useCallback(async () => {
    try {
      const r = await fetch('/api/prelaunch/session', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      const data = r.ok ? await r.json() : null;
      setVerified(data?.verified === true);
    } catch { setVerified(false); setError('Unable to verify access. Check your connection and retry.'); }
    finally { setChecking(false); }
  }, []);
  useEffect(() => { window.dispatchEvent(new Event('sadu:ready')); void check(); const id = setInterval(check, 60000); return () => clearInterval(id); }, [check]);
  useEffect(() => { try { if (verified) sessionStorage.setItem('sadu-prelaunch-verified', 'true'); else sessionStorage.removeItem('sadu-prelaunch-verified'); } catch { /* Storage is optional, never an auth source. */ } }, [verified]);
  if (verified) return <><aside aria-label="Preview session" className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-2 text-sm text-[#111817]">
    <span>Private SADU preview · Fictional data</span>
    <button className="rounded border border-[#8C8173] ps-3 pe-3 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2" disabled={busy} onClick={async () => {
      if (!window.confirm('Lock this preview? Unrecorded changes will be lost. Recorded journey progress stays in this tab.')) return;
      setBusy(true); setError('');
      try { const r = await fetch('/api/prelaunch/lock', { method: 'POST', signal: AbortSignal.timeout(10000) }); if (!r.ok) throw new Error(); setVerified(false); }
      catch { setError('Unable to lock the preview. Check your connection and retry.'); }
      finally { setBusy(false); }
    }}>{busy ? 'Locking…' : 'Lock preview'}</button>
    {error && <p role="alert" className="w-full">{error}</p>}
  </aside>{children}</>;
  if (checking) return <main className="min-h-screen grid place-items-center bg-[#F7F1E6] text-[#111817]"><p role="status">Checking preview access…</p></main>;
  return <main style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', background: '#F7F1E6', color: '#111817', padding: 24 }}>
    <form style={{ width: 'min(360px, 85vw)', textAlign: 'center' }} onSubmit={async e => {
      e.preventDefault(); setBusy(true); setError('');
      try { const r = await fetch('/api/prelaunch/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000), body: JSON.stringify({ password }) }); if (!r.ok) throw new Error(); await check(); }
      catch { setError('Unable to unlock. Check your password or contact the preview owner.'); }
      finally { setPassword(''); setBusy(false); }
    }}>
      <p>Sharjah Department of Culture</p><h1 className="text-3xl font-semibold my-4">SADU</h1>
      <p>System under construction. Authorized personnel only.</p>
      <label className="block text-start mt-6">Password<input className="block w-full border p-3 mt-2 rounded" type="password" autoComplete="current-password" required maxLength={256} value={password} onChange={e => setPassword(e.target.value)} disabled={busy}/></label>
      <button className="w-full mt-3 p-3 rounded bg-[#111817] text-[#F7F1E6] disabled:opacity-50" disabled={busy}>{busy ? 'Checking access…' : 'Submit'}</button>
      <p role="alert" className="mt-3">{error}</p><small>Restricted fictional prototype</small>
    </form>
  </main>;
}
