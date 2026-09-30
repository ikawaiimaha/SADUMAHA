-- Reference extension to spatial-ledger-schema.sql; local runtime uses its transactional repository.
CREATE TABLE curatorial_slot (
 id TEXT PRIMARY KEY, block_id TEXT NOT NULL, gallery_id TEXT NOT NULL,
 brief TEXT NOT NULL, area_ceiling_m2 REAL NOT NULL CHECK(area_ceiling_m2>0),
 budget_ceiling_minor INTEGER NOT NULL CHECK(budget_ceiling_minor>0), assigned_actor_id TEXT NOT NULL REFERENCES actor(id),
 FOREIGN KEY(block_id,gallery_id) REFERENCES spatial_block_gallery(block_id,gallery_id)
);
CREATE TABLE curatorial_proposal (id TEXT PRIMARY KEY, slot_id TEXT NOT NULL REFERENCES curatorial_slot(id), author_id TEXT NOT NULL REFERENCES actor(id), state TEXT NOT NULL CHECK(state IN ('SUBMITTED','RETURNED','SHORTLISTED','COMMITTEE_APPROVED','ENDORSED')));
CREATE TABLE curatorial_proposal_revision (
 proposal_id TEXT NOT NULL REFERENCES curatorial_proposal(id), revision INTEGER NOT NULL CHECK(revision>0), artwork_id TEXT NOT NULL REFERENCES artwork(id),
 thematic_rationale TEXT NOT NULL, research_reference TEXT NOT NULL, footprint_m2 REAL NOT NULL CHECK(footprint_m2>0), estimated_cost_minor INTEGER NOT NULL CHECK(estimated_cost_minor>=0),
 review_response TEXT NOT NULL, created_by TEXT NOT NULL REFERENCES actor(id), created_at TEXT NOT NULL, PRIMARY KEY(proposal_id,revision)
);
CREATE TABLE curatorial_feedback (id TEXT PRIMARY KEY, proposal_id TEXT NOT NULL, revision INTEGER NOT NULL, reviewer_id TEXT NOT NULL REFERENCES actor(id), reason_code TEXT NOT NULL, specific_note TEXT NOT NULL CHECK(length(trim(specific_note))>=10), recorded_at TEXT NOT NULL, FOREIGN KEY(proposal_id,revision) REFERENCES curatorial_proposal_revision(proposal_id,revision));
CREATE TABLE defense_board_snapshot (id TEXT PRIMARY KEY, block_id TEXT NOT NULL REFERENCES spatial_block(id), payload_json TEXT NOT NULL CHECK(json_valid(payload_json)), locked_by TEXT NOT NULL REFERENCES actor(id), locked_at TEXT NOT NULL);
CREATE TABLE defense_board_decision (id TEXT PRIMARY KEY, snapshot_id TEXT NOT NULL REFERENCES defense_board_snapshot(id), actor_id TEXT NOT NULL REFERENCES actor(id), decision TEXT NOT NULL CHECK(decision IN ('ENDORSED','SUPERSEDED')), recorded_at TEXT NOT NULL);
CREATE TRIGGER curatorial_revision_no_update BEFORE UPDATE ON curatorial_proposal_revision BEGIN SELECT RAISE(ABORT,'Proposal revisions are append-only'); END;
CREATE TRIGGER curatorial_revision_no_delete BEFORE DELETE ON curatorial_proposal_revision BEGIN SELECT RAISE(ABORT,'Proposal revisions are append-only'); END;
CREATE TRIGGER defense_snapshot_no_update BEFORE UPDATE ON defense_board_snapshot BEGIN SELECT RAISE(ABORT,'Defense snapshots are immutable'); END;
CREATE TRIGGER defense_snapshot_no_delete BEFORE DELETE ON defense_board_snapshot BEGIN SELECT RAISE(ABORT,'Defense snapshots are immutable'); END;
