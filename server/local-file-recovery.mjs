import { rename } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

// A Windows scanner may briefly hold the destination. Never delete the old file
// or publish in-memory success until the atomic replacement actually succeeds.
export async function replaceLocalFile(from, to, replace = rename, wait = delay) {
  for (let attempt = 0; ; attempt++) {
    try { await replace(from, to); return; }
    catch (error) {
      if (!['EPERM', 'EBUSY', 'EACCES'].includes(error.code) || attempt >= 3) throw error;
      await wait(25 * 2 ** attempt);
    }
  }
}
