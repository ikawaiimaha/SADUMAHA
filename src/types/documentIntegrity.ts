/** Revision-bound vault metadata. Never infer uploader identity from the hash. */
export interface DocumentIntegrity {
  id: string;
  entityId: string;
  revisionHash: string;
  actorId: string;
  objectId: string;
  file_hash: string;
  hash_algorithm: 'SHA-256';
  byte_length: number;
}
