import { useEffect, useId, useRef, useState } from 'react';
import { isDimension, validateLayout } from '../spatial/geometry.mjs';

type Artwork = { id: string; title: string; width_cm: number; height_cm: number; revision: number };
type Placement = { artwork_id: string; x_cm: number; y_cm: number };
type Wall = { id: string; artist_id: string; max_width_cm: number; max_height_cm: number };
type SpatialRecord = { version: number; wall_space: Wall; artwork_records: Artwork[]; placements: Placement[] };
const input = 'mt-1 block w-full rounded border border-[#8C8173] bg-white ps-3 pe-3 py-2';
const button = 'rounded bg-[#8B261E] text-white ps-3 pe-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2';
const emptyArtwork = { id: '', title: '', width: '', height: '' };
async function request(body?: unknown): Promise<SpatialRecord> {
  const response = await fetch('/api/review/spatial', { credentials: 'same-origin', ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
  const record = await response.json();
  if (!response.ok) throw new Error(record.error ?? 'Unable to save the wall plan.');
  return record;
}

export default function SpatialPlanner({ role, onDirtyChange, fixedWall = false }: { fixedWall?: boolean; role: string; onDirtyChange: (dirty: boolean) => void }) {
  const coordinator = role === 'General_Exhibition_Coordinator';
  const [data, setData] = useState<SpatialRecord | null>(null);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selected, setSelected] = useState('');
  const [wallDraft, setWallDraft] = useState({ width: '', height: '' });
  const [artworkDraft, setArtworkDraft] = useState(emptyArtwork);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef<{ id: string; pointer: number; dx: number; dy: number } | null>(null);
  const gridId = useId();
  const apply = (next: SpatialRecord) => { setData(next); setPlacements(next.placements); setWallDraft({ width: String(next.wall_space.max_width_cm), height: String(next.wall_space.max_height_cm) }); setArtworkDraft(emptyArtwork); };
  useEffect(() => {
    let active = true;
    void request().then(next => { if (active) apply(next); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  const layoutDirty = Boolean(data && JSON.stringify(placements) !== JSON.stringify(data.placements));
  const wallDirty = Boolean(data && (Number(wallDraft.width) !== data.wall_space.max_width_cm || Number(wallDraft.height) !== data.wall_space.max_height_cm));
  const artworkDirty = Boolean(artworkDraft.id || artworkDraft.title || artworkDraft.width || artworkDraft.height);
  const dirty = layoutDirty || wallDirty || artworkDirty;
  useEffect(() => { onDirtyChange(dirty || busy); }, [dirty, busy, onDirtyChange]);
  const run = async (action?: object) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { apply(await request(action ? { ...action, version: data?.version } : undefined)); setNotice(action ? 'Spatial record saved on this computer.' : 'Latest saved plan loaded.'); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  const move = (id: string, x: number, y: number) => {
    if (!coordinator || busy) return;
    const placement = { artwork_id: id, x_cm: Math.round(x * 10) / 10, y_cm: Math.round(y * 10) / 10 };
    setPlacements(previous => [...previous.filter(p => p.artwork_id !== id), placement]); setSelected(id); setNotice('Unsaved layout changes.');
  };
  const point = (clientX: number, clientY: number) => {
    const matrix = svg.current?.getScreenCTM(); if (!matrix || !svg.current) return null;
    const p = svg.current.createSVGPoint(); p.x = clientX; p.y = clientY;
    return p.matrixTransform(matrix.inverse());
  };
  const cancelDrag = (pointerId: number) => {
    dragging.current = null;
    if (svg.current?.hasPointerCapture(pointerId)) svg.current.releasePointerCapture(pointerId);
  };
  const issues = data ? validateLayout(data.wall_space, data.artwork_records, placements) : [];
  const selectedWork = data?.artwork_records.find(a => a.id === selected);
  const selectedPosition = placements.find(p => p.artwork_id === selected);
  const wall = data?.wall_space;
  const padding = wall ? Math.max(wall.max_width_cm, wall.max_height_cm) * 0.08 : 30;
  return <section className="rounded-xl border border-[#D9CEBA] bg-white ps-5 pe-5 py-5 space-y-5" aria-labelledby="spatial-heading">
    <h2 id="spatial-heading" className="text-xl font-semibold">Wall-space bounding box grid</h2>
    <p>Fictional wall study for this artist. Dimensions are centimetres; x runs right and y runs down from the wall’s top-left. Wall fit does not establish mounting or structural safety for the bronze sculpture.</p>
    {error && <p role="alert" className="text-red-800">{error}</p>}
    <p role="status">{busy ? 'Loading or saving spatial plan…' : notice}</p>
    <button className={button} disabled={busy} onClick={() => void run()}>{dirty ? 'Discard local changes and reload plan' : 'Reload saved wall plan'}</button>
    {data && wall && <>
      <p><strong>Assigned wall:</strong> {wall.max_width_cm} cm wide × {wall.max_height_cm} cm high · Artist {wall.artist_id}</p>
      {coordinator && !fixedWall && <fieldset disabled={busy || layoutDirty} className="space-y-3"><legend className="font-semibold">Wall dimensions</legend>
        <div className="grid gap-3 sm:grid-cols-2"><label>Wall width (cm)<input className={input} type="number" min="0" max="100000" step="any" value={wallDraft.width} onChange={e => setWallDraft({ ...wallDraft, width: e.target.value })}/></label><label>Wall height (cm)<input className={input} type="number" min="0" max="100000" step="any" value={wallDraft.height} onChange={e => setWallDraft({ ...wallDraft, height: e.target.value })}/></label></div>
        <button className={button} disabled={!wallDirty || !isDimension(Number(wallDraft.width)) || !isDimension(Number(wallDraft.height))} onClick={() => void run({ action: 'save_wall', max_width_cm: Number(wallDraft.width), max_height_cm: Number(wallDraft.height) })}>Save wall dimensions</button>
        <p className="text-sm">The sample wall starts at 600 × 300 cm. Saving new dimensions rechecks existing positions.</p>
      </fieldset>}
      {!coordinator && <form className="space-y-3" onSubmit={e => { e.preventDefault(); void run({ action: 'save_artwork', artwork: { ...(artworkDraft.id ? { id: artworkDraft.id } : {}), title: artworkDraft.title, width_cm: Number(artworkDraft.width), height_cm: Number(artworkDraft.height) } }); }}>
        <h3 className="font-semibold">{artworkDraft.id ? 'Update artwork dimensions' : 'Submit a wall artwork'}</h3>
        <label className="block">Wall artwork title<input required maxLength={200} className={input} disabled={busy} value={artworkDraft.title} onChange={e => setArtworkDraft({ ...artworkDraft, title: e.target.value })}/></label>
        <div className="grid gap-3 sm:grid-cols-2"><label>Artwork width (cm)<input required type="number" min="0" max="100000" step="any" className={input} disabled={busy} value={artworkDraft.width} onChange={e => setArtworkDraft({ ...artworkDraft, width: e.target.value })}/></label><label>Artwork height (cm)<input required type="number" min="0" max="100000" step="any" className={input} disabled={busy} value={artworkDraft.height} onChange={e => setArtworkDraft({ ...artworkDraft, height: e.target.value })}/></label></div>
        <button className={button} disabled={busy || !artworkDraft.title.trim() || !isDimension(Number(artworkDraft.width)) || !isDimension(Number(artworkDraft.height))}>Save artwork dimensions</button>
        <p className="text-sm">Changed dimensions require a new placement. Earlier dimensions and layouts remain in backend history.</p>
      </form>}
      <div className="flex flex-wrap gap-3" aria-label="Artwork blocks">{data.artwork_records.map((a, index) => <div key={a.id} className="rounded border border-[#D9CEBA] ps-3 pe-3 py-3">
        <button type="button" draggable={coordinator && !busy && !wallDirty} disabled={busy} className="text-start underline font-semibold" aria-pressed={selected === a.id} onDragStart={e => { e.dataTransfer.setData('text/plain', a.id); e.dataTransfer.effectAllowed = 'move'; setSelected(a.id); }} onClick={() => { setSelected(a.id); if (!coordinator) setArtworkDraft({ id: a.id, title: a.title, width: String(a.width_cm), height: String(a.height_cm) }); }}>{index + 1}. {a.title}</button>
        <p>{a.width_cm} × {a.height_cm} cm · {placements.some(p => p.artwork_id === a.id) ? 'Placed' : 'Unplaced'}</p>
        {coordinator && !placements.some(p => p.artwork_id === a.id) && <button className="underline" disabled={busy || wallDirty} onClick={() => move(a.id, 0, 0)}>Place {a.title} on wall</button>}
      </div>)}</div>
      {coordinator && <p id="spatial-help" className="text-sm">Drag an artwork card onto the wall, then drag its block to reposition. You can also place it with the button, use arrow keys (1 cm; Shift = 10 cm), or enter coordinates below. Edge-touching is allowed; no minimum installation gap is assumed. Save after arranging every artwork.</p>}
      <svg ref={svg} role="group" aria-label="Scaled wall layout canvas" aria-describedby={coordinator ? 'spatial-help' : undefined}
        viewBox={`${-padding} ${-padding} ${wall.max_width_cm + padding * 2} ${wall.max_height_cm + padding * 2}`}
        className="w-full rounded border border-[#8C8173] bg-[#F7F1E6]" style={{ aspectRatio: `${wall.max_width_cm + padding * 2} / ${wall.max_height_cm + padding * 2}`, maxHeight: 520, touchAction: coordinator ? 'none' : 'auto' }}
        onDragOver={e => { if (coordinator && !busy && !wallDirty) e.preventDefault(); }}
        onDrop={e => { e.preventDefault(); if (!coordinator || busy || wallDirty) return; const id = e.dataTransfer.getData('text/plain'); const p = point(e.clientX, e.clientY); if (p && data.artwork_records.some(a => a.id === id)) move(id, p.x, p.y); }}
        onPointerMove={e => { const drag = dragging.current; if (!drag || drag.pointer !== e.pointerId) return; const p = point(e.clientX, e.clientY); if (p) move(drag.id, p.x - drag.dx, p.y - drag.dy); }}
        onPointerUp={e => cancelDrag(e.pointerId)} onPointerCancel={e => cancelDrag(e.pointerId)} onLostPointerCapture={() => { dragging.current = null; }}>
        <defs><pattern id={gridId} width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="#D9CEBA" strokeWidth="0.5"/></pattern></defs>
        <rect x="0" y="0" width={wall.max_width_cm} height={wall.max_height_cm} fill={`url(#${gridId})`} stroke="#2C2A29" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
        <text x="0" y={-padding / 3} fontSize={Math.max(wall.max_width_cm / 55, 1)}>0,0 · {wall.max_width_cm} cm × {wall.max_height_cm} cm · Grid 10 cm</text>
        {[...data.artwork_records].sort((a, b) => Number(a.id === selected) - Number(b.id === selected)).map(a => {
          const p = placements.find(item => item.artwork_id === a.id); if (!p) return null;
          const invalid = issues.some(issue => issue.artworkIds.includes(a.id)); const index = data.artwork_records.findIndex(item => item.id === a.id) + 1;
          return <g key={a.id} role={coordinator ? 'button' : 'img'} tabIndex={coordinator && !busy && !wallDirty ? 0 : undefined} aria-label={`${a.title}, ${a.width_cm} by ${a.height_cm} cm, x ${p.x_cm}, y ${p.y_cm}${invalid ? ', warning' : ''}`} aria-disabled={busy || wallDirty} style={{ cursor: coordinator ? 'grab' : 'default' }}
            onFocus={() => setSelected(a.id)} onPointerDown={e => { if (!coordinator || busy || wallDirty || e.button !== 0) return; const q = point(e.clientX, e.clientY); if (!q) return; e.preventDefault(); e.currentTarget.focus(); dragging.current = { id: a.id, pointer: e.pointerId, dx: q.x - p.x_cm, dy: q.y - p.y_cm }; svg.current?.setPointerCapture(e.pointerId); setSelected(a.id); }}
            onKeyDown={e => { if (!coordinator || busy || wallDirty || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return; e.preventDefault(); const step = e.shiftKey ? 10 : 1; move(a.id, p.x_cm + (e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0), p.y_cm + (e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0)); }}>
            <rect x={p.x_cm} y={p.y_cm} width={a.width_cm} height={a.height_cm} fill={invalid ? '#FECACA' : '#B8D5C2'} fillOpacity="0.85" stroke={selected === a.id ? '#111817' : invalid ? '#991B1B' : '#286044'} strokeWidth={selected === a.id ? 3 : 1.5} vectorEffect="non-scaling-stroke"/>
            <text x={p.x_cm + a.width_cm / 2} y={p.y_cm + a.height_cm / 2} textAnchor="middle" dominantBaseline="middle" fontSize={Math.min(a.width_cm / 3, a.height_cm / 3, 16)} pointerEvents="none">{index}</text>
          </g>;
        })}
      </svg>
      {coordinator && selectedWork && selectedPosition && <fieldset disabled={busy || wallDirty} className="space-y-3"><legend className="font-semibold">Position: {selectedWork.title}</legend><div className="grid gap-3 sm:grid-cols-2"><label>X from wall left (cm)<input type="number" step="0.1" className={input} value={selectedPosition.x_cm} onChange={e => move(selectedWork.id, Number(e.target.value), selectedPosition.y_cm)}/></label><label>Y from wall top (cm)<input type="number" step="0.1" className={input} value={selectedPosition.y_cm} onChange={e => move(selectedWork.id, selectedPosition.x_cm, Number(e.target.value))}/></label></div></fieldset>}
      <div aria-live="polite" className={`rounded ps-4 pe-4 py-3 ${issues.length ? 'bg-amber-50 text-amber-950' : 'bg-green-50 text-green-900'}`}>
        {issues.length ? <><strong>Layout needs attention</strong><ul className="list-disc ps-5">{issues.map((issue, i) => <li key={`${issue.kind}-${i}`}>{issue.message}</li>)}</ul></> : <p>{data.artwork_records.length ? 'All blocks fit inside the wall without overlapping.' : 'No wall artworks submitted yet. Use the Artist account to add exact dimensions.'}</p>}
      </div>
      {coordinator && <button className={button} disabled={busy || wallDirty || !layoutDirty || issues.length > 0 || !data.artwork_records.length} onClick={() => void run({ action: 'save_layout', placements })}>Save validated layout</button>}
    </>}
  </section>;
}
