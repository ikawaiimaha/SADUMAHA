-- Reference relational extension. Local runtime uses the transactional JSON adapter.
-- Gallery footprint is usable floor area in m²; wall-fit and structural checks remain separate.
CREATE TABLE venue (id TEXT PRIMARY KEY, name TEXT NOT NULL, active INTEGER NOT NULL CHECK(active IN (0,1)));
CREATE TABLE gallery_space (id TEXT PRIMARY KEY, venue_id TEXT NOT NULL REFERENCES venue(id), name TEXT NOT NULL, active INTEGER NOT NULL CHECK(active IN (0,1)));
CREATE TABLE spatial_block (id TEXT PRIMARY KEY, exhibition_id TEXT NOT NULL REFERENCES exhibition(id), state TEXT NOT NULL CHECK(state IN ('DRAFT','ACTIVE')), theme_approval_id TEXT, budget_minor INTEGER NOT NULL CHECK(budget_minor>=0), version INTEGER NOT NULL DEFAULT 0, CHECK(state!='ACTIVE' OR theme_approval_id IS NOT NULL));
CREATE UNIQUE INDEX active_spatial_block ON spatial_block(exhibition_id) WHERE state='ACTIVE';
CREATE TABLE spatial_block_gallery (block_id TEXT NOT NULL REFERENCES spatial_block(id), gallery_id TEXT NOT NULL REFERENCES gallery_space(id), max_artworks INTEGER NOT NULL CHECK(max_artworks>0), usable_m2 REAL NOT NULL CHECK(usable_m2>0), PRIMARY KEY(block_id,gallery_id));
CREATE TABLE artwork_allocation (artwork_id TEXT PRIMARY KEY REFERENCES artwork(id), block_id TEXT NOT NULL REFERENCES spatial_block(id), gallery_id TEXT, state TEXT NOT NULL CHECK(state IN ('UNASSIGNED','APPROVED','LOCATION_ORPHANED','WITHDRAWN')), footprint_m2 REAL NOT NULL CHECK(footprint_m2>0), assignment_version INTEGER NOT NULL DEFAULT 0, technical_version INTEGER, coordinator_id TEXT REFERENCES actor(id), FOREIGN KEY(block_id,gallery_id) REFERENCES spatial_block_gallery(block_id,gallery_id), CHECK(state!='APPROVED' OR gallery_id IS NOT NULL));
-- A production adapter must lock the block row and recompute occupied capacity inside
-- the same transaction as approval, reassignment, closure, contract authorization and payment.
-- Never delete historical approvals or payment entries when a location becomes unavailable.
