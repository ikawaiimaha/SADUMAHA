-- SQLite reference schema for the local unified pipeline. Not a hosted migration.
PRAGMA foreign_keys = ON;
CREATE TABLE exhibition (id TEXT PRIMARY KEY, state TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(state IN ('ACTIVE','ARCHIVED_DIGITAL_TWIN')));
CREATE TABLE actor (id TEXT PRIMARY KEY, exhibition_id TEXT NOT NULL REFERENCES exhibition(id), role TEXT NOT NULL);
CREATE TABLE artwork (id TEXT PRIMARY KEY, exhibition_id TEXT NOT NULL REFERENCES exhibition(id), artist_actor_id TEXT NOT NULL REFERENCES actor(id));
CREATE TABLE artwork_revision (
 id TEXT PRIMARY KEY, artwork_id TEXT NOT NULL REFERENCES artwork(id), sequence INTEGER NOT NULL CHECK(sequence>0),
 version_hash TEXT NOT NULL CHECK(length(version_hash)=64), concept_text TEXT NOT NULL,
 cultural_json TEXT NOT NULL CHECK(json_valid(cultural_json)),
 height_cm REAL NOT NULL CHECK(height_cm>0), width_cm REAL NOT NULL CHECK(width_cm>0),
 state TEXT NOT NULL CHECK(state IN ('EDITORIAL_DRAFT','EXECUTIVE_REVIEW','PUBLISHED')),
 UNIQUE(artwork_id,sequence), UNIQUE(artwork_id,id)
);
CREATE TABLE document_vault (
 id TEXT PRIMARY KEY, revision_id TEXT NOT NULL REFERENCES artwork_revision(id), object_id TEXT NOT NULL UNIQUE,
 file_hash TEXT NOT NULL CHECK(length(file_hash)=64 AND file_hash NOT GLOB '*[^a-f0-9]*'),
 hash_algorithm TEXT NOT NULL CHECK(hash_algorithm='SHA-256'), byte_length INTEGER NOT NULL CHECK(byte_length>0)
);
CREATE TABLE curatorial_tag (revision_id TEXT NOT NULL REFERENCES artwork_revision(id), term TEXT NOT NULL, PRIMARY KEY(revision_id,term));
CREATE TABLE translation_dictionary (
 id TEXT PRIMARY KEY, english_term TEXT NOT NULL, arabic_term TEXT NOT NULL, version INTEGER NOT NULL CHECK(version>0),
 approved_by TEXT REFERENCES actor(id), approved_at TEXT, UNIQUE(english_term,version),
 CHECK((approved_by IS NULL) = (approved_at IS NULL))
);
CREATE TABLE editorial_suggestion (
 revision_id TEXT NOT NULL REFERENCES artwork_revision(id), dictionary_id TEXT NOT NULL REFERENCES translation_dictionary(id),
 PRIMARY KEY(revision_id,dictionary_id)
);
CREATE TABLE revision_approval (revision_id TEXT NOT NULL REFERENCES artwork_revision(id), domain TEXT NOT NULL, actor_id TEXT NOT NULL REFERENCES actor(id), version_hash TEXT NOT NULL, PRIMARY KEY(revision_id,domain));
CREATE TABLE wall_space (id TEXT PRIMARY KEY, exhibition_id TEXT NOT NULL REFERENCES exhibition(id), max_height_cm REAL NOT NULL CHECK(max_height_cm>0), max_width_cm REAL NOT NULL CHECK(max_width_cm>0));
CREATE TABLE spatial_placement (revision_id TEXT PRIMARY KEY REFERENCES artwork_revision(id), wall_id TEXT NOT NULL REFERENCES wall_space(id), x_cm REAL NOT NULL CHECK(x_cm>=0), y_cm REAL NOT NULL CHECK(y_cm>=0));
CREATE TABLE technical_requirement (id TEXT PRIMARY KEY, revision_id TEXT NOT NULL REFERENCES artwork_revision(id), item TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity>0), external_dependency INTEGER NOT NULL CHECK(external_dependency IN (0,1)));
CREATE TABLE gov_sync_sla (
 id TEXT PRIMARY KEY, requirement_id TEXT NOT NULL UNIQUE REFERENCES technical_requirement(id), sla_deadline TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('QUEUED_PAUSED','AWAITING_ALLOCATION','ALLOCATED','CONTINGENCY_FUNDING_REQUIRED','SUPERSEDED')),
 dispatched_at TEXT, CHECK(state != 'AWAITING_ALLOCATION' OR dispatched_at IS NOT NULL)
);
CREATE TABLE physical_observation (id TEXT PRIMARY KEY, artwork_id TEXT NOT NULL REFERENCES artwork(id), revision_id TEXT NOT NULL REFERENCES artwork_revision(id), actor_id TEXT NOT NULL REFERENCES actor(id), physical_status TEXT NOT NULL, recorded_at TEXT NOT NULL);
CREATE TABLE digital_twin (id TEXT PRIMARY KEY, revision_id TEXT NOT NULL UNIQUE REFERENCES artwork_revision(id), endpoint_uri TEXT NOT NULL UNIQUE, json_ld TEXT NOT NULL CHECK(json_valid(json_ld)), payload_hash TEXT NOT NULL, published_by TEXT NOT NULL REFERENCES actor(id));
CREATE TABLE gallery_label (id TEXT PRIMARY KEY, twin_id TEXT NOT NULL UNIQUE REFERENCES digital_twin(id), pdf_base64 TEXT NOT NULL, file_hash TEXT NOT NULL);
CREATE TABLE decision_log (id TEXT PRIMARY KEY, actor_id TEXT NOT NULL REFERENCES actor(id), target_id TEXT NOT NULL, version_hash TEXT NOT NULL, action TEXT NOT NULL, recorded_at TEXT NOT NULL);
