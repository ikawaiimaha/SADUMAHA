-- Reference SQLite schema for the local prototype, not an applied hosted migration.
CREATE TABLE invitation_template_revision (
 id TEXT PRIMARY KEY, edition_id TEXT NOT NULL, revision INTEGER NOT NULL,
 text_en TEXT NOT NULL, text_ar TEXT NOT NULL, sha256 TEXT,
 editorial_actor_id TEXT, policy_actor_id TEXT, director_actor_id TEXT,
 UNIQUE(edition_id,revision), CHECK(sha256 IS NULL OR length(sha256)=64)
);
CREATE TABLE artist_invitation (
 id TEXT PRIMARY KEY, artist_id TEXT NOT NULL, artist_actor_id TEXT NOT NULL,
 coordinator_id TEXT NOT NULL, roster_snapshot_id TEXT NOT NULL,
 template_revision_id TEXT NOT NULL REFERENCES invitation_template_revision(id),
 snapshot_en TEXT NOT NULL,snapshot_ar TEXT NOT NULL,welcome_note TEXT NOT NULL,
 token_hash TEXT,expires_at TEXT,consumed_at TEXT,state TEXT NOT NULL,
 UNIQUE(artist_id,roster_snapshot_id)
);
CREATE TABLE artist_submission_revision (
 work_id TEXT NOT NULL,revision INTEGER NOT NULL,invitation_id TEXT NOT NULL REFERENCES artist_invitation(id),
 route TEXT NOT NULL CHECK(route IN ('COMMISSION','EXISTING')),
 metadata_json TEXT NOT NULL CHECK(json_valid(metadata_json)),state TEXT NOT NULL,
 PRIMARY KEY(work_id,revision)
);
CREATE TABLE care_evidence (
 id TEXT PRIMARY KEY,work_id TEXT NOT NULL,revision INTEGER NOT NULL,kind TEXT NOT NULL,
 object_ref TEXT NOT NULL,sha256 TEXT NOT NULL CHECK(length(sha256)=64),
 FOREIGN KEY(work_id,revision) REFERENCES artist_submission_revision(work_id,revision)
);
CREATE TABLE production_milestone (
 id TEXT PRIMARY KEY,work_id TEXT NOT NULL,label TEXT NOT NULL,amount_minor INTEGER NOT NULL CHECK(amount_minor>0),
 evidence_id TEXT REFERENCES care_evidence(id),verified_by TEXT,verified_at TEXT,
 finance_actor_id TEXT,simulated_payment_at TEXT
);
CREATE TABLE repair_protocol_revision (
 id TEXT PRIMARY KEY,work_id TEXT NOT NULL,revision INTEGER NOT NULL,protocol TEXT NOT NULL,
 artist_approved_at TEXT,artist_actor_id TEXT,completed_at TEXT,UNIQUE(work_id,revision)
);
CREATE TABLE maintenance_completion (id TEXT PRIMARY KEY,work_id TEXT NOT NULL,due_at TEXT NOT NULL,completed_at TEXT NOT NULL,actor_id TEXT NOT NULL,note TEXT NOT NULL);
CREATE TABLE legacy_asset (id TEXT PRIMARY KEY,work_id TEXT NOT NULL,evidence_id TEXT NOT NULL REFERENCES care_evidence(id),cleared_by TEXT,cleared_at TEXT);
-- Read policies must bind authenticated actors to invitation/edition scope; never trust a posted role.
-- Invitation redemption, milestone payment and roster reservation require atomic transactions.
-- Restricted benchmark identities must not enter research projections, payload logs or exports.
