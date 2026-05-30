-- ============================================================
-- NLDR  |  MIGRATION 007  —  Final Views
-- Depends on: 20260425000006_indigenous_seeds.sql
-- ============================================================

-- ── Upload form schema view ───────────────────────────────────
-- This is the primary view the frontend queries to dynamically
-- build the upload form for any content type.
--
-- Usage:
--   SELECT * FROM public.v_upload_form_schema
--   WHERE applies_to IS NULL OR 'audio' = ANY(applies_to)
--   ORDER BY display_order;
--
-- Each row = one form field.
-- The `options` column contains the dropdown choices as JSON
-- for select / multiselect fields, empty array for all others.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_upload_form_schema AS
SELECT
    mf.id              AS field_id,
    mf.field_key,
    mf.label,
    mf.data_type,
    mf.ui_widget,
    mf.applies_to,
    mf.is_required,
    mf.is_filterable,
    mf.description,
    mf.default_value,
    mf.validation_regex,
    mf.group_name,
    mf.display_order,
    COALESCE(
        JSONB_AGG(
            JSONB_BUILD_OBJECT('value', mfo.value, 'label', mfo.label)
            ORDER BY mfo.display_order
        ) FILTER (WHERE mfo.id IS NOT NULL),
        '[]'::JSONB
    ) AS options
FROM      public.metadata_fields        mf
LEFT JOIN public.metadata_field_options mfo
          ON mfo.field_id = mf.id AND mfo.is_active = TRUE
GROUP BY
    mf.id, mf.field_key, mf.label, mf.data_type, mf.ui_widget,
    mf.applies_to, mf.is_required, mf.is_filterable,
    mf.description, mf.default_value, mf.validation_regex,
    mf.group_name, mf.display_order
ORDER BY mf.display_order;

COMMENT ON VIEW public.v_upload_form_schema IS
    'Upload form schema: one row per metadata field with inline options array. '
    'Filter client-side by: applies_to IS NULL OR ''audio'' = ANY(applies_to). '
    'Groups: Core, Cultural Protocol, Speaker, Recording, Location, File Info, Preservation, Rights, Bibliographic.';


-- ── Community overview view ───────────────────────────────────
-- Used by the browse / filter UI to show communities with
-- their documented language count and public item count.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_community_overview AS
SELECT
    com.id,
    com.name,
    com.local_name,
    com.country,
    com.region,
    com.traditional_territory,
    COUNT(DISTINCT cc.content_item_id)  AS total_items,
    COUNT(DISTINCT ci.language_id)      AS language_count,
    ARRAY_AGG(DISTINCT l.name ORDER BY l.name)
        FILTER (WHERE l.name IS NOT NULL) AS languages
FROM      public.communities        com
LEFT JOIN public.content_communities cc  ON cc.community_id = com.id
LEFT JOIN public.content_items       ci  ON ci.id           = cc.content_item_id
                                        AND ci.visibility    = 'public'
LEFT JOIN public.languages           l   ON l.id            = ci.language_id
WHERE     com.is_active = TRUE
GROUP BY  com.id, com.name, com.local_name, com.country, com.region, com.traditional_territory
ORDER BY  com.name;

COMMENT ON VIEW public.v_community_overview IS
    'Community browse view: public item count and documented languages per community.';


-- ── Verification queries — run these after step 09 ───────────
-- Uncomment and run each block to confirm everything is in order.

/*

-- 1. All 9 groups of metadata fields present
SELECT group_name, COUNT(*) AS fields
FROM   public.metadata_fields
GROUP  BY group_name
ORDER  BY group_name;

-- 2. Every select/multiselect field has options
SELECT mf.field_key, mf.ui_widget, COUNT(mfo.id) AS option_count
FROM   public.metadata_fields       mf
LEFT JOIN public.metadata_field_options mfo ON mfo.field_id = mf.id
WHERE  mf.ui_widget IN ('select', 'multiselect')
GROUP  BY mf.field_key, mf.ui_widget
ORDER  BY mf.field_key;

-- 3. Communities seeded
SELECT name, region, traditional_territory
FROM   public.communities
ORDER  BY name;

-- 4. content_items backfill matches recordings + transcripts
SELECT content_type, COUNT(*) FROM public.content_items GROUP BY content_type;
SELECT 'recordings'  AS source, COUNT(*) FROM public.recordings
UNION ALL
SELECT 'transcripts', COUNT(*) FROM public.transcripts;

-- 5. Upload form schema returns fields with options
SELECT field_key, group_name, ui_widget, jsonb_array_length(options) AS option_count
FROM   public.v_upload_form_schema
ORDER  BY display_order;

*/
