-- ============================================================
-- NLDR  |  MIGRATION 005  —  Indigenous Tables
-- Depends on: 20260425000004_backfill_seeds_views.sql
-- ============================================================

-- ── metadata_field_options ────────────────────────────────────
-- Controlled vocabulary options for select / multiselect fields.
CREATE TABLE IF NOT EXISTS public.metadata_field_options (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_id      UUID        NOT NULL REFERENCES public.metadata_fields(id) ON DELETE CASCADE,
    value         TEXT        NOT NULL,
    label         TEXT        NOT NULL,
    display_order INTEGER     NOT NULL DEFAULT 0,
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    UNIQUE (field_id, value)
);

CREATE INDEX idx_field_options_field_id
    ON public.metadata_field_options(field_id, display_order);

COMMENT ON TABLE public.metadata_field_options IS
    'Controlled vocabulary for select / multiselect metadata fields.';

-- ── communities ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.communities (
    id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                  TEXT        NOT NULL,
    local_name            TEXT,
    country               CHAR(2),
    region                TEXT,
    traditional_territory TEXT,
    contact_institution   TEXT,
    metadata              JSONB       NOT NULL DEFAULT '{}'::JSONB,
    is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_communities_updated_at
    BEFORE UPDATE ON public.communities
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_communities_country ON public.communities(country);
CREATE INDEX idx_communities_region  ON public.communities(region);

COMMENT ON TABLE public.communities IS
    'Indigenous nations, clans, and language communities.';

-- ── content_communities (junction) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.content_communities (
    content_item_id UUID    NOT NULL REFERENCES public.content_items(id)  ON DELETE CASCADE,
    community_id    UUID    NOT NULL REFERENCES public.communities(id)    ON DELETE CASCADE,
    relationship    TEXT    NOT NULL DEFAULT 'belongs_to',
    consent_status  TEXT    NOT NULL DEFAULT 'pending',
    consent_ref     TEXT,
    notes           TEXT,
    PRIMARY KEY (content_item_id, community_id)
);

CREATE INDEX idx_content_communities_community_id
    ON public.content_communities(community_id);
CREATE INDEX idx_content_communities_consent
    ON public.content_communities(consent_status);

COMMENT ON TABLE public.content_communities IS
    'Junction: which indigenous communities are affiliated with each content item.';

-- ── access_protocols ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.access_protocols (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_item_id UUID        NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
    protocol_type   TEXT        NOT NULL,
    /*
      'gender_restricted_women'
      'gender_restricted_men'
      'age_restricted_elders'
      'ceremonial'
      'secret_sacred'
      'community_only'
      'researcher_only'
      'embargo'
    */
    description     TEXT,
    community_id    UUID        REFERENCES public.communities(id) ON DELETE SET NULL,
    granted_by      UUID        REFERENCES public.users(id)       ON DELETE SET NULL,
    review_date     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_access_protocols_content_item
    ON public.access_protocols(content_item_id);
CREATE INDEX idx_access_protocols_community
    ON public.access_protocols(community_id);

COMMENT ON TABLE public.access_protocols IS
    'Cultural restrictions applied by community authority.';

-- ── tk_labels ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tk_labels (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_item_id UUID        NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
    label_code      TEXT        NOT NULL,
    label_text      TEXT,
    notice_url      TEXT,
    community_id    UUID        REFERENCES public.communities(id) ON DELETE SET NULL,
    applied_by      UUID        REFERENCES public.users(id)       ON DELETE SET NULL,
    applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (content_item_id, label_code)
);

CREATE INDEX idx_tk_labels_content_item ON public.tk_labels(content_item_id);
CREATE INDEX idx_tk_labels_community    ON public.tk_labels(community_id);
CREATE INDEX idx_tk_labels_code         ON public.tk_labels(label_code);

COMMENT ON TABLE public.tk_labels IS
    'Traditional Knowledge and Biocultural Labels from localcontexts.org.';

-- ── deposit_agreements ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deposit_agreements (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_code  TEXT        NOT NULL UNIQUE,
    depositor_id    UUID        REFERENCES public.contributors(id) ON DELETE SET NULL,
    community_id    UUID        REFERENCES public.communities(id)  ON DELETE SET NULL,
    agreement_date  DATE        NOT NULL,
    agreement_type  TEXT        NOT NULL DEFAULT 'standard',
    storage_path    TEXT,
    notes           TEXT,
    created_by      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deposit_agreements_depositor ON public.deposit_agreements(depositor_id);
CREATE INDEX idx_deposit_agreements_community ON public.deposit_agreements(community_id);

COMMENT ON TABLE public.deposit_agreements IS
    'Formal deposit agreements — one agreement may cover many content items.';

-- ── Add deposit_agreement_id FK to content_items ─────────────
-- The column was created as plain UUID in step_04.
-- Now the deposit_agreements table exists so we can add the FK.
ALTER TABLE public.content_items
    ADD CONSTRAINT fk_content_items_deposit_agreement
    FOREIGN KEY (deposit_agreement_id)
    REFERENCES public.deposit_agreements(id)
    ON DELETE SET NULL;

CREATE INDEX idx_content_items_deposit
    ON public.content_items(deposit_agreement_id)
    WHERE deposit_agreement_id IS NOT NULL;
