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

-- Version-bound artist intent; approved theme snapshot is copied by the service, never trusted from request data.
CREATE TABLE thematic_defense (
 work_id TEXT NOT NULL, revision INTEGER NOT NULL,
 conceptual_text TEXT NOT NULL, material_text TEXT NOT NULL,
 theme_revision INTEGER NOT NULL, theme_snapshot_json TEXT NOT NULL CHECK(json_valid(theme_snapshot_json)),
 acknowledged_at TEXT NOT NULL,
 PRIMARY KEY(work_id,revision),
 FOREIGN KEY(work_id,revision) REFERENCES artist_submission_revision(work_id,revision)
);

-- Artist-defined context, never an institutional quality score.
CREATE TABLE artist_craft_context (
 work_id TEXT NOT NULL, revision INTEGER NOT NULL,
 lineage INTEGER NOT NULL CHECK(lineage BETWEEN 0 AND 100), lineage_rationale TEXT NOT NULL,
 anchors_json TEXT NOT NULL CHECK(json_valid(anchors_json)),
 substrate TEXT NOT NULL, pigment TEXT NOT NULL, method TEXT NOT NULL,
 comparison_json TEXT CHECK(comparison_json IS NULL OR json_valid(comparison_json)),
 PRIMARY KEY(work_id,revision), FOREIGN KEY(work_id,revision) REFERENCES artist_submission_revision(work_id,revision)
);
CREATE TABLE curatorial_consultation (
 id TEXT PRIMARY KEY, work_id TEXT NOT NULL, revision INTEGER NOT NULL,
 assigned_coordinator_id TEXT NOT NULL, artist_actor_id TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('OPEN','RELEASED')),
 FOREIGN KEY(work_id,revision) REFERENCES artist_submission_revision(work_id,revision)
);
CREATE TABLE consultation_message (
 id TEXT PRIMARY KEY, consultation_id TEXT NOT NULL REFERENCES curatorial_consultation(id),
 actor_id TEXT NOT NULL, created_at TEXT NOT NULL, body TEXT NOT NULL
);
-- GC_CONSULTATION drafts and all messages are projected only to the owner and assigned desk.
-- Committee responses exclude consultation history even after formal submission.

CREATE TABLE freight_draft (
 work_id TEXT NOT NULL, revision INTEGER NOT NULL, draft_json TEXT NOT NULL CHECK(json_valid(draft_json)),
 PRIMARY KEY(work_id,revision), FOREIGN KEY(work_id,revision) REFERENCES artist_submission_revision(work_id,revision)
);
CREATE TABLE condition_checkpoint (
 id TEXT PRIMARY KEY, work_id TEXT NOT NULL, revision INTEGER NOT NULL,
 freight_revision INTEGER NOT NULL DEFAULT 0,
 stage TEXT NOT NULL CHECK(stage IN ('PRE_DISPATCH','ARRIVAL','DEINSTALLATION')),
 actor_id TEXT NOT NULL, recorded_at TEXT NOT NULL, note TEXT NOT NULL,
 evidence_json TEXT NOT NULL CHECK(json_valid(evidence_json)), previous_hash TEXT, sha256 TEXT NOT NULL,
 UNIQUE(work_id,revision,freight_revision,stage), FOREIGN KEY(work_id,revision) REFERENCES artist_submission_revision(work_id,revision)
);
-- Condition checkpoints are append-only. Customs exports are drafts for broker review, not clearance.
