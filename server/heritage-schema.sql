-- Safeguarding extension to unified-schema.sql. Local reference schema, not a hosted migration.
-- Enum labels are SADU vocabulary v1, not values prescribed by UNESCO.
CREATE TABLE heritage_social_actor (
 id TEXT PRIMARY KEY CHECK(length(id)=36), exhibition_id TEXT NOT NULL REFERENCES exhibition(id),
 kind TEXT NOT NULL CHECK(kind IN ('Institution','Family_Group','Guild','Master_Practitioner')),
 name_en TEXT NOT NULL, name_ar TEXT NOT NULL, UNIQUE(id,exhibition_id)
);
CREATE TABLE artist_record (id TEXT PRIMARY KEY CHECK(length(id)=36), actor_id TEXT NOT NULL REFERENCES actor(id), exhibition_id TEXT NOT NULL REFERENCES exhibition(id));
CREATE TABLE artist_heritage_revision (
 id TEXT PRIMARY KEY CHECK(length(id)=36), artist_id TEXT NOT NULL REFERENCES artist_record(id),
 version_hash TEXT NOT NULL CHECK(length(version_hash)=64), recorded_by TEXT NOT NULL REFERENCES actor(id), recorded_at TEXT NOT NULL
);
CREATE TABLE safeguarding_declaration (
 id TEXT PRIMARY KEY, artwork_revision_id TEXT UNIQUE REFERENCES artwork_revision(id), artist_revision_id TEXT UNIQUE REFERENCES artist_heritage_revision(id),
 exhibition_id TEXT NOT NULL REFERENCES exhibition(id), vocabulary_version INTEGER NOT NULL CHECK(vocabulary_version=1),
 applicability TEXT NOT NULL CHECK(applicability IN ('APPLICABLE','NOT_APPLICABLE')), reason TEXT,
 transmission_method TEXT CHECK(transmission_method IN ('INTERGENERATIONAL','FORMAL_TRAINING','PEER_EXCHANGE','REVITALIZATION_PROGRAM')),
 material_provenance TEXT CHECK(material_provenance IN ('NATURAL_RAW','SYNTHETIC','MIXED_MEDIA','HISTORICAL_DYE')),
 CHECK((artwork_revision_id IS NULL) != (artist_revision_id IS NULL)),
 CHECK((applicability='APPLICABLE' AND transmission_method IS NOT NULL AND material_provenance IS NOT NULL) OR
       (applicability='NOT_APPLICABLE' AND length(trim(reason))>=10 AND transmission_method IS NULL AND material_provenance IS NULL)),
 UNIQUE(id,exhibition_id)
);
CREATE TABLE safeguarding_measure (
 declaration_id TEXT NOT NULL REFERENCES safeguarding_declaration(id),
 measure TEXT NOT NULL CHECK(measure IN ('DOCUMENTATION','EXHIBITION','CAPACITY_BUILDING','ECONOMIC_SUPPORT')),
 PRIMARY KEY(declaration_id,measure)
);
CREATE TABLE safeguarding_social_actor (
 declaration_id TEXT NOT NULL, exhibition_id TEXT NOT NULL, actor_id TEXT NOT NULL,
 PRIMARY KEY(declaration_id,actor_id),
 FOREIGN KEY(declaration_id,exhibition_id) REFERENCES safeguarding_declaration(id,exhibition_id),
 FOREIGN KEY(actor_id,exhibition_id) REFERENCES heritage_social_actor(id,exhibition_id)
);
-- ARRAY[ENUM] and ARRAY[UUID] are normalized above. Submission controller enforces
-- nonempty, unique arrays and scope in the same transaction before revision commit.
-- Existing revisions remain NOT_RECORDED; do not backfill invented declarations.
CREATE TRIGGER artist_heritage_revision_no_update BEFORE UPDATE ON artist_heritage_revision BEGIN SELECT RAISE(ABORT,'Create a new artist revision'); END;
CREATE TRIGGER artist_heritage_revision_no_delete BEFORE DELETE ON artist_heritage_revision BEGIN SELECT RAISE(ABORT,'Artist revisions are retained'); END;
