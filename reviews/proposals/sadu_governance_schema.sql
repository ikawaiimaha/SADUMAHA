-- SADU fictional governance model — 2026-09-29, PROPOSAL ONLY.
-- Not a migration. No authentication integration, user provisioning, policy grants,
-- worker, webhook call or production rollout is included. Final ROLLBACK is intentional.
-- DDL illustrates relations/constraints; see the companion review for required
-- authenticated transition functions, RLS, storage policies and acceptance tests.
BEGIN;
CREATE SCHEMA sadu_proposal;
REVOKE ALL ON SCHEMA sadu_proposal FROM PUBLIC;

CREATE TYPE sadu_proposal.role_code AS ENUM
  ('General_Exhibition_Coordinator', 'Director', 'Artist', 'Editorial',
   'PR_Officer', 'Technical', 'Finance', 'Logistics');
-- HIP is absent from this candidate vocabulary. Historical roles are not deleted.
CREATE TYPE sadu_proposal.submission_state AS ENUM
  ('Draft', 'Coordinator_Review', 'Revision_Requested', 'Executive_Review',
   'Publication_Approved', 'Withdrawn');
CREATE TYPE sadu_proposal.source_kind AS ENUM ('Verbal', 'Email', 'Meeting', 'Document');
CREATE TYPE sadu_proposal.sync_state AS ENUM ('Pending_Sync', 'Synced', 'Failed_Sync');

CREATE TABLE sadu_proposal.exhibition (
  id uuid PRIMARY KEY,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  event_date date, -- No fabricated day in April. Required before dated validations.
  timezone text NOT NULL DEFAULT 'Asia/Dubai',
  submission_deadline timestamptz,
  policy_revision integer NOT NULL DEFAULT 1 CHECK (policy_revision > 0),
  passport_validity_months integer NOT NULL DEFAULT 6 CHECK (passport_validity_months >= 0),
  concept_max_words integer NOT NULL DEFAULT 250 CHECK (concept_max_words > 0),
  biography_max_words integer NOT NULL DEFAULT 300 CHECK (biography_max_words > 0),
  minimum_image_width_px integer CHECK (minimum_image_width_px > 0),
  minimum_image_height_px integer CHECK (minimum_image_height_px > 0),
  departure_airport_required boolean NOT NULL DEFAULT false,
  policy_status text NOT NULL DEFAULT 'Proposed' CHECK (policy_status IN ('Proposed','Confirmed'))
);

CREATE TABLE sadu_proposal.person (
  id uuid PRIMARY KEY,
  display_name text NOT NULL,
  is_fictional boolean NOT NULL DEFAULT true CHECK (is_fictional)
);
CREATE TABLE sadu_proposal.role_assignment (
  id uuid PRIMARY KEY,
  exhibition_id uuid NOT NULL REFERENCES sadu_proposal.exhibition,
  person_id uuid NOT NULL REFERENCES sadu_proposal.person,
  role sadu_proposal.role_code NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_until timestamptz,
  source_kind sadu_proposal.source_kind NOT NULL,
  attributed_by text NOT NULL CHECK (length(trim(attributed_by)) > 0),
  scope_statement text NOT NULL CHECK (length(trim(scope_statement)) > 0),
  source_reference text, -- Optional, including for verbal delegation assertions.
  status text NOT NULL DEFAULT 'Proposed' CHECK (status IN ('Proposed','Confirmed','Revoked')),
  CHECK (effective_until IS NULL OR effective_until > effective_from)
);
CREATE TABLE sadu_proposal.submission (
  id uuid PRIMARY KEY,
  exhibition_id uuid NOT NULL REFERENCES sadu_proposal.exhibition,
  artist_id uuid NOT NULL REFERENCES sadu_proposal.person,
  UNIQUE (exhibition_id, artist_id)
);
CREATE TABLE sadu_proposal.submission_revision (
  submission_id uuid NOT NULL REFERENCES sadu_proposal.submission,
  revision integer NOT NULL CHECK (revision > 0),
  policy_revision integer NOT NULL CHECK (policy_revision > 0),
  state sadu_proposal.submission_state NOT NULL DEFAULT 'Draft',
  biography_text text NOT NULL DEFAULT '',
  concept_text text NOT NULL DEFAULT '',
  source_language text NOT NULL CHECK (source_language IN ('en','ar')),
  departure_airport text,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (submission_id, revision)
  -- Word counts are computed server-side on submit, not accepted from the browser.
  -- Empty/short drafts are allowed. Boundaries derive from the confirmed policy.
);

CREATE TABLE sadu_proposal.artwork_record (
  submission_id uuid NOT NULL,
  revision integer NOT NULL,
  artwork_id uuid NOT NULL,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  description text NOT NULL CHECK (length(trim(description)) > 0),
  width_mm numeric NOT NULL CHECK (width_mm > 0),
  height_mm numeric NOT NULL CHECK (height_mm > 0),
  depth_mm numeric CHECK (depth_mm > 0),
  display_kind text NOT NULL CHECK (display_kind IN ('Wall','Floor','Other')),
  PRIMARY KEY (submission_id, revision, artwork_id),
  FOREIGN KEY (submission_id, revision) REFERENCES sadu_proposal.submission_revision
);
CREATE TABLE sadu_proposal.artwork_image (
  id uuid PRIMARY KEY,
  submission_id uuid NOT NULL,
  revision integer NOT NULL,
  artwork_id uuid NOT NULL,
  private_object_key text NOT NULL,
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  inspected_width_px integer CHECK (inspected_width_px > 0),
  inspected_height_px integer CHECK (inspected_height_px > 0),
  media_review text NOT NULL DEFAULT 'Pending' CHECK (media_review IN ('Pending','Accepted','Rejected')),
  FOREIGN KEY (submission_id, revision, artwork_id)
    REFERENCES sadu_proposal.artwork_record (submission_id, revision, artwork_id)
  -- Upload issuance must require this scoped parent; storage orphan cleanup is separate.
);
CREATE TABLE sadu_proposal.spatial_assignment (
  id uuid PRIMARY KEY,
  submission_id uuid NOT NULL,
  revision integer NOT NULL,
  available_width_mm numeric NOT NULL CHECK (available_width_mm > 0),
  available_height_mm numeric NOT NULL CHECK (available_height_mm > 0),
  assessment text NOT NULL DEFAULT 'Unreviewed' CHECK (assessment IN ('Unreviewed','Warning','Specialist_Accepted')),
  FOREIGN KEY (submission_id, revision) REFERENCES sadu_proposal.submission_revision
  -- Area comparison is a warning only; layout, spacing, load and mounting need Technical.
);

