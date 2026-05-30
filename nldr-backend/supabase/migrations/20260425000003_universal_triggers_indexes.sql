-- ============================================================
-- NLDR  |  MIGRATION 003  —  Universal Triggers & Indexes
-- Depends on: 20260425000002_universal_metadata_tables.sql
-- ============================================================

-- ── updated_at triggers (new tables) ─────────────────────────
CREATE TRIGGER trg_contributors_updated_at
    BEFORE UPDATE ON public.contributors
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_content_items_updated_at
    BEFORE UPDATE ON public.content_items
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_collections_updated_at
    BEFORE UPDATE ON public.collections
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_sources_updated_at
    BEFORE UPDATE ON public.sources
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── FTS: content_items ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_content_item_fts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.fts_vector :=
        setweight(to_tsvector('simple', unaccent(COALESCE(NEW.title,       ''))), 'A') ||
        setweight(to_tsvector('simple', unaccent(COALESCE(NEW.description, ''))), 'B') ||
        setweight(to_tsvector('simple', unaccent(COALESCE(NEW.region,      ''))), 'C') ||
        setweight(
            to_tsvector('simple', unaccent(
                COALESCE(NEW.extended_metadata->>'topics',            '') || ' ' ||
                COALESCE(NEW.extended_metadata->>'keywords',          '') || ' ' ||
                COALESCE(NEW.extended_metadata->>'recording_context', '') || ' ' ||
                COALESCE(NEW.extended_metadata->>'license',           '')
            )), 'D'
        );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_content_items_fts
    BEFORE INSERT OR UPDATE ON public.content_items
    FOR EACH ROW EXECUTE FUNCTION public.update_content_item_fts();

-- ── FTS: collections ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_collection_fts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.fts_vector :=
        setweight(to_tsvector('simple', unaccent(COALESCE(NEW.title,       ''))), 'A') ||
        setweight(to_tsvector('simple', unaccent(COALESCE(NEW.description, ''))), 'B');
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_collections_fts
    BEFORE INSERT OR UPDATE ON public.collections
    FOR EACH ROW EXECUTE FUNCTION public.update_collection_fts();

-- ── Sync trigger: recordings → content_items ─────────────────
CREATE OR REPLACE FUNCTION public.sync_recording_to_content_item()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_contributor_id UUID;
    v_region         TEXT;
BEGIN
    SELECT id INTO v_contributor_id
    FROM   public.contributors
    WHERE  user_id = NEW.uploaded_by
    LIMIT  1;

    v_region := COALESCE(
        NEW.metadata -> 'location' ->> 'region',
        NEW.metadata -> 'location' ->> 'country'
    );

    INSERT INTO public.content_items (
        content_type, entity_id, title, description,
        language_id, contributor_id, region, visibility,
        upload_date, extended_metadata
    )
    VALUES (
        'audio', NEW.id, NEW.title, NEW.description,
        NEW.language_id, v_contributor_id, v_region,
        CASE NEW.status
            WHEN 'published' THEN 'public'::visibility_type
            WHEN 'rejected'  THEN 'private'::visibility_type
            WHEN 'archived'  THEN 'restricted'::visibility_type
            ELSE                  'restricted'::visibility_type
        END,
        NEW.created_at,
        jsonb_strip_nulls(jsonb_build_object(
            'license',           NEW.metadata ->> 'license',
            'doi',               NEW.metadata ->> 'doi',
            'equipment',         NEW.metadata ->> 'equipment',
            'recording_context', NEW.metadata ->> 'recording_context',
            'speaker_gender',    NEW.metadata -> 'speaker' ->> 'gender',
            'speaker_age_range', NEW.metadata -> 'speaker' ->> 'age_range',
            'native_speaker',    NEW.metadata -> 'speaker' -> 'native_speaker',
            'topics',            NEW.metadata -> 'topics',
            'file_format',       NEW.file_format,
            'duration_seconds',  NEW.duration_seconds,
            'file_size_bytes',   NEW.file_size_bytes
        ))
    )
    ON CONFLICT (content_type, entity_id) DO UPDATE SET
        title             = EXCLUDED.title,
        description       = EXCLUDED.description,
        language_id       = EXCLUDED.language_id,
        contributor_id    = COALESCE(public.content_items.contributor_id, EXCLUDED.contributor_id),
        region            = EXCLUDED.region,
        visibility        = EXCLUDED.visibility,
        extended_metadata = EXCLUDED.extended_metadata,
        updated_at        = NOW();

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_recording_to_content_item
    AFTER INSERT OR UPDATE ON public.recordings
    FOR EACH ROW EXECUTE FUNCTION public.sync_recording_to_content_item();

-- ── Sync trigger: transcripts → content_items ────────────────
CREATE OR REPLACE FUNCTION public.sync_transcript_to_content_item()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_recording_title TEXT;
    v_contributor_id  UUID;
