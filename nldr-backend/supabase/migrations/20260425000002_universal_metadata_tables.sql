-- ============================================================
-- NLDR  |  MIGRATION 002  —  New Enums + Universal Tables
-- Depends on: 20260425000001_initial_schema.sql
-- ============================================================

-- ── New enums (not in initial schema) ────────────────────────
CREATE TYPE content_type_enum AS ENUM (
    'audio', 'video', 'document', 'source',
    'collection', 'transcript', 'image'
);

CREATE TYPE visibility_type AS ENUM (
    'public',       -- visible to everyone
    'restricted',   -- authenticated users only
    'private',      -- contributor + admins only
    'embargoed'     -- hidden until embargo date
);

CREATE TYPE relationship_type AS ENUM (
    'derived_from', 'related_to', 'part_of',
    'references', 'translation_of', 'version_of', 'replaces'
);

CREATE TYPE field_data_type AS ENUM (
    'text', 'integer', 'decimal', 'boolean',
    'date', 'timestamptz', 'jsonb', 'uuid', 'text_array'
);

CREATE TYPE cultural_sensitivity_level AS ENUM (
    'open', 'low', 'medium', 'high', 'secret_sacred'
);

-- ── contributors ─────────────────────────────────────────────
-- External contributors not necessarily registered as users.
CREATE TABLE IF NOT EXISTS public.contributors (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    full_name    TEXT        NOT NULL,
    email        TEXT,
    institution  TEXT,
    orcid        TEXT        UNIQUE,
    role_label   TEXT,
    metadata     JSONB       NOT NULL DEFAULT '{}'::JSONB,
    is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.contributors IS 'External contributor profiles — optionally linked to public.users.';
COMMENT ON COLUMN public.contributors.orcid IS 'ORCID iD for academic contributor attribution.';

-- ── metadata_fields ──────────────────────────────────────────
-- Schema registry: defines every valid metadata field.
CREATE TABLE IF NOT EXISTS public.metadata_fields (
    id               UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_key        TEXT             NOT NULL UNIQUE,
    label            TEXT             NOT NULL,
    data_type        field_data_type  NOT NULL DEFAULT 'text',
    applies_to       content_type_enum[],        -- NULL = applies to all types
    is_required      BOOLEAN          NOT NULL DEFAULT FALSE,
    is_searchable    BOOLEAN          NOT NULL DEFAULT TRUE,
    is_filterable    BOOLEAN          NOT NULL DEFAULT FALSE,
    default_value    TEXT,
    validation_regex TEXT,
    description      TEXT,
    display_order    INTEGER          NOT NULL DEFAULT 0,
    group_name       TEXT,
    ui_widget        TEXT             NOT NULL DEFAULT 'text_input',
    created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.metadata_fields IS 'Schema registry: every valid metadata field with type and UI hints.';
COMMENT ON COLUMN public.metadata_fields.ui_widget IS
    'Frontend widget: text_input, textarea, number, select, multiselect, checkbox, date, datetime, location_picker';

-- ── content_items ─────────────────────────────────────────────
-- Universal registry: one row per content asset of any type.
CREATE TABLE IF NOT EXISTS public.content_items (
    id                    UUID                       PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type          content_type_enum          NOT NULL,
    entity_id             UUID,
    title                 TEXT                       NOT NULL,
    description           TEXT,
    language_id           UUID                       REFERENCES public.languages(id)    ON DELETE SET NULL,
    contributor_id        UUID                       REFERENCES public.contributors(id) ON DELETE SET NULL,
    region                TEXT,
    visibility            visibility_type            NOT NULL DEFAULT 'public',
    upload_date           TIMESTAMPTZ,
    embargo_until         TIMESTAMPTZ,
    cultural_sensitivity  cultural_sensitivity_level NOT NULL DEFAULT 'open',
    deposit_agreement_id  UUID,                      -- FK added after deposit_agreements is created
    extended_metadata     JSONB                      NOT NULL DEFAULT '{}'::JSONB,
    fts_vector            TSVECTOR,
    created_at            TIMESTAMPTZ                NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ                NOT NULL DEFAULT NOW(),
    UNIQUE NULLS NOT DISTINCT (content_type, entity_id)
);

COMMENT ON TABLE  public.content_items IS 'Universal content registry — normalised metadata for every asset type.';
COMMENT ON COLUMN public.content_items.entity_id IS 'FK to recordings.id or transcripts.id. NULL for native items.';
COMMENT ON COLUMN public.content_items.extended_metadata IS 'JSONB keyed by metadata_fields.field_key.';

-- ── collections ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.collections (
    id          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       TEXT            NOT NULL,
    slug        TEXT            NOT NULL UNIQUE,
    description TEXT,
    curator_id  UUID            REFERENCES public.users(id)       ON DELETE SET NULL,
    parent_id   UUID            REFERENCES public.collections(id) ON DELETE SET NULL,
    visibility  visibility_type NOT NULL DEFAULT 'public',
    metadata    JSONB           NOT NULL DEFAULT '{}'::JSONB,
    fts_vector  TSVECTOR,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.collections IS 'Curated, nestable groupings of content items.';

-- ── collection_items (junction) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.collection_items (
    collection_id   UUID        NOT NULL REFERENCES public.collections(id)   ON DELETE CASCADE,
    content_item_id UUID        NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
    position        INTEGER,
    notes           TEXT,
    added_by        UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (collection_id, content_item_id)
);

COMMENT ON TABLE public.collection_items IS 'Junction: ordered collections ↔ content items.';

-- ── sources ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sources (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       TEXT        NOT NULL,
    source_type TEXT        NOT NULL,
    authors     TEXT[],
    year        INTEGER,
    publisher   TEXT,
    doi         TEXT        UNIQUE,
    url         TEXT,
    isbn        TEXT,
    description TEXT,
    metadata    JSONB       NOT NULL DEFAULT '{}'::JSONB,
    created_by  UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.sources IS 'Bibliographic / archival sources cited by or hosting content items.';

-- ── content_sources (junction) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.content_sources (
    content_item_id UUID    NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
    source_id       UUID    NOT NULL REFERENCES public.sources(id)       ON DELETE CASCADE,
    relationship    TEXT,
    page_reference  TEXT,
    notes           TEXT,
    PRIMARY KEY (content_item_id, source_id)
);

COMMENT ON TABLE public.content_sources IS 'Junction: content items ↔ bibliographic sources.';

-- ── content_contributors (junction) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.content_contributors (
    content_item_id UUID    NOT NULL REFERENCES public.content_items(id)  ON DELETE CASCADE,
    contributor_id  UUID    NOT NULL REFERENCES public.contributors(id)   ON DELETE CASCADE,
    role            TEXT    NOT NULL DEFAULT 'contributor',
    notes           TEXT,
    PRIMARY KEY (content_item_id, contributor_id, role)
);

COMMENT ON TABLE public.content_contributors IS 'Junction: content items ↔ contributors with explicit roles.';

-- ── metadata_relationships ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.metadata_relationships (
    id                UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_item_id    UUID              NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
    target_item_id    UUID              NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
    relationship_type relationship_type NOT NULL,
    notes             TEXT,
    metadata          JSONB             NOT NULL DEFAULT '{}'::JSONB,
    created_by        UUID              REFERENCES public.users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    CHECK (source_item_id <> target_item_id)
);

COMMENT ON TABLE public.metadata_relationships IS 'Typed directed relationships between content items.';
