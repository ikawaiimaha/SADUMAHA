/** Coordinates are centimetres, measured from the wall's top-left. No rotation. */
/** @typedef {{id:string,title:string,width_cm:number,height_cm:number}} Artwork */
/** @typedef {{max_width_cm:number,max_height_cm:number}} Wall */
/** @typedef {{artwork_id:string,x_cm:number,y_cm:number}} Placement */
export const isDimension = value => typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 100000;
const epsilon = 1e-8;
/** @param {Wall} wall @param {Artwork[]} artworks @param {Placement[]} placements */
export function validateLayout(wall, artworks, placements) {
  /** @type {{kind:string, artworkIds:string[], message:string}[]} */
  const issues = [];
  if (!wall || !isDimension(wall.max_width_cm) || !isDimension(wall.max_height_cm)) return [{ kind: 'invalid', artworkIds: [], message: 'Wall width and height must be positive centimetre measurements.' }];
  if (!Array.isArray(artworks) || !Array.isArray(placements)) return [{ kind: 'invalid', artworkIds: [], message: 'Artwork and placement lists are required.' }];
  const ids = new Set();
  for (const artwork of artworks) {
    if (!artwork || typeof artwork.id !== 'string' || !artwork.id || ids.has(artwork.id) || !isDimension(artwork.width_cm) || !isDimension(artwork.height_cm)) {
      issues.push({ kind: 'invalid', artworkIds: [], message: 'Each artwork needs a unique ID and positive width and height.' });
    } else ids.add(artwork.id);
  }
  const placed = new Map();
  for (const placement of placements) {
    if (!placement || !ids.has(placement.artwork_id) || placed.has(placement.artwork_id) || !Number.isFinite(placement.x_cm) || !Number.isFinite(placement.y_cm)) {
      issues.push({ kind: 'invalid', artworkIds: [], message: 'Each placement must reference one known artwork and finite numeric coordinates.' });
    } else placed.set(placement.artwork_id, placement);
  }
  if (issues.length) return issues;
  for (const artwork of artworks) {
    const p = placed.get(artwork.id);
    if (!p) { issues.push({ kind: 'unplaced', artworkIds: [artwork.id], message: `${artwork.title}: not yet placed.` }); continue; }
    if (p.x_cm < -epsilon || p.y_cm < -epsilon || p.x_cm + artwork.width_cm > wall.max_width_cm + epsilon || p.y_cm + artwork.height_cm > wall.max_height_cm + epsilon) {
      issues.push({ kind: 'boundary', artworkIds: [artwork.id], message: `${artwork.title}: extends beyond the wall boundary.` });
    }
  }
  for (let i = 0; i < artworks.length; i++) for (let j = i + 1; j < artworks.length; j++) {
    const a = artworks[i], b = artworks[j], p = placed.get(a.id), q = placed.get(b.id);
    if (p && q && p.x_cm < q.x_cm + b.width_cm - epsilon && p.x_cm + a.width_cm > q.x_cm + epsilon && p.y_cm < q.y_cm + b.height_cm - epsilon && p.y_cm + a.height_cm > q.y_cm + epsilon) {
      issues.push({ kind: 'overlap', artworkIds: [a.id, b.id], message: `${a.title} overlaps ${b.title}.` });
    }
  }
  return issues;
}