BEGIN
    SELECT title INTO v_recording_title
    FROM   public.recordings WHERE id = NEW.recording_id;

    SELECT id INTO v_contributor_id
    FROM   public.contributors WHERE user_id = NEW.created_by LIMIT 1;

    INSERT INTO public.content_items (
        content_type, entity_id, title,
        language_id, contributor_id, visibility,
        upload_date, extended_metadata
    )
    VALUES (
        'transcript', NEW.id,
        COALESCE(v_recording_title || ' — Transcript', 'Transcript'),
        NEW.language_id, v_contributor_id,
        CASE NEW.status
            WHEN 'approved' THEN 'public'::visibility_type
            WHEN 'rejected' THEN 'private'::visibility_type
            ELSE                 'restricted'::visibility_type
        END,
        NEW.created_at,
        jsonb_strip_nulls(jsonb_build_object(
            'tool',           NEW.metadata ->> 'tool',
            'confidence',     NEW.metadata ->> 'confidence',
            'is_translation', NEW.is_translation
        ))
    )
    ON CONFLICT (content_type, entity_id) DO UPDATE SET
        title             = EXCLUDED.title,
        language_id       = EXCLUDED.language_id,
        contributor_id    = COALESCE(public.content_items.contributor_id, EXCLUDED.contributor_id),
        visibility        = EXCLUDED.visibility,
        extended_metadata = EXCLUDED.extended_metadata,
        updated_at        = NOW();

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_transcript_to_content_item
    AFTER INSERT OR UPDATE ON public.transcripts
    FOR EACH ROW EXECUTE FUNCTION public.sync_transcript_to_content_item();

-- ── Indexes: contributors ─────────────────────────────────────
CREATE INDEX idx_contributors_user_id     ON public.contributors(user_id);
CREATE INDEX idx_contributors_institution ON public.contributors(institution);
CREATE INDEX idx_contributors_metadata    ON public.contributors USING GIN (metadata);
CREATE INDEX idx_contributors_orcid       ON public.contributors(orcid)
    WHERE orcid IS NOT NULL;

-- ── Indexes: metadata_fields ──────────────────────────────────
CREATE INDEX idx_metadata_fields_key        ON public.metadata_fields(field_key);
CREATE INDEX idx_metadata_fields_applies_to ON public.metadata_fields USING GIN (applies_to);
CREATE INDEX idx_metadata_fields_group      ON public.metadata_fields(group_name);
CREATE INDEX idx_metadata_fields_order      ON public.metadata_fields(display_order);

-- ── Indexes: content_items ────────────────────────────────────
CREATE INDEX idx_content_items_content_type   ON public.content_items(content_type);
CREATE INDEX idx_content_items_entity_id      ON public.content_items(entity_id);
CREATE INDEX idx_content_items_language_id    ON public.content_items(language_id);
CREATE INDEX idx_content_items_contributor_id ON public.content_items(contributor_id);
CREATE INDEX idx_content_items_visibility     ON public.content_items(visibility);
CREATE INDEX idx_content_items_region         ON public.content_items(region);
CREATE INDEX idx_content_items_upload_date    ON public.content_items(upload_date DESC);
CREATE INDEX idx_content_items_sensitivity    ON public.content_items(cultural_sensitivity);
CREATE INDEX idx_content_items_fts            ON public.content_items USING GIN (fts_vector);
CREATE INDEX idx_content_items_ext_metadata   ON public.content_items USING GIN (extended_metadata);
CREATE INDEX idx_content_items_title_trgm
    ON public.content_items USING GIN (title gin_trgm_ops);
CREATE INDEX idx_content_items_public
    ON public.content_items(content_type, upload_date DESC)
    WHERE visibility = 'public';
CREATE INDEX idx_content_items_embargo
    ON public.content_items(embargo_until)
    WHERE visibility = 'embargoed';

-- ── Indexes: collections ──────────────────────────────────────
CREATE INDEX idx_collections_curator_id ON public.collections(curator_id);
CREATE INDEX idx_collections_parent_id  ON public.collections(parent_id)
    WHERE parent_id IS NOT NULL;
CREATE INDEX idx_collections_visibility ON public.collections(visibility);
CREATE INDEX idx_collections_slug       ON public.collections(slug);
CREATE INDEX idx_collections_fts        ON public.collections USING GIN (fts_vector);

-- ── Indexes: collection_items ─────────────────────────────────
CREATE INDEX idx_collection_items_content_item_id ON public.collection_items(content_item_id);
CREATE INDEX idx_collection_items_position
    ON public.collection_items(collection_id, position NULLS LAST);

-- ── Indexes: sources ──────────────────────────────────────────
CREATE INDEX idx_sources_type    ON public.sources(source_type);
CREATE INDEX idx_sources_year    ON public.sources(year);
CREATE INDEX idx_sources_authors ON public.sources USING GIN (authors);
CREATE INDEX idx_sources_doi     ON public.sources(doi) WHERE doi IS NOT NULL;

-- ── Indexes: junctions ────────────────────────────────────────
CREATE INDEX idx_content_sources_source_id           ON public.content_sources(source_id);
CREATE INDEX idx_content_contributors_contributor_id ON public.content_contributors(contributor_id);
CREATE INDEX idx_content_contributors_role           ON public.content_contributors(role);
CREATE INDEX idx_metadata_rel_source ON public.metadata_relationships(source_item_id);
CREATE INDEX idx_metadata_rel_target ON public.metadata_relationships(target_item_id);
CREATE INDEX idx_metadata_rel_type   ON public.metadata_relationships(relationship_type);
