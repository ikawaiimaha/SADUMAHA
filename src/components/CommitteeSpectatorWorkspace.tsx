import { useEffect, useRef, useState } from 'react';
import '@fontsource/fraunces/400.css';
import '@fontsource/amiri/400.css';
import './CommitteeSpectatorWorkspace.css';

type Candidate = { id: string; revisionId: string; artistName: { en: string; ar: string }; nationality: string | null; medium: string | null; statement: string; allocation: string; imageUrl: string | null };
type Gallery = { proposals: { en: string; ar: string; meaning: string | null; justification: string }[]; candidates: Candidate[] };
const banner = 'وضع المشاهدة للجنة — عرض فقط / Committee Spectator Mode — Read-Only Gallery';

function Focus({ candidate, close }: { candidate: Candidate; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className="committee-focus" aria-labelledby="focus-name" onCancel={e => { e.preventDefault(); close(); }}>
    <div className="committee-banner">{banner}</div>
    <div className="committee-focus-content">
      <button autoFocus className="committee-close" onClick={close}>إغلاق / Close</button>
      <ArtworkImage candidate={candidate} />
      <h1 id="focus-name">{candidate.artistName.en}<span lang="ar" dir="rtl">{candidate.artistName.ar}</span></h1>
      <p className="committee-allocation">{candidate.allocation}</p>
      <p className="committee-statement" dir="auto">{candidate.statement || 'Conceptual statement not recorded.'}</p>
    </div>
  </dialog>;
}

function ArtworkImage({ candidate }: { candidate: Candidate }) {
  const [failed, setFailed] = useState(false);
  return candidate.imageUrl && !failed
    ? <img src={candidate.imageUrl} alt={`Artwork submitted by ${candidate.artistName.en}`} onError={() => setFailed(true)} />
    : <div className="committee-image-empty">{failed ? 'Artwork image unavailable.' : 'Artwork image not recorded.'}</div>;
}

export default function CommitteeSpectatorWorkspace() {
  const [view, setView] = useState<Gallery>();
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'theme' | 'gallery'>('theme');
  const [selected, setSelected] = useState<Candidate | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/review/committee-spectator', { signal: controller.signal, cache: 'no-store' })
      .then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Committee gallery unavailable.'); setView(body); })
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, []);
  return <main className="committee-spectator">
    <div className="committee-banner">{banner}</div>
    <div className="committee-content">
      <header><p className="committee-eyebrow">SADU · Preparatory Committee</p><h1>A shared view of the exhibition</h1></header>
      <nav aria-label="Committee views" className="committee-tabs">
        <button aria-pressed={tab === 'theme'} onClick={() => setTab('theme')}>Thematic Framework <span lang="ar">الإطار التقييمي</span></button>
        <button aria-pressed={tab === 'gallery'} onClick={() => setTab('gallery')}>Curatorial Gallery <span lang="ar">معرض المرشحين</span></button>
      </nav>
      {error ? <p role="alert">{error}</p> : !view ? <p role="status">Loading shared Committee records…</p> : tab === 'theme' ?
        <section aria-label="Theme proposals" className="committee-themes">
          {view.proposals.length === 0 && <p>No theme proposals have been recorded yet.</p>}
          {view.proposals.map((p, i) => <article key={i}><p className="committee-eyebrow">Proposal {i + 1}</p><h2 lang="ar" dir="rtl">{p.ar}</h2><h2>{p.en}</h2><h3>Definition / Meaning</h3><p dir="auto">{p.meaning || 'Definition not recorded separately.'}</p><h3>Curatorial justification</h3><p dir="auto">{p.justification || 'Justification not recorded.'}</p></article>)}
        </section> : <section aria-label="Candidates pending Committee review">
          <p className="committee-intro">Candidates awaiting Committee review · {view.candidates.length}</p>
          {!view.candidates.length && <p>No candidates are currently awaiting Committee review.</p>}
          <div className="committee-grid">{view.candidates.map(candidate => <button key={candidate.id} className="committee-card" onClick={() => setSelected(candidate)} aria-label={`View dossier: ${candidate.artistName.en}`}>
            <ArtworkImage candidate={candidate} /><div><h2>{candidate.artistName.en}<span lang="ar" dir="rtl">{candidate.artistName.ar}</span></h2><p>{candidate.nationality || 'Nationality not recorded'}</p><p>{candidate.medium || 'Medium not recorded'}</p></div>
          </button>)}</div>
        </section>}
    </div>
    {selected && <Focus candidate={selected} close={() => setSelected(null)} />}
  </main>;
}
