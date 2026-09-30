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
-- SQLite JSON equivalent of the requested JSONB conservation field.
ALTER TABLE artwork_revision ADD COLUMN conservation_reqs TEXT CHECK(conservation_reqs IS NULL OR json_valid(conservation_reqs));
ALTER TABLE wall_space ADD COLUMN climate_capability TEXT CHECK(climate_capability IS NULL OR json_valid(climate_capability));
CREATE TABLE condition_pin (
 id TEXT PRIMARY KEY, revision_id TEXT NOT NULL REFERENCES artwork_revision(id), reference_image_hash TEXT NOT NULL,
 x_pct REAL NOT NULL CHECK(x_pct BETWEEN 0 AND 100), y_pct REAL NOT NULL CHECK(y_pct BETWEEN 0 AND 100),
 description TEXT NOT NULL, photo_document_id TEXT NOT NULL REFERENCES document_vault(id), recorded_by TEXT NOT NULL REFERENCES actor(id), recorded_at TEXT NOT NULL
);
CREATE TABLE exhibition_budget (exhibition_id TEXT PRIMARY KEY REFERENCES exhibition(id), ceiling_minor INTEGER NOT NULL CHECK(ceiling_minor>=0), currency TEXT NOT NULL CHECK(currency='AED'));
CREATE TABLE budget_line (id TEXT PRIMARY KEY, exhibition_id TEXT NOT NULL REFERENCES exhibition_budget(exhibition_id), artwork_id TEXT NOT NULL REFERENCES artwork(id), amount_minor INTEGER NOT NULL CHECK(amount_minor>=0), paid_minor INTEGER NOT NULL DEFAULT 0 CHECK(paid_minor>=0), released_minor INTEGER NOT NULL DEFAULT 0 CHECK(released_minor>=0), CHECK(paid_minor+released_minor<=amount_minor));
-- Stage 8 operational dossier archive; distinct from the public cultural archive.
ALTER TABLE artwork ADD COLUMN lifecycle_status TEXT NOT NULL DEFAULT 'INVITED';
CREATE TABLE archival_record (
 id TEXT PRIMARY KEY, artwork_id TEXT NOT NULL UNIQUE REFERENCES artwork(id),
 revision_id TEXT NOT NULL REFERENCES artwork_revision(id), closed_by TEXT NOT NULL REFERENCES actor(id), closed_at TEXT NOT NULL,
 snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json)), snapshot_hash TEXT NOT NULL CHECK(length(snapshot_hash)=64),
 pdf_base64 TEXT NOT NULL, pdf_hash TEXT NOT NULL CHECK(length(pdf_hash)=64)
);
CREATE TRIGGER archival_record_no_update BEFORE UPDATE ON archival_record BEGIN SELECT RAISE(ABORT,'Archival records are immutable'); END;
CREATE TRIGGER archival_record_no_delete BEFORE DELETE ON archival_record BEGIN SELECT RAISE(ABORT,'Archival records are immutable'); END;
CREATE TRIGGER archive_requires_compiled_record BEFORE UPDATE OF lifecycle_status ON artwork
 WHEN NEW.lifecycle_status='ARCHIVED_CLOSED' AND NOT EXISTS(SELECT 1 FROM archival_record WHERE artwork_id=NEW.id)
 BEGIN SELECT RAISE(ABORT,'Generate archival record in the closing transaction first'); END;
ALTER TABLE artwork ADD COLUMN accession_number TEXT;
ALTER TABLE artwork ADD COLUMN ownership_state TEXT NOT NULL DEFAULT 'TEMPORARY_LOAN' CHECK(ownership_state IN ('TEMPORARY_LOAN','SDC_OWNED','SOVEREIGN_COLLECTION'));
CREATE UNIQUE INDEX artwork_accession_unique ON artwork(accession_number) WHERE accession_number IS NOT NULL;
CREATE TABLE accession_counter (year INTEGER NOT NULL, edition INTEGER NOT NULL, last_sequence INTEGER NOT NULL CHECK(last_sequence>=0), PRIMARY KEY(year,edition));
CREATE TABLE acquisition (
 id TEXT PRIMARY KEY, artwork_id TEXT NOT NULL UNIQUE REFERENCES artwork(id), revision_id TEXT NOT NULL REFERENCES artwork_revision(id),
 buyer TEXT NOT NULL CHECK(buyer IN ('SDC_OWNED','SOVEREIGN_COLLECTION')), purchase_minor INTEGER NOT NULL CHECK(purchase_minor>0),
 price_agreement_ref TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('AWAITING_ARTIST_SIGNATURE','SIMULATED_ARTIST_ACCEPTED','ACQUIRED_SIMULATED','TRANSFER_ROUTED')),
 title_pdf_base64 TEXT NOT NULL, title_hash TEXT NOT NULL, signature_receipt_json TEXT CHECK(signature_receipt_json IS NULL OR json_valid(signature_receipt_json)),
 destination TEXT, permanent_manifest_base64 TEXT, permanent_manifest_hash TEXT,
 return_manifest_state TEXT NOT NULL DEFAULT 'VOID' CHECK(return_manifest_state='VOID')
);
-- Production adapters must allocate the counter and accession under one database transaction
-- and enforce dossier-level sovereign access on every query, export and storage read.
