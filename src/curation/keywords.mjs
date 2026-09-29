// Deterministic local suggestions; no external model or inferred curatorial approval.
export const EXTRACTOR_VERSION = 1;
const stop = new Set(`a an the and or but if then than that this these those of to in on at for from by with as is are was were be been being it its i me my we our you your they their he she his her them us not no nor so very can could would should will may might also about into over under through between within without upon such each any all more most other some do does did have has had exploring explores explore work works artwork artworks artist artists art artistic using uses use create creates made making presents present text concept form forms هم هي هو هذا هذه ذلك تلك في من على الى إلى عن مع و أو لا ما ان إن أن كان كانت يكون بين عند كل كما التي الذي عمل أعمال العمل`.split(/\s+/));
const aliases = new Map(Object.entries({ architectural: 'architecture', architectures: 'architecture', memories: 'memory', identities: 'identity', ecological: 'ecology', environmental: 'environment', communities: 'community', traditions: 'tradition', landscapes: 'landscape', migration: 'migration', migrated: 'migration', geometrical: 'geometry', geometric: 'geometry', calligraphic: 'calligraphy', sculptures: 'sculpture', sculptural: 'sculpture', textures: 'texture', spatial: 'space', spaces: 'space' }));
const artTerms = new Set('architecture memory identity ecology environment community tradition landscape migration geometry calligraphy sculpture texture space bronze heritage belonging displacement urban nature light shadow language rhythm abstraction material body time place ritual archive'.split(' '));
export function extractKeywords(text) {
  if (typeof text !== 'string' || text.length > 10000) throw new TypeError('Concept must be text of at most 10,000 characters.');
  const counts = new Map();
  const words = text.normalize('NFKC').toLowerCase().match(/\p{L}[\p{L}\p{M}]*/gu) ?? [];
  for (const word of words) {
    if (word.length < 3 || word.length > 40 || stop.has(word)) continue;
    const tag = aliases.get(word) ?? word;
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts].filter(([tag, count]) => artTerms.has(tag) || count >= 2)
    .sort(([a, ac], [b, bc]) => (bc + (artTerms.has(b) ? 2 : 0)) - (ac + (artTerms.has(a) ? 2 : 0)) || (a < b ? -1 : a > b ? 1 : 0))
    .slice(0, 8).map(([tag]) => tag);
}
export function filterArtworks(artworks, selectedTags) {
  return artworks.filter(artwork => selectedTags.every(tag => artwork.tags.includes(tag)));
}
