import { useState } from 'react';
import { filterArtworks } from '../curation/keywords.mjs';
export type CuratedArtwork = { id: string; revision: number; title: string; concept: string; tags: string[]; extracted: boolean };
export default function SmartCuration({ artworks, busy, onExtractExisting }: { artworks: CuratedArtwork[]; busy: boolean; onExtractExisting: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const tags = [...new Set(artworks.flatMap(a => a.tags))].sort();
  const shown = filterArtworks(artworks, selected);
  return <section aria-label="Smart Filter" className="rounded-xl border border-[#D9CEBA] bg-white ps-5 pe-5 py-5 space-y-4">
    <h2 className="text-xl font-semibold">Smart Filter</h2>
    <p>Suggested themes extracted locally from submitted concept text. These are keywords, not curatorial judgments. Select multiple tags to show artworks matching all selected themes.</p>
    <p className="text-sm">This fictional journey currently contains one publication artwork. Historical revisions and unsubmitted drafts are excluded.</p>
    <fieldset className="flex flex-wrap gap-3"><legend className="font-semibold">Themes</legend>{tags.map(tag => <label key={tag} className="rounded border border-[#D9CEBA] ps-3 pe-3 py-2"><input type="checkbox" checked={selected.includes(tag)} onChange={e => setSelected(old => e.target.checked ? [...old, tag] : old.filter(t => t !== tag))}/> <span>{tag}</span></label>)}</fieldset>
    {!tags.length && <p>No theme keywords are available yet.</p>}
    <button className="underline disabled:opacity-40" disabled={!selected.length} onClick={() => setSelected([])}>Clear theme filters</button>
    <p role="status">{shown.length} of {artworks.length} submitted artworks shown</p>
    {shown.length === 0 && <p>No submitted artworks match these themes.</p>}
    <div className="grid gap-4 sm:grid-cols-2">{shown.map(artwork => <article key={`${artwork.id}-${artwork.revision}`} className="rounded-lg border border-[#D9CEBA] ps-4 pe-4 py-4 space-y-2">
      <h3 className="font-semibold">{artwork.title}</h3><p>Revision {artwork.revision}</p><p className="break-words">{artwork.concept}</p>
      <p>{artwork.extracted ? (artwork.tags.length ? `Suggested themes: ${artwork.tags.join(', ')}` : 'No strong keywords found in this concept.') : 'This submission predates automatic tagging.'}</p>
      {!artwork.extracted && <button className="rounded bg-[#8B261E] text-white ps-3 pe-3 py-2 disabled:opacity-40" disabled={busy} onClick={onExtractExisting}>Extract themes for existing submission</button>}
    </article>)}</div>
  </section>;
}
