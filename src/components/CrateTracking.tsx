import { useEffect, useRef, useState } from 'react';
type Shipment = { id: string; title: string; physical_status: string; approved_revision: number; logistics: { origin: string; destination: string; carrier: string; handling: string; gross_weight_kg: number } };
type View = { version: number; artwork_records: Shipment[]; events: { id: string; to?: string; note?: string; actor_id: string; at: string }[] };
const field = 'block w-full rounded border border-[#8C8173] ps-3 pe-3 py-2';
const button = 'rounded bg-[#8B261E] text-white ps-4 pe-4 py-2 disabled:opacity-40';
export default function CrateTracking({ role }: { role: 'Artist' | 'General_Exhibition_Coordinator' }) {
  const [view, setView] = useState<View | null>(null);
  const [details, setDetails] = useState({ origin: '', destination: '', carrier: '', handling: '', gross_weight_kg: '' });
  const [id, setId] = useState(''); const [note, setNote] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false); const video = useRef<HTMLVideoElement>(null); const stream = useRef<MediaStream | null>(null); const timer = useRef<ReturnType<typeof setTimeout> | null>(null); const active = useRef(true);
  const stop = () => { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; if (timer.current) clearTimeout(timer.current); setScanning(false); };
  const request = async (body?: unknown) => {
    const r = await fetch('/api/review/logistics', { credentials: 'same-origin', ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
    const data = await r.json(); if (!r.ok) throw new Error(data.error); return data as View;
  };
  const apply = (v: View) => { setView(v); const d = v.artwork_records[0]?.logistics; if (d) setDetails({ ...d, gross_weight_kg: String(d.gross_weight_kg) }); };
  useEffect(() => { active.current = true; void request().then(v => { if (active.current) apply(v); }).catch(e => { if (active.current) setMessage(e.message); }); return () => { active.current = false; stream.current?.getTracks().forEach(t => t.stop()); if (timer.current) clearTimeout(timer.current); }; }, []);
  const run = async (work: () => Promise<void>) => { if (busy) return; setBusy(true); setMessage(''); try { await work(); } catch (e) { stop(); setMessage((e as Error).message); } finally { setBusy(false); } };
  const act = (action: string, physical_status?: string) => run(async () => { stop(); apply(await request({ action, version: view?.version, artwork_id: id.trim(), note, physical_status, logistics: { ...details, gross_weight_kg: Number(details.gross_weight_kg) } })); setMessage(action === 'save' ? 'Shipment details saved. Manifest is ready.' : 'Physical observation saved. No technical or financial approvals changed.'); });
  const scan = () => run(async () => {
    type Detector = { detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]> };
    const Barcode = (window as unknown as { BarcodeDetector?: new (options: { formats: string[] }) => Detector }).BarcodeDetector;
    if (!Barcode || !navigator.mediaDevices?.getUserMedia) throw new Error('Camera QR scanning is unavailable in this browser. Use a keyboard scanner or enter the printed ID.');
    const detector = new Barcode({ formats: ['qr_code'] });
    const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    if (!active.current) { media.getTracks().forEach(t => t.stop()); return; }
    stream.current = media; setScanning(true);
    if (video.current) { video.current.srcObject = media; await video.current.play(); }
    const tick = async () => {
      if (!stream.current || !video.current) return;
      try { const values = await detector.detect(video.current); if (values[0]) { setId(values[0].rawValue); stop(); setMessage('QR read. Check the artwork ID and record arrival below.'); return; } }
      catch { stop(); setMessage('Unable to read camera frames. Use manual ID entry.'); return; }
      if (active.current && stream.current) timer.current = setTimeout(tick, 200);
    }; void tick();
  });
  const record = view?.artwork_records[0];
  return <section aria-label="Crate-to-wall logistics" className="rounded-xl border border-[#D9CEBA] bg-white ps-5 pe-5 py-5 space-y-4">
    <h2 className="text-xl font-semibold">Crate-to-wall logistics</h2>
    <p>Fictional single-artwork, single-crate journey. Receipt records location only; condition, customs permission, installation safety and payment remain separate.</p>
    <p role="status">{message}</p>
    <button className={button} disabled={busy} onClick={() => void run(async () => apply(await request()))}>Reload shipment</button>
    {record && <p><strong>{record.title}</strong><br/>Artwork Record ID: <code>{record.id}</code><br/>Physical status: {record.physical_status.replaceAll('_', ' ')}</p>}
    {role === 'Artist' && <fieldset disabled={busy || Boolean(record && record.physical_status !== 'Pending_Shipment')} className="space-y-3"><legend>Shipping details for the approved artwork</legend>
      {(['origin','destination','carrier','handling'] as const).map(k => <label className="block" key={k}>{({origin:'Collection point',destination:'Sharjah delivery point',carrier:'Carrier / tracking reference',handling:'Handling instructions'})[k]}<input className={field} maxLength={150} value={details[k]} onChange={e => setDetails({ ...details, [k]: e.target.value })}/></label>)}
      <label className="block">Gross crate weight (kg)<input className={field} type="number" min="0.01" step="any" value={details.gross_weight_kg} onChange={e => setDetails({ ...details, gross_weight_kg: e.target.value })}/></label>
      <p>Use fictional details and basic Latin text. Gross crate weight includes packing; it is not the artwork's net weight.</p>
      <button className={button} onClick={() => void act('save')}>Save shipment details</button>
    </fieldset>}
    {record && <button className={button} disabled={busy} onClick={() => void run(async () => { const r = await fetch(`/api/review/logistics/${encodeURIComponent(record.id)}/manifest.pdf`); if (!r.ok) throw new Error((await r.json()).error); const url = URL.createObjectURL(await r.blob()); const a = document.createElement('a'); a.href = url; a.download = 'SADU-shipping-manifest.pdf'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setMessage('Manifest downloaded. Print A4 at actual size and attach to the sample crate.'); })}>Download shipping manifest</button>}
    {role === 'General_Exhibition_Coordinator' && <div className="space-y-3">
      <label className="block">Scan or enter Artwork Record ID<input className={field} value={id} maxLength={80} onChange={e => setId(e.target.value)}/></label>
      <p>A keyboard barcode scanner can type into this field. Camera scanning reads the ID locally and never opens a URL.</p>
      <button className={button} disabled={busy || scanning} onClick={() => void scan()}>Scan QR with camera</button>
      {scanning && <button className={button} onClick={stop}>Stop camera</button>}
      <video ref={video} muted playsInline className={scanning ? 'w-full max-w-sm' : 'hidden'} />
      <label className="block">Observation and location<textarea className={field} maxLength={300} value={note} onChange={e => setNote(e.target.value)}/></label>
      <div className="flex flex-wrap gap-2"><button className={button} disabled={busy || !id.trim() || !note.trim()} onClick={() => void act('arrive')}>Record arrival in Sharjah</button>
      {['In_Transit','Customs_Clearance','Installed'].map(status => <button key={status} className={button} disabled={busy || !id.trim() || !note.trim()} onClick={() => void act('status', status)}>Record {status.replaceAll('_',' ')}</button>)}</div>
    </div>}
    <ul>{view?.events.filter(e => e.to).map(e => <li key={e.id}>{e.to?.replaceAll('_',' ')} · {e.note} · {e.actor_id} · {new Date(e.at).toLocaleString('en-GB')}</li>)}</ul>
  </section>;
}