CREATE TABLE sadu_proposal.decision_record (
  id uuid PRIMARY KEY,
  submission_id uuid NOT NULL,
  revision integer NOT NULL,
  source_kind sadu_proposal.source_kind NOT NULL,
  attributed_speaker text NOT NULL CHECK (length(trim(attributed_speaker)) > 0),
  occurred_at timestamptz NOT NULL,
  recorded_by uuid NOT NULL REFERENCES sadu_proposal.person,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  statement text NOT NULL CHECK (length(trim(statement)) > 0),
  source_reference text,
  supersedes_id uuid REFERENCES sadu_proposal.decision_record,
  UNIQUE (id, submission_id, revision),
  FOREIGN KEY (submission_id, revision) REFERENCES sadu_proposal.submission_revision,
  CHECK (occurred_at <= recorded_at)
);
CREATE TABLE sadu_proposal.review_event (
  id uuid PRIMARY KEY,
  submission_id uuid NOT NULL,
  revision integer NOT NULL,
  decision_id uuid NOT NULL,
  actor_id uuid NOT NULL REFERENCES sadu_proposal.person,
  action text NOT NULL CHECK (action IN
    ('Confirm_Statement','Dispute_Statement','Request_Revision','Ready_For_Executive',
     'Approve_Publication','Withdraw_Publication','PR_Evidence','Technical_Evidence','Editorial_Evidence')),
  note text NOT NULL CHECK (length(trim(note)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, submission_id, revision, action),
  FOREIGN KEY (decision_id, submission_id, revision)
    REFERENCES sadu_proposal.decision_record (id, submission_id, revision)
  -- Server-derived actor + scoped capability required. No direct client writes.
  -- Events must be append-only; confirmation alone never authorizes publication.
);

CREATE TABLE sadu_proposal.document_version (
  id uuid PRIMARY KEY,
  submission_id uuid NOT NULL,
  revision integer NOT NULL,
  kind text NOT NULL CHECK (kind IN ('Invitation','Passport','Contract')),
  document_version integer NOT NULL CHECK (document_version > 0),
  private_object_key text NOT NULL,
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, kind, document_version),
  FOREIGN KEY (submission_id, revision) REFERENCES sadu_proposal.submission_revision
  -- Encryption, retention and object immutability require storage controls.
  -- Passport: assigned PR only by default. Contract: assigned Finance only by default.
  -- Coordinator receives safe status; no blanket cross-access to both document kinds.
);

CREATE TABLE sadu_proposal.publication_outbox (
  id uuid PRIMARY KEY,
  submission_id uuid NOT NULL,
  revision integer NOT NULL,
  approval_event_id uuid NOT NULL,
  approval_action text NOT NULL DEFAULT 'Approve_Publication' CHECK (approval_action = 'Approve_Publication'),
  idempotency_key uuid NOT NULL UNIQUE,
  sync_status sadu_proposal.sync_state NOT NULL DEFAULT 'Pending_Sync',
  public_snapshot jsonb NOT NULL CHECK (jsonb_typeof(public_snapshot) = 'object'),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at timestamptz,
  acknowledged_at timestamptz,
  acknowledgement_event_id uuid,
  cancelled_at timestamptz,
  UNIQUE (submission_id, revision),
  FOREIGN KEY (approval_event_id, submission_id, revision, approval_action)
    REFERENCES sadu_proposal.review_event (id, submission_id, revision, action),
  CHECK (sync_status <> 'Synced' OR
    (acknowledged_at IS NOT NULL AND acknowledgement_event_id IS NOT NULL))
  -- Only an atomic Director approval transaction may insert a PUBLIC allowlisted snapshot.
  -- This table cannot validate actor authority or payload privacy by itself.
  -- No executable webhook trigger exists. Future trusted worker owns delivery receipts.
);
CREATE TABLE sadu_proposal.artist_task (
  id uuid PRIMARY KEY,
  submission_id uuid NOT NULL,
  revision integer NOT NULL,
  task_key text NOT NULL,
  owner_role sadu_proposal.role_code NOT NULL,
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Blocked','Complete','Cancelled')),
  due_at timestamptz,
  safe_summary text NOT NULL,
  UNIQUE (submission_id, revision, task_key),
  FOREIGN KEY (submission_id, revision) REFERENCES sadu_proposal.submission_revision
  -- Coordinator sees safe summaries, not private specialist payloads.
);

-- Deny-by-default illustration; no client policies or grants are proposed here.
DO $$ DECLARE t record; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'sadu_proposal' LOOP
    EXECUTE format('ALTER TABLE sadu_proposal.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('ALTER TABLE sadu_proposal.%I FORCE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA sadu_proposal FROM PUBLIC;
ROLLBACK;
