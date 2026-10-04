import { executiveMode } from '../lib/executiveMode';
import LocalReplayControls from './LocalReplayControls';
import { startDemoReplay, pauseDemoReplay } from '../lib/demoReplay';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { prelaunchCopy } from '../i18n/prelaunch.mjs';

/** sessionStorage is a display hint only; the server cookie is always verified. */
export default function GlobalPasswordGate({ children }: { children: ReactNode }) {
  const [verified, setVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const copy = prelaunchCopy[language];
  const [error, setError] = useState<'' | 'verifyError' | 'lockError' | 'unlockError' | 'rateLimit' | 'unconfigured'>('');
  useEffect(()=>{if(verified)void startDemoReplay({hostname:window.location.hostname,pathname:window.location.pathname});else pauseDemoReplay();},[verified]);
  const check = useCallback(async () => {
    try {
      const r = await fetch('/api/prelaunch/session', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      const data = r.ok ? await r.json() : null;
      setVerified(data?.verified === true);
    } catch { setVerified(false); setError('verifyError'); }
    finally { setChecking(false); }
  }, []);
  useEffect(() => { window.dispatchEvent(new Event('sadu:ready')); void check(); const id = setInterval(check, 60000); return () => clearInterval(id); }, [check]);
  useEffect(() => { try { if (verified) sessionStorage.setItem('sadu-prelaunch-verified', 'true'); else sessionStorage.removeItem('sadu-prelaunch-verified'); } catch { /* Storage is optional, never an auth source. */ } }, [verified]);
  if (verified) return <><aside aria-label="Preview session" className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-2 text-sm text-[#111817]">
    {!executiveMode && <span lang="ar" dir="rtl">عرض سدو الخاص · بيانات تجريبية</span>}<LocalReplayControls/>
    <button className="rounded border border-[#8C8173] ps-3 pe-3 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2" disabled={busy} onClick={async () => {
      if (!window.confirm(copy.lockConfirm)) return;
      setBusy(true); setError('');
      try { const r = await fetch('/api/prelaunch/lock', { method: 'POST', signal: AbortSignal.timeout(10000) }); if (!r.ok) throw new Error(); setVerified(false); }
      catch { setError('lockError'); }
      finally { setBusy(false); }
    }}>{busy ? 'جارٍ القفل…' : 'قفل العرض'}</button>
    {error && <p role="alert" className="w-full" lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'}>{copy[error]}</p>}
  </aside>{children}</>;
  if (checking) return <main lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen grid place-items-center bg-[#F7F1E6] text-[#111817]"><p role="status">{copy.checking}</p></main>;
  return <main lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', background: '#F7F1E6', color: '#111817', padding: 24 }}>
    <form data-private style={{ width: 'min(360px, 85vw)', textAlign: 'center' }} onSubmit={async e => {
      e.preventDefault(); setBusy(true); setError('');
      try { const r = await fetch('/api/prelaunch/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000), body: JSON.stringify({ password }) }); if (!r.ok) { setError(r.status === 429 ? 'rateLimit' : r.status === 503 ? 'unconfigured' : 'unlockError'); return; } await check(); }
      catch { setError('unlockError'); }
      finally { setPassword(''); setBusy(false); }
    }}>
      <button type="button" className="border rounded ps-4 pe-4 py-3 mb-6" lang={language === 'ar' ? 'en' : 'ar'} onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}>{language === 'ar' ? 'English' : 'العربية'}</button>
      <p>{copy.institution}</p><h1 className="text-3xl font-semibold my-4"><span lang="ar">سدو</span> · <span lang="en">SADU</span></h1>
      <p>{copy.introduction}</p>
      <label className="block text-start mt-6">{copy.password}<input className="block w-full border p-3 mt-2 rounded" dir="ltr" type="password" autoComplete="current-password" required maxLength={256} value={password} onChange={e => setPassword(e.target.value)} disabled={busy}/></label>
      <button className="w-full mt-3 p-3 rounded bg-[#111817] text-[#F7F1E6] disabled:opacity-50" disabled={busy}>{busy ? copy.checking : copy.submit}</button>
      <p role="alert" className="mt-3">{error && copy[error]}</p><small>{copy.disclaimer}</small>
    </form>
  </main>;
}
