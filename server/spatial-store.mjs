import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { isDimension, validateLayout } from '../src/spatial/geometry.mjs';
import { ReviewError } from './review-store.mjs';

export const initialSpatial = () => ({
  format: 1, version: 0, artist_id: 'demo-kufic-horizon', exhibition_id: 'demo-exhibition',
  wall_space: { id: 'demo-wall-1', artist_id: 'demo-kufic-horizon', exhibition_id: 'demo-exhibition', max_width_cm: 600, max_height_cm: 300 },
  artwork_records: [], placements: [], history: [],
});
const reject = (status, message) => { throw new ReviewError(status, message); };
function authorize(state, actor) {
  if (!actor || !['Artist', 'General_Exhibition_Coordinator'].includes(actor.role) || actor.exhibitionId !== state.exhibition_id || (actor.role === 'Artist' && actor.artistId !== state.artist_id)) reject(403, 'Spatial planning is restricted to the assigned artist and General Exhibition Coordinator.');
}
export function projectSpatial(state, actor) {
  authorize(state, actor);
  return structuredClone({ ...state, issues: validateLayout(state.wall_space, state.artwork_records, state.placements) });
}
export function transitionSpatial(state, actor, command, at = new Date().toISOString()) {
  authorize(state, actor);
  if (!command || command.version !== state.version) reject(409, 'The spatial record changed. Reload the latest plan before saving.');
  const next = structuredClone(state);
  const role = expected => { if (actor.role !== expected) reject(403, 'Your role cannot make this spatial change.'); };
  switch (command.action) {
    case 'save_artwork': {
      role('Artist');
      const a = command.artwork;
      if (!a || typeof a.title !== 'string' || !a.title.trim() || a.title.length > 200 || !isDimension(a.height_cm) || !isDimension(a.width_cm)) reject(422, 'Artwork title, exact positive height_cm and width_cm are required (maximum 100,000 cm).');
      const old = a.id ? next.artwork_records.find(r => r.id === a.id) : undefined;
      if (a.id && !old) reject(404, 'Artwork is not assigned to this artist.');
      if (!old && next.artwork_records.length >= 50) reject(422, 'This local wall plan supports up to 50 artworks.');
      const record = { id: old?.id ?? randomUUID(), artist_id: state.artist_id, exhibition_id: state.exhibition_id, title: a.title.trim(), height_cm: a.height_cm, width_cm: a.width_cm, revision: (old?.revision ?? 0) + 1 };
      if (old) next.artwork_records[next.artwork_records.findIndex(r => r.id === old.id)] = record;
      else next.artwork_records.push(record);
      // New dimensions cannot silently inherit a previously validated placement.
      next.placements = next.placements.filter(p => p.artwork_id !== record.id);
      break;
    }
    case 'save_wall':
      role('General_Exhibition_Coordinator');
      if (!isDimension(command.max_height_cm) || !isDimension(command.max_width_cm)) reject(422, 'Exact positive wall height and width are required (maximum 100,000 cm).');
      next.wall_space = { ...state.wall_space, max_height_cm: command.max_height_cm, max_width_cm: command.max_width_cm };
      // Keep positions and report any new boundary issue; do not silently move artwork.
      break;
    case 'save_layout': {
      role('General_Exhibition_Coordinator');
      if (!Array.isArray(command.placements) || command.placements.length > 50) reject(422, 'A bounded placement list is required.');
      const issues = validateLayout(state.wall_space, state.artwork_records, command.placements);
      if (issues.length) reject(422, issues.map(i => i.message).join(' '));
      next.placements = command.placements.map(p => ({ artwork_id: p.artwork_id, x_cm: p.x_cm, y_cm: p.y_cm }));
      break;
    }
    default: reject(400, 'Unknown spatial action.');
  }
  next.history.push({ id: randomUUID(), actor_id: actor.id, role: actor.role, at, action: command.action, previous_version: state.version,
    previous: { wall_space: state.wall_space, artwork_records: state.artwork_records, placements: state.placements } });
  next.version++;
  return next;
}
export async function openSpatialStore(file) {
  await mkdir(dirname(file), { recursive: true });
  let state;
  try { state = JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; state = initialSpatial(); await writeFile(file, JSON.stringify(state, null, 2), { flag: 'wx', mode: 0o600 }); }
  if (state.format !== 1 || !Number.isInteger(state.version) || !Array.isArray(state.history) || validateLayout(state.wall_space, state.artwork_records, state.placements).some(i => i.kind === 'invalid')) throw new Error('Invalid spatial data. Preserve and inspect the local file.');
  let queue = Promise.resolve();
  return {
    read: actor => projectSpatial(state, actor),
    act(actor, command) {
      const result = queue.then(async () => {
        const next = transitionSpatial(state, actor, command);
        const temporary = `${file}.${randomUUID()}.tmp`;
        await writeFile(temporary, JSON.stringify(next, null, 2), { mode: 0o600 });
        await rename(temporary, file); state = next; return projectSpatial(state, actor);
      });
      queue = result.catch(() => {}); return result;
    },
  };
}
