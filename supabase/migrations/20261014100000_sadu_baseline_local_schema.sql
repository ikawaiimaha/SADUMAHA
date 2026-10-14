-- Baseline of the SADU schema that was previously applied by hand from supabase/local/*.sql
-- and the root migration.sql. Generated on 2026-10-14 with
--   supabase db diff --local --schema public,storage,sadu_private,sadu_governance
-- against a shadow database built from the earlier migrations, so a fresh
-- 'supabase db reset' now reproduces the verified local schema.
-- supabase/local/*.sql remain as the authored history; do not re-apply them to a
-- database that has this migration.

create extension if not exists pg_cron with schema pg_catalog;

SET local check_function_bodies = off;

CREATE SCHEMA "sadu_governance";

CREATE SCHEMA "sadu_private";

CREATE TABLE "public"."sadu_arrival_receipts" (
  "booking_id"          uuid                     NOT NULL,
  "artwork_id"          uuid                     NOT NULL,
  "artist_id"           uuid                     NOT NULL,
  "coordinator_id"      uuid,
  "artist_name"         text                     NOT NULL,
  "artwork_title"       text                     NOT NULL,
  "facility"            text                     NOT NULL,
  "recorded_at"         timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  "all_crates_received" boolean                  NOT NULL,
  CONSTRAINT "sadu_arrival_receipts_all_crates_received_check" CHECK (all_crates_received),
  CONSTRAINT "sadu_arrival_receipts_facility_check" CHECK (((length(TRIM(BOTH FROM facility)) >= 3) AND (length(TRIM(BOTH FROM facility)) <= 200))),
  CONSTRAINT "sadu_arrival_receipts_pkey" PRIMARY KEY (booking_id),
  "recorded_by"         uuid                     NOT NULL DEFAULT auth.uid()
);

ALTER TABLE "public"."sadu_arrival_receipts"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_arrival_receipts" FROM "anon";

CREATE TABLE "public"."sadu_artwork_checklist" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "scenario_id"          uuid                     NOT NULL,
  "zone_id"              uuid                     NOT NULL,
  "source"               jsonb                    NOT NULL,
  "translation_ar"       jsonb,
  "production_year"      integer                  NOT NULL,
  "height_cm"            numeric                  NOT NULL,
  "width_cm"             numeric                  NOT NULL,
  "weight_kg"            numeric                  NOT NULL,
  "crate_count"          integer                  NOT NULL,
  "translation_status"   text                     NOT NULL DEFAULT 'PENDING_TRANSLATION'::text,
  "translated_by"        uuid,
  "translated_at"        timestamp with time zone,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "media_object_name"    text                     NOT NULL,
  "translation_en"       jsonb,
  "translation_receipts" jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "religious_text"       boolean,
  CONSTRAINT "sadu_artwork_checklist_crate_count_check" CHECK (((crate_count >= 1) AND (crate_count <= 100))),
  CONSTRAINT "sadu_artwork_checklist_height_cm_check" CHECK (((height_cm > (0)::numeric) AND (height_cm < (100000)::numeric))),
  CONSTRAINT "sadu_artwork_checklist_media_object_name_key" UNIQUE (media_object_name),
  CONSTRAINT "sadu_artwork_checklist_pkey" PRIMARY KEY (id),
  CONSTRAINT "sadu_artwork_checklist_production_year_check" CHECK (((production_year >= 1) AND (production_year <= 2100))),
  CONSTRAINT "sadu_artwork_checklist_translation_status_check" CHECK ((translation_status = ANY (ARRAY['PENDING_TRANSLATION'::text, 'TRANSLATION_COMPLETED'::text]))),
  CONSTRAINT "sadu_artwork_checklist_weight_kg_check" CHECK (((weight_kg > (0)::numeric) AND (weight_kg < (100000)::numeric))),
  CONSTRAINT "sadu_artwork_checklist_width_cm_check" CHECK (((width_cm > (0)::numeric) AND (width_cm < (100000)::numeric)))
);

ALTER TABLE "public"."sadu_artwork_checklist"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_artwork_checklist" FROM "anon";

CREATE TABLE "public"."sadu_artwork_values" (
  "artwork_id"   uuid                     NOT NULL,
  "title"        text                     NOT NULL DEFAULT ''::text,
  "amount_minor" bigint                   NOT NULL,
  "currency"     text                     NOT NULL,
  "purpose"      text                     NOT NULL,
  "recorded_at"  timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "sadu_artwork_values_amount_minor_check" CHECK (((amount_minor >= 0) AND (amount_minor <= '100000000000'::bigint))),
  CONSTRAINT "sadu_artwork_values_currency_check" CHECK ((currency = ANY (ARRAY['AED'::text, 'USD'::text, 'EUR'::text]))),
  CONSTRAINT "sadu_artwork_values_pkey" PRIMARY KEY (artwork_id),
  CONSTRAINT "sadu_artwork_values_purpose_check" CHECK ((purpose = ANY (ARRAY['DECLARED_SALE_VALUE'::text, 'INSURANCE_VALUE'::text]))),
  "artist_id"    uuid                     NOT NULL DEFAULT auth.uid()
);

ALTER TABLE "public"."sadu_artwork_values"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_artwork_values" FROM "anon";

CREATE TABLE "public"."sadu_asset_reminders" (
  "scenario_id" uuid                     NOT NULL,
  "queued_at"   timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  "status"      text                     NOT NULL DEFAULT 'PENDING_DELIVERY'::text,
  CONSTRAINT "sadu_asset_reminders_pkey" PRIMARY KEY (scenario_id),
  CONSTRAINT "sadu_asset_reminders_status_check" CHECK ((status = ANY (ARRAY['PENDING_DELIVERY'::text, 'CANCELLED'::text, 'SENT'::text])))
);

ALTER TABLE "public"."sadu_asset_reminders"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_asset_reminders" FROM "anon";

CREATE TABLE "public"."sadu_asset_scope" (
  "scenario_id"        uuid                     NOT NULL,
  "expected_count"     integer                  NOT NULL,
  "approval_reference" text                     NOT NULL,
  "approved_at"        timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "sadu_asset_scope_approval_reference_check" CHECK (((length(TRIM(BOTH FROM approval_reference)) >= 3) AND (length(TRIM(BOTH FROM approval_reference)) <= 500))),
  CONSTRAINT "sadu_asset_scope_expected_count_check" CHECK (((expected_count >= 1) AND (expected_count <= 3000))),
  CONSTRAINT "sadu_asset_scope_pkey" PRIMARY KEY (scenario_id),
  "approved_by"        uuid                     NOT NULL DEFAULT auth.uid()
);

ALTER TABLE "public"."sadu_asset_scope"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_asset_scope" FROM "anon";

CREATE TABLE "public"."sadu_companion_requests" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "contract_id"     text                     NOT NULL,
  "artist_id"       uuid                     NOT NULL,
  "companion_name"  text                     NOT NULL,
  "self_funded_ack" boolean                  NOT NULL,
  "object_name"     text                     NOT NULL,
  "file_name"       text                     NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "sadu_companion_requests_check" CHECK ((object_name = (((((artist_id)::text || '/companion-intake/'::text) || (id)::text) || '/'::text) || file_name))),
  CONSTRAINT "sadu_companion_requests_companion_name_check" CHECK (((length(TRIM(BOTH FROM companion_name)) >= 1) AND (length(TRIM(BOTH FROM companion_name)) <= 200))),
  CONSTRAINT "sadu_companion_requests_file_name_check" CHECK (((file_name ~ '^[a-zA-Z0-9._-]{1,180}$'::text) AND (file_name ~* '\.pdf$'::text))),
  CONSTRAINT "sadu_companion_requests_object_name_key" UNIQUE (object_name),
  CONSTRAINT "sadu_companion_requests_pkey" PRIMARY KEY (id),
  CONSTRAINT "sadu_companion_requests_self_funded_ack_check" CHECK (self_funded_ack)
);

ALTER TABLE "public"."sadu_companion_requests"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_companion_requests" FROM "anon";

CREATE TABLE "public"."sadu_condition_reports" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "contract_id" text                     NOT NULL,
  "artist_id"   uuid                     NOT NULL,
  "description" text                     NOT NULL,
  "photos"      jsonb                    NOT NULL,
  "status"      text                     NOT NULL DEFAULT 'DRAFT'::text,
  "decision_at" timestamp with time zone,
  "decided_by"  uuid,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "sadu_condition_reports_description_check" CHECK (((length(TRIM(BOTH FROM description)) >= 3) AND (length(TRIM(BOTH FROM description)) <= 2000))),
  CONSTRAINT "sadu_condition_reports_photos_check" CHECK (((jsonb_typeof(photos) = 'array'::text) AND ((jsonb_array_length(photos) >= 1) AND (jsonb_array_length(photos) <= 5)))),
  CONSTRAINT "sadu_condition_reports_pkey" PRIMARY KEY (id),
  CONSTRAINT "sadu_condition_reports_status_check"
    CHECK ((status = ANY (ARRAY['DRAFT'::text, 'DAMAGED_PENDING_ARTIST_APPROVAL'::text, 'REPAIR_AUTHORIZED'::text, 'ARTIST_REPAIR_PLANNED'::text]))),
  "reporter_id" uuid                     NOT NULL DEFAULT auth.uid()
);

ALTER TABLE "public"."sadu_condition_reports"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_condition_reports" FROM "anon";

CREATE TABLE "public"."sadu_consignments" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "artwork_id"       uuid                     NOT NULL,
  "artist_id"        uuid                     NOT NULL,
  "origin"           text                     NOT NULL,
  "contact_name"     text,
  "contact_email"    text,
  "status"           text                     NOT NULL,
  "details"          jsonb,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "received_at"      timestamp with time zone,
  "freight_revision" integer                  NOT NULL DEFAULT 1,
  CONSTRAINT "sadu_consignments_artwork_id_key" UNIQUE (artwork_id),
  CONSTRAINT "sadu_consignments_origin_check" CHECK ((origin = ANY (ARRAY['ARTIST_STUDIO'::text, 'THIRD_PARTY_GALLERY'::text]))),
  CONSTRAINT "sadu_consignments_pkey" PRIMARY KEY (id),
  CONSTRAINT "sadu_consignments_status_check" CHECK ((status = ANY (ARRAY['STUDIO_SELECTED'::text, 'AWAITING_GALLERY'::text, 'CONSIGNMENT_DATA_RECEIVED'::text])))
);

ALTER TABLE "public"."sadu_consignments"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_consignments" FROM "anon";

CREATE TABLE "public"."sadu_contract_intake" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "contract_id" text                     NOT NULL,
  "artist_id"   uuid                     NOT NULL,
  "kind"        text                     NOT NULL,
  "object_name" text                     NOT NULL,
  "file_name"   text                     NOT NULL,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "sadu_contract_intake_check1"
    CHECK ((((kind = 'PASSPORT'::text) AND (file_name ~* '\.pdf$'::text)) OR ((kind = 'ARTWORK_IMAGE'::text) AND (file_name ~* '\.(png|tif|tiff)$'::text)))),
  CONSTRAINT "sadu_contract_intake_check" CHECK ((object_name = (((((artist_id)::text || '/contract-intake/'::text) || (id)::text) || '/'::text) || file_name))),
  CONSTRAINT "sadu_contract_intake_file_name_check" CHECK (((length(file_name) >= 1) AND (length(file_name) <= 255))),
  CONSTRAINT "sadu_contract_intake_kind_check" CHECK ((kind = ANY (ARRAY['PASSPORT'::text, 'ARTWORK_IMAGE'::text]))),
  CONSTRAINT "sadu_contract_intake_object_name_key" UNIQUE (object_name),
  CONSTRAINT "sadu_contract_intake_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."sadu_contract_intake"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_contract_intake" FROM "anon";

CREATE TABLE "public"."sadu_exhibition_scenarios" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "contract_id"       text                     NOT NULL,
  "artist_id"         uuid                     NOT NULL,
  "coordinator_id"    uuid,
  "artwork_checklist" jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "status"            text                     NOT NULL DEFAULT 'DRAFT'::text,
  "submitted_at"      timestamp with time zone,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "sadu_exhibition_scenarios_contract_id_key" UNIQUE (contract_id),
  CONSTRAINT "sadu_exhibition_scenarios_pkey" PRIMARY KEY (id),
  CONSTRAINT "sadu_exhibition_scenarios_status_check" CHECK ((status = ANY (ARRAY['DRAFT'::text, 'SUBMITTED'::text])))
);

ALTER TABLE "public"."sadu_exhibition_scenarios"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."sadu_exhibition_titles" (
  "scenario_id"  uuid                     NOT NULL,
  "title_ar"     text                     NOT NULL,
  "title_en"     text                     NOT NULL,
  "status"       text                     NOT NULL DEFAULT 'PENDING_CURATOR_REVIEW'::text,
  "submitted_at" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  "locked_at"    timestamp with time zone,
  "locked_by"    uuid,
  CONSTRAINT "sadu_exhibition_titles_pkey" PRIMARY KEY (scenario_id),
  CONSTRAINT "sadu_exhibition_titles_status_check" CHECK ((status = ANY (ARRAY['PENDING_CURATOR_REVIEW'::text, 'LOCKED'::text]))),
  CONSTRAINT "sadu_exhibition_titles_title_ar_check" CHECK (((length(TRIM(BOTH FROM title_ar)) >= 1) AND (length(TRIM(BOTH FROM title_ar)) <= 250))),
  CONSTRAINT "sadu_exhibition_titles_title_en_check" CHECK (((length(TRIM(BOTH FROM title_en)) >= 1) AND (length(TRIM(BOTH FROM title_en)) <= 250)))
);

ALTER TABLE "public"."sadu_exhibition_titles"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_exhibition_titles" FROM "anon";

CREATE TABLE "public"."sadu_freight_alerts" (
  "consignment_id"   uuid                     NOT NULL,
  "status"           text                     NOT NULL DEFAULT 'OPEN'::text,
  "priority"         text                     NOT NULL DEFAULT 'HIGH'::text,
  "created_at"       timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  "resolved_at"      timestamp with time zone,
  "freight_revision" integer                  NOT NULL DEFAULT 1,
  CONSTRAINT "sadu_freight_alerts_pkey" PRIMARY KEY (consignment_id, freight_revision),
  CONSTRAINT "sadu_freight_alerts_priority_check" CHECK ((priority = 'HIGH'::text)),
  CONSTRAINT "sadu_freight_alerts_status_check" CHECK ((status = ANY (ARRAY['OPEN'::text, 'RESOLVED'::text])))
);

ALTER TABLE "public"."sadu_freight_alerts"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_freight_alerts" FROM "anon";

CREATE TABLE "public"."sadu_freight_assignments" (
  "consignment_id"    uuid                     NOT NULL,
  "artist_id"         uuid                     NOT NULL,
  "vendor_id"         uuid                     NOT NULL,
  "curator_id"        uuid                     NOT NULL,
  "closure_start"     date                     NOT NULL,
  "reopens_on"        date                     NOT NULL,
  "facility_timezone" text                     NOT NULL,
  "recorded_at"       timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "sadu_freight_assignments_check" CHECK ((reopens_on > closure_start)),
  CONSTRAINT "sadu_freight_assignments_pkey" PRIMARY KEY (consignment_id),
  "recorded_by"       uuid                     NOT NULL DEFAULT auth.uid()
);

ALTER TABLE "public"."sadu_freight_assignments"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_freight_assignments" FROM "anon";

CREATE TABLE "public"."sadu_freight_bookings" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "artwork_id"          uuid                     NOT NULL,
  "artist_id"           uuid                     NOT NULL,
  "ready_date"          date                     NOT NULL,
  "unavailable_start"   date,
  "unavailable_end"     date,
  "address"             jsonb                    NOT NULL,
  "map_url"             text                     NOT NULL,
  "status"              text                     NOT NULL DEFAULT 'PENDING_ORIGIN_DISPATCH'::text,
  "requested_date"      date,
  "change_reason"       text,
  "change_status"       text,
  "condition_reference" text,
  "history"             jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "freight_complete_travel_range" CHECK ((((unavailable_start IS NULL) AND (unavailable_end IS NULL)) OR ((unavailable_start IS NOT NULL) AND (unavailable_end IS
    NOT NULL) AND (unavailable_end >= unavailable_start)))),
  CONSTRAINT "freight_trusted_pin" CHECK ((map_url ~ '^https://(maps\.google\.com|www\.google\.com|maps\.app\.goo\.gl|goo\.gl|www\.makani\.ae|makani\.ae)/'::text)),
  CONSTRAINT "sadu_freight_bookings_artwork_id_key" UNIQUE (artwork_id),
  CONSTRAINT "sadu_freight_bookings_change_status_check" CHECK ((change_status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text]))),
  CONSTRAINT "sadu_freight_bookings_check1" CHECK (((unavailable_start IS NULL) OR ((ready_date < unavailable_start) OR (ready_date > unavailable_end)))),
  CONSTRAINT "sadu_freight_bookings_check" CHECK ((((unavailable_start IS NULL) AND (unavailable_end IS NULL)) OR ((unavailable_start IS
    NOT NULL) AND (unavailable_end >= unavailable_start)))),
  CONSTRAINT "sadu_freight_bookings_map_url_check"
    CHECK ((map_url ~ '^https://(maps\.google\.[a-z.]+|www\.google\.com|maps\.app\.goo\.gl|goo\.gl|www\.makani\.ae|makani\.ae)/'::text)),
  CONSTRAINT "sadu_freight_bookings_pkey" PRIMARY KEY (id),
  CONSTRAINT "sadu_freight_bookings_status_check"
    CHECK ((status = ANY (ARRAY['PENDING_ORIGIN_DISPATCH'::text, 'IN_TRANSIT'::text, 'CUSTOMS_CLEARANCE'::text, 'RECEIVED_CONDITION_CHECKED'::text])))
);

ALTER TABLE "public"."sadu_freight_bookings"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_freight_bookings" FROM "anon";

CREATE TABLE "public"."sadu_freight_changes" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "consignment_id"       uuid                     NOT NULL,
  "base_revision"        integer                  NOT NULL,
  "kind"                 text                     NOT NULL,
  "proposal"             jsonb                    NOT NULL,
  "estimated_cost_minor" bigint                   NOT NULL,
  "currency"             text                     NOT NULL,
  "payer"                text                     NOT NULL,
  "reason"               text                     NOT NULL,
  "before_snapshot"      jsonb                    NOT NULL,
  "status"               text                     NOT NULL DEFAULT 'PENDING'::text,
  "requested_at"         timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  "logistics_by"         uuid,
  "logistics_at"         timestamp with time zone,
  "finance_by"           uuid,
  "finance_at"           timestamp with time zone,
  "decision_note"        text,
  "decided_at"           timestamp with time zone,
  "decided_by"           uuid,
  CONSTRAINT "sadu_freight_changes_currency_check" CHECK ((currency = ANY (ARRAY['AED'::text, 'USD'::text, 'EUR'::text]))),
  CONSTRAINT "sadu_freight_changes_estimated_cost_minor_check" CHECK (((estimated_cost_minor >= 0) AND (estimated_cost_minor <= '10000000000'::bigint))),
  CONSTRAINT "sadu_freight_changes_kind_check" CHECK ((kind = ANY (ARRAY['PACKING'::text, 'RETURN'::text, 'CLOSURE'::text]))),
  CONSTRAINT "sadu_freight_changes_payer_check" CHECK ((payer = ANY (ARRAY['ARTIST'::text, 'DEPARTMENT'::text, 'GALLERY'::text]))),
  CONSTRAINT "sadu_freight_changes_pkey" PRIMARY KEY (id),
  CONSTRAINT "sadu_freight_changes_reason_check" CHECK (((length(TRIM(BOTH FROM reason)) >= 10) AND (length(TRIM(BOTH FROM reason)) <= 1000))),
  CONSTRAINT "sadu_freight_changes_status_check" CHECK ((status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text]))),
  "requested_by"         uuid                     NOT NULL DEFAULT auth.uid()
);

ALTER TABLE "public"."sadu_freight_changes"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_freight_changes" FROM "anon";

CREATE TABLE "public"."sadu_guest_deadline_policy" (
  "id"        boolean NOT NULL DEFAULT true,
  "lead_days" integer NOT NULL,
  CONSTRAINT "sadu_guest_deadline_policy_id_check" CHECK (id),
  CONSTRAINT "sadu_guest_deadline_policy_lead_days_check" CHECK (((lead_days >= 1) AND (lead_days <= 180))),
  CONSTRAINT "sadu_guest_deadline_policy_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."sadu_guest_deadline_policy"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_guest_deadline_policy" FROM "anon";

CREATE TABLE "public"."sadu_guest_document_policy" (
  "id"                    boolean NOT NULL DEFAULT true,
  "version"               text    NOT NULL,
  "national_id_countries" text[]  NOT NULL,
  "reference"             text    NOT NULL,
  CONSTRAINT "sadu_guest_document_policy_id_check" CHECK (id),
  CONSTRAINT "sadu_guest_document_policy_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."sadu_guest_document_policy"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_guest_document_policy" FROM "anon";

CREATE TABLE "public"."sadu_guest_finalizations" (
  "intake_id"    uuid                     NOT NULL,
  "artist_id"    uuid                     NOT NULL,
  "finalized_at" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "sadu_guest_finalizations_pkey" PRIMARY KEY (intake_id)
);

ALTER TABLE "public"."sadu_guest_finalizations"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_guest_finalizations" FROM "anon";

CREATE TABLE "public"."sadu_guest_intakes" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "contract_id"       text                     NOT NULL,
  "artist_id"         uuid                     NOT NULL,
  "arrival"           date                     NOT NULL,
  "departure"         date                     NOT NULL,
  "airport"           text                     NOT NULL,
  "companion_name"    text,
  "companion_ack"     boolean                  NOT NULL DEFAULT false,
  "photo_extension"   text                     NOT NULL,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "artist_name"       text                     NOT NULL DEFAULT ''::text,
  "contract_status"   text                     NOT NULL DEFAULT ''::text,
  "identity"          jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "departure_airport" text,
  "document_policy"   jsonb,
  CONSTRAINT "sadu_guest_intakes_airport_check" CHECK ((airport = ANY (ARRAY['DXB'::text, 'SHJ'::text, 'OTHER'::text]))),
  CONSTRAINT "sadu_guest_intakes_check1" CHECK (((companion_name IS NULL) OR companion_ack)),
  CONSTRAINT "sadu_guest_intakes_check" CHECK ((departure >= arrival)),
  CONSTRAINT "sadu_guest_intakes_companion_name_check"
    CHECK (((companion_name IS NULL) OR ((length(TRIM(BOTH FROM companion_name)) >= 1) AND (length(TRIM(BOTH FROM companion_name)) <= 200)))),
  CONSTRAINT "sadu_guest_intakes_departure_airport_check" CHECK ((departure_airport = ANY (ARRAY['DXB'::text, 'SHJ'::text, 'OTHER'::text]))),
  CONSTRAINT "sadu_guest_intakes_photo_extension_check" CHECK ((photo_extension = ANY (ARRAY['jpg'::text, 'png'::text]))),
  CONSTRAINT "sadu_guest_intakes_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."sadu_guest_intakes"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_guest_intakes" FROM "anon";

CREATE TABLE "public"."sadu_guest_itinerary_approvals" (
  "intake_id"        uuid                     NOT NULL,
  "approved_at"      timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  "ticket_reference" text                     NOT NULL,
  CONSTRAINT "sadu_guest_itinerary_approvals_pkey" PRIMARY KEY (intake_id),
  CONSTRAINT "sadu_guest_itinerary_approvals_ticket_reference_check"
    CHECK (((length(TRIM(BOTH FROM ticket_reference)) >= 1) AND (length(TRIM(BOTH FROM ticket_reference)) <= 200))),
  "reviewed_by"      uuid                     NOT NULL DEFAULT auth.uid()
);

ALTER TABLE "public"."sadu_guest_itinerary_approvals"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_guest_itinerary_approvals" FROM "anon";

CREATE TABLE "public"."sadu_guest_reminder_outbox" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "contract_id" text                     NOT NULL,
  "artist_id"   uuid                     NOT NULL,
  "plan_id"     uuid                     NOT NULL,
  "deadline"    timestamp with time zone NOT NULL,
  "stage"       text                     NOT NULL,
  "status"      text                     NOT NULL DEFAULT 'PENDING_DELIVERY'::text,
  "created_at"  timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  "sent_at"     timestamp with time zone,
  CONSTRAINT "sadu_guest_reminder_outbox_check" CHECK (((status = 'SENT'::text) = (sent_at IS NOT NULL))),
  CONSTRAINT "sadu_guest_reminder_outbox_intake_id_deadline_stage_key" UNIQUE (plan_id, deadline, stage),
  CONSTRAINT "sadu_guest_reminder_outbox_pkey" PRIMARY KEY (id),
  CONSTRAINT "sadu_guest_reminder_outbox_stage_check" CHECK ((stage = ANY (ARRAY['14_DAYS'::text, '7_DAYS'::text, 'FINAL'::text]))),
  CONSTRAINT "sadu_guest_reminder_outbox_status_check" CHECK ((status = ANY (ARRAY['PENDING_DELIVERY'::text, 'CANCELLED'::text, 'SENT'::text])))
);

ALTER TABLE "public"."sadu_guest_reminder_outbox"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_guest_reminder_outbox" FROM "anon";

CREATE TABLE "public"."sadu_guest_travel_plans" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "contract_id" text                     NOT NULL,
  "artist_id"   uuid                     NOT NULL,
  "arrival"     date                     NOT NULL,
  "departure"   date                     NOT NULL,
  "created_at"  timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "sadu_guest_travel_plans_check" CHECK ((departure >= arrival)),
  CONSTRAINT "sadu_guest_travel_plans_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."sadu_guest_travel_plans"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_guest_travel_plans" FROM "anon";

CREATE TABLE "public"."sadu_logistics_routing" (
  "singleton"  boolean NOT NULL DEFAULT true,
  "officer_id" uuid    NOT NULL,
  "head_id"    uuid    NOT NULL,
  CONSTRAINT "sadu_logistics_routing_pkey" PRIMARY KEY (singleton),
  CONSTRAINT "sadu_logistics_routing_singleton_check" CHECK (singleton)
);

ALTER TABLE "public"."sadu_logistics_routing"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_logistics_routing" FROM "anon";

CREATE TABLE "public"."sadu_logistics_tickets" (
  "consignment_id" uuid                     NOT NULL,
  "artist_id"      uuid                     NOT NULL,
  "officer_id"     uuid                     NOT NULL,
  "head_id"        uuid                     NOT NULL,
  "ready_at"       timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  "opened_at"      timestamp with time zone,
  "actioned_at"    timestamp with time zone,
  "action_note"    text,
  "escalated_at"   timestamp with time zone,
  CONSTRAINT "sadu_logistics_tickets_pkey" PRIMARY KEY (consignment_id)
);

ALTER TABLE "public"."sadu_logistics_tickets"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_logistics_tickets" FROM "anon";

CREATE TABLE "public"."sadu_media_reviews" (
  "object_name" text                     NOT NULL,
  "object_id"   uuid                     NOT NULL,
  "reviewed_at" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "sadu_media_reviews_pkey" PRIMARY KEY (object_name),
  "reviewed_by" uuid                     NOT NULL DEFAULT auth.uid()
);

ALTER TABLE "public"."sadu_media_reviews"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_media_reviews" FROM "anon";

CREATE TABLE "public"."sadu_publication_queue" (
  "scenario_id"     uuid                     NOT NULL,
  "payload"         jsonb                    NOT NULL,
  "status"          text                     NOT NULL DEFAULT 'PENDING_CMS_CONNECTION'::text,
  "approved_at"     timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  "delivered_at"    timestamp with time zone,
  "sync_status"     text                     NOT NULL DEFAULT 'Pending_Sync'::text,
  "attempts"        integer                  NOT NULL DEFAULT 0,
  "next_attempt_at" timestamp with time zone NOT NULL DEFAULT now(),
  "lease_until"     timestamp with time zone,
  "last_error"      text,
  CONSTRAINT "sadu_publication_queue_check" CHECK (((status <> 'DELIVERED'::text) OR (delivered_at IS NOT NULL))),
  CONSTRAINT "sadu_publication_queue_pkey" PRIMARY KEY (scenario_id),
  CONSTRAINT "sadu_publication_queue_status_check" CHECK ((status = ANY (ARRAY['PENDING_CMS_CONNECTION'::text, 'DELIVERED'::text, 'FAILED'::text, 'CANCELLED'::text]))),
  CONSTRAINT "sadu_publication_queue_sync_status_check" CHECK ((sync_status = ANY (ARRAY['Pending_Sync'::text, 'Synced'::text, 'Failed_Sync'::text]))),
  "approved_by"     uuid                     NOT NULL DEFAULT auth.uid()
);

ALTER TABLE "public"."sadu_publication_queue"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_publication_queue" FROM "anon";

CREATE TABLE "public"."sadu_scenario_media" (
  "object_name"    text  NOT NULL,
  "scenario_id"    uuid  NOT NULL,
  "zone_id"        uuid  NOT NULL,
  "category"       text  NOT NULL,
  "file_name"      text  NOT NULL,
  "asset_metadata" jsonb,
  CONSTRAINT "sadu_scenario_media_category_check" CHECK ((category = ANY (ARRAY['PRINT'::text, 'AV'::text, 'BLUEPRINT'::text]))),
  CONSTRAINT "sadu_scenario_media_check"
    CHECK
    ((((category = 'PRINT'::text) AND (lower(file_name) ~ '\.(png|tif|tiff)$'::text)) OR ((category = 'AV'::text) AND (lower(file_name) ~ '\.(mp4|mov)$'::text)) OR ((category =
    'BLUEPRINT'::text) AND (lower(file_name) ~ '\.pdf$'::text)))),
  CONSTRAINT "sadu_scenario_media_file_name_check" CHECK (((length(file_name) >= 1) AND (length(file_name) <= 255))),
  CONSTRAINT "sadu_scenario_media_pkey" PRIMARY KEY (object_name)
);

ALTER TABLE "public"."sadu_scenario_media"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."sadu_visa_notice_templates" (
  "version"            text                     NOT NULL,
  "body_ar"            text                     NOT NULL,
  "body_en"            text                     NOT NULL,
  "approved_at"        timestamp with time zone,
  "approval_reference" text,
  CONSTRAINT "sadu_visa_notice_templates_check" CHECK ((((approved_at IS NULL) AND (approval_reference IS NULL)) OR ((approved_at IS
    NOT NULL) AND (length(TRIM(BOTH FROM approval_reference)) >= 3)))),
  CONSTRAINT "sadu_visa_notice_templates_pkey" PRIMARY KEY (VERSION)
);

ALTER TABLE "public"."sadu_visa_notice_templates"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_visa_notice_templates" FROM "anon";

CREATE TABLE "public"."sadu_visa_notifications" (
  "contract_id"      text                     NOT NULL,
  "artist_id"        uuid                     NOT NULL,
  "visa_status"      text                     NOT NULL,
  "delivery_status"  text                     NOT NULL,
  "template_version" text,
  "body_ar"          text,
  "body_en"          text,
  "recorded_at"      timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "sadu_visa_notifications_delivery_status_check" CHECK ((delivery_status = ANY (ARRAY['TEMPLATE_APPROVAL_REQUIRED'::text, 'PENDING_DELIVERY'::text]))),
  CONSTRAINT "sadu_visa_notifications_pkey" PRIMARY KEY (contract_id),
  CONSTRAINT "sadu_visa_notifications_visa_status_check" CHECK ((visa_status = 'REJECTED_BY_AUTHORITY'::text))
);

ALTER TABLE "public"."sadu_visa_notifications"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_visa_notifications" FROM "anon";

CREATE TABLE "public"."sadu_visa_refusals" (
  "contract_id"         text                     NOT NULL,
  "intake_id"           uuid                     NOT NULL,
  "authority_reference" text                     NOT NULL,
  "recorded_at"         timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "sadu_visa_refusals_authority_reference_check" CHECK (((length(TRIM(BOTH FROM authority_reference)) >= 3) AND (length(TRIM(BOTH FROM authority_reference)) <= 200))),
  CONSTRAINT "sadu_visa_refusals_pkey" PRIMARY KEY (contract_id),
  "recorded_by"         uuid                     NOT NULL DEFAULT auth.uid()
);

ALTER TABLE "public"."sadu_visa_refusals"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."sadu_visa_refusals" FROM "anon";

CREATE TABLE "sadu_governance"."artist_profiles" (
  "id"               uuid    NOT NULL DEFAULT gen_random_uuid(),
  "user_id"          uuid    NOT NULL,
  "legal_name"       text    NOT NULL,
  "biography"        jsonb   NOT NULL DEFAULT '{}'::jsonb,
  "nationality_code" text    NOT NULL,
  "revision"         integer NOT NULL DEFAULT 1,
  CONSTRAINT "artist_profiles_nationality_code_check" CHECK ((nationality_code ~ '^[A-Z]{2}$'::text)),
  CONSTRAINT "artist_profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "artist_profiles_revision_check" CHECK ((revision > 0)),
  CONSTRAINT "artist_profiles_user_id_key" UNIQUE (user_id)
);

ALTER TABLE "sadu_governance"."artist_profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sadu_governance"."artwork_assets" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "artwork_id"          uuid                     NOT NULL,
  "artwork_revision"    integer                  NOT NULL,
  "category"            text                     NOT NULL,
  "object_key"          text                     NOT NULL,
  "sha256"              text                     NOT NULL,
  "byte_size"           bigint                   NOT NULL,
  "mime_type"           text                     NOT NULL,
  "width_px"            integer,
  "height_px"           integer,
  "storage_verified_at" timestamp with time zone,
  "scan_status"         text                     NOT NULL DEFAULT 'PENDING'::text,
  CONSTRAINT "artwork_assets_byte_size_check" CHECK (((byte_size > 0) AND (byte_size <= '2147483648'::bigint))),
  CONSTRAINT "artwork_assets_category_check" CHECK ((category = ANY (ARRAY['CATALOG_IMAGE'::text, 'VIDEO_MASTER'::text, 'TECHNICAL_RIDER'::text, 'BLUEPRINT'::text]))),
  CONSTRAINT "artwork_assets_object_key_key" UNIQUE (object_key),
  CONSTRAINT "artwork_assets_pkey" PRIMARY KEY (id),
  CONSTRAINT "artwork_assets_scan_status_check" CHECK ((scan_status = ANY (ARRAY['PENDING'::text, 'CLEAN'::text, 'REJECTED'::text]))),
  CONSTRAINT "artwork_assets_sha256_check" CHECK ((sha256 ~ '^[a-f0-9]{64}$'::text))
);

ALTER TABLE "sadu_governance"."artwork_assets"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sadu_governance"."artworks" (
  "id"                 uuid          NOT NULL DEFAULT gen_random_uuid(),
  "participation_id"   uuid          NOT NULL,
  "reference_id"       text          NOT NULL,
  "revision"           integer       NOT NULL DEFAULT 1,
  "title"              jsonb         NOT NULL,
  "materials"          jsonb         NOT NULL,
  "concept"            jsonb         NOT NULL,
  "height_cm"          numeric       NOT NULL,
  "width_cm"           numeric       NOT NULL,
  "depth_cm"           numeric       NOT NULL,
  "production_year"    integer       NOT NULL,
  "insurance_value"    numeric(14,2) NOT NULL,
  "insurance_currency" text          NOT NULL,
  "textual_elements"   jsonb         NOT NULL DEFAULT '{}'::jsonb,
  "religious_text"     boolean       NOT NULL DEFAULT false,
  CONSTRAINT "artworks_depth_cm_check" CHECK ((depth_cm > (0)::numeric)),
  CONSTRAINT "artworks_height_cm_check" CHECK ((height_cm > (0)::numeric)),
  CONSTRAINT "artworks_id_revision_key" UNIQUE (id, revision),
  CONSTRAINT "artworks_insurance_currency_check" CHECK ((insurance_currency = ANY (ARRAY['AED'::text, 'USD'::text, 'EUR'::text]))),
  CONSTRAINT "artworks_insurance_value_check" CHECK ((insurance_value >= (0)::numeric)),
  CONSTRAINT "artworks_pkey" PRIMARY KEY (id),
  CONSTRAINT "artworks_production_year_check" CHECK (((production_year >= 1000) AND (production_year <= 2100))),
  CONSTRAINT "artworks_reference_id_key" UNIQUE (reference_id),
  CONSTRAINT "artworks_revision_check" CHECK ((revision > 0)),
  CONSTRAINT "artworks_width_cm_check" CHECK ((width_cm > (0)::numeric))
);

ALTER TABLE "sadu_governance"."artworks"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sadu_governance"."condition_reports" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "ticket_id"         uuid                     NOT NULL,
  "registrar_id"      uuid                     NOT NULL,
  "condition"         text                     NOT NULL,
  "photo_object_keys" text[]                   NOT NULL DEFAULT '{}'::text[],
  "recorded_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "condition_reports_check" CHECK (((condition <> 'DAMAGED'::text) OR (cardinality(photo_object_keys) > 0))),
  CONSTRAINT "condition_reports_condition_check" CHECK ((condition = ANY (ARRAY['INTACT'::text, 'DAMAGED'::text]))),
  CONSTRAINT "condition_reports_pkey" PRIMARY KEY (id)
);

ALTER TABLE "sadu_governance"."condition_reports"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sadu_governance"."contracts" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "participation_id" uuid                     NOT NULL,
  "revision"         integer                  NOT NULL,
  "snapshot"         jsonb                    NOT NULL,
  "pdf_object_key"   text                     NOT NULL,
  "pdf_sha256"       text                     NOT NULL,
  "sealed_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "supersedes_id"    uuid,
  CONSTRAINT "contracts_participation_id_revision_key" UNIQUE (participation_id, revision),
  CONSTRAINT "contracts_pdf_sha256_check" CHECK ((pdf_sha256 ~ '^[a-f0-9]{64}$'::text)),
  CONSTRAINT "contracts_pkey" PRIMARY KEY (id),
  CONSTRAINT "contracts_revision_check" CHECK ((revision > 0))
);

ALTER TABLE "sadu_governance"."contracts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sadu_governance"."crates" (
  "id"                 uuid          NOT NULL DEFAULT gen_random_uuid(),
  "artwork_id"         uuid          NOT NULL,
  "length_cm"          numeric       NOT NULL,
  "width_cm"           numeric       NOT NULL,
  "height_cm"          numeric       NOT NULL,
  "weight_kg"          numeric       NOT NULL,
  "pickup_address"     jsonb         NOT NULL,
  "pickup_contact"     jsonb         NOT NULL,
  "insurance_value"    numeric(14,2) NOT NULL,
  "insurance_currency" text          NOT NULL,
  CONSTRAINT "crates_height_cm_check" CHECK ((height_cm > (0)::numeric)),
  CONSTRAINT "crates_insurance_currency_check" CHECK ((insurance_currency = ANY (ARRAY['AED'::text, 'USD'::text, 'EUR'::text]))),
  CONSTRAINT "crates_insurance_value_check" CHECK ((insurance_value >= (0)::numeric)),
  CONSTRAINT "crates_length_cm_check" CHECK ((length_cm > (0)::numeric)),
  CONSTRAINT "crates_pkey" PRIMARY KEY (id),
  CONSTRAINT "crates_weight_kg_check" CHECK ((weight_kg > (0)::numeric)),
  CONSTRAINT "crates_width_cm_check" CHECK ((width_cm > (0)::numeric))
);

ALTER TABLE "sadu_governance"."crates"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sadu_governance"."document_vault" (
  "id"                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "artist_id"              uuid                     NOT NULL,
  "kind"                   text                     NOT NULL,
  "private_object_key"     text                     NOT NULL,
  "sha256"                 text                     NOT NULL,
  "key_reference"          text                     NOT NULL,
  "encryption_verified_at" timestamp with time zone,
  "scan_status"            text                     NOT NULL DEFAULT 'PENDING'::text,
  "expires_on"             date,
  "uploaded_at"            timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "document_vault_kind_check" CHECK ((kind = ANY (ARRAY['PASSPORT'::text, 'NATIONAL_ID'::text]))),
  CONSTRAINT "document_vault_pkey" PRIMARY KEY (id),
  CONSTRAINT "document_vault_private_object_key_key" UNIQUE (private_object_key),
  CONSTRAINT "document_vault_scan_status_check" CHECK ((scan_status = ANY (ARRAY['PENDING'::text, 'CLEAN'::text, 'REJECTED'::text]))),
  CONSTRAINT "document_vault_sha256_check" CHECK ((sha256 ~ '^[a-f0-9]{64}$'::text))
);

ALTER TABLE "sadu_governance"."document_vault"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sadu_governance"."editorial_approvals" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "artwork_id"         uuid                     NOT NULL,
  "artwork_revision"   integer                  NOT NULL,
  "approved_by"        uuid                     NOT NULL,
  "approved_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "source_sha256"      text                     NOT NULL,
  "bilingual_snapshot" jsonb                    NOT NULL,
  CONSTRAINT "editorial_approvals_artwork_id_artwork_revision_key" UNIQUE (artwork_id, artwork_revision),
  CONSTRAINT "editorial_approvals_pkey" PRIMARY KEY (id),
  CONSTRAINT "editorial_approvals_source_sha256_check" CHECK ((source_sha256 ~ '^[a-f0-9]{64}$'::text))
);

ALTER TABLE "sadu_governance"."editorial_approvals"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sadu_governance"."immigration_policies" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "version"               text                     NOT NULL,
  "approved_reference"    text                     NOT NULL,
  "valid_from"            date                     NOT NULL,
  "valid_until"           date                     NOT NULL,
  "passport_months"       integer                  NOT NULL DEFAULT 6,
  "national_id_countries" text[]                   NOT NULL DEFAULT '{}'::text[],
  "activated_at"          timestamp with time zone,
  CONSTRAINT "immigration_policies_check" CHECK ((valid_until >= valid_from)),
  CONSTRAINT "immigration_policies_passport_months_check" CHECK (((passport_months >= 1) AND (passport_months <= 24))),
  CONSTRAINT "immigration_policies_pkey" PRIMARY KEY (id),
  CONSTRAINT "immigration_policies_version_key" UNIQUE (VERSION)
);

ALTER TABLE "sadu_governance"."immigration_policies"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sadu_governance"."memberships" (
  "program_id" uuid    NOT NULL,
  "user_id"    uuid    NOT NULL,
  "active"     boolean NOT NULL DEFAULT true
);

ALTER TABLE "sadu_governance"."memberships"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sadu_governance"."message_templates" (
  "id"                       uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "purpose"                  text                     NOT NULL,
  "language"                 text                     NOT NULL,
  "body"                     text                     NOT NULL,
  "legal_approval_reference" text,
  "approved_at"              timestamp with time zone,
  CONSTRAINT "message_templates_pkey" PRIMARY KEY (id),
  CONSTRAINT "message_templates_purpose_language_key" UNIQUE (purpose, LANGUAGE)
);

ALTER TABLE "sadu_governance"."message_templates"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sadu_governance"."outbox" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "dedupe_key"        text                     NOT NULL,
  "kind"              text                     NOT NULL,
  "recipient_user_id" uuid,
  "record_id"         uuid                     NOT NULL,
  "template_id"       uuid,
  "status"            text                     NOT NULL DEFAULT 'PENDING'::text,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "delivered_at"      timestamp with time zone,
  CONSTRAINT "outbox_check" CHECK (((status <> 'SENT'::text) OR (delivered_at IS NOT NULL))),
  CONSTRAINT "outbox_dedupe_key_key" UNIQUE (dedupe_key),
  CONSTRAINT "outbox_kind_check" CHECK ((kind = ANY (ARRAY['SHIPPING_SLA'::text, 'RECEIVED_NOTICE'::text, 'VISA_DECISION'::text, 'CMS_PUBLICATION'::text]))),
  CONSTRAINT "outbox_pkey" PRIMARY KEY (id),
  CONSTRAINT "outbox_status_check" CHECK ((status = ANY (ARRAY['PENDING'::text, 'SENT'::text, 'CANCELLED'::text, 'FAILED'::text])))
);

ALTER TABLE "sadu_governance"."outbox"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sadu_governance"."participations" (
  "id"                     uuid    NOT NULL DEFAULT gen_random_uuid(),
  "program_id"             uuid    NOT NULL,
  "artist_id"              uuid    NOT NULL,
  "coordinator_id"         uuid    NOT NULL,
  "approved_artwork_count" integer,
  "status"                 text    NOT NULL DEFAULT 'DRAFT'::text,
  "arrival"                date,
  CONSTRAINT "participations_approved_artwork_count_check" CHECK ((approved_artwork_count > 0)),
  CONSTRAINT "participations_pkey" PRIMARY KEY (id),
  CONSTRAINT "participations_program_id_artist_id_key" UNIQUE (program_id, artist_id),
  CONSTRAINT "participations_status_check" CHECK ((status = ANY (ARRAY['DRAFT'::text, 'SUBMITTED'::text, 'READY_FOR_PRINT'::text, 'ARCHIVED'::text])))
);

ALTER TABLE "sadu_governance"."participations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sadu_governance"."programs" (
  "id"        uuid NOT NULL DEFAULT gen_random_uuid(),
  "name"      text NOT NULL,
  "starts_on" date NOT NULL,
  "ends_on"   date NOT NULL,
  CONSTRAINT "programs_check" CHECK ((ends_on >= starts_on)),
  CONSTRAINT "programs_pkey" PRIMARY KEY (id)
);

ALTER TABLE "sadu_governance"."programs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sadu_governance"."shipping_tickets" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "crate_id"          uuid                     NOT NULL,
  "vendor_user_id"    uuid,
  "logistics_user_id" uuid                     NOT NULL,
  "status"            text                     NOT NULL DEFAULT 'READY_FOR_SHIPPING'::text,
  "ready_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "actioned_at"       timestamp with time zone,
  "received_at"       timestamp with time zone,
  CONSTRAINT "shipping_tickets_check" CHECK (((status <> 'RECEIVED'::text) OR (received_at IS NOT NULL))),
  CONSTRAINT "shipping_tickets_pkey" PRIMARY KEY (id),
  CONSTRAINT "shipping_tickets_status_check" CHECK ((status = ANY (ARRAY['READY_FOR_SHIPPING'::text, 'ACTIONED'::text, 'IN_TRANSIT'::text, 'RECEIVED'::text, 'CANCELLED'::text])))
);

ALTER TABLE "sadu_governance"."shipping_tickets"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sadu_governance"."signature_receipts" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "contract_id"         uuid                     NOT NULL,
  "provider"            text                     NOT NULL,
  "provider_event_id"   text                     NOT NULL,
  "signer_user_id"      uuid                     NOT NULL,
  "pdf_sha256"          text                     NOT NULL,
  "webhook_verified_at" timestamp with time zone NOT NULL,
  "signed_at"           timestamp with time zone NOT NULL,
  CONSTRAINT "signature_receipts_pkey" PRIMARY KEY (id),
  CONSTRAINT "signature_receipts_provider_event_id_key" UNIQUE (provider_event_id)
);

ALTER TABLE "sadu_governance"."signature_receipts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sadu_governance"."visa_decisions" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "participation_id"    uuid                     NOT NULL,
  "decision"            text                     NOT NULL,
  "authority_reference" text                     NOT NULL,
  "recorded_by"         uuid                     NOT NULL,
  "recorded_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "visa_decisions_decision_check" CHECK ((decision = ANY (ARRAY['APPROVED_BY_AUTHORITY'::text, 'REJECTED_BY_AUTHORITY'::text]))),
  CONSTRAINT "visa_decisions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "sadu_governance"."visa_decisions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "sadu_private"."consignment_tokens" (
  "consignment_id" uuid                     NOT NULL,
  "token_hash"     text                     NOT NULL,
  "expires_at"     timestamp with time zone NOT NULL,
  "used_at"        timestamp with time zone,
  CONSTRAINT "consignment_tokens_pkey" PRIMARY KEY (consignment_id),
  CONSTRAINT "consignment_tokens_token_hash_key" UNIQUE (token_hash)
);

ALTER TABLE "sadu_private"."consignment_tokens"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."artist_dossiers"
  ADD COLUMN "committee_minutes" text;

ALTER TABLE "public"."artist_dossiers"
  ADD COLUMN "committee_reviewed_at" timestamp WITH time zone;

ALTER TABLE "public"."artist_dossiers"
  ADD COLUMN "committee_reviewed_by" uuid;

ALTER TABLE "public"."sadu_artwork_checklist"
  ADD COLUMN "translation_policy" jsonb GENERATED ALWAYS AS
    ('{"bio": {"requires_translation": true}, "title": {"requires_translation": true}, "medium": {"requires_translation": true}, "concept": {"requires_translation": true}, "dimensions": {"requires_translation": false}, "flight_itinerary": {"requires_translation": false}}'::jsonb) STORED;

ALTER TABLE "public"."sadu_freight_assignments"
  ADD COLUMN "details_due" date GENERATED ALWAYS AS ((closure_start - 5)) STORED;

CREATE TYPE "public"."artist_status" AS ENUM (
  'INCOMPLETE_DOSSIER',
  'HIP_BLOCKED',
  'PENDING_DIRECTOR_REVIEW',
  'DIRECTOR_APPROVED',
  'DIRECTOR_VETOED',
  'PENDING_COMMITTEE_REVIEW',
  'COMMITTEE_REJECTED'
);

CREATE TYPE "sadu_governance"."role" AS ENUM (
  'ADMIN',
  'COORDINATOR',
  'PR_OFFICER',
  'LOGISTICS_OFFICER',
  'EXTERNAL_VENDOR',
  'ARTIST',
  'EDITORIAL',
  'DIRECTOR',
  'FINANCE'
);

ALTER TABLE "sadu_governance"."memberships"
  ADD COLUMN "role" sadu_governance.role NOT NULL;

CREATE OR REPLACE FUNCTION public.sadu_blueprint_not_label()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
 if exists(select 1 from public.sadu_scenario_media where object_name=new.media_object_name and category='BLUEPRINT') then raise exception 'A blueprint cannot replace catalog artwork media';end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION public.sadu_check_booking_origin()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
 if not exists(select 1 from public.sadu_consignments where artwork_id=new.artwork_id and artist_id=auth.uid() and origin='ARTIST_STUDIO') then raise exception 'Select Artist Studio origin; gallery pickups use the consignment ledger';end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION public.sadu_complete_delivery()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare expected int; actual int;
begin
 if new.status='SUBMITTED' and old.status='DRAFT' then
  select expected_count into expected from public.sadu_asset_scope where scenario_id=new.id;
  select count(*) into actual from public.sadu_artwork_checklist where scenario_id=new.id;
  if expected is null or expected<>actual then raise exception 'Approved artwork count must match the complete delivery';end if;
  if exists(select 1 from public.sadu_artwork_checklist a where a.scenario_id=new.id and not exists(select 1 from public.sadu_artwork_values v where v.artwork_id=a.id)) then raise exception 'Every artwork requires a structured declared value';end if;
 end if;return new;
end $function$;

CREATE OR REPLACE FUNCTION public.sadu_condition_contracts()
  RETURNS TABLE (
    id          text,
    artist_id   uuid,
    artist_name text
  )
  LANGUAGE sql
  SET search_path TO ''
  AS $function$select * from sadu_private.condition_contracts()$function$;

REVOKE ALL ON FUNCTION "public"."sadu_condition_contracts"() FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.sadu_decide_freight_change (
  change_id uuid,
  approve   boolean,
  note      text
)
  RETURNS void
  LANGUAGE sql
  SET search_path TO ''
  AS $function$select sadu_private.decide_freight_change(change_id,approve,note)$function$;

REVOKE ALL ON FUNCTION "public"."sadu_decide_freight_change"(uuid, boolean, text) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.sadu_dossier_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SET search_path TO ''
  AS $function$
 select coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role','');
$function$;

CREATE OR REPLACE FUNCTION public.sadu_finalize_guest (
  p_id uuid
)
  RETURNS timestamp WITH time zone
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare at timestamptz;begin
 if not exists(select 1 from public.sadu_guest_intakes where id=p_id and artist_id=auth.uid()) then raise exception 'Own intake required';end if;
 insert into public.sadu_guest_finalizations(intake_id,artist_id) values(p_id,auth.uid()) on conflict(intake_id) do nothing;
 select finalized_at into at from public.sadu_guest_finalizations where intake_id=p_id;return at;
end $function$;

REVOKE ALL ON FUNCTION "public"."sadu_finalize_guest"(uuid) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.sadu_guard_booking()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare k text; role_name text:=coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role'); event_name text;
begin
 if TG_OP='INSERT' then
  if new.artist_id is distinct from auth.uid() or new.ready_date<current_date then raise exception 'Owned current pickup date required';end if;
  if not exists(select 1 from public.sadu_artwork_checklist a join public.sadu_exhibition_scenarios s on s.id=a.scenario_id join public.bilateral_contracts c on c.id=s.contract_id where a.id=new.artwork_id and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED')) then raise exception 'Accepted owned agreement required for freight';end if;
  foreach k in array array['country','city','district','street','building'] loop
   if jsonb_typeof(new.address->k) is distinct from 'string' or length(trim(new.address->>k)) not between 1 and 250 then raise exception 'Complete structured address required';end if;
  end loop;
  new.status:='PENDING_ORIGIN_DISPATCH';new.requested_date:=null;new.change_reason:=null;new.change_status:=null;new.condition_reference:=null;new.history:='[]';event_name:='BOOKED';
 else
  if (to_jsonb(new)-array['ready_date','requested_date','change_reason','change_status','status','condition_reference','history','updated_at']) is distinct from (to_jsonb(old)-array['ready_date','requested_date','change_reason','change_status','status','condition_reference','history','updated_at']) then raise exception 'Booking identity and address are locked';end if;
  if old.status='RECEIVED_CONDITION_CHECKED' then raise exception 'Received shipment is locked';end if;
  if role_name='LOGISTICS' then
   if new.requested_date is distinct from old.requested_date or new.change_reason is distinct from old.change_reason then raise exception 'Artist owns change request';end if;
   if new.change_status is distinct from old.change_status then
    if old.change_status is distinct from 'PENDING' or new.change_status not in ('APPROVED','REJECTED') or new.status<>old.status or old.status<>'PENDING_ORIGIN_DISPATCH' then raise exception 'Pending date-change decision required';end if;
    new.ready_date:=case when new.change_status='APPROVED' then old.requested_date else old.ready_date end;event_name:='DATE_CHANGE_'||new.change_status;
   else
    if new.ready_date<>old.ready_date or new.status=old.status or old.change_status='PENDING' then raise exception 'No direct date edits or dispatch with pending change';end if;
    if not ((old.status='PENDING_ORIGIN_DISPATCH' and new.status='IN_TRANSIT') or (old.status='IN_TRANSIT' and new.status in ('CUSTOMS_CLEARANCE','RECEIVED_CONDITION_CHECKED')) or (old.status='CUSTOMS_CLEARANCE' and new.status='RECEIVED_CONDITION_CHECKED')) then raise exception 'Invalid shipment transition';end if;
    if new.status='RECEIVED_CONDITION_CHECKED' and length(trim(coalesce(new.condition_reference,'')))<3 then raise exception 'Condition inspection reference required';end if;
    event_name:=new.status;
   end if;
  else
   if new.artist_id is distinct from auth.uid() or old.status<>'PENDING_ORIGIN_DISPATCH' or old.change_status='PENDING' or new.status<>old.status or new.ready_date<>old.ready_date or new.condition_reference is distinct from old.condition_reference or new.change_status is distinct from 'PENDING' or new.requested_date is null or new.requested_date<current_date or new.requested_date=old.ready_date or length(trim(coalesce(new.change_reason,'')))<3 then raise exception 'Valid artist date-change request required';end if;
   event_name:='DATE_CHANGE_REQUESTED';
  end if;
  new.history:=old.history;
 end if;
 if new.requested_date between new.unavailable_start and new.unavailable_end then raise exception 'Requested date conflicts with artist travel';end if;
 new.updated_at:=now();new.history:=new.history||jsonb_build_array(jsonb_build_object('event',event_name,'at',now(),'actor',auth.uid(),'date',new.ready_date,'requested_date',new.requested_date));
 return new;
end $function$;

CREATE OR REPLACE FUNCTION public.sadu_guard_committee_gate()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare actor text;
begin
 -- Trusted maintenance/automated compliance only. Never expose service credentials to clients.
 if current_user in ('postgres','service_role','supabase_admin') then
  if TG_OP='DELETE' then return old;else return new;end if;
 end if;
 actor=public.sadu_dossier_role();
 if auth.uid() is null or actor not in ('COORDINATOR','PREPARATORY_COMMITTEE','BIENNIAL_DIRECTOR') or TG_OP='DELETE' then
  raise exception 'Dossier mutation is not authorized' using errcode='42501';
 end if;
 if TG_OP='INSERT' then
  if actor<>'COORDINATOR' or new.status::text<>'INCOMPLETE_DOSSIER' or new.committee_minutes is not null or new.committee_reviewed_at is not null or new.committee_reviewed_by is not null then
   raise exception 'New dossiers must begin incomplete without committee evidence' using errcode='42501';
  end if;
  return new;
 end if;
 if actor='COORDINATOR' then
  if old.status::text<>'INCOMPLETE_DOSSIER' or new.status::text not in ('INCOMPLETE_DOSSIER','PENDING_COMMITTEE_REVIEW')
   or new.id is distinct from old.id or new.committee_minutes is distinct from old.committee_minutes or new.committee_reviewed_at is distinct from old.committee_reviewed_at or new.committee_reviewed_by is distinct from old.committee_reviewed_by then
   raise exception 'Coordinator cannot bypass Committee or alter reviewed dossiers' using errcode='42501';
  end if;
  if new.status::text='PENDING_COMMITTEE_REVIEW' and (nullif(trim(new.name),'') is null or nullif(trim(new.arabic_name),'') is null or nullif(trim(new.nationality),'') is null or nullif(trim(new.medium),'') is null or nullif(trim(new.category),'') is null or nullif(trim(new.cv_url),'') is null or nullif(trim(new.portfolio_url),'') is null or (new.is_commissioned and nullif(trim(new.mockups_url),'') is null)) then
   raise exception 'Complete dossier fields and attachment references before submission';
  end if;
 elsif actor='PREPARATORY_COMMITTEE' then
  if old.status::text<>'PENDING_COMMITTEE_REVIEW' or new.status::text not in ('PENDING_DIRECTOR_REVIEW','COMMITTEE_REJECTED')
   or (to_jsonb(new)-array['status','committee_minutes','updated_at']) is distinct from (to_jsonb(old)-array['status','committee_minutes','updated_at']) then
   raise exception 'Committee may record only a decision and minutes' using errcode='42501';
  end if;
  if length(coalesce(new.committee_minutes,''))>4000 or (new.status::text='COMMITTEE_REJECTED' and nullif(trim(new.committee_minutes),'') is null) then raise exception 'Rejection requires consensus minutes (maximum 4000 characters)';end if;
  new.committee_reviewed_at=clock_timestamp();new.committee_reviewed_by=auth.uid();
 elsif actor='BIENNIAL_DIRECTOR' then
  if old.status::text<>'PENDING_DIRECTOR_REVIEW' or old.committee_reviewed_at is null or old.committee_reviewed_by is null or new.status::text not in ('DIRECTOR_APPROVED','DIRECTOR_VETOED')
   or (to_jsonb(new)-array['status','rejection_reason','updated_at']) is distinct from (to_jsonb(old)-array['status','rejection_reason','updated_at']) then
   raise exception 'Director requires Committee endorsement and cannot edit the dossier' using errcode='42501';
  end if;
  if new.status::text='DIRECTOR_VETOED' and nullif(trim(new.rejection_reason),'') is null then raise exception 'Director veto requires a reason';end if;
 end if;
 new.updated_at=clock_timestamp();return new;
end $function$;

CREATE OR REPLACE FUNCTION public.sadu_guard_contract_update()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  if current_user = 'authenticated' then
    if new.artist_id is distinct from old.artist_id or new.coordinator_id is distinct from old.coordinator_id
      or new.dossier_id is distinct from old.dossier_id or new.id is distinct from old.id then
      raise exception 'Contract identities are immutable' using errcode = '42501';
    end if;
    if auth.jwt()->>'institutional_role' = 'ARTIST'
      and (to_jsonb(new) - array['is_signed','signed_at','signature_reference','status','updated_at'])
        is distinct from (to_jsonb(old) - array['is_signed','signed_at','signature_reference','status','updated_at']) then
      raise exception 'Artist may accept but cannot rewrite terms' using errcode = '42501';
    end if;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.sadu_guard_pickup_calendar()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare today date:=(now() at time zone 'Asia/Dubai')::date;
begin
 if TG_OP='INSERT' then
  if new.ready_date is null or new.ready_date<today or new.ready_date>public.sadu_pickup_deadline() then
   raise exception 'Pickup outside the approved 2026 intake window';
  end if;
 else
  if new.ready_date is distinct from old.ready_date or (new.change_status='APPROVED' and new.change_status is distinct from old.change_status) then
   if new.ready_date is null or new.ready_date<today or new.ready_date>public.sadu_pickup_deadline() then raise exception 'Pickup outside the approved 2026 intake window';end if;
  end if;
  if new.requested_date is distinct from old.requested_date and new.requested_date is not null then
   if new.requested_date<today or new.requested_date>public.sadu_pickup_deadline() then raise exception 'Requested pickup outside the approved 2026 intake window';end if;
  end if;
  if new.status='IN_TRANSIT' and old.status is distinct from new.status and new.ready_date>public.sadu_pickup_deadline() then raise exception 'Dispatch exceeds the approved 2026 intake window';end if;
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION public.sadu_guest_document_snapshot()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare p public.sadu_guest_document_policy;
begin
 select * into p from public.sadu_guest_document_policy where id=true;
 if p.version is null then raise exception 'Guest document policy unavailable';end if;
 if not public.sadu_valid_guest_identity(new.identity,new.arrival) then raise exception 'Complete identity and six-calendar-month passport validity required';end if;
 new.document_policy=jsonb_build_object('version',p.version,'reference',p.reference,'passport_months',6,'national_id_required',(new.identity->>'nationality')=any(p.national_id_countries));
 return new;
end $function$;

REVOKE ALL ON FUNCTION "public"."sadu_guest_document_snapshot"() FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.sadu_guest_finalization_time()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$begin new.finalized_at=clock_timestamp();return new;end $function$;

REVOKE ALL ON FUNCTION "public"."sadu_guest_finalization_time"() FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.sadu_guest_plan_time()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$begin if exists(select 1 from (select * from public.sadu_guest_travel_plans where contract_id=new.contract_id and artist_id=auth.uid() order by created_at desc,id desc limit 1)p where p.arrival=new.arrival and p.departure=new.departure) then return null;end if;new.created_at=clock_timestamp();return new;end $function$;

REVOKE ALL ON FUNCTION "public"."sadu_guest_plan_time"() FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.sadu_guest_snapshot()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
 select c.artist_name,c.status into new.artist_name,new.contract_status from public.bilateral_contracts c
 where c.id=new.contract_id and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED');
 if new.artist_name is null then raise exception 'Owned accepted agreement required';end if;
 new.created_at=clock_timestamp();
 return new;
end $function$;

REVOKE ALL ON FUNCTION "public"."sadu_guest_snapshot"() FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.sadu_issue_consignment (
  a uuid,
  o text,
  n text,
  e text
)
  RETURNS text
  LANGUAGE sql
  SET search_path TO ''
  AS $function$select sadu_private.issue_consignment(a,o,n,e)$function$;

REVOKE ALL ON FUNCTION "public"."sadu_issue_consignment"(uuid, text, text, text) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.sadu_itinerary_stamp()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$begin new.reviewed_by=auth.uid();new.approved_at=clock_timestamp();return new;end $function$;

REVOKE ALL ON FUNCTION "public"."sadu_itinerary_stamp"() FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.sadu_lock_exhibition_title()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
 if auth.jwt()->'app_metadata'->>'institutional_role' is distinct from 'HIP' or old.status<>'PENDING_CURATOR_REVIEW' or new.status<>'LOCKED'
 or new.title_ar is distinct from old.title_ar or new.title_en is distinct from old.title_en or new.scenario_id is distinct from old.scenario_id then raise exception 'Curator title lock required';end if;
 new.locked_at=clock_timestamp();new.locked_by=auth.uid();return new;
end $function$;

REVOKE ALL ON FUNCTION "public"."sadu_lock_exhibition_title"() FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.sadu_logistics_action()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
 if auth.uid() is distinct from old.officer_id or auth.jwt()->'app_metadata'->>'institutional_role' is distinct from 'LOGISTICS' or old.actioned_at is not null then raise exception 'Assigned officer action required';end if;
 new.opened_at=coalesce(old.opened_at,clock_timestamp());
 if old.ready_at<=clock_timestamp()-interval '48 hours' then new.escalated_at=coalesce(old.escalated_at,clock_timestamp());end if;
 if new.action_note is distinct from old.action_note then
 if length(trim(coalesce(new.action_note,''))) not between 10 and 1000 then raise exception 'Meaningful action reference required';end if;
 new.actioned_at=clock_timestamp();
 end if;return new;
end $function$;

REVOKE ALL ON FUNCTION "public"."sadu_logistics_action"() FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.sadu_match_asset_bundle()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare b jsonb;
begin
 select asset_metadata into b from public.sadu_scenario_media where object_name=new.media_object_name;
 if b is not null and (new.source->>'title' is distinct from b->>'title' or new.source->>'medium' is distinct from b->>'medium' or new.production_year is distinct from (b->>'year')::int or new.height_cm is distinct from (b->>'height')::numeric or new.width_cm is distinct from (b->>'width')::numeric) then raise exception 'Catalog data must match the immutable uploaded artwork bundle';end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION public.sadu_operational_guest_calendar()
  RETURNS TABLE (
    contract_id       text,
    artist_name       text,
    arrival           date,
    departure         date,
    arrival_airport   text,
    departure_airport text,
    approved_at       timestamp with time zone
  )
  LANGUAGE sql
  STABLE
  SET search_path TO ''
  AS $function$select * from sadu_private.operational_guest_calendar();$function$;

REVOKE ALL ON FUNCTION "public"."sadu_operational_guest_calendar"() FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.sadu_pickup_deadline()
  RETURNS date
  LANGUAGE sql
  IMMUTABLE
  SET search_path TO ''
  AS $function$select date '2026-09-10'$function$;

CREATE OR REPLACE FUNCTION public.sadu_pr_guest_roster()
  RETURNS TABLE (
    id          text,
    artist_name text
  )
  LANGUAGE sql
  STABLE
  SET search_path TO ''
  AS $function$select * from sadu_private.pr_guest_roster();$function$;

REVOKE ALL ON FUNCTION "public"."sadu_pr_guest_roster"() FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.sadu_prepare_publication()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare title_row public.sadu_exhibition_titles; items jsonb; expected integer; actual integer;
begin
 if auth.uid() is null or auth.jwt()->'app_metadata'->>'institutional_role' is distinct from 'EDITORIAL' then raise exception 'Editorial required' using errcode='42501';end if;
 perform 1 from public.sadu_exhibition_scenarios where id=new.scenario_id and status='SUBMITTED';
 if not found then raise exception 'Submitted scenario required';end if;
 select * into title_row from public.sadu_exhibition_titles where scenario_id=new.scenario_id and status='LOCKED';
 if not found then raise exception 'Locked bilingual exhibition title required';end if;
 select expected_count into expected from public.sadu_asset_scope where scenario_id=new.scenario_id;
 select count(*) into actual from public.sadu_artwork_checklist where scenario_id=new.scenario_id;
 if expected is null or actual<>expected or actual=0 then raise exception 'Complete approved artwork set required';end if;
 if exists(select 1 from public.sadu_artwork_checklist a where a.scenario_id=new.scenario_id and (
 a.translation_status<>'TRANSLATION_COMPLETED' or a.religious_text is null or
 (length(trim(coalesce(a.source->>'bio','')))>0 and (length(trim(coalesce(a.translation_ar->>'bio','')))=0 or length(trim(coalesce(a.translation_en->>'bio','')))=0)) or
 exists(select 1 from (values ('ar'),('en')) lang(code) cross join (values ('title'),('medium'),('concept')) field(key) where length(trim(coalesce((case when a.source->>'language'=lang.code then a.source else case when lang.code='ar' then a.translation_ar else a.translation_en end end)->>field.key,'')))=0) or
 length(trim(coalesce(case when a.source->>'language'='ar' then a.source->>'title' else a.translation_ar->>'title' end,'')))=0 or
 length(trim(coalesce(case when a.source->>'language'='en' then a.source->>'title' else a.translation_en->>'title' end,'')))=0 or
 not exists(select 1 from public.sadu_media_inventory i where i.object_name=a.media_object_name and i.received and i.reviewed_at is not null))) then raise exception 'Bilingual text and individual media review required';end if;
 select jsonb_agg(jsonb_build_object('reference_id',a.id,'ar',jsonb_build_object('title',(case when a.source->>'language'='ar' then a.source else a.translation_ar end)->>'title','medium',(case when a.source->>'language'='ar' then a.source else a.translation_ar end)->>'medium','concept',(case when a.source->>'language'='ar' then a.source else a.translation_ar end)->>'concept','bio',(case when a.source->>'language'='ar' then a.source else a.translation_ar end)->>'bio'),'en',jsonb_build_object('title',(case when a.source->>'language'='en' then a.source else a.translation_en end)->>'title','medium',(case when a.source->>'language'='en' then a.source else a.translation_en end)->>'medium','concept',(case when a.source->>'language'='en' then a.source else a.translation_en end)->>'concept','bio',(case when a.source->>'language'='en' then a.source else a.translation_en end)->>'bio'),'media_object',a.media_object_name,'year',a.production_year,'height_cm',a.height_cm,'width_cm',a.width_cm) order by a.id) into items from public.sadu_artwork_checklist a where a.scenario_id=new.scenario_id;
 new.payload=jsonb_build_object('schema_version',1,'exhibition_title',jsonb_build_object('ar',title_row.title_ar,'en',title_row.title_en),'artworks',items);
 new.status='PENDING_CMS_CONNECTION';new.approved_at=clock_timestamp();new.approved_by=auth.uid();new.delivered_at=null;return new;
end $function$;

REVOKE ALL ON FUNCTION "public"."sadu_prepare_publication"() FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.sadu_receive_consignment (
  t text,
  d jsonb
)
  RETURNS void
  LANGUAGE sql
  SET search_path TO ''
  AS $function$select sadu_private.receive_consignment(t,d)$function$;

CREATE OR REPLACE FUNCTION public.sadu_record_visa_refusal (
  p_intake    uuid,
  p_reference text
)
  RETURNS timestamp WITH time zone
  LANGUAGE sql
  SET search_path TO ''
  AS $function$select sadu_private.record_visa_refusal(p_intake,p_reference);$function$;

REVOKE ALL ON FUNCTION "public"."sadu_record_visa_refusal"(uuid, text) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.sadu_require_asset_bundle()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare k text;
begin
 if new.category='BLUEPRINT' then return new;end if;
 foreach k in array array['title','medium','year','height','width','depth'] loop
  if jsonb_typeof(new.asset_metadata->k) is distinct from 'string' or length(trim(new.asset_metadata->>k)) not between 1 and 250 then raise exception 'Artwork metadata required before upload';end if;
 end loop;
 if new.asset_metadata->>'year' !~ '^\d{4}$' or (new.asset_metadata->>'year')::int not between 1000 and extract(year from current_date)::int then raise exception 'Invalid production year';end if;
 foreach k in array array['height','width','depth'] loop
  if new.asset_metadata->>k !~ '^[0-9]+(\.[0-9]+)?$' or (new.asset_metadata->>k)::numeric<=0 or (new.asset_metadata->>k)::numeric>=100000 then raise exception 'Invalid artwork dimensions';end if;
 end loop;return new;
end $function$;

CREATE OR REPLACE FUNCTION public.sadu_require_execution_escrow()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
 if new.status='CONTRACT_EXECUTED' and (TG_OP='INSERT' or old.status is distinct from new.status) then
  if not exists(select 1 from public.sadu_asset_escrow e where e.contract_id=new.id and e.escrow_ready) then raise exception 'Execution blocked: submitted private assets and required blueprints missing';end if;
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION public.sadu_require_label_declaration()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
 if TG_OP='INSERT' and new.religious_text is null then raise exception 'Explicit religious text declaration required'; end if;
 if TG_OP='UPDATE' and new.religious_text is distinct from old.religious_text then raise exception 'Submitted formatting declaration is immutable'; end if;
 return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sadu_require_labels()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare z jsonb;
begin
 if exists(select 1 from public.sadu_artwork_checklist a where a.scenario_id=new.id and not exists(select 1 from jsonb_array_elements(new.artwork_checklist) as entry(value) where entry.value->>'id'=a.zone_id::text)) then raise exception 'Cannot remove a zone with locked artwork metadata';end if;
 if new.status='SUBMITTED' and old.status='DRAFT' then
  for z in select value from jsonb_array_elements(new.artwork_checklist) loop
   if (select count(*) from public.sadu_artwork_checklist where scenario_id=new.id and zone_id=(z->>'id')::uuid)<>(z->>'artworkCount')::integer then raise exception 'Every artwork requires catalog and rational metadata';end if;
  end loop;
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION public.sadu_stamp_media_review()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
 if auth.uid() is null or auth.jwt()->'app_metadata'->>'institutional_role' is distinct from 'EDITORIAL' then raise exception 'Editorial required' using errcode='42501';end if;
 select o.id into new.object_id from storage.objects o join public.sadu_scenario_media m on m.object_name=o.name join public.sadu_exhibition_scenarios s on s.id=m.scenario_id where m.object_name=new.object_name and m.category in ('PRINT','AV') and s.status='SUBMITTED' and o.bucket_id='logistics-secure' and (o.metadata->>'size')::bigint>0;
 if new.object_id is null then raise exception 'Completed submitted artwork upload required';end if;
 new.reviewed_at=clock_timestamp();new.reviewed_by=auth.uid();return new;
end $function$;

REVOKE ALL ON FUNCTION "public"."sadu_stamp_media_review"() FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.sadu_valid_guest_identity (
  v       jsonb,
  arrival date
)
  RETURNS boolean
  LANGUAGE plpgsql
  IMMUTABLE
  SET search_path TO ''
  AS $function$
declare k text;begin
 if jsonb_typeof(v)<>'object' then return false;end if;
 foreach k in array array['passportNumber','passportExpiry','nationality','birthDate','birthPlace','email','phone'] loop
  if jsonb_typeof(v->k) is distinct from 'string' or length(trim(v->>k)) not between 1 and 200 then return false;end if;
 end loop;
 if (v->>'birthDate') !~ '^\d{4}-\d{2}-\d{2}$' or (v->>'passportExpiry') !~ '^\d{4}-\d{2}-\d{2}$' then return false;end if;
 if (v->>'birthDate')::date>=arrival or (v->>'passportExpiry')::date<(arrival+interval '6 months')::date or (v->>'nationality') !~ '^[A-Z]{2}$' or (v->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then return false;end if;
 return not exists(select 1 from jsonb_each(v) where jsonb_typeof(value)<>'string' or length(value#>>'{}')>200);
 exception when others then return false;
end $function$;

REVOKE ALL ON FUNCTION "public"."sadu_valid_guest_identity"(jsonb, date) FROM PUBLIC, "anon";

CREATE OR REPLACE FUNCTION public.sadu_validate_condition_report()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare p text;
begin
 if TG_OP='INSERT' then
  new.created_at:=now();new.decision_at:=null;new.decided_by:=null;
  for p in select jsonb_array_elements_text(new.photos) loop
   if p !~ ('^'||new.artist_id::text||'/condition-reports/'||new.id::text||'/[a-f0-9-]+\.(jpg|png)$') then raise exception 'Invalid evidence path';end if;
  end loop;
 elsif old.status='DRAFT' and new.status='DAMAGED_PENDING_ARTIST_APPROVAL' then
  if old.reporter_id<>auth.uid() or coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role') is distinct from 'LOGISTICS' then raise exception 'Registrar required';end if;
  for p in select jsonb_array_elements_text(old.photos) loop
   if not exists(select 1 from storage.objects where bucket_id='logistics-secure' and name=p and (metadata->>'size')::bigint between 1 and 10485760 and metadata->>'mimetype' in ('image/png','image/jpeg')) then raise exception 'Upload evidence before routing';end if;
  end loop;
 elsif old.status='DAMAGED_PENDING_ARTIST_APPROVAL' and new.status in ('REPAIR_AUTHORIZED','ARTIST_REPAIR_PLANNED') then
  if old.artist_id<>auth.uid() then raise exception 'Owning artist required';end if;
  new.decision_at:=now();new.decided_by:=auth.uid();
 else raise exception 'Condition report transition forbidden';
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION public.sadu_validate_label()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare k text; s public.sadu_exhibition_scenarios; zone jsonb; target jsonb; lang text;
begin
 if TG_OP='INSERT' then
  select * into s from public.sadu_exhibition_scenarios where id=new.scenario_id for update;
  if s.artist_id is distinct from auth.uid() or s.status<>'DRAFT' then raise exception 'Owned draft scenario required';end if;
  select value into zone from jsonb_array_elements(s.artwork_checklist) where value->>'id'=new.zone_id::text;
  if zone is null or (select count(*) from public.sadu_artwork_checklist where scenario_id=new.scenario_id and zone_id=new.zone_id)>=(zone->>'artworkCount')::integer then raise exception 'Zone missing or artwork count exceeded';end if;
  if not exists(select 1 from public.sadu_scenario_media m join storage.objects o on o.name=m.object_name and o.bucket_id='logistics-secure' where m.object_name=new.media_object_name and m.scenario_id=new.scenario_id and m.zone_id=new.zone_id and (o.metadata->>'size')::bigint>0) then raise exception 'Uploaded artwork file required';end if;
  if not exists(select 1 from public.bilateral_contracts c where c.id=s.contract_id and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED')) then raise exception 'Accepted contract required';end if;
  foreach k in array array['title','medium','concept','language'] loop
   if jsonb_typeof(new.source->k) is distinct from 'string' or length(trim(new.source->>k)) not between 1 and 2000 then raise exception 'Source metadata incomplete';end if;
  end loop;
  if new.source->>'language' not in ('en','fr','ar') or cardinality(regexp_split_to_array(trim(new.source->>'concept'),'\s+'))>50 then raise exception 'Invalid language or concept exceeds 50 words';end if;
  if (new.source ? 'bio' and (jsonb_typeof(new.source->'bio')<>'string' or length(new.source->>'bio')>2000)) or (new.source ? 'title_ar' and jsonb_typeof(new.source->'title_ar')<>'string') then raise exception 'Invalid optional source text';end if;
  new.translation_status:='PENDING_TRANSLATION';new.translation_ar:=null;new.translation_en:=null;new.translation_receipts:='[]';new.translated_by:=null;new.translated_at:=null;new.created_at:=now();
 else
  if (old.translation_status<>'PENDING_TRANSLATION' and not (old.source->>'language'<>'en' and old.translation_en is null)) or new.translation_status<>'TRANSLATION_COMPLETED' or (auth.jwt()->'app_metadata'->>'institutional_role')<>'EDITORIAL' then raise exception 'Editorial approval required';end if;
  if (to_jsonb(new)-array['translation_policy','translation_ar','translation_en','translation_receipts','translation_status','translated_by','translated_at']) is distinct from (to_jsonb(old)-array['translation_policy','translation_ar','translation_en','translation_receipts','translation_status','translated_by','translated_at']) then raise exception 'Submitted source and dimensions are immutable';end if;
  if new.source->>'language'='ar' then new.translation_ar:=new.source;end if;
  if new.source->>'language'='en' then new.translation_en:=new.source;end if;
  foreach lang in array array['ar','en'] loop
   target:=case when lang='ar' then new.translation_ar else new.translation_en end;
   foreach k in array array['title','medium','concept'] loop
    if jsonb_typeof(target->k) is distinct from 'string' or length(trim(target->>k)) not between 1 and 2000 then raise exception 'Bilingual public text incomplete';end if;
   end loop;
   if length(trim(coalesce(new.source->>'bio','')))>0 and (jsonb_typeof(target->'bio') is distinct from 'string' or length(trim(target->>'bio')) not between 1 and 2000) then raise exception 'Biography translation required';end if;
   if cardinality(regexp_split_to_array(trim(target->>'concept'),'\s+'))>50 then raise exception 'Translated concept exceeds 50 words';end if;
  end loop;
  if old.translation_status='TRANSLATION_COMPLETED' and old.source->>'language'='fr' and new.translation_ar is distinct from old.translation_ar then raise exception 'Existing approved Arabic is locked';end if;
  new.translation_receipts:=old.translation_receipts||case when old.translation_status='TRANSLATION_COMPLETED' then jsonb_build_array(jsonb_build_object('actor',old.translated_by,'at',old.translated_at,'source',old.source,'ar',old.translation_ar,'en',old.translation_en,'legacy',true)) else '[]'::jsonb end||jsonb_build_array(jsonb_build_object('actor',auth.uid(),'at',clock_timestamp(),'source',old.source,'ar',new.translation_ar,'en',new.translation_en));
  new.translated_by:=auth.uid();new.translated_at:=now();
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION public.sadu_value_stamp()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$begin
 select source->>'title' into new.title from public.sadu_artwork_checklist where id=new.artwork_id;
 if new.title is null then raise exception 'Owned artwork required';end if;
 new.artist_id:=auth.uid();new.recorded_at:=clock_timestamp();return new;
end $function$;

CREATE OR REPLACE FUNCTION public.validate_exhibition_scenario()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare z jsonb; cat text; n integer; seen text[]:=array[]::text[];
begin
 if TG_OP='UPDATE' and (old.status='SUBMITTED' or new.id<>old.id or new.contract_id<>old.contract_id or new.artist_id<>old.artist_id or new.coordinator_id is distinct from old.coordinator_id) then raise exception 'Scenario is immutable'; end if;
 if not exists(select 1 from public.bilateral_contracts c where c.id=new.contract_id and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED')) then raise exception 'Accepted owned contract required';end if;
 if jsonb_typeof(new.artwork_checklist)<>'array' or jsonb_array_length(new.artwork_checklist)>30 then raise exception 'Invalid checklist';end if;
 if new.status='SUBMITTED' then
  if jsonb_array_length(new.artwork_checklist)=0 then raise exception 'Zones required';end if;
  for z in select value from jsonb_array_elements(new.artwork_checklist) loop
   if coalesce(z->>'id','')='' or (z->>'id')=any(seen) then raise exception 'Unique zone ID required';end if;
   perform (z->>'id')::uuid; seen:=array_append(seen,z->>'id');
   n:=(z->>'artworkCount')::integer;
   if n is null or n<1 or n>100 or length(trim(coalesce(z->>'name',''))) not between 1 and 150 or length(trim(coalesce(z->>'medium',''))) not between 1 and 250 or length(trim(coalesce(z->>'displaySpecifications',''))) not between 1 and 4000 or jsonb_typeof(z->'avRequired') is distinct from 'boolean' or jsonb_typeof(z->'darkRoom') is distinct from 'boolean' or jsonb_typeof(z->'printRequired') is distinct from 'boolean' or not ((z->>'avRequired')::boolean or (z->>'printRequired')::boolean) then raise exception 'Complete zone fields and declare media';end if;
   if z ? 'requires_spatial_planning' and jsonb_typeof(z->'requires_spatial_planning') is distinct from 'boolean' then raise exception 'Spatial requirement must be boolean';end if;
   foreach cat in array array['PRINT','AV','BLUEPRINT'] loop
    if (cat='PRINT' and (z->>'printRequired')::boolean) or (cat='AV' and (z->>'avRequired')::boolean) or (cat='BLUEPRINT' and coalesce((z->>'requires_spatial_planning')::boolean,false)) then
     if not exists(select 1 from public.sadu_scenario_media m join storage.objects o on o.name=m.object_name and o.bucket_id='logistics-secure' where m.scenario_id=new.id and m.zone_id=(z->>'id')::uuid and m.category=cat and (o.metadata->>'size')::bigint between 1 and 2147483648 and ((cat='PRINT' and o.metadata->>'mimetype' in ('image/png','image/tiff')) or (cat='AV' and o.metadata->>'mimetype' in ('video/mp4','video/quicktime')) or (cat='BLUEPRINT' and o.metadata->>'mimetype'='application/pdf' and (o.metadata->>'size')::bigint<=20971520))) then raise exception 'Uploaded media missing for zone';end if;
    end if;
   end loop;
  end loop;
  new.submitted_at:=now();
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION sadu_governance.immutable_record()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$begin raise exception 'Immutable receipt: create an explicit new revision';end$function$;

CREATE OR REPLACE FUNCTION sadu_private.condition_contracts()
  RETURNS TABLE (
    id          text,
    artist_id   uuid,
    artist_name text
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
 select c.id,c.artist_id,c.artist_name from public.bilateral_contracts c where auth.uid() is not null and coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role')='LOGISTICS' and c.status in ('ARTIST_APPROVED','LOCKED')
$function$;

CREATE OR REPLACE FUNCTION sadu_private.decide_freight_change (
  change_id uuid,
  approve   boolean,
  note      text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare r public.sadu_freight_changes;c public.sadu_consignments;role_name text:=auth.jwt()->'app_metadata'->>'institutional_role';
begin
 if auth.uid() is null or role_name not in ('LOGISTICS','FINANCE') or role_name is null then raise exception 'Logistics or Finance decision required' using errcode='42501';end if;
 if approve is null or length(trim(coalesce(note,''))) not between 10 and 1000 then raise exception 'Decision reference required';end if;
 select * into r from public.sadu_freight_changes where id=change_id for update;
 if r.id is null or r.status<>'PENDING' then raise exception 'Pending request required';end if;
 select * into c from public.sadu_consignments where id=r.consignment_id for update;
 if c.freight_revision<>r.base_revision then raise exception 'Stale revision';end if;
 if not approve then update public.sadu_freight_changes set status='REJECTED',decision_note=coalesce(decision_note||E'\n','')||role_name||': '||note,decided_at=clock_timestamp(),decided_by=auth.uid() where id=r.id;return;end if;
 if role_name='LOGISTICS' then
 if r.logistics_at is not null or r.finance_by=auth.uid() then raise exception 'Independent unrepeated decision required';end if;
 update public.sadu_freight_changes set logistics_by=auth.uid(),logistics_at=clock_timestamp(),decision_note=coalesce(decision_note||E'\n','')||'Logistics: '||note where id=r.id;
 else
 if r.finance_at is not null or r.logistics_by=auth.uid() then raise exception 'Independent unrepeated decision required';end if;
 update public.sadu_freight_changes set finance_by=auth.uid(),finance_at=clock_timestamp(),decision_note=coalesce(decision_note||E'\n','')||'Finance: '||note where id=r.id;
 end if;
 select * into r from public.sadu_freight_changes where id=change_id;
 if r.logistics_at is not null and r.finance_at is not null then
 if r.kind='CLOSURE' then update public.sadu_freight_assignments set closure_start=(r.proposal->>'closure_start')::date,reopens_on=(r.proposal->>'reopens_on')::date,facility_timezone=r.proposal->>'facility_timezone' where consignment_id=r.consignment_id;
 else update public.sadu_consignments set details=details||r.proposal where id=r.consignment_id;end if;
 update public.sadu_consignments set freight_revision=freight_revision+1 where id=r.consignment_id;
 update public.sadu_freight_changes set status='APPROVED',decided_at=clock_timestamp(),decided_by=auth.uid() where id=r.id;
 end if;
end $function$;

CREATE OR REPLACE FUNCTION sadu_private.escalate_freight_closures()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
 update public.sadu_freight_alerts r set status='RESOLVED',resolved_at=clock_timestamp() from public.sadu_consignments c where r.consignment_id=c.id and r.status='OPEN' and (c.status<>'AWAITING_GALLERY' or c.freight_revision<>r.freight_revision);
 insert into public.sadu_freight_alerts(consignment_id,freight_revision) select a.consignment_id,c.freight_revision from public.sadu_freight_assignments a join public.sadu_consignments c on c.id=a.consignment_id where c.status='AWAITING_GALLERY' and clock_timestamp()>=a.details_due::timestamp at time zone a.facility_timezone on conflict do nothing;
end $function$;

CREATE OR REPLACE FUNCTION sadu_private.escalate_logistics_sla()
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
 update public.sadu_logistics_tickets set escalated_at=clock_timestamp() where actioned_at is null and escalated_at is null and ready_at<=clock_timestamp()-interval '48 hours';
$function$;

CREATE OR REPLACE FUNCTION sadu_private.finance_artwork_visible (
  p_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
 select auth.uid() is not null and auth.jwt()->'app_metadata'->>'institutional_role'='FINANCE' and exists(select 1 from public.sadu_artwork_checklist a join public.sadu_exhibition_scenarios s on s.id=a.scenario_id where a.id=p_id and s.status='SUBMITTED');
$function$;

CREATE OR REPLACE FUNCTION sadu_private.issue_consignment (
  a uuid,
  o text,
  n text,
  e text
)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare owner_id uuid; cid uuid; secret text; oldrow public.sadu_consignments;
begin
 select s.artist_id into owner_id from public.sadu_artwork_checklist w
 join public.sadu_exhibition_scenarios s on s.id=w.scenario_id
 join public.bilateral_contracts c on c.id=s.contract_id
 where w.id=a and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED') for update of w;
 if auth.uid() is null or owner_id is distinct from auth.uid() then raise exception 'Owned accepted agreement required';end if;
 if o is null or o not in ('ARTIST_STUDIO','THIRD_PARTY_GALLERY') then raise exception 'Dispatch origin required';end if;
 select * into oldrow from public.sadu_consignments where artwork_id=a;
 if oldrow.status='CONSIGNMENT_DATA_RECEIVED' or exists(select 1 from public.sadu_freight_bookings where artwork_id=a) then raise exception 'Origin locked after submission or booking';end if;
 if o='THIRD_PARTY_GALLERY' and (length(trim(coalesce(n,''))) not between 1 and 200 or length(coalesce(e,''))>254 or coalesce(e,'') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'Gallery name and email required';end if;
 insert into public.sadu_consignments(artwork_id,artist_id,origin,contact_name,contact_email,status)
 values(a,auth.uid(),o,case when o='THIRD_PARTY_GALLERY' then trim(n) end,case when o='THIRD_PARTY_GALLERY' then trim(e) end,case when o='ARTIST_STUDIO' then 'STUDIO_SELECTED' else 'AWAITING_GALLERY' end)
 on conflict(artwork_id) do update set origin=excluded.origin,contact_name=excluded.contact_name,contact_email=excluded.contact_email,status=excluded.status returning id into cid;
 if o='ARTIST_STUDIO' then delete from sadu_private.consignment_tokens where consignment_id=cid;return null;end if;
 secret:=encode(extensions.gen_random_bytes(32),'hex');
 insert into sadu_private.consignment_tokens values(cid,encode(extensions.digest(secret,'sha256'),'hex'),now()+interval '7 days',null)
 on conflict(consignment_id) do update set token_hash=excluded.token_hash,expires_at=excluded.expires_at,used_at=null;
 return secret;
end $function$;

CREATE OR REPLACE FUNCTION sadu_private.lock_approved_visa_template()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin if old.approved_at is not null then raise exception 'Approved template is immutable; create a new version';end if;return new;end $function$;

CREATE OR REPLACE FUNCTION sadu_private.logistics_ready()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare route public.sadu_logistics_routing;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501';end if;
 select g.artist_id into new.artist_id from public.sadu_consignments g join public.sadu_artwork_checklist a on a.id=g.artwork_id join public.sadu_exhibition_scenarios s on s.id=a.scenario_id join public.bilateral_contracts c on c.id=s.contract_id where g.id=new.consignment_id and g.artist_id=auth.uid() and g.status='CONSIGNMENT_DATA_RECEIVED' and length(trim(coalesce(g.details->>'packing_list','')))>0 and c.status in ('ARTIST_APPROVED','LOCKED');
 if new.artist_id is null then raise exception 'Owned complete gallery packing list and accepted agreement required';end if;
 select * into route from public.sadu_logistics_routing where singleton;
 if not exists(select 1 from auth.users where id=route.officer_id and raw_app_meta_data->>'institutional_role'='LOGISTICS') or not exists(select 1 from auth.users where id=route.head_id and raw_app_meta_data->>'institutional_role' in ('BIENNIAL_DIRECTOR','CHAIRMAN')) then raise exception 'Configure provisioned Logistics officer and department head accounts';end if;
 new.officer_id=route.officer_id;new.head_id=route.head_id;new.ready_at=clock_timestamp();return new;
end $function$;

CREATE OR REPLACE FUNCTION sadu_private.operational_guest_calendar()
  RETURNS TABLE (
    contract_id       text,
    artist_name       text,
    arrival           date,
    departure         date,
    arrival_airport   text,
    departure_airport text,
    approved_at       timestamp with time zone
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
 select r.contract_id,r.artist_name,r.arrival,r.departure,r.airport,r.departure_airport,a.approved_at
 from public.sadu_guest_itinerary_approvals a join public.sadu_guest_intakes r on r.id=a.intake_id join public.bilateral_contracts c on c.id=r.contract_id
 where auth.uid() is not null and auth.jwt()->'app_metadata'->>'institutional_role' in ('TECHNICAL','PR_PROTOCOL','BIENNIAL_DIRECTOR','HIP')
 and c.status in ('ARTIST_APPROVED','LOCKED')
 and not exists(select 1 from public.sadu_visa_refusals v where v.contract_id=r.contract_id)
 and exists(select 1 from (select * from public.sadu_guest_travel_plans p where p.contract_id=r.contract_id order by created_at desc,id desc limit 1)p where p.arrival=r.arrival and p.departure=r.departure)
 and not exists(select 1 from public.sadu_guest_intakes n join public.sadu_guest_finalizations f on f.intake_id=n.id where n.contract_id=r.contract_id and (n.created_at,n.id)>(r.created_at,r.id));
$function$;

CREATE OR REPLACE FUNCTION sadu_private.packing_ready_guard()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
 if not exists(select 1 from public.sadu_consignments c where c.id=new.consignment_id and c.details->>'packing_type' in ('MUSEUM_CRATE','SOFT_PACK') and length(trim(coalesce(c.details->>'return_address','')))>0) or exists(select 1 from public.sadu_freight_changes where consignment_id=new.consignment_id and status='PENDING') then raise exception 'Shipping held: packing, return destination or pending amendment';end if;return new;
end $function$;

CREATE OR REPLACE FUNCTION sadu_private.pr_guest_roster()
  RETURNS TABLE (
    id          text,
    artist_name text
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
 select c.id,c.artist_name from public.bilateral_contracts c
 where auth.uid() is not null and auth.jwt()->'app_metadata'->>'institutional_role'='PR_PROTOCOL'
 and c.status in ('ARTIST_APPROVED','LOCKED');
$function$;

CREATE OR REPLACE FUNCTION sadu_private.prepare_freight_change()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare c public.sadu_consignments;k text;
begin
 select * into c from public.sadu_consignments where id=new.consignment_id for update;
 if auth.uid() is null or not coalesce((c.artist_id=auth.uid() or auth.jwt()->'app_metadata'->>'institutional_role'='LOGISTICS' or (auth.jwt()->'app_metadata'->>'institutional_role'='EXTERNAL_VENDOR' and exists(select 1 from public.sadu_freight_assignments a where a.consignment_id=c.id and a.vendor_id=auth.uid()))),false) then raise exception 'Owned or assigned freight authority required' using errcode='42501';end if;
 if c.status<>'CONSIGNMENT_DATA_RECEIVED' and not (new.kind='CLOSURE' and c.status='AWAITING_GALLERY') then raise exception 'Submitted baseline required';end if;
 if new.proposal is null or jsonb_typeof(new.proposal)<>'object' or octet_length(new.proposal::text)>10000 then raise exception 'Structured proposal required';end if;
 if new.kind='PACKING' then
 if coalesce(new.proposal->>'packing_type','') not in ('MUSEUM_CRATE','SOFT_PACK') then raise exception 'Completed protective packaging required';end if;
 foreach k in array array['length_cm','width_cm','height_cm','weight_kg'] loop if jsonb_typeof(new.proposal->k) is distinct from 'number' or (new.proposal->>k)::numeric<=0 or (new.proposal->>k)::numeric>100000000 then raise exception 'Measured packed dimensions and weight required';end if;end loop;
 if length(trim(coalesce(new.proposal->>'packing_list',''))) not between 1 and 500 then raise exception 'Packing contents required';end if;
 select jsonb_object_agg(key,value) into new.proposal from jsonb_each(new.proposal) where key=any(array['packing_type','length_cm','width_cm','height_cm','weight_kg','packing_list']);
 elsif new.kind='RETURN' then
 foreach k in array array['return_country','return_city','return_address'] loop if length(trim(coalesce(new.proposal->>k,''))) not between 1 and 500 then raise exception 'Exact return destination required';end if;end loop;
 select jsonb_object_agg(key,value) into new.proposal from jsonb_each(new.proposal) where key=any(array['return_country','return_city','return_address']);
 else
 if not exists(select 1 from public.sadu_freight_assignments where consignment_id=c.id) then raise exception 'Recorded closure baseline required';end if;
 if coalesce(new.proposal->>'closure_start','') !~ '^\d{4}-\d{2}-\d{2}$' or coalesce(new.proposal->>'reopens_on','') !~ '^\d{4}-\d{2}-\d{2}$' or (new.proposal->>'reopens_on')::date<=(new.proposal->>'closure_start')::date or not exists(select 1 from pg_catalog.pg_timezone_names where name=new.proposal->>'facility_timezone') then raise exception 'Valid closure dates and timezone required';end if;
 select jsonb_object_agg(key,value) into new.proposal from jsonb_each(new.proposal) where key=any(array['closure_start','reopens_on','facility_timezone']);
 end if;
 new.base_revision=c.freight_revision;new.before_snapshot=jsonb_build_object('details',c.details,'closure',(select jsonb_build_object('closure_start',a.closure_start,'reopens_on',a.reopens_on,'facility_timezone',a.facility_timezone) from public.sadu_freight_assignments a where a.consignment_id=c.id));new.requested_at=clock_timestamp();new.requested_by=auth.uid();return new;
end $function$;

CREATE OR REPLACE FUNCTION sadu_private.queue_asset_reminders()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
 update public.sadu_asset_reminders q set status='CANCELLED' where q.status='PENDING_DELIVERY' and (not exists(select 1 from public.sadu_exhibition_scenarios s join public.bilateral_contracts c on c.id=s.contract_id where s.id=q.scenario_id and c.status in ('ARTIST_APPROVED','LOCKED')) or exists(select 1 from public.sadu_asset_scope a where a.scenario_id=q.scenario_id and (select count(*) from public.sadu_artwork_checklist w where w.scenario_id=a.scenario_id)>=a.expected_count));
 insert into public.sadu_asset_reminders(scenario_id)
 select a.scenario_id from public.sadu_asset_scope a join public.sadu_exhibition_scenarios s on s.id=a.scenario_id join public.bilateral_contracts c on c.id=s.contract_id
 where c.status in ('ARTIST_APPROVED','LOCKED') and a.approved_at<=clock_timestamp()-interval '48 hours' and (select count(*) from public.sadu_artwork_checklist w where w.scenario_id=a.scenario_id)<a.expected_count on conflict do nothing;
end $function$;

CREATE OR REPLACE FUNCTION sadu_private.queue_guest_reminders()
  RETURNS void
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
 update public.sadu_guest_reminder_outbox o set status='CANCELLED' where status='PENDING_DELIVERY' and (
 exists(select 1 from public.sadu_guest_finalizations f join public.sadu_guest_intakes r on r.id=f.intake_id join public.sadu_guest_travel_plans p on p.id=o.plan_id where r.contract_id=o.contract_id and r.arrival=p.arrival and r.departure=p.departure)
 or not exists(select 1 from public.bilateral_contracts c where c.id=o.contract_id and c.status in ('ARTIST_APPROVED','LOCKED'))
 or exists(select 1 from public.sadu_guest_travel_plans newer join public.sadu_guest_travel_plans old on old.id=o.plan_id where newer.contract_id=o.contract_id and (newer.created_at,newer.id)>(old.created_at,old.id))
 or o.deadline<>(select (r.arrival-p.lead_days+time '23:59:59') at time zone 'Asia/Dubai' from public.sadu_guest_travel_plans r cross join public.sadu_guest_deadline_policy p where r.id=o.plan_id));
 insert into public.sadu_guest_reminder_outbox(contract_id,artist_id,plan_id,deadline,stage)
 select r.contract_id,r.artist_id,r.id,d.deadline,case when now()>=d.deadline then 'FINAL' when now()>=d.deadline-interval '7 days' then '7_DAYS' else '14_DAYS' end
 from (select distinct on(contract_id) * from public.sadu_guest_travel_plans order by contract_id,created_at desc,id desc) r
 join public.bilateral_contracts c on c.id=r.contract_id and c.status in ('ARTIST_APPROVED','LOCKED') cross join public.sadu_guest_deadline_policy p
 cross join lateral(select (r.arrival-p.lead_days+time '23:59:59') at time zone 'Asia/Dubai' as deadline)d
 where now()>=d.deadline-interval '14 days' and not exists(select 1 from public.sadu_guest_finalizations f join public.sadu_guest_intakes i on i.id=f.intake_id where i.contract_id=r.contract_id and i.arrival=r.arrival and i.departure=r.departure)
 on conflict(plan_id,deadline,stage) do nothing;
 update public.sadu_guest_reminder_outbox o set status='CANCELLED' where o.status='PENDING_DELIVERY' and ((o.stage='14_DAYS' and now()>=o.deadline-interval '7 days') or (o.stage='7_DAYS' and now()>=o.deadline));
end $function$;

CREATE OR REPLACE FUNCTION sadu_private.receive_consignment (
  t text,
  d jsonb
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare ticket sadu_private.consignment_tokens; k text; v numeric;
begin
 if t is null or t !~ '^[a-f0-9]{64}$' then raise exception 'Link invalid, expired or already used';end if;
 select * into ticket from sadu_private.consignment_tokens where token_hash=encode(extensions.digest(t,'sha256'),'hex') for update;
 if not found or ticket.used_at is not null or ticket.expires_at<=now() then raise exception 'Link invalid, expired or already used';end if;
 if not exists(select 1 from public.sadu_consignments g join public.sadu_artwork_checklist w on w.id=g.artwork_id join public.sadu_exhibition_scenarios s on s.id=w.scenario_id join public.bilateral_contracts c on c.id=s.contract_id where g.id=ticket.consignment_id and c.artist_id=g.artist_id and c.status in ('ARTIST_APPROVED','LOCKED')) then raise exception 'Link invalid, expired or already used';end if;
 if d is null or jsonb_typeof(d)<>'object' or octet_length(d::text)>20000 then raise exception 'Invalid consignment data';end if;
 foreach k in array array['length_cm','width_cm','height_cm','weight_kg','insurance_value'] loop
  if jsonb_typeof(d->k) is distinct from 'number' then raise exception 'Positive numeric measurements required';end if;
  v:=(d->>k)::numeric;if v<=0 or v>100000000 then raise exception 'Positive numeric measurements required';end if;
 end loop;
 foreach k in array array['country','city','district','street','building','hours','phone','map_url','packing_list','return_country','return_city','return_address'] loop
  if jsonb_typeof(d->k) is distinct from 'string' or length(trim(d->>k)) not between 1 and 500 then raise exception 'Complete address and courier instructions required';end if;
 end loop;
 if coalesce(d->>'currency','') not in ('AED','USD','EUR') or d->>'map_url' !~ '^https://(maps\.google\.com|www\.google\.com|maps\.app\.goo\.gl|goo\.gl|www\.makani\.ae|makani\.ae)/[^[:space:]]*$' then raise exception 'Valid currency and map URL required';end if;
 if coalesce(d->>'packing_type','') not in ('MUSEUM_CRATE','SOFT_PACK','NO_PACKAGING') then raise exception 'Explicit packing declaration required';end if;
 -- Whitelist fields rather than retaining arbitrary untrusted JSON.
 select jsonb_object_agg(key,value) into d from jsonb_each(d) where key=any(array['length_cm','width_cm','height_cm','weight_kg','insurance_value','packing_type','currency','country','city','district','street','building','hours','phone','map_url','packing_list','return_country','return_city','return_address']);
 update public.sadu_consignments set details=d,status='CONSIGNMENT_DATA_RECEIVED',received_at=now() where id=ticket.consignment_id and status='AWAITING_GALLERY';
 if not found then raise exception 'Link invalid, expired or already used';end if;
 update sadu_private.consignment_tokens set used_at=now() where consignment_id=ticket.consignment_id;
end $function$;

CREATE OR REPLACE FUNCTION sadu_private.record_visa_refusal (
  p_intake    uuid,
  p_reference text
)
  RETURNS timestamp WITH time zone
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare r public.sadu_guest_intakes;t public.sadu_visa_notice_templates;stamp timestamptz;
begin
 if auth.uid() is null or auth.jwt()->'app_metadata'->>'institutional_role' is distinct from 'PR_PROTOCOL' then raise exception 'PR authority required' using errcode='42501';end if;
 if p_reference is null or length(trim(p_reference)) not between 3 and 200 then raise exception 'Authority decision reference required';end if;
 select * into r from public.sadu_guest_intakes where id=p_intake;
 if r.id is null or not exists(select 1 from public.sadu_guest_finalizations where intake_id=r.id) then raise exception 'Finalized guest packet required';end if;
 -- Serialize per agreement so repeats cannot create multiple receipts.
 perform 1 from public.bilateral_contracts where id=r.contract_id and status in ('ARTIST_APPROVED','LOCKED') for update;
 if not found then raise exception 'Active accepted agreement required';end if;
 select recorded_at into stamp from public.sadu_visa_refusals where contract_id=r.contract_id;
 if stamp is not null then return stamp;end if;
 if exists(select 1 from public.sadu_guest_intakes n join public.sadu_guest_finalizations f on f.intake_id=n.id where n.contract_id=r.contract_id and (n.created_at,n.id)>(r.created_at,r.id)) then raise exception 'Current finalized packet required';end if;
 insert into public.sadu_visa_refusals(contract_id,intake_id,authority_reference) values(r.contract_id,r.id,trim(p_reference)) returning recorded_at into stamp;
 select * into t from public.sadu_visa_notice_templates where approved_at is not null and approved_at<=clock_timestamp() and approval_reference is not null and length(trim(body_ar))>=30 and length(trim(body_en))>=30 order by approved_at desc,version desc limit 1;
 insert into public.sadu_visa_notifications(contract_id,artist_id,visa_status,delivery_status,template_version,body_ar,body_en,recorded_at)
 values(r.contract_id,r.artist_id,'REJECTED_BY_AUTHORITY',case when t.version is null then 'TEMPLATE_APPROVAL_REQUIRED' else 'PENDING_DELIVERY' end,t.version,t.body_ar,t.body_en,stamp);
 return stamp;
end $function$;

CREATE OR REPLACE FUNCTION sadu_private.release_visa_notices()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
 if new.approved_at is not null and new.approved_at<=clock_timestamp() and length(trim(new.approval_reference))>=3 and length(trim(new.body_ar))>=30 and length(trim(new.body_en))>=30 then
 update public.sadu_visa_notifications n set delivery_status='PENDING_DELIVERY',template_version=new.version,body_ar=new.body_ar,body_en=new.body_en
 where delivery_status='TEMPLATE_APPROVAL_REQUIRED' and exists(select 1 from public.bilateral_contracts c where c.id=n.contract_id and c.status in ('ARTIST_APPROVED','LOCKED'));
 end if;return new;
end $function$;

CREATE OR REPLACE FUNCTION sadu_private.stamp_arrival()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
 if auth.uid() is null or auth.jwt()->'app_metadata'->>'institutional_role' is distinct from 'LOGISTICS' then raise exception 'Logistics authority required' using errcode='42501';end if;
 select b.artwork_id,s.artist_id,s.coordinator_id,c.artist_name,a.source->>'title'
 into new.artwork_id,new.artist_id,new.coordinator_id,new.artist_name,new.artwork_title
 from public.sadu_freight_bookings b join public.sadu_artwork_checklist a on a.id=b.artwork_id
 join public.sadu_exhibition_scenarios s on s.id=a.scenario_id join public.bilateral_contracts c on c.id=s.contract_id
 where b.id=new.booking_id and b.status in ('IN_TRANSIT','CUSTOMS_CLEARANCE','RECEIVED_CONDITION_CHECKED') and c.status in ('ARTIST_APPROVED','LOCKED');
 if new.artwork_id is null then raise exception 'Dispatched artwork required';end if;
 new.recorded_at=clock_timestamp();new.recorded_by=auth.uid();return new;
end $function$;

CREATE OR REPLACE FUNCTION sadu_private.validate_freight_assignment()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
 if auth.uid() is null or auth.jwt()->'app_metadata'->>'institutional_role' is distinct from 'LOGISTICS' then raise exception 'Logistics authority required' using errcode='42501';end if;
 select artist_id into new.artist_id from public.sadu_consignments where id=new.consignment_id and origin='THIRD_PARTY_GALLERY';
 if new.artist_id is null then raise exception 'Gallery consignment required';end if;
 if not exists(select 1 from auth.users where id=new.vendor_id and raw_app_meta_data->>'institutional_role'='EXTERNAL_VENDOR') then raise exception 'Provisioned freight vendor account required';end if;
 if not exists(select 1 from auth.users where id=new.curator_id and raw_app_meta_data->>'institutional_role' in ('HIP','VENUE_AUTHORITY')) then raise exception 'Provisioned curator account required';end if;
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=new.facility_timezone) then raise exception 'IANA facility timezone required';end if;
 new.recorded_by=auth.uid();new.recorded_at=clock_timestamp();return new;
end $function$;

ALTER TABLE "public"."sadu_arrival_receipts"
  ADD CONSTRAINT "sadu_arrival_receipts_artwork_id_fkey" FOREIGN KEY (artwork_id) REFERENCES public.sadu_artwork_checklist(id);

ALTER TABLE "public"."sadu_artwork_values"
  ADD CONSTRAINT "sadu_artwork_values_artwork_id_fkey" FOREIGN KEY (artwork_id) REFERENCES public.sadu_artwork_checklist(id);

ALTER TABLE "public"."sadu_asset_reminders"
  ADD CONSTRAINT "sadu_asset_reminders_scenario_id_fkey" FOREIGN KEY (scenario_id) REFERENCES public.sadu_asset_scope(scenario_id);

ALTER TABLE "public"."sadu_companion_requests"
  ADD CONSTRAINT "sadu_companion_requests_artist_id_fkey" FOREIGN KEY (artist_id) REFERENCES auth.users(id);

ALTER TABLE "public"."sadu_companion_requests"
  ADD CONSTRAINT "sadu_companion_requests_contract_id_fkey" FOREIGN KEY (contract_id) REFERENCES public.bilateral_contracts(id);

ALTER TABLE "public"."sadu_condition_reports"
  ADD CONSTRAINT "sadu_condition_reports_artist_id_fkey" FOREIGN KEY (artist_id) REFERENCES auth.users(id);

ALTER TABLE "public"."sadu_condition_reports"
  ADD CONSTRAINT "sadu_condition_reports_contract_id_fkey" FOREIGN KEY (contract_id) REFERENCES public.bilateral_contracts(id);

ALTER TABLE "public"."sadu_consignments"
  ADD CONSTRAINT "sadu_consignments_artist_id_fkey" FOREIGN KEY (artist_id) REFERENCES auth.users(id);

ALTER TABLE "public"."sadu_consignments"
  ADD CONSTRAINT "sadu_consignments_artwork_id_fkey" FOREIGN KEY (artwork_id) REFERENCES public.sadu_artwork_checklist(id);

ALTER TABLE "public"."sadu_contract_intake"
  ADD CONSTRAINT "sadu_contract_intake_artist_id_fkey" FOREIGN KEY (artist_id) REFERENCES auth.users(id);

ALTER TABLE "public"."sadu_contract_intake"
  ADD CONSTRAINT "sadu_contract_intake_contract_id_fkey" FOREIGN KEY (contract_id) REFERENCES public.bilateral_contracts(id);

ALTER TABLE "public"."sadu_exhibition_scenarios"
  ADD CONSTRAINT "sadu_exhibition_scenarios_artist_id_fkey" FOREIGN KEY (artist_id) REFERENCES auth.users(id);

ALTER TABLE "public"."sadu_exhibition_scenarios"
  ADD CONSTRAINT "sadu_exhibition_scenarios_contract_id_fkey" FOREIGN KEY (contract_id) REFERENCES public.bilateral_contracts(id);

ALTER TABLE "public"."sadu_exhibition_scenarios"
  ADD CONSTRAINT "sadu_exhibition_scenarios_coordinator_id_fkey" FOREIGN KEY (coordinator_id) REFERENCES auth.users(id);

ALTER TABLE "public"."sadu_artwork_checklist"
  ADD CONSTRAINT "sadu_artwork_checklist_scenario_id_fkey" FOREIGN KEY (scenario_id) REFERENCES public.sadu_exhibition_scenarios(id);

ALTER TABLE "public"."sadu_asset_scope"
  ADD CONSTRAINT "sadu_asset_scope_scenario_id_fkey" FOREIGN KEY (scenario_id) REFERENCES public.sadu_exhibition_scenarios(id);

ALTER TABLE "public"."sadu_exhibition_titles"
  ADD CONSTRAINT "sadu_exhibition_titles_scenario_id_fkey" FOREIGN KEY (scenario_id) REFERENCES public.sadu_exhibition_scenarios(id);

ALTER TABLE "public"."sadu_freight_assignments"
  ADD CONSTRAINT "sadu_freight_assignments_artist_id_fkey" FOREIGN KEY (artist_id) REFERENCES auth.users(id);

ALTER TABLE "public"."sadu_freight_assignments"
  ADD CONSTRAINT "sadu_freight_assignments_consignment_id_fkey" FOREIGN KEY (consignment_id) REFERENCES public.sadu_consignments(id);

ALTER TABLE "public"."sadu_freight_assignments"
  ADD CONSTRAINT "sadu_freight_assignments_curator_id_fkey" FOREIGN KEY (curator_id) REFERENCES auth.users(id);

ALTER TABLE "public"."sadu_freight_alerts"
  ADD CONSTRAINT "sadu_freight_alerts_consignment_id_fkey" FOREIGN KEY (consignment_id) REFERENCES public.sadu_freight_assignments(consignment_id);

ALTER TABLE "public"."sadu_freight_assignments"
  ADD CONSTRAINT "sadu_freight_assignments_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES auth.users(id);

ALTER TABLE "public"."sadu_freight_bookings"
  ADD CONSTRAINT "sadu_freight_bookings_artist_id_fkey" FOREIGN KEY (artist_id) REFERENCES auth.users(id);

ALTER TABLE "public"."sadu_freight_bookings"
  ADD CONSTRAINT "sadu_freight_bookings_artwork_id_fkey" FOREIGN KEY (artwork_id) REFERENCES public.sadu_artwork_checklist(id);

ALTER TABLE "public"."sadu_arrival_receipts"
  ADD CONSTRAINT "sadu_arrival_receipts_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.sadu_freight_bookings(id);

ALTER TABLE "public"."sadu_freight_changes"
  ADD CONSTRAINT "sadu_freight_changes_consignment_id_fkey" FOREIGN KEY (consignment_id) REFERENCES public.sadu_consignments(id);

ALTER TABLE "public"."sadu_guest_finalizations"
  ADD CONSTRAINT "sadu_guest_finalizations_artist_id_fkey" FOREIGN KEY (artist_id) REFERENCES auth.users(id);

ALTER TABLE "public"."sadu_guest_intakes"
  ADD CONSTRAINT "sadu_guest_intakes_artist_id_fkey" FOREIGN KEY (artist_id) REFERENCES auth.users(id);

ALTER TABLE "public"."sadu_guest_intakes"
  ADD CONSTRAINT "sadu_guest_intakes_contract_id_fkey" FOREIGN KEY (contract_id) REFERENCES public.bilateral_contracts(id);

ALTER TABLE "public"."sadu_guest_finalizations"
  ADD CONSTRAINT "sadu_guest_finalizations_intake_id_fkey" FOREIGN KEY (intake_id) REFERENCES public.sadu_guest_intakes(id);

ALTER TABLE "public"."sadu_guest_itinerary_approvals"
  ADD CONSTRAINT "sadu_guest_itinerary_approvals_intake_id_fkey" FOREIGN KEY (intake_id) REFERENCES public.sadu_guest_finalizations(intake_id);

ALTER TABLE "public"."sadu_guest_reminder_outbox"
  ADD CONSTRAINT "sadu_guest_reminder_outbox_contract_id_fkey" FOREIGN KEY (contract_id) REFERENCES public.bilateral_contracts(id);

ALTER TABLE "public"."sadu_guest_travel_plans"
  ADD CONSTRAINT "sadu_guest_travel_plans_artist_id_fkey" FOREIGN KEY (artist_id) REFERENCES auth.users(id);

ALTER TABLE "public"."sadu_guest_travel_plans"
  ADD CONSTRAINT "sadu_guest_travel_plans_contract_id_fkey" FOREIGN KEY (contract_id) REFERENCES public.bilateral_contracts(id);

ALTER TABLE "public"."sadu_guest_reminder_outbox"
  ADD CONSTRAINT "sadu_guest_reminder_outbox_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public.sadu_guest_travel_plans(id);

ALTER TABLE "public"."sadu_logistics_routing"
  ADD CONSTRAINT "sadu_logistics_routing_head_id_fkey" FOREIGN KEY (head_id) REFERENCES auth.users(id);

ALTER TABLE "public"."sadu_logistics_routing"
  ADD CONSTRAINT "sadu_logistics_routing_officer_id_fkey" FOREIGN KEY (officer_id) REFERENCES auth.users(id);

ALTER TABLE "public"."sadu_logistics_tickets"
  ADD CONSTRAINT "sadu_logistics_tickets_consignment_id_fkey" FOREIGN KEY (consignment_id) REFERENCES public.sadu_consignments(id);

ALTER TABLE "public"."sadu_publication_queue"
  ADD CONSTRAINT "sadu_publication_queue_scenario_id_fkey" FOREIGN KEY (scenario_id) REFERENCES public.sadu_exhibition_scenarios(id);

ALTER TABLE "public"."sadu_artwork_checklist"
  ADD CONSTRAINT "sadu_artwork_checklist_media_object_name_fkey" FOREIGN KEY (media_object_name) REFERENCES public.sadu_scenario_media(object_name);

ALTER TABLE "public"."sadu_media_reviews"
  ADD CONSTRAINT "sadu_media_reviews_object_name_fkey" FOREIGN KEY (object_name) REFERENCES public.sadu_scenario_media(object_name);

ALTER TABLE "public"."sadu_scenario_media"
  ADD CONSTRAINT "sadu_scenario_media_scenario_id_fkey" FOREIGN KEY (scenario_id) REFERENCES public.sadu_exhibition_scenarios(id);

ALTER TABLE "public"."sadu_visa_notifications"
  ADD CONSTRAINT "sadu_visa_notifications_artist_id_fkey" FOREIGN KEY (artist_id) REFERENCES auth.users(id);

ALTER TABLE "public"."sadu_visa_notifications"
  ADD CONSTRAINT "sadu_visa_notifications_template_version_fkey" FOREIGN KEY (template_version) REFERENCES public.sadu_visa_notice_templates(VERSION);

ALTER TABLE "public"."sadu_visa_refusals"
  ADD CONSTRAINT "sadu_visa_refusals_contract_id_fkey" FOREIGN KEY (contract_id) REFERENCES public.bilateral_contracts(id);

ALTER TABLE "public"."sadu_visa_refusals"
  ADD CONSTRAINT "sadu_visa_refusals_intake_id_fkey" FOREIGN KEY (intake_id) REFERENCES public.sadu_guest_finalizations(intake_id);

ALTER TABLE "public"."sadu_visa_notifications"
  ADD CONSTRAINT "sadu_visa_notifications_contract_id_fkey" FOREIGN KEY (contract_id) REFERENCES public.sadu_visa_refusals(contract_id);

ALTER TABLE "sadu_governance"."artist_profiles"
  ADD CONSTRAINT "artist_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE "sadu_governance"."artwork_assets"
  ADD CONSTRAINT "artwork_assets_artwork_id_artwork_revision_fkey" FOREIGN KEY (artwork_id, artwork_revision) REFERENCES sadu_governance.artworks(id, revision);

ALTER TABLE "sadu_governance"."condition_reports"
  ADD CONSTRAINT "condition_reports_registrar_id_fkey" FOREIGN KEY (registrar_id) REFERENCES auth.users(id);

ALTER TABLE "sadu_governance"."contracts"
  ADD CONSTRAINT "contracts_supersedes_id_fkey" FOREIGN KEY (supersedes_id) REFERENCES sadu_governance.contracts(id);

ALTER TABLE "sadu_governance"."crates"
  ADD CONSTRAINT "crates_artwork_id_fkey" FOREIGN KEY (artwork_id) REFERENCES sadu_governance.artworks(id);

ALTER TABLE "sadu_governance"."document_vault"
  ADD CONSTRAINT "document_vault_artist_id_fkey" FOREIGN KEY (artist_id) REFERENCES sadu_governance.artist_profiles(id);

ALTER TABLE "sadu_governance"."editorial_approvals"
  ADD CONSTRAINT "editorial_approvals_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES auth.users(id);

ALTER TABLE "sadu_governance"."editorial_approvals"
  ADD CONSTRAINT "editorial_approvals_artwork_id_artwork_revision_fkey" FOREIGN KEY (artwork_id, artwork_revision) REFERENCES sadu_governance.artworks(id, revision);

ALTER TABLE "sadu_governance"."memberships"
  ADD CONSTRAINT "memberships_pkey" PRIMARY KEY (program_id, user_id, ROLE);

ALTER TABLE "sadu_governance"."memberships"
  ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE "sadu_governance"."outbox"
  ADD CONSTRAINT "outbox_recipient_user_id_fkey" FOREIGN KEY (recipient_user_id) REFERENCES auth.users(id);

ALTER TABLE "sadu_governance"."outbox"
  ADD CONSTRAINT "outbox_template_id_fkey" FOREIGN KEY (template_id) REFERENCES sadu_governance.message_templates(id);

ALTER TABLE "sadu_governance"."participations"
  ADD CONSTRAINT "participations_artist_id_fkey" FOREIGN KEY (artist_id) REFERENCES sadu_governance.artist_profiles(id);

ALTER TABLE "sadu_governance"."participations"
  ADD CONSTRAINT "participations_coordinator_id_fkey" FOREIGN KEY (coordinator_id) REFERENCES auth.users(id);

ALTER TABLE "sadu_governance"."artworks"
  ADD CONSTRAINT "artworks_participation_id_fkey" FOREIGN KEY (participation_id) REFERENCES sadu_governance.participations(id);

ALTER TABLE "sadu_governance"."contracts"
  ADD CONSTRAINT "contracts_participation_id_fkey" FOREIGN KEY (participation_id) REFERENCES sadu_governance.participations(id);

ALTER TABLE "sadu_governance"."memberships"
  ADD CONSTRAINT "memberships_program_id_fkey" FOREIGN KEY (program_id) REFERENCES sadu_governance.programs(id);

ALTER TABLE "sadu_governance"."participations"
  ADD CONSTRAINT "participations_program_id_fkey" FOREIGN KEY (program_id) REFERENCES sadu_governance.programs(id);

ALTER TABLE "sadu_governance"."shipping_tickets"
  ADD CONSTRAINT "shipping_tickets_crate_id_fkey" FOREIGN KEY (crate_id) REFERENCES sadu_governance.crates(id);

ALTER TABLE "sadu_governance"."shipping_tickets"
  ADD CONSTRAINT "shipping_tickets_logistics_user_id_fkey" FOREIGN KEY (logistics_user_id) REFERENCES auth.users(id);

ALTER TABLE "sadu_governance"."condition_reports"
  ADD CONSTRAINT "condition_reports_ticket_id_fkey" FOREIGN KEY (ticket_id) REFERENCES sadu_governance.shipping_tickets(id);

ALTER TABLE "sadu_governance"."shipping_tickets"
  ADD CONSTRAINT "shipping_tickets_vendor_user_id_fkey" FOREIGN KEY (vendor_user_id) REFERENCES auth.users(id);

ALTER TABLE "sadu_governance"."signature_receipts"
  ADD CONSTRAINT "signature_receipts_contract_id_fkey" FOREIGN KEY (contract_id) REFERENCES sadu_governance.contracts(id);

ALTER TABLE "sadu_governance"."signature_receipts"
  ADD CONSTRAINT "signature_receipts_signer_user_id_fkey" FOREIGN KEY (signer_user_id) REFERENCES auth.users(id);

ALTER TABLE "sadu_governance"."visa_decisions"
  ADD CONSTRAINT "visa_decisions_participation_id_fkey" FOREIGN KEY (participation_id) REFERENCES sadu_governance.participations(id);

ALTER TABLE "sadu_governance"."visa_decisions"
  ADD CONSTRAINT "visa_decisions_recorded_by_fkey" FOREIGN KEY (recorded_by) REFERENCES auth.users(id);

ALTER TABLE "sadu_private"."consignment_tokens"
  ADD CONSTRAINT "consignment_tokens_consignment_id_fkey" FOREIGN KEY (consignment_id) REFERENCES public.sadu_consignments(id);

CREATE VIEW "public"."sadu_asset_escrow" WITH (security_invoker=true) AS  SELECT id AS scenario_id,
    contract_id,
    status,
    submitted_at,
    artwork_checklist,
    ((status = 'SUBMITTED'::text) AND (submitted_at IS NOT NULL) AND (jsonb_array_length(artwork_checklist) > 0) AND (NOT (EXISTS ( SELECT 1
           FROM (jsonb_array_elements(s.artwork_checklist) z(value)
             CROSS JOIN ( VALUES ('PRINT'::text,'printRequired'::text), ('AV'::text,'avRequired'::text), ('BLUEPRINT'::text,'requires_spatial_planning'::text)) required(category, flag))
          WHERE (COALESCE(((z.value ->> required.flag))::boolean, false) AND (NOT (EXISTS ( SELECT 1
                   FROM (public.sadu_scenario_media m
                     JOIN storage.objects o ON (((o.bucket_id = 'logistics-secure'::text) AND (o.name = m.object_name))))
                  WHERE ((m.scenario_id = s.id) AND ((m.zone_id)::text = (z.value ->> 'id'::text)) AND (m.category = required.category) AND ((((o.metadata ->> 'size'::text))::bigint >= 1) AND (((o.metadata ->> 'size'::text))::bigint <= '2147483648'::bigint)) AND (((m.category = 'PRINT'::text) AND ((o.metadata ->> 'mimetype'::text) = ANY (ARRAY['image/png'::text, 'image/tiff'::text]))) OR ((m.category = 'AV'::text) AND ((o.metadata ->> 'mimetype'::text) = ANY (ARRAY['video/mp4'::text, 'video/quicktime'::text]))) OR ((m.category = 'BLUEPRINT'::text) AND ((o.metadata ->> 'mimetype'::text) = 'application/pdf'::text) AND (((o.metadata ->> 'size'::text))::bigint <= 20971520)))))))))))) AS escrow_ready
   FROM public.sadu_exhibition_scenarios s;

REVOKE ALL ON TABLE "public"."sadu_asset_escrow" FROM "anon";

CREATE VIEW "public"."sadu_guest_queue" WITH (security_invoker=true) AS  SELECT id,
    contract_id,
    artist_id,
    arrival,
    departure,
    airport,
    companion_name,
    companion_ack,
    photo_extension,
    created_at,
    artist_name,
    contract_status,
    (EXISTS ( SELECT 1
           FROM storage.objects o
          WHERE ((o.bucket_id = 'logistics-secure'::text) AND (o.name = ((((r.artist_id)::text || '/guest-intake/'::text) || (r.id)::text) || '/passport.pdf'::text)) AND ((((o.metadata ->> 'size'::text))::bigint >= 1) AND (((o.metadata ->> 'size'::text))::bigint <= 10485760)) AND ((o.metadata ->> 'mimetype'::text) = 'application/pdf'::text)))) AS passport_uploaded,
    (EXISTS ( SELECT 1
           FROM storage.objects o
          WHERE ((o.bucket_id = 'logistics-secure'::text) AND (o.name = (((((r.artist_id)::text || '/guest-intake/'::text) || (r.id)::text) || '/photo.'::text) || r.photo_extension)) AND ((((o.metadata ->> 'size'::text))::bigint >= 1) AND (((o.metadata ->> 'size'::text))::bigint <= 10485760)) AND ((o.metadata ->> 'mimetype'::text) = ANY (ARRAY['image/jpeg'::text, 'image/png'::text]))))) AS photo_uploaded,
    (EXISTS ( SELECT 1
           FROM storage.objects o
          WHERE ((o.bucket_id = 'logistics-secure'::text) AND (o.name = ((((r.artist_id)::text || '/guest-intake/'::text) || (r.id)::text) || '/companion.pdf'::text)) AND ((((o.metadata ->> 'size'::text))::bigint >= 1) AND (((o.metadata ->> 'size'::text))::bigint <= 10485760)) AND ((o.metadata ->> 'mimetype'::text) = 'application/pdf'::text)))) AS companion_uploaded
   FROM public.sadu_guest_intakes r;

REVOKE ALL ON TABLE "public"."sadu_guest_queue" FROM "anon";

CREATE VIEW "public"."sadu_guest_submission_queue" WITH (security_invoker=true) AS  SELECT q.id,
    q.contract_id,
    q.artist_id,
    q.arrival,
    q.departure,
    q.airport,
    q.companion_name,
    q.companion_ack,
    q.photo_extension,
    q.created_at,
    q.artist_name,
    q.contract_status,
    q.passport_uploaded,
    q.photo_uploaded,
    q.companion_uploaded,
    r.identity,
    r.departure_airport,
    f.finalized_at,
    ((r.document_policy ->> 'national_id_required'::text))::boolean AS national_id_required,
    (EXISTS ( SELECT 1
           FROM storage.objects o
          WHERE ((o.bucket_id = 'logistics-secure'::text) AND (o.name = ((((r.artist_id)::text || '/guest-intake/'::text) || (r.id)::text) || '/national-id.pdf'::text)) AND ((((o.metadata ->> 'size'::text))::bigint >= 1) AND (((o.metadata ->> 'size'::text))::bigint <= 10485760)) AND ((o.metadata ->> 'mimetype'::text) = 'application/pdf'::text)))) AS national_id_uploaded,
    r.document_policy
   FROM ((public.sadu_guest_queue q
     JOIN public.sadu_guest_intakes r ON ((r.id = q.id)))
     LEFT JOIN public.sadu_guest_finalizations f ON ((f.intake_id = q.id)));

REVOKE ALL ON TABLE "public"."sadu_guest_submission_queue" FROM "anon";

CREATE VIEW "public"."sadu_media_inventory" WITH (security_invoker=true) AS  SELECT m.scenario_id,
    m.object_name,
    m.file_name,
    m.category,
    ((o.id IS NOT NULL) AND (((o.metadata ->> 'size'::text))::bigint > 0)) AS received,
    o.created_at AS received_at,
        CASE
            WHEN (r.object_id = o.id) THEN r.reviewed_at
            ELSE NULL::timestamp with time zone
        END AS reviewed_at
   FROM ((public.sadu_scenario_media m
     LEFT JOIN storage.objects o ON (((o.bucket_id = 'logistics-secure'::text) AND (o.name = m.object_name))))
     LEFT JOIN public.sadu_media_reviews r ON ((r.object_name = m.object_name)));

REVOKE ALL ON TABLE "public"."sadu_media_inventory" FROM "anon";

CREATE UNIQUE INDEX one_pending_freight_change ON public.sadu_freight_changes USING btree (consignment_id)
  WHERE (status = 'PENDING'::text);

CREATE INDEX sadu_artwork_checklist_scenario_id_idx ON public.sadu_artwork_checklist USING btree (scenario_id);

CREATE INDEX sadu_freight_bookings_artist_id_idx ON public.sadu_freight_bookings USING btree (artist_id);

CREATE INDEX sadu_guest_intakes_contract_id_created_at_idx ON public.sadu_guest_intakes USING btree (contract_id, created_at DESC);

CREATE INDEX artwork_assets_artwork_id_artwork_revision_idx ON sadu_governance.artwork_assets USING btree (artwork_id, artwork_revision);

CREATE INDEX artworks_participation_id_idx ON sadu_governance.artworks USING btree (participation_id);

CREATE INDEX participations_coordinator_id_idx ON sadu_governance.participations USING btree (coordinator_id);

CREATE INDEX shipping_tickets_ready_at_idx ON sadu_governance.shipping_tickets USING btree (ready_at)
  WHERE (status = 'READY_FOR_SHIPPING'::text);

CREATE TRIGGER sadu_committee_gate
  BEFORE INSERT OR DELETE OR UPDATE ON public.artist_dossiers
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_guard_committee_gate();

CREATE TRIGGER execution_escrow
  BEFORE INSERT OR UPDATE ON public.bilateral_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_require_execution_escrow();

CREATE TRIGGER stamp_arrival
  BEFORE INSERT ON public.sadu_arrival_receipts
  FOR EACH ROW
  EXECUTE FUNCTION sadu_private.stamp_arrival();

CREATE TRIGGER asset_bundle_match
  BEFORE INSERT ON public.sadu_artwork_checklist
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_match_asset_bundle();

CREATE TRIGGER label_blueprint_guard
  BEFORE INSERT ON public.sadu_artwork_checklist
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_blueprint_not_label();

CREATE TRIGGER label_declaration
  BEFORE INSERT OR UPDATE ON public.sadu_artwork_checklist
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_require_label_declaration();

CREATE TRIGGER label_validate
  BEFORE INSERT OR UPDATE ON public.sadu_artwork_checklist
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_validate_label();

CREATE TRIGGER value_stamp
  BEFORE INSERT ON public.sadu_artwork_values
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_value_stamp();

CREATE TRIGGER validate_condition_report
  BEFORE INSERT OR UPDATE ON public.sadu_condition_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_validate_condition_report();

CREATE TRIGGER complete_delivery
  BEFORE UPDATE ON public.sadu_exhibition_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_complete_delivery();

CREATE TRIGGER scenario_labels
  BEFORE UPDATE ON public.sadu_exhibition_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_require_labels();

CREATE TRIGGER scenario_validation
  BEFORE INSERT OR UPDATE ON public.sadu_exhibition_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_exhibition_scenario();

CREATE TRIGGER lock_exhibition_title
  BEFORE UPDATE ON public.sadu_exhibition_titles
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_lock_exhibition_title();

CREATE TRIGGER freight_assignment_validate
  BEFORE INSERT ON public.sadu_freight_assignments
  FOR EACH ROW
  EXECUTE FUNCTION sadu_private.validate_freight_assignment();

CREATE TRIGGER booking_guard
  BEFORE INSERT OR UPDATE ON public.sadu_freight_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_guard_booking();

CREATE TRIGGER freight_origin
  BEFORE INSERT ON public.sadu_freight_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_check_booking_origin();

CREATE TRIGGER zz_pickup_calendar
  BEFORE INSERT OR UPDATE ON public.sadu_freight_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_guard_pickup_calendar();

CREATE TRIGGER prepare_freight_change
  BEFORE INSERT ON public.sadu_freight_changes
  FOR EACH ROW
  EXECUTE FUNCTION sadu_private.prepare_freight_change();

CREATE TRIGGER guest_finalization_time
  BEFORE INSERT ON public.sadu_guest_finalizations
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_guest_finalization_time();

CREATE TRIGGER guest_document_snapshot
  BEFORE INSERT ON public.sadu_guest_intakes
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_guest_document_snapshot();

CREATE TRIGGER guest_snapshot
  BEFORE INSERT ON public.sadu_guest_intakes
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_guest_snapshot();

CREATE TRIGGER itinerary_stamp
  BEFORE INSERT ON public.sadu_guest_itinerary_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_itinerary_stamp();

CREATE TRIGGER plan_time
  BEFORE INSERT ON public.sadu_guest_travel_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_guest_plan_time();

CREATE TRIGGER logistics_action
  BEFORE UPDATE OF opened_at, action_note ON public.sadu_logistics_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_logistics_action();

CREATE TRIGGER logistics_ready
  BEFORE INSERT ON public.sadu_logistics_tickets
  FOR EACH ROW
  EXECUTE FUNCTION sadu_private.logistics_ready();

CREATE TRIGGER packing_ready_guard
  BEFORE INSERT ON public.sadu_logistics_tickets
  FOR EACH ROW
  EXECUTE FUNCTION sadu_private.packing_ready_guard();

CREATE TRIGGER media_review_receipt
  BEFORE INSERT ON public.sadu_media_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_stamp_media_review();

CREATE TRIGGER publication_snapshot
  BEFORE INSERT ON public.sadu_publication_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_prepare_publication();

CREATE TRIGGER asset_bundle
  BEFORE INSERT ON public.sadu_scenario_media
  FOR EACH ROW
  EXECUTE FUNCTION public.sadu_require_asset_bundle();

CREATE TRIGGER approved_visa_template
  AFTER INSERT OR UPDATE ON public.sadu_visa_notice_templates
  FOR EACH ROW
  EXECUTE FUNCTION sadu_private.release_visa_notices();

CREATE TRIGGER lock_visa_template
  BEFORE DELETE OR UPDATE ON public.sadu_visa_notice_templates
  FOR EACH ROW
  EXECUTE FUNCTION sadu_private.lock_approved_visa_template();

CREATE TRIGGER immutable_contract
  BEFORE DELETE OR UPDATE ON sadu_governance.contracts
  FOR EACH ROW
  EXECUTE FUNCTION sadu_governance.immutable_record();

CREATE TRIGGER immutable_editorial
  BEFORE DELETE OR UPDATE ON sadu_governance.editorial_approvals
  FOR EACH ROW
  EXECUTE FUNCTION sadu_governance.immutable_record();

CREATE TRIGGER immutable_signature
  BEFORE DELETE OR UPDATE ON sadu_governance.signature_receipts
  FOR EACH ROW
  EXECUTE FUNCTION sadu_governance.immutable_record();

CREATE POLICY "Coordinators manage dossiers retained read" ON "public"."artist_dossiers"
  FOR SELECT
  TO PUBLIC
  USING (((auth.jwt() ->> 'institutional_role'::text) = 'COORDINATOR'::text));

CREATE POLICY "stage4_committee_decision" ON "public"."artist_dossiers"
  FOR UPDATE
  TO "authenticated"
  USING (((public.sadu_dossier_role() = 'PREPARATORY_COMMITTEE'::text) AND (status = 'PENDING_COMMITTEE_REVIEW'::text)))
  WITH CHECK (((public.sadu_dossier_role() = 'PREPARATORY_COMMITTEE'::text) AND (status = ANY (ARRAY['PENDING_DIRECTOR_REVIEW'::text, 'COMMITTEE_REJECTED'::text]))));

CREATE POLICY "stage4_draft_insert" ON "public"."artist_dossiers"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((public.sadu_dossier_role() = 'COORDINATOR'::text) AND (status = 'INCOMPLETE_DOSSIER'::text)));

CREATE POLICY "stage4_review_read" ON "public"."artist_dossiers"
  FOR SELECT
  TO "authenticated"
  USING ((public.sadu_dossier_role() = ANY (ARRAY['COORDINATOR'::text, 'PREPARATORY_COMMITTEE'::text, 'BIENNIAL_DIRECTOR'::text])));

CREATE POLICY "stage4_submit" ON "public"."artist_dossiers"
  FOR UPDATE
  TO "authenticated"
  USING (((public.sadu_dossier_role() = 'COORDINATOR'::text) AND (status = 'INCOMPLETE_DOSSIER'::text)))
  WITH CHECK (((public.sadu_dossier_role() = 'COORDINATOR'::text) AND (status = ANY (ARRAY['INCOMPLETE_DOSSIER'::text, 'PENDING_COMMITTEE_REVIEW'::text]))));

CREATE POLICY "stage5_director_decision" ON "public"."artist_dossiers"
  FOR UPDATE
  TO "authenticated"
  USING (((public.sadu_dossier_role() = 'BIENNIAL_DIRECTOR'::text) AND (status = 'PENDING_DIRECTOR_REVIEW'::text) AND (committee_reviewed_at IS
    NOT NULL) AND (committee_reviewed_by IS NOT NULL)))
  WITH CHECK (((public.sadu_dossier_role() = 'BIENNIAL_DIRECTOR'::text) AND (status = ANY (ARRAY['DIRECTOR_APPROVED'::text, 'DIRECTOR_VETOED'::text]))));

CREATE POLICY "guest_owner_contract_read" ON "public"."bilateral_contracts"
  FOR SELECT
  TO "authenticated"
  USING (((artist_id = auth.uid()) AND (status = ANY (ARRAY['ARTIST_APPROVED'::text, 'LOCKED'::text]))));

CREATE POLICY "arrival_read" ON "public"."sadu_arrival_receipts"
  FOR SELECT
  TO "authenticated"
  USING
    (((artist_id = auth.uid()) OR (coordinator_id = auth.uid()) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = ANY (ARRAY['LOGISTICS'::text,
    'TECHNICAL'::text]))));

CREATE POLICY "label_insert" ON "public"."sadu_artwork_checklist"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.sadu_exhibition_scenarios s
  WHERE ((s.id = sadu_artwork_checklist.scenario_id) AND (s.artist_id = auth.uid()) AND (s.status = 'DRAFT'::text)))));

CREATE POLICY "label_read" ON "public"."sadu_artwork_checklist"
  FOR SELECT
  TO "authenticated"
  USING (((EXISTS ( SELECT 1
   FROM public.sadu_exhibition_scenarios s
  WHERE ((s.id = sadu_artwork_checklist.scenario_id) AND ((s.artist_id = auth.uid()) OR (s.coordinator_id = auth.uid()))))) OR
    (((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = ANY (ARRAY['EDITORIAL'::text, 'PR_PROTOCOL'::text, 'LOGISTICS'::text, 'HIP'::text,
    'BIENNIAL_DIRECTOR'::text]))));

CREATE POLICY "label_translate" ON "public"."sadu_artwork_checklist"
  FOR UPDATE
  TO "authenticated"
  USING
    ((((translation_status = 'PENDING_TRANSLATION'::text) OR (((source ->> 'language'::text) <> 'en'::text) AND (translation_en IS NULL))) AND (((auth.jwt() ->
    'app_metadata'::text) ->> 'institutional_role'::text) = 'EDITORIAL'::text)))
  WITH CHECK ((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'EDITORIAL'::text));

CREATE POLICY "technical_submitted_labels" ON "public"."sadu_artwork_checklist"
  FOR SELECT
  TO "authenticated"
  USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'TECHNICAL'::text) AND (EXISTS ( SELECT 1
   FROM public.sadu_exhibition_scenarios s
  WHERE ((s.id = sadu_artwork_checklist.scenario_id) AND (s.status = 'SUBMITTED'::text))))));

CREATE POLICY "reminder_read" ON "public"."sadu_asset_reminders"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.sadu_exhibition_scenarios s
  WHERE (s.id = sadu_asset_reminders.scenario_id))));

CREATE POLICY "scope_read" ON "public"."sadu_asset_scope"
  FOR SELECT
  TO "authenticated"
  USING (((EXISTS ( SELECT 1
   FROM public.sadu_exhibition_scenarios s
  WHERE (s.id = sadu_asset_scope.scenario_id))) OR
    (((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = ANY (ARRAY['EDITORIAL'::text, 'PR_PROTOCOL'::text, 'HIP'::text]))));

CREATE POLICY "companion_read" ON "public"."sadu_companion_requests"
  FOR SELECT
  TO "authenticated"
  USING
    (((artist_id = auth.uid()) OR (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text), (auth.jwt() ->> 'institutional_role'::text)) =
    'PR_PROTOCOL'::text)));

CREATE POLICY "companion_register" ON "public"."sadu_companion_requests"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((artist_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.bilateral_contracts c
  WHERE ((c.id = sadu_companion_requests.contract_id) AND (c.artist_id = auth.uid()) AND (c.status = ANY (ARRAY['ARTIST_APPROVED'::text, 'LOCKED'::text])))))));

CREATE POLICY "condition_read" ON "public"."sadu_condition_reports"
  FOR SELECT
  TO "authenticated"
  USING
    ((((artist_id = auth.uid()) AND (status <> 'DRAFT'::text)) OR (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text), (auth.jwt() ->>
    'institutional_role'::text)) = ANY (ARRAY['LOGISTICS'::text, 'TECHNICAL'::text]))));

CREATE POLICY "consignment_read" ON "public"."sadu_consignments"
  FOR SELECT
  TO "authenticated"
  USING
    (((artist_id = auth.uid()) OR (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text), (auth.jwt() ->> 'institutional_role'::text)) =
    'LOGISTICS'::text)));

CREATE POLICY "consignment_vendor_read" ON "public"."sadu_consignments"
  FOR SELECT
  TO "authenticated"
  USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'EXTERNAL_VENDOR'::text) AND (EXISTS ( SELECT 1
   FROM public.sadu_freight_assignments a
  WHERE ((a.consignment_id = sadu_consignments.id) AND (a.vendor_id = auth.uid()))))));

CREATE POLICY "intake_read" ON "public"."sadu_contract_intake"
  FOR SELECT
  TO "authenticated"
  USING
    (((artist_id = auth.uid()) OR ((kind = 'PASSPORT'::text) AND (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text), (auth.jwt() ->>
    'institutional_role'::text)) = 'PR_PROTOCOL'::text)) OR
    ((kind = 'ARTWORK_IMAGE'::text) AND (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text), (auth.jwt() ->> 'institutional_role'::text)) = ANY
    (ARRAY['TECHNICAL'::text, 'EDITORIAL'::text])))));

CREATE POLICY "intake_register" ON "public"."sadu_contract_intake"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((artist_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.bilateral_contracts c
  WHERE ((c.id = sadu_contract_intake.contract_id) AND (c.artist_id = auth.uid()) AND (c.status = ANY (ARRAY['ARTIST_APPROVED'::text, 'LOCKED'::text])))))));

CREATE POLICY "scenario_insert" ON "public"."sadu_exhibition_scenarios"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((artist_id = auth.uid()) AND (status = 'DRAFT'::text) AND (EXISTS ( SELECT 1
   FROM public.bilateral_contracts c
  WHERE
    ((c.id = sadu_exhibition_scenarios.contract_id) AND (c.artist_id = auth.uid()) AND (NOT (c.coordinator_id IS DISTINCT FROM sadu_exhibition_scenarios.coordinator_id)) AND
    (c.status = ANY (ARRAY['ARTIST_APPROVED'::text, 'LOCKED'::text])))))));

CREATE POLICY "scenario_publication_read" ON "public"."sadu_exhibition_scenarios"
  FOR SELECT
  TO "authenticated"
  USING
    (((status = 'SUBMITTED'::text) AND (((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = ANY (ARRAY['EDITORIAL'::text, 'PR_PROTOCOL'::text, 'HIP'::text]))));

CREATE POLICY "scenario_read" ON "public"."sadu_exhibition_scenarios"
  FOR SELECT
  TO "authenticated"
  USING
    (((artist_id = auth.uid()) OR (coordinator_id = auth.uid()) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = ANY (ARRAY['LOGISTICS'::text,
    'BIENNIAL_DIRECTOR'::text]))));

CREATE POLICY "scenario_technical_read" ON "public"."sadu_exhibition_scenarios"
  FOR SELECT
  TO "authenticated"
  USING (((status = 'SUBMITTED'::text) AND (((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'TECHNICAL'::text)));

CREATE POLICY "scenario_update" ON "public"."sadu_exhibition_scenarios"
  FOR UPDATE
  TO "authenticated"
  USING (((artist_id = auth.uid()) AND (status = 'DRAFT'::text)))
  WITH CHECK ((artist_id = auth.uid()));

CREATE POLICY "titles_insert" ON "public"."sadu_exhibition_titles"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.sadu_exhibition_scenarios s
     JOIN public.bilateral_contracts c ON ((c.id = s.contract_id)))
  WHERE ((s.id = sadu_exhibition_titles.scenario_id) AND (s.artist_id = auth.uid()) AND (c.status = ANY (ARRAY['ARTIST_APPROVED'::text, 'LOCKED'::text]))))));

CREATE POLICY "titles_lock" ON "public"."sadu_exhibition_titles"
  FOR UPDATE
  TO "authenticated"
  USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'HIP'::text) AND (status = 'PENDING_CURATOR_REVIEW'::text)))
  WITH CHECK (((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'HIP'::text) AND (status = 'LOCKED'::text)));

CREATE POLICY "titles_management_read" ON "public"."sadu_exhibition_titles"
  FOR SELECT
  TO "authenticated"
  USING ((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = ANY (ARRAY['CHAIRMAN'::text, 'BIENNIAL_DIRECTOR'::text])));

CREATE POLICY "titles_read" ON "public"."sadu_exhibition_titles"
  FOR SELECT
  TO "authenticated"
  USING (((EXISTS ( SELECT 1
   FROM public.sadu_exhibition_scenarios s
  WHERE (s.id = sadu_exhibition_titles.scenario_id))) OR
    (((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = ANY (ARRAY['HIP'::text, 'EDITORIAL'::text, 'PR_PROTOCOL'::text]))));

CREATE POLICY "freight_alert_read" ON "public"."sadu_freight_alerts"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.sadu_freight_assignments a
  WHERE (a.consignment_id = sadu_freight_alerts.consignment_id))));

CREATE POLICY "freight_assignment_read" ON "public"."sadu_freight_assignments"
  FOR SELECT
  TO "authenticated"
  USING
    (((artist_id = auth.uid()) OR (vendor_id = auth.uid()) OR (curator_id = auth.uid()) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) =
    'LOGISTICS'::text)));

CREATE POLICY "freight_insert" ON "public"."sadu_freight_bookings"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((artist_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM (public.sadu_artwork_checklist a
     JOIN public.sadu_exhibition_scenarios s ON ((s.id = a.scenario_id)))
  WHERE ((a.id = sadu_freight_bookings.artwork_id) AND (s.artist_id = auth.uid()))))));

CREATE POLICY "freight_read" ON "public"."sadu_freight_bookings"
  FOR SELECT
  TO "authenticated"
  USING
    (((artist_id = auth.uid()) OR (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text), (auth.jwt() ->> 'institutional_role'::text)) =
    'LOGISTICS'::text)));

CREATE POLICY "freight_update" ON "public"."sadu_freight_bookings"
  FOR UPDATE
  TO "authenticated"
  USING
    (((artist_id = auth.uid()) OR (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text), (auth.jwt() ->> 'institutional_role'::text)) =
    'LOGISTICS'::text)))
  WITH
    CHECK
    (((artist_id = auth.uid()) OR (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text), (auth.jwt() ->> 'institutional_role'::text)) =
    'LOGISTICS'::text)));

CREATE POLICY "freight_changes_read" ON "public"."sadu_freight_changes"
  FOR SELECT
  TO "authenticated"
  USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = ANY (ARRAY['LOGISTICS'::text, 'FINANCE'::text])) OR (EXISTS ( SELECT 1
   FROM public.sadu_consignments c
  WHERE (c.id = sadu_freight_changes.consignment_id)))));

CREATE POLICY "deadline_read" ON "public"."sadu_guest_deadline_policy"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "document_policy_read" ON "public"."sadu_guest_document_policy"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "final_document_boundary" ON "public"."sadu_guest_finalizations"
  AS RESTRICTIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.sadu_guest_intakes r
  WHERE ((r.id = sadu_guest_finalizations.intake_id) AND (r.artist_id = auth.uid()) AND ((r.document_policy ->> 'version'::text) IS
    NOT NULL) AND public.sadu_valid_guest_identity(r.identity, r.arrival) AND
    (((r.document_policy ->> 'national_id_required'::text) = 'false'::text) OR (((r.document_policy ->> 'national_id_required'::text) = 'true'::text) AND (EXISTS ( SELECT 1
           FROM storage.objects o
          WHERE
            ((o.bucket_id = 'logistics-secure'::text) AND (o.name = ((((r.artist_id)::text || '/guest-intake/'::text) || (r.id)::text) || '/national-id.pdf'::text)) AND
            ((((o.metadata ->> 'size'::text))::bigint >= 1) AND (((o.metadata ->> 'size'::text))::bigint <= 10485760)) AND
            ((o.metadata ->> 'mimetype'::text) = 'application/pdf'::text))))))))));

CREATE POLICY "final_insert" ON "public"."sadu_guest_finalizations"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((artist_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM ((public.sadu_guest_queue q
     JOIN public.sadu_guest_intakes r ON ((r.id = q.id)))
     JOIN public.bilateral_contracts c ON ((c.id = q.contract_id)))
  WHERE
    ((q.id = sadu_guest_finalizations.intake_id) AND (q.artist_id = auth.uid()) AND (c.artist_id = auth.uid()) AND (c.status = ANY (ARRAY['ARTIST_APPROVED'::text, 'LOCKED'::text]))
    AND q.passport_uploaded AND q.photo_uploaded AND ((q.companion_name IS NULL) OR q.companion_uploaded) AND (q.airport = ANY (ARRAY['DXB'::text, 'SHJ'::text, 'OTHER'::text])) AND
    (r.departure_airport = ANY (ARRAY['DXB'::text, 'SHJ'::text, 'OTHER'::text])) AND public.sadu_valid_guest_identity(r.identity, r.arrival))))));

CREATE POLICY "final_read" ON "public"."sadu_guest_finalizations"
  FOR SELECT
  TO "authenticated"
  USING (((artist_id = auth.uid()) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'PR_PROTOCOL'::text)));

CREATE POLICY "guest_insert" ON "public"."sadu_guest_intakes"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((artist_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.bilateral_contracts c
  WHERE ((c.id = sadu_guest_intakes.contract_id) AND (c.artist_id = auth.uid()) AND (c.status = ANY (ARRAY['ARTIST_APPROVED'::text, 'LOCKED'::text])))))));

CREATE POLICY "guest_read" ON "public"."sadu_guest_intakes"
  FOR SELECT
  TO "authenticated"
  USING (((artist_id = auth.uid()) OR ((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'PR_PROTOCOL'::text) AND (EXISTS ( SELECT 1
   FROM public.sadu_guest_finalizations f
  WHERE (f.intake_id = sadu_guest_intakes.id))))));

CREATE POLICY "itinerary_document_boundary" ON "public"."sadu_guest_itinerary_approvals"
  AS RESTRICTIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.sadu_guest_submission_queue q
  WHERE ((q.id = sadu_guest_itinerary_approvals.intake_id) AND ((q.document_policy ->> 'version'::text) IS
    NOT NULL) AND public.sadu_valid_guest_identity(q.identity, q.arrival) AND ((q.national_id_required = false) OR ((q.national_id_required = true) AND q.national_id_uploaded))))));

CREATE POLICY "itinerary_no_refusal" ON "public"."sadu_guest_itinerary_approvals"
  AS RESTRICTIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((NOT (EXISTS ( SELECT 1
   FROM (public.sadu_visa_refusals v
     JOIN public.sadu_guest_intakes r ON ((r.contract_id = v.contract_id)))
  WHERE (r.id = v.intake_id)))));

CREATE POLICY "itinerary_read" ON "public"."sadu_guest_itinerary_approvals"
  FOR SELECT
  TO "authenticated"
  USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'PR_PROTOCOL'::text) OR (EXISTS ( SELECT 1
   FROM public.sadu_guest_intakes r
  WHERE ((r.id = sadu_guest_itinerary_approvals.intake_id) AND (r.artist_id = auth.uid()))))));

CREATE POLICY "reminder_read" ON "public"."sadu_guest_reminder_outbox"
  FOR SELECT
  TO "authenticated"
  USING (((artist_id = auth.uid()) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'PR_PROTOCOL'::text)));

CREATE POLICY "plan_insert" ON "public"."sadu_guest_travel_plans"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((artist_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.bilateral_contracts c
  WHERE ((c.id = sadu_guest_travel_plans.contract_id) AND (c.artist_id = auth.uid()) AND (c.status = ANY (ARRAY['ARTIST_APPROVED'::text, 'LOCKED'::text])))))));

CREATE POLICY "plan_read" ON "public"."sadu_guest_travel_plans"
  FOR SELECT
  TO "authenticated"
  USING (((artist_id = auth.uid()) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'PR_PROTOCOL'::text)));

CREATE POLICY "routing_admin" ON "public"."sadu_logistics_routing"
  FOR ALL
  TO "authenticated"
  USING ((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'ADMIN'::text))
  WITH CHECK ((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'ADMIN'::text));

CREATE POLICY "ticket_action" ON "public"."sadu_logistics_tickets"
  FOR UPDATE
  TO "authenticated"
  USING (((officer_id = auth.uid()) AND (((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'LOGISTICS'::text) AND (actioned_at IS NULL)))
  WITH CHECK (((officer_id = auth.uid()) AND (((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'LOGISTICS'::text)));

CREATE POLICY "ticket_ready" ON "public"."sadu_logistics_tickets"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((artist_id = auth.uid()));

CREATE POLICY "ticket_read" ON "public"."sadu_logistics_tickets"
  FOR SELECT
  TO "authenticated"
  USING
    (((((auth.uid() = artist_id) OR (auth.uid() = officer_id)) OR (auth.uid() = head_id)) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) =
    'ADMIN'::text)));

CREATE POLICY "review_read" ON "public"."sadu_media_reviews"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.sadu_scenario_media m
  WHERE (m.object_name = sadu_media_reviews.object_name))));

CREATE POLICY "publication_admin_read" ON "public"."sadu_publication_queue"
  FOR SELECT
  TO "authenticated"
  USING ((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'ADMIN'::text));

CREATE POLICY "publication_read" ON "public"."sadu_publication_queue"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.sadu_exhibition_scenarios s
  WHERE (s.id = sadu_publication_queue.scenario_id))));

CREATE POLICY "media_insert" ON "public"."sadu_scenario_media"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((EXISTS ( SELECT 1
   FROM public.sadu_exhibition_scenarios s
  WHERE ((s.id = sadu_scenario_media.scenario_id) AND (s.artist_id = auth.uid()) AND (s.status = 'DRAFT'::text)))) AND
    (object_name = (((((((((auth.uid())::text || '/scenarios/'::text) || (scenario_id)::text) || '/'::text) || (zone_id)::text) || '/'::text) || category) || '/'::text) ||
    file_name))));

CREATE POLICY "media_read" ON "public"."sadu_scenario_media"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.sadu_exhibition_scenarios s
  WHERE (s.id = sadu_scenario_media.scenario_id))));

CREATE POLICY "visa_template_read" ON "public"."sadu_visa_notice_templates"
  FOR SELECT
  TO "authenticated"
  USING ((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'PR_PROTOCOL'::text));

CREATE POLICY "visa_notice_read" ON "public"."sadu_visa_notifications"
  FOR SELECT
  TO "authenticated"
  USING (((artist_id = auth.uid()) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'PR_PROTOCOL'::text)));

CREATE POLICY "visa_refusal_read" ON "public"."sadu_visa_refusals"
  FOR SELECT
  TO "authenticated"
  USING ((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'PR_PROTOCOL'::text));

CREATE POLICY "companion_download" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'logistics-secure'::text) AND (EXISTS ( SELECT 1
   FROM public.sadu_companion_requests r
  WHERE (r.object_name = objects.name)))));

CREATE POLICY "companion_no_delete" ON "storage"."objects"
  AS RESTRICTIVE
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id <> 'logistics-secure'::text) OR ((storage.foldername(name))[2] IS DISTINCT FROM 'companion-intake'::text)));

CREATE POLICY "companion_no_replacement" ON "storage"."objects"
  AS RESTRICTIVE
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id <> 'logistics-secure'::text) OR ((storage.foldername(name))[2] IS DISTINCT FROM 'companion-intake'::text)));

CREATE POLICY "companion_read_boundary" ON "storage"."objects"
  AS RESTRICTIVE
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id <> 'logistics-secure'::text) OR ((storage.foldername(name))[2] IS DISTINCT FROM 'companion-intake'::text) OR (EXISTS ( SELECT 1
   FROM public.sadu_companion_requests r
  WHERE (r.object_name = objects.name)))));

CREATE POLICY "companion_upload" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'logistics-secure'::text) AND (EXISTS ( SELECT 1
   FROM (public.sadu_companion_requests r
     JOIN public.bilateral_contracts c ON ((c.id = r.contract_id)))
  WHERE ((r.object_name = objects.name) AND (r.artist_id = auth.uid()) AND (c.artist_id = auth.uid()) AND (c.status = ANY (ARRAY['ARTIST_APPROVED'::text, 'LOCKED'::text])))))));

CREATE POLICY "companion_write_boundary" ON "storage"."objects"
  AS RESTRICTIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id <> 'logistics-secure'::text) OR ((storage.foldername(name))[2] IS DISTINCT FROM 'companion-intake'::text) OR (EXISTS ( SELECT 1
   FROM (public.sadu_companion_requests r
     JOIN public.bilateral_contracts c ON ((c.id = r.contract_id)))
  WHERE ((r.object_name = objects.name) AND (r.artist_id = auth.uid()) AND (c.artist_id = auth.uid()) AND (c.status = ANY (ARRAY['ARTIST_APPROVED'::text, 'LOCKED'::text])))))));

CREATE POLICY "condition_photo_no_delete" ON "storage"."objects"
  AS RESTRICTIVE
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id <> 'logistics-secure'::text) OR ((storage.foldername(name))[2] IS DISTINCT FROM 'condition-reports'::text)));

CREATE POLICY "condition_photo_no_update" ON "storage"."objects"
  AS RESTRICTIVE
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id <> 'logistics-secure'::text) OR ((storage.foldername(name))[2] IS DISTINCT FROM 'condition-reports'::text)));

CREATE POLICY "condition_photo_read_boundary" ON "storage"."objects"
  AS RESTRICTIVE
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id <> 'logistics-secure'::text) OR ((storage.foldername(name))[2] IS DISTINCT FROM 'condition-reports'::text) OR (EXISTS ( SELECT 1
   FROM public.sadu_condition_reports r
  WHERE (r.photos ? objects.name)))));

CREATE POLICY "condition_photo_read" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'logistics-secure'::text) AND (EXISTS ( SELECT 1
   FROM public.sadu_condition_reports r
  WHERE (r.photos ? objects.name)))));

CREATE POLICY "guest_anon_boundary" ON "storage"."objects"
  AS RESTRICTIVE
  FOR SELECT
  TO "anon"
  USING (((bucket_id <> 'logistics-secure'::text) OR ((storage.foldername(name))[2] IS DISTINCT FROM 'guest-intake'::text)));

CREATE POLICY "guest_download" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'logistics-secure'::text) AND (EXISTS ( SELECT 1
   FROM public.sadu_guest_intakes r
  WHERE
    ((((objects.name = ((((r.artist_id)::text || '/guest-intake/'::text) || (r.id)::text) || '/passport.pdf'::text)) OR (objects.name = (((((r.artist_id)::text ||
    '/guest-intake/'::text) || (r.id)::text) || '/photo.'::text) || r.photo_extension))) OR (objects.name =
        CASE
            WHEN ((r.document_policy ->> 'national_id_required'::text) = 'true'::text) THEN
              ((((r.artist_id)::text || '/guest-intake/'::text) || (r.id)::text) || '/national-id.pdf'::text)
            ELSE NULL::text
        END)) OR (objects.name =
        CASE
            WHEN (r.companion_name IS NOT NULL) THEN ((((r.artist_id)::text || '/guest-intake/'::text) || (r.id)::text) || '/companion.pdf'::text)
            ELSE NULL::text
        END))))));

CREATE POLICY "guest_insert_boundary" ON "storage"."objects"
  AS RESTRICTIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id <> 'logistics-secure'::text) OR ((storage.foldername(name))[2] IS DISTINCT FROM 'guest-intake'::text) OR (EXISTS ( SELECT 1
   FROM (public.sadu_guest_intakes r
     JOIN public.bilateral_contracts c ON ((c.id = r.contract_id)))
  WHERE
    ((r.artist_id = auth.uid()) AND (c.artist_id = auth.uid()) AND (c.status = ANY (ARRAY['ARTIST_APPROVED'::text, 'LOCKED'::text])) AND ((((objects.name = ((((r.artist_id)::text
    || '/guest-intake/'::text) || (r.id)::text) || '/passport.pdf'::text)) OR
    (objects.name = (((((r.artist_id)::text || '/guest-intake/'::text) || (r.id)::text) || '/photo.'::text) || r.photo_extension))) OR (objects.name =
        CASE
            WHEN ((r.document_policy ->> 'national_id_required'::text) = 'true'::text) THEN
              ((((r.artist_id)::text || '/guest-intake/'::text) || (r.id)::text) || '/national-id.pdf'::text)
            ELSE NULL::text
        END)) OR (objects.name =
        CASE
            WHEN (r.companion_name IS NOT NULL) THEN ((((r.artist_id)::text || '/guest-intake/'::text) || (r.id)::text) || '/companion.pdf'::text)
            ELSE NULL::text
        END)))))));

CREATE POLICY "guest_no_delete" ON "storage"."objects"
  AS RESTRICTIVE
  FOR DELETE
  TO PUBLIC
  USING (((bucket_id <> 'logistics-secure'::text) OR ((storage.foldername(name))[2] IS DISTINCT FROM 'guest-intake'::text)));

CREATE POLICY "guest_no_update" ON "storage"."objects"
  AS RESTRICTIVE
  FOR UPDATE
  TO PUBLIC
  USING (((bucket_id <> 'logistics-secure'::text) OR ((storage.foldername(name))[2] IS DISTINCT FROM 'guest-intake'::text)));

CREATE POLICY "guest_read_boundary" ON "storage"."objects"
  AS RESTRICTIVE
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id <> 'logistics-secure'::text) OR ((storage.foldername(name))[2] IS DISTINCT FROM 'guest-intake'::text) OR (EXISTS ( SELECT 1
   FROM public.sadu_guest_intakes r
  WHERE
    ((((objects.name = ((((r.artist_id)::text || '/guest-intake/'::text) || (r.id)::text) || '/passport.pdf'::text)) OR (objects.name = (((((r.artist_id)::text ||
    '/guest-intake/'::text) || (r.id)::text) || '/photo.'::text) || r.photo_extension))) OR (objects.name =
        CASE
            WHEN ((r.document_policy ->> 'national_id_required'::text) = 'true'::text) THEN
              ((((r.artist_id)::text || '/guest-intake/'::text) || (r.id)::text) || '/national-id.pdf'::text)
            ELSE NULL::text
        END)) OR (objects.name =
        CASE
            WHEN (r.companion_name IS NOT NULL) THEN ((((r.artist_id)::text || '/guest-intake/'::text) || (r.id)::text) || '/companion.pdf'::text)
            ELSE NULL::text
        END))))));

CREATE POLICY "guest_upload" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'logistics-secure'::text) AND (EXISTS ( SELECT 1
   FROM (public.sadu_guest_intakes r
     JOIN public.bilateral_contracts c ON ((c.id = r.contract_id)))
  WHERE
    ((r.artist_id = auth.uid()) AND (c.artist_id = auth.uid()) AND (c.status = ANY (ARRAY['ARTIST_APPROVED'::text, 'LOCKED'::text])) AND ((((objects.name = ((((r.artist_id)::text
    || '/guest-intake/'::text) || (r.id)::text) || '/passport.pdf'::text)) OR
    (objects.name = (((((r.artist_id)::text || '/guest-intake/'::text) || (r.id)::text) || '/photo.'::text) || r.photo_extension))) OR (objects.name =
        CASE
            WHEN ((r.document_policy ->> 'national_id_required'::text) = 'true'::text) THEN
              ((((r.artist_id)::text || '/guest-intake/'::text) || (r.id)::text) || '/national-id.pdf'::text)
            ELSE NULL::text
        END)) OR (objects.name =
        CASE
            WHEN (r.companion_name IS NOT NULL) THEN ((((r.artist_id)::text || '/guest-intake/'::text) || (r.id)::text) || '/companion.pdf'::text)
            ELSE NULL::text
        END)))))));

CREATE POLICY "intake_download" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'logistics-secure'::text) AND (EXISTS ( SELECT 1
   FROM public.sadu_contract_intake d
  WHERE (d.object_name = objects.name)))));

CREATE POLICY "intake_upload" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'logistics-secure'::text) AND (EXISTS ( SELECT 1
   FROM (public.sadu_contract_intake d
     JOIN public.bilateral_contracts c ON ((c.id = d.contract_id)))
  WHERE ((d.object_name = objects.name) AND (d.artist_id = auth.uid()) AND (c.artist_id = auth.uid()) AND (c.status = ANY (ARRAY['ARTIST_APPROVED'::text, 'LOCKED'::text])))))));

CREATE POLICY "scenario_download" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'logistics-secure'::text) AND (EXISTS ( SELECT 1
   FROM public.sadu_scenario_media m
  WHERE (m.object_name = objects.name)))));

CREATE POLICY "scenario_upload" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'logistics-secure'::text) AND (EXISTS ( SELECT 1
   FROM (public.sadu_scenario_media m
     JOIN public.sadu_exhibition_scenarios s ON ((s.id = m.scenario_id)))
  WHERE ((m.object_name = objects.name) AND (s.artist_id = auth.uid()) AND (s.status = 'DRAFT'::text))))));

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."sadu_arrival_receipts";

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."sadu_artwork_checklist";

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."sadu_condition_reports";

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."sadu_consignments";

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."sadu_exhibition_titles";

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."sadu_freight_alerts";

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."sadu_freight_assignments";

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."sadu_freight_bookings";

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."sadu_freight_changes";

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."sadu_logistics_tickets";

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."sadu_media_reviews";

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."sadu_publication_queue";

COMMENT ON VIEW "public"."sadu_asset_escrow" IS 'Live media-evidence readiness only. Not a legal signature, contract status, cultural clearance or payment authorization.';

REVOKE ALL ON FUNCTION "public"."sadu_blueprint_not_label"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sadu_blueprint_not_label"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_blueprint_not_label"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_blueprint_not_label"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_blueprint_not_label"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."sadu_check_booking_origin"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sadu_check_booking_origin"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_check_booking_origin"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_check_booking_origin"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_check_booking_origin"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."sadu_complete_delivery"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sadu_complete_delivery"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_complete_delivery"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_complete_delivery"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_complete_delivery"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."sadu_condition_contracts"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_condition_contracts"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_condition_contracts"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_condition_contracts"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."sadu_decide_freight_change"(uuid, boolean, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_decide_freight_change"(uuid, boolean, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_decide_freight_change"(uuid, boolean, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_decide_freight_change"(uuid, boolean, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."sadu_dossier_role"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sadu_dossier_role"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_dossier_role"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_dossier_role"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_dossier_role"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."sadu_finalize_guest"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_finalize_guest"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_finalize_guest"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_finalize_guest"(uuid) TO "service_role";

REVOKE ALL ON FUNCTION "public"."sadu_guard_booking"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sadu_guard_booking"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_guard_booking"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_guard_booking"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_guard_booking"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."sadu_guard_committee_gate"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sadu_guard_committee_gate"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_guard_committee_gate"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_guard_committee_gate"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_guard_committee_gate"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."sadu_guard_pickup_calendar"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sadu_guard_pickup_calendar"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_guard_pickup_calendar"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_guard_pickup_calendar"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_guard_pickup_calendar"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."sadu_guest_document_snapshot"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_guest_document_snapshot"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_guest_document_snapshot"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_guest_document_snapshot"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."sadu_guest_finalization_time"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_guest_finalization_time"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_guest_finalization_time"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_guest_finalization_time"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."sadu_guest_plan_time"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_guest_plan_time"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_guest_plan_time"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_guest_plan_time"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."sadu_guest_snapshot"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_guest_snapshot"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_guest_snapshot"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_guest_snapshot"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."sadu_issue_consignment"(uuid, text, text, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_issue_consignment"(uuid, text, text, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_issue_consignment"(uuid, text, text, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_issue_consignment"(uuid, text, text, text) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."sadu_itinerary_stamp"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_itinerary_stamp"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_itinerary_stamp"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_itinerary_stamp"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."sadu_lock_exhibition_title"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_lock_exhibition_title"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_lock_exhibition_title"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_lock_exhibition_title"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."sadu_logistics_action"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_logistics_action"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_logistics_action"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_logistics_action"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."sadu_match_asset_bundle"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sadu_match_asset_bundle"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_match_asset_bundle"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_match_asset_bundle"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_match_asset_bundle"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."sadu_operational_guest_calendar"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_operational_guest_calendar"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_operational_guest_calendar"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_operational_guest_calendar"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."sadu_pickup_deadline"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sadu_pickup_deadline"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_pickup_deadline"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_pickup_deadline"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_pickup_deadline"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."sadu_pr_guest_roster"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_pr_guest_roster"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_pr_guest_roster"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_pr_guest_roster"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."sadu_prepare_publication"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_prepare_publication"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_prepare_publication"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_prepare_publication"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."sadu_receive_consignment"(text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sadu_receive_consignment"(text, jsonb) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_receive_consignment"(text, jsonb) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_receive_consignment"(text, jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_receive_consignment"(text, jsonb) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."sadu_record_visa_refusal"(uuid, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_record_visa_refusal"(uuid, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_record_visa_refusal"(uuid, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_record_visa_refusal"(uuid, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."sadu_require_asset_bundle"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sadu_require_asset_bundle"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_require_asset_bundle"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_require_asset_bundle"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_require_asset_bundle"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."sadu_require_execution_escrow"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sadu_require_execution_escrow"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_require_execution_escrow"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_require_execution_escrow"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_require_execution_escrow"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."sadu_require_label_declaration"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sadu_require_label_declaration"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_require_label_declaration"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_require_label_declaration"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_require_label_declaration"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."sadu_require_labels"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sadu_require_labels"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_require_labels"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_require_labels"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_require_labels"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."sadu_stamp_media_review"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_stamp_media_review"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_stamp_media_review"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_stamp_media_review"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."sadu_valid_guest_identity"(jsonb, date) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_valid_guest_identity"(jsonb, date) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_valid_guest_identity"(jsonb, date) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_valid_guest_identity"(jsonb, date) TO "service_role";

REVOKE ALL ON FUNCTION "public"."sadu_validate_condition_report"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sadu_validate_condition_report"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_validate_condition_report"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_validate_condition_report"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_validate_condition_report"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."sadu_validate_label"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sadu_validate_label"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_validate_label"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_validate_label"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_validate_label"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."sadu_value_stamp"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."sadu_value_stamp"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."sadu_value_stamp"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_value_stamp"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."sadu_value_stamp"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."validate_exhibition_scenario"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."validate_exhibition_scenario"() TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."validate_exhibition_scenario"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."validate_exhibition_scenario"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."validate_exhibition_scenario"() TO "service_role";

REVOKE ALL ON FUNCTION "sadu_governance"."immutable_record"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "sadu_private"."condition_contracts"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sadu_private"."condition_contracts"() TO "authenticated";

REVOKE ALL ON FUNCTION "sadu_private"."decide_freight_change"(uuid, boolean, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sadu_private"."decide_freight_change"(uuid, boolean, text) TO "authenticated";

REVOKE ALL ON FUNCTION "sadu_private"."escalate_freight_closures"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "sadu_private"."escalate_logistics_sla"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "sadu_private"."finance_artwork_visible"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sadu_private"."finance_artwork_visible"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "sadu_private"."issue_consignment"(uuid, text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sadu_private"."issue_consignment"(uuid, text, text, text) TO "authenticated";

REVOKE ALL ON FUNCTION "sadu_private"."lock_approved_visa_template"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "sadu_private"."logistics_ready"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "sadu_private"."operational_guest_calendar"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sadu_private"."operational_guest_calendar"() TO "authenticated";

REVOKE ALL ON FUNCTION "sadu_private"."packing_ready_guard"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "sadu_private"."pr_guest_roster"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sadu_private"."pr_guest_roster"() TO "authenticated";

REVOKE ALL ON FUNCTION "sadu_private"."prepare_freight_change"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "sadu_private"."queue_asset_reminders"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "sadu_private"."queue_guest_reminders"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "sadu_private"."receive_consignment"(text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sadu_private"."receive_consignment"(text, jsonb) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "sadu_private"."record_visa_refusal"(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "sadu_private"."record_visa_refusal"(uuid, text) TO "authenticated";

REVOKE ALL ON FUNCTION "sadu_private"."release_visa_notices"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "sadu_private"."stamp_arrival"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "sadu_private"."validate_freight_assignment"() FROM PUBLIC;

GRANT USAGE ON SCHEMA "sadu_private" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."artist_dossiers" FROM "anon";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."artist_dossiers" TO "anon";

REVOKE ALL ON TABLE "public"."sadu_arrival_receipts" FROM "authenticated";

REVOKE ALL ("all_crates_received") ON TABLE "public"."sadu_arrival_receipts" FROM "authenticated";

GRANT INSERT ("all_crates_received") ON TABLE "public"."sadu_arrival_receipts" TO "authenticated";

REVOKE ALL ("booking_id") ON TABLE "public"."sadu_arrival_receipts" FROM "authenticated";

GRANT INSERT ("booking_id") ON TABLE "public"."sadu_arrival_receipts" TO "authenticated";

REVOKE ALL ("facility") ON TABLE "public"."sadu_arrival_receipts" FROM "authenticated";

GRANT INSERT ("facility") ON TABLE "public"."sadu_arrival_receipts" TO "authenticated";

GRANT SELECT ON TABLE "public"."sadu_arrival_receipts" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_arrival_receipts" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_arrival_receipts" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_arrival_receipts" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_artwork_checklist" FROM "authenticated";

REVOKE ALL ("religious_text") ON TABLE "public"."sadu_artwork_checklist" FROM "authenticated";

GRANT INSERT ("religious_text") ON TABLE "public"."sadu_artwork_checklist" TO "authenticated";

REVOKE ALL ("translation_ar") ON TABLE "public"."sadu_artwork_checklist" FROM "authenticated";

GRANT UPDATE ("translation_ar") ON TABLE "public"."sadu_artwork_checklist" TO "authenticated";

REVOKE ALL ("translation_en") ON TABLE "public"."sadu_artwork_checklist" FROM "authenticated";

GRANT UPDATE ("translation_en") ON TABLE "public"."sadu_artwork_checklist" TO "authenticated";

REVOKE ALL ("translation_status") ON TABLE "public"."sadu_artwork_checklist" FROM "authenticated";

GRANT UPDATE ("translation_status") ON TABLE "public"."sadu_artwork_checklist" TO "authenticated";

GRANT INSERT, SELECT ON TABLE "public"."sadu_artwork_checklist" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_artwork_checklist" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_artwork_checklist" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_artwork_checklist" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_artwork_values" FROM "authenticated";

REVOKE ALL ("amount_minor") ON TABLE "public"."sadu_artwork_values" FROM "authenticated";

GRANT INSERT ("amount_minor") ON TABLE "public"."sadu_artwork_values" TO "authenticated";

REVOKE ALL ("artwork_id") ON TABLE "public"."sadu_artwork_values" FROM "authenticated";

GRANT INSERT ("artwork_id") ON TABLE "public"."sadu_artwork_values" TO "authenticated";

REVOKE ALL ("currency") ON TABLE "public"."sadu_artwork_values" FROM "authenticated";

GRANT INSERT ("currency") ON TABLE "public"."sadu_artwork_values" TO "authenticated";

REVOKE ALL ("purpose") ON TABLE "public"."sadu_artwork_values" FROM "authenticated";

GRANT INSERT ("purpose") ON TABLE "public"."sadu_artwork_values" TO "authenticated";

GRANT SELECT ON TABLE "public"."sadu_artwork_values" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_artwork_values" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_artwork_values" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_artwork_values" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_asset_reminders" FROM "authenticated";

GRANT SELECT ON TABLE "public"."sadu_asset_reminders" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_asset_reminders" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_asset_reminders" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_asset_reminders" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_asset_scope" FROM "authenticated";

REVOKE ALL ("approval_reference") ON TABLE "public"."sadu_asset_scope" FROM "authenticated";

GRANT INSERT ("approval_reference") ON TABLE "public"."sadu_asset_scope" TO "authenticated";

REVOKE ALL ("expected_count") ON TABLE "public"."sadu_asset_scope" FROM "authenticated";

GRANT INSERT ("expected_count") ON TABLE "public"."sadu_asset_scope" TO "authenticated";

REVOKE ALL ("scenario_id") ON TABLE "public"."sadu_asset_scope" FROM "authenticated";

GRANT INSERT ("scenario_id") ON TABLE "public"."sadu_asset_scope" TO "authenticated";

GRANT SELECT ON TABLE "public"."sadu_asset_scope" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_asset_scope" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_asset_scope" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_asset_scope" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_companion_requests" FROM "authenticated";

GRANT INSERT, SELECT ON TABLE "public"."sadu_companion_requests" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_companion_requests" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_companion_requests" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_companion_requests" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_condition_reports" FROM "authenticated";

REVOKE ALL ("status") ON TABLE "public"."sadu_condition_reports" FROM "authenticated";

GRANT UPDATE ("status") ON TABLE "public"."sadu_condition_reports" TO "authenticated";

GRANT INSERT, SELECT ON TABLE "public"."sadu_condition_reports" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_condition_reports" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_condition_reports" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_condition_reports" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_consignments" FROM "authenticated";

GRANT SELECT ON TABLE "public"."sadu_consignments" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_consignments" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_consignments" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_consignments" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_contract_intake" FROM "authenticated";

GRANT INSERT, SELECT ON TABLE "public"."sadu_contract_intake" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_contract_intake" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_contract_intake" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_contract_intake" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_exhibition_scenarios" TO "anon";

REVOKE ALL ("artwork_checklist") ON TABLE "public"."sadu_exhibition_scenarios" FROM "authenticated";

GRANT UPDATE ("artwork_checklist") ON TABLE "public"."sadu_exhibition_scenarios" TO "authenticated";

REVOKE ALL ("status") ON TABLE "public"."sadu_exhibition_scenarios" FROM "authenticated";

GRANT UPDATE ("status") ON TABLE "public"."sadu_exhibition_scenarios" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_exhibition_scenarios" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_exhibition_scenarios" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_exhibition_scenarios" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_exhibition_scenarios" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_exhibition_titles" FROM "authenticated";

REVOKE ALL ("scenario_id") ON TABLE "public"."sadu_exhibition_titles" FROM "authenticated";

GRANT INSERT ("scenario_id") ON TABLE "public"."sadu_exhibition_titles" TO "authenticated";

REVOKE ALL ("status") ON TABLE "public"."sadu_exhibition_titles" FROM "authenticated";

GRANT UPDATE ("status") ON TABLE "public"."sadu_exhibition_titles" TO "authenticated";

REVOKE ALL ("title_ar") ON TABLE "public"."sadu_exhibition_titles" FROM "authenticated";

GRANT INSERT ("title_ar") ON TABLE "public"."sadu_exhibition_titles" TO "authenticated";

REVOKE ALL ("title_en") ON TABLE "public"."sadu_exhibition_titles" FROM "authenticated";

GRANT INSERT ("title_en") ON TABLE "public"."sadu_exhibition_titles" TO "authenticated";

GRANT SELECT ON TABLE "public"."sadu_exhibition_titles" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_exhibition_titles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_exhibition_titles" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_exhibition_titles" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_freight_alerts" FROM "authenticated";

GRANT SELECT ON TABLE "public"."sadu_freight_alerts" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_freight_alerts" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_freight_alerts" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_freight_alerts" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_freight_assignments" FROM "authenticated";

REVOKE ALL ("closure_start") ON TABLE "public"."sadu_freight_assignments" FROM "authenticated";

GRANT INSERT ("closure_start") ON TABLE "public"."sadu_freight_assignments" TO "authenticated";

REVOKE ALL ("consignment_id") ON TABLE "public"."sadu_freight_assignments" FROM "authenticated";

GRANT INSERT ("consignment_id") ON TABLE "public"."sadu_freight_assignments" TO "authenticated";

REVOKE ALL ("curator_id") ON TABLE "public"."sadu_freight_assignments" FROM "authenticated";

GRANT INSERT ("curator_id") ON TABLE "public"."sadu_freight_assignments" TO "authenticated";

REVOKE ALL ("facility_timezone") ON TABLE "public"."sadu_freight_assignments" FROM "authenticated";

GRANT INSERT ("facility_timezone") ON TABLE "public"."sadu_freight_assignments" TO "authenticated";

REVOKE ALL ("reopens_on") ON TABLE "public"."sadu_freight_assignments" FROM "authenticated";

GRANT INSERT ("reopens_on") ON TABLE "public"."sadu_freight_assignments" TO "authenticated";

REVOKE ALL ("vendor_id") ON TABLE "public"."sadu_freight_assignments" FROM "authenticated";

GRANT INSERT ("vendor_id") ON TABLE "public"."sadu_freight_assignments" TO "authenticated";

GRANT SELECT ON TABLE "public"."sadu_freight_assignments" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_freight_assignments" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_freight_assignments" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_freight_assignments" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_freight_bookings" FROM "authenticated";

REVOKE ALL ("change_reason") ON TABLE "public"."sadu_freight_bookings" FROM "authenticated";

GRANT UPDATE ("change_reason") ON TABLE "public"."sadu_freight_bookings" TO "authenticated";

REVOKE ALL ("change_status") ON TABLE "public"."sadu_freight_bookings" FROM "authenticated";

GRANT UPDATE ("change_status") ON TABLE "public"."sadu_freight_bookings" TO "authenticated";

REVOKE ALL ("condition_reference") ON TABLE "public"."sadu_freight_bookings" FROM "authenticated";

GRANT UPDATE ("condition_reference") ON TABLE "public"."sadu_freight_bookings" TO "authenticated";

REVOKE ALL ("ready_date") ON TABLE "public"."sadu_freight_bookings" FROM "authenticated";

GRANT UPDATE ("ready_date") ON TABLE "public"."sadu_freight_bookings" TO "authenticated";

REVOKE ALL ("requested_date") ON TABLE "public"."sadu_freight_bookings" FROM "authenticated";

GRANT UPDATE ("requested_date") ON TABLE "public"."sadu_freight_bookings" TO "authenticated";

REVOKE ALL ("status") ON TABLE "public"."sadu_freight_bookings" FROM "authenticated";

GRANT UPDATE ("status") ON TABLE "public"."sadu_freight_bookings" TO "authenticated";

GRANT INSERT, SELECT ON TABLE "public"."sadu_freight_bookings" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_freight_bookings" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_freight_bookings" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_freight_bookings" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_freight_changes" FROM "authenticated";

REVOKE ALL ("consignment_id") ON TABLE "public"."sadu_freight_changes" FROM "authenticated";

GRANT INSERT ("consignment_id") ON TABLE "public"."sadu_freight_changes" TO "authenticated";

REVOKE ALL ("currency") ON TABLE "public"."sadu_freight_changes" FROM "authenticated";

GRANT INSERT ("currency") ON TABLE "public"."sadu_freight_changes" TO "authenticated";

REVOKE ALL ("estimated_cost_minor") ON TABLE "public"."sadu_freight_changes" FROM "authenticated";

GRANT INSERT ("estimated_cost_minor") ON TABLE "public"."sadu_freight_changes" TO "authenticated";

REVOKE ALL ("kind") ON TABLE "public"."sadu_freight_changes" FROM "authenticated";

GRANT INSERT ("kind") ON TABLE "public"."sadu_freight_changes" TO "authenticated";

REVOKE ALL ("payer") ON TABLE "public"."sadu_freight_changes" FROM "authenticated";

GRANT INSERT ("payer") ON TABLE "public"."sadu_freight_changes" TO "authenticated";

REVOKE ALL ("proposal") ON TABLE "public"."sadu_freight_changes" FROM "authenticated";

GRANT INSERT ("proposal") ON TABLE "public"."sadu_freight_changes" TO "authenticated";

REVOKE ALL ("reason") ON TABLE "public"."sadu_freight_changes" FROM "authenticated";

GRANT INSERT ("reason") ON TABLE "public"."sadu_freight_changes" TO "authenticated";

GRANT SELECT ON TABLE "public"."sadu_freight_changes" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_freight_changes" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_freight_changes" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_freight_changes" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_guest_deadline_policy" FROM "authenticated";

GRANT SELECT ON TABLE "public"."sadu_guest_deadline_policy" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_guest_deadline_policy" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_guest_deadline_policy" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_guest_deadline_policy" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_guest_document_policy" FROM "authenticated";

GRANT SELECT ON TABLE "public"."sadu_guest_document_policy" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_guest_document_policy" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_guest_document_policy" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_guest_document_policy" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_guest_finalizations" FROM "authenticated";

GRANT INSERT, SELECT ON TABLE "public"."sadu_guest_finalizations" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_guest_finalizations" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_guest_finalizations" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_guest_finalizations" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_guest_intakes" FROM "authenticated";

GRANT INSERT, SELECT ON TABLE "public"."sadu_guest_intakes" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_guest_intakes" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_guest_intakes" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_guest_intakes" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_guest_itinerary_approvals" FROM "authenticated";

GRANT INSERT, SELECT ON TABLE "public"."sadu_guest_itinerary_approvals" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_guest_itinerary_approvals" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_guest_itinerary_approvals" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_guest_itinerary_approvals" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_guest_reminder_outbox" FROM "authenticated";

GRANT SELECT ON TABLE "public"."sadu_guest_reminder_outbox" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_guest_reminder_outbox" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_guest_reminder_outbox" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_guest_reminder_outbox" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_guest_travel_plans" FROM "authenticated";

GRANT INSERT, SELECT ON TABLE "public"."sadu_guest_travel_plans" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_guest_travel_plans" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_guest_travel_plans" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_guest_travel_plans" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_logistics_routing" FROM "authenticated";

GRANT INSERT, SELECT ON TABLE "public"."sadu_logistics_routing" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_logistics_routing" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_logistics_routing" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_logistics_routing" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_logistics_tickets" FROM "authenticated";

REVOKE ALL ("action_note") ON TABLE "public"."sadu_logistics_tickets" FROM "authenticated";

GRANT UPDATE ("action_note") ON TABLE "public"."sadu_logistics_tickets" TO "authenticated";

REVOKE ALL ("consignment_id") ON TABLE "public"."sadu_logistics_tickets" FROM "authenticated";

GRANT INSERT ("consignment_id") ON TABLE "public"."sadu_logistics_tickets" TO "authenticated";

REVOKE ALL ("opened_at") ON TABLE "public"."sadu_logistics_tickets" FROM "authenticated";

GRANT UPDATE ("opened_at") ON TABLE "public"."sadu_logistics_tickets" TO "authenticated";

GRANT SELECT ON TABLE "public"."sadu_logistics_tickets" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_logistics_tickets" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_logistics_tickets" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_logistics_tickets" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_media_reviews" FROM "authenticated";

REVOKE ALL ("object_name") ON TABLE "public"."sadu_media_reviews" FROM "authenticated";

GRANT INSERT ("object_name") ON TABLE "public"."sadu_media_reviews" TO "authenticated";

GRANT SELECT ON TABLE "public"."sadu_media_reviews" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_media_reviews" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_media_reviews" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_media_reviews" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_publication_queue" FROM "authenticated";

REVOKE ALL ("scenario_id") ON TABLE "public"."sadu_publication_queue" FROM "authenticated";

GRANT INSERT ("scenario_id") ON TABLE "public"."sadu_publication_queue" TO "authenticated";

GRANT SELECT ON TABLE "public"."sadu_publication_queue" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_publication_queue" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_publication_queue" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_publication_queue" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_scenario_media" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."sadu_scenario_media" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_scenario_media" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_scenario_media" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_visa_notice_templates" FROM "authenticated";

GRANT SELECT ON TABLE "public"."sadu_visa_notice_templates" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_visa_notice_templates" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_visa_notice_templates" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_visa_notice_templates" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_visa_notifications" FROM "authenticated";

GRANT SELECT ON TABLE "public"."sadu_visa_notifications" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_visa_notifications" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_visa_notifications" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_visa_notifications" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_visa_refusals" FROM "authenticated";

GRANT SELECT ON TABLE "public"."sadu_visa_refusals" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_visa_refusals" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_visa_refusals" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_visa_refusals" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_asset_escrow" FROM "authenticated";

GRANT SELECT ON TABLE "public"."sadu_asset_escrow" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_asset_escrow" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_asset_escrow" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_asset_escrow" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_guest_queue" FROM "authenticated";

GRANT SELECT ON TABLE "public"."sadu_guest_queue" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_guest_queue" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_guest_queue" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_guest_queue" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_guest_submission_queue" FROM "authenticated";

GRANT SELECT ON TABLE "public"."sadu_guest_submission_queue" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_guest_submission_queue" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_guest_submission_queue" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_guest_submission_queue" TO "service_role";

REVOKE ALL ON TABLE "public"."sadu_media_inventory" FROM "authenticated";

GRANT SELECT ON TABLE "public"."sadu_media_inventory" TO "authenticated";

REVOKE ALL ON TABLE "public"."sadu_media_inventory" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_media_inventory" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sadu_media_inventory" TO "service_role";

CREATE POLICY "arrival_record" ON "public"."sadu_arrival_receipts"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'LOGISTICS'::text) AND (recorded_by = auth.uid())));

CREATE POLICY "artwork_value_insert" ON "public"."sadu_artwork_values"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((artist_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM (public.sadu_artwork_checklist a
     JOIN public.sadu_exhibition_scenarios s ON ((s.id = a.scenario_id)))
  WHERE ((a.id = sadu_artwork_values.artwork_id) AND (s.artist_id = auth.uid()) AND (s.status = 'DRAFT'::text))))));

CREATE POLICY "artwork_value_read" ON "public"."sadu_artwork_values"
  FOR SELECT
  TO "authenticated"
  USING (((artist_id = auth.uid()) OR sadu_private.finance_artwork_visible(artwork_id)));

CREATE POLICY "scope_insert" ON "public"."sadu_asset_scope"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'BIENNIAL_DIRECTOR'::text) AND (approved_by = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.sadu_exhibition_scenarios s
  WHERE (s.id = sadu_asset_scope.scenario_id)))));

CREATE POLICY "condition_insert" ON "public"."sadu_condition_reports"
  FOR INSERT
  TO "authenticated"
  WITH
    CHECK
    (((COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text), (auth.jwt() ->> 'institutional_role'::text)) = 'LOGISTICS'::text) AND (reporter_id =
    auth.uid()) AND (status = 'DRAFT'::text) AND (EXISTS ( SELECT 1
   FROM public.sadu_condition_contracts() c(id, artist_id, artist_name)
  WHERE ((c.id = sadu_condition_reports.contract_id) AND (c.artist_id = sadu_condition_reports.artist_id))))));

CREATE POLICY "condition_update" ON "public"."sadu_condition_reports"
  FOR UPDATE
  TO "authenticated"
  USING
    ((((status = 'DRAFT'::text) AND (reporter_id = auth.uid()) AND (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text), (auth.jwt() ->>
    'institutional_role'::text)) = 'LOGISTICS'::text)) OR ((status = 'DAMAGED_PENDING_ARTIST_APPROVAL'::text) AND (artist_id = auth.uid()))))
  WITH
    CHECK
    ((((reporter_id = auth.uid()) AND (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text), (auth.jwt() ->> 'institutional_role'::text)) =
    'LOGISTICS'::text)) OR (artist_id = auth.uid())));

CREATE POLICY "condition_photo_upload" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'logistics-secure'::text) AND (EXISTS ( SELECT 1
   FROM public.sadu_condition_reports r
  WHERE ((r.reporter_id = auth.uid()) AND (r.status = 'DRAFT'::text) AND (r.photos ? objects.name))))));

CREATE POLICY "condition_photo_write_boundary" ON "storage"."objects"
  AS RESTRICTIVE
  FOR INSERT
  TO "authenticated"
  WITH
    CHECK
    (((bucket_id <> 'logistics-secure'::text) OR ((storage.foldername(name))[2] IS DISTINCT FROM 'condition-reports'::text) OR ((COALESCE(((auth.jwt() -> 'app_metadata'::text) ->>
    'institutional_role'::text), (auth.jwt() ->> 'institutional_role'::text)) = 'LOGISTICS'::text) AND (EXISTS ( SELECT 1
   FROM public.sadu_condition_reports r
  WHERE ((r.reporter_id = auth.uid()) AND (r.status = 'DRAFT'::text) AND (r.photos ? objects.name)))))));

CREATE POLICY "freight_assignment_insert" ON "public"."sadu_freight_assignments"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'LOGISTICS'::text) AND (recorded_by = auth.uid())));

CREATE POLICY "freight_changes_request" ON "public"."sadu_freight_changes"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((requested_by = auth.uid()));

CREATE POLICY "itinerary_insert" ON "public"."sadu_guest_itinerary_approvals"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'PR_PROTOCOL'::text) AND (reviewed_by = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.sadu_guest_intakes r
  WHERE ((r.id = sadu_guest_itinerary_approvals.intake_id) AND (EXISTS ( SELECT 1
           FROM ( SELECT p_1.id,
                    p_1.contract_id,
                    p_1.artist_id,
                    p_1.arrival,
                    p_1.departure,
                    p_1.created_at
                   FROM public.sadu_guest_travel_plans p_1
                  WHERE (p_1.contract_id = r.contract_id)
                  ORDER BY p_1.created_at DESC, p_1.id DESC
                 LIMIT 1) p
          WHERE ((p.arrival = r.arrival) AND (p.departure = r.departure)))) AND (NOT (EXISTS ( SELECT 1
           FROM (public.sadu_guest_intakes n
             JOIN public.sadu_guest_finalizations f ON ((f.intake_id = n.id)))
          WHERE ((n.contract_id = r.contract_id) AND (ROW(n.created_at, n.id) > ROW(r.created_at, r.id)))))))))));

CREATE POLICY "review_insert" ON "public"."sadu_media_reviews"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'EDITORIAL'::text) AND (reviewed_by = auth.uid())));

CREATE POLICY "publication_insert" ON "public"."sadu_publication_queue"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((((auth.jwt() -> 'app_metadata'::text) ->> 'institutional_role'::text) = 'EDITORIAL'::text) AND (approved_by = auth.uid())));

-- Local queue/escalation jobs. They only write in-app notices; no external delivery.
select cron.schedule('sadu-guest-reminders-local', '*/15 * * * *', 'select sadu_private.queue_guest_reminders()');
select cron.schedule('sadu-pending-assets-local', '*/15 * * * *', 'select sadu_private.queue_asset_reminders();');
select cron.schedule('sadu-freight-closure-local', '*/15 * * * *', 'select sadu_private.escalate_freight_closures();');
select cron.schedule('sadu-logistics-action-sla-local', '*/15 * * * *', 'select sadu_private.escalate_logistics_sla();');
