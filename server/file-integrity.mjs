import { createHash } from 'node:crypto';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

/** Hash the exact bytes successfully written to private storage, never the multipart envelope.
 * Caller supplies an authenticated, scoped actor and an isolated staging destination.
 * Commit the document row only after success; retain failed staging files for explicit cleanup.
 */
export async function hashUploadStream(source, destination, { maxBytes = 50 * 1024 * 1024, signal } = {}) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error('Invalid upload size limit.');
  const hash = createHash('sha256'); let byteLength = 0;
  const meter = new Transform({ transform(chunk, encoding, callback) {
    byteLength += chunk.length;
    if (byteLength > maxBytes) return callback(new Error('Upload exceeds configured size limit.'));
    hash.update(chunk); callback(null, chunk);
  } });
  await pipeline(source, meter, destination, { signal });
  if (byteLength === 0) throw new Error('Empty uploads are not accepted.');
  return { file_hash: hash.digest('hex'), hash_algorithm: 'SHA-256', byte_length: byteLength };
}

/** Adapter middleware for a parsed single-file stream. No raw body or file bytes are logged. */
export function integrityUploadMiddleware({ authorize, openStaging, saveDocument, maxBytes }) {
  return async (req, res, next) => {
    try {
      const scope = await authorize(req);
      if (!scope?.actorId || !scope?.entityId) throw new Error('Authenticated document scope required.');
      if (!req.fileStream) throw new Error('A parsed file stream is required.');
      const staged = await openStaging(scope);
      const integrity = await hashUploadStream(req.fileStream, staged.stream, { maxBytes });
      // saveDocument must transactionally attach the staging object to this exact entity revision.
      res.locals.document = await saveDocument({ ...scope, objectId: staged.objectId, ...integrity });
      next();
    } catch (error) { next(error); }
  };
}

export function documentHashCaption(document) {
  if (document.hash_algorithm !== 'SHA-256' || !/^[a-f0-9]{64}$/.test(document.file_hash)) throw new Error('Verified document hash required.');
  return `Source document SHA-256: ${document.file_hash}`;
}
