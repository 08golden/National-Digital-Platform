-- ============================================================
-- NLDR  |  MIGRATION 004  —  Backfill, Field Seeds & Views
-- Depends on: 20260425000003_universal_triggers_indexes.sql
-- ============================================================

-- ── Backfill: recordings → content_items ─────────────────────
-- Uses a direct INSERT so existing updated_at values are
-- not changed. ON CONFLICT means it is safe to re-run.
INSERT INTO public.content_items (
    content_type, entity_id, title, description,
    language_id, region, visibility, upload_date, extended_metadata
)
SELECT
    'audio',
    r.id,
    r.title,
    r.description,
    r.language_id,
    COALESCE(
        r.metadata -> 'location' ->> 'region',
        r.metadata -> 'location' ->> 'country'
    ),
    CASE r.status
        WHEN 'published' THEN 'public'::visibility_type
        WHEN 'rejected'  THEN 'private'::visibility_type
        WHEN 'archived'  THEN 'restricted'::visibility_type
        ELSE                  'restricted'::visibility_type
    END,
    r.created_at,
    jsonb_strip_nulls(jsonb_build_object(
        'license',           r.metadata ->> 'license',
        'doi',               r.metadata ->> 'doi',
        'equipment',         r.metadata ->> 'equipment',
        'recording_context', r.metadata ->> 'recording_context',
        'speaker_gender',    r.metadata -> 'speaker' ->> 'gender',
        'speaker_age_range', r.metadata -> 'speaker' ->> 'age_range',
        'native_speaker',    r.metadata -> 'speaker' -> 'native_speaker',
        'topics',            r.metadata -> 'topics',
        'file_format',       r.file_format,
        'duration_seconds',  r.duration_seconds,
        'file_size_bytes',   r.file_size_bytes
    ))
FROM public.recordings r
ON CONFLICT (content_type, entity_id) DO NOTHING;

-- ── Backfill: transcripts → content_items ────────────────────
INSERT INTO public.content_items (
    content_type, entity_id, title,
    language_id, visibility, upload_date, extended_metadata
)
SELECT
    'transcript',
    t.id,
    COALESCE(r.title || ' — Transcript', 'Transcript'),
    t.language_id,
    CASE t.status
        WHEN 'approved' THEN 'public'::visibility_type
        WHEN 'rejected' THEN 'private'::visibility_type
        ELSE                 'restricted'::visibility_type
    END,
    t.created_at,
    jsonb_strip_nulls(jsonb_build_object(
        'tool',           t.metadata ->> 'tool',
        'confidence',     t.metadata ->> 'confidence',
        'is_translation', t.is_translation
    ))
FROM public.transcripts t
JOIN public.recordings  r ON r.id = t.recording_id
ON CONFLICT (content_type, entity_id) DO NOTHING;

-- ── Seed: metadata_fields ─────────────────────────────────────
INSERT INTO public.metadata_fields
    (field_key, label, data_type, applies_to, is_required, is_searchable,
     is_filterable, description, display_order, group_name, ui_widget)
VALUES
-- Universal fields (applies_to = NULL → every content type)
('title',           'Title',               'text', NULL, TRUE,  TRUE,  FALSE, 'Primary title',                           1,  'Core',   'text_input'),
('description',     'Description',         'text', NULL, FALSE, TRUE,  FALSE, 'Free-text description',                   2,  'Core',   'textarea'),
('language',        'Language',            'uuid', NULL, FALSE, TRUE,  TRUE,  'Primary language (FK to languages)',       3,  'Core',   'select'),
('contributor_id',  'Primary Contributor', 'uuid', NULL, FALSE, FALSE, TRUE,  'Main contributor FK',                     4,  'Core',   'select'),
('region',          'Region',              'text', NULL, FALSE, TRUE,  TRUE,  'Geographic region of origin',             5,  'Core',   'text_input'),
('visibility',      'Visibility',          'text', NULL, TRUE,  FALSE, TRUE,  'public | restricted | private | embargoed',6, 'Core',   'select'),
('upload_date',     'Upload Date',         'timestamptz', NULL, FALSE, FALSE, TRUE, 'Date deposited',                   7,  'Core',   'datetime'),
('license',         'License',             'text', NULL, FALSE, FALSE, TRUE,  'Rights license e.g. CC-BY-4.0',           8,  'Rights', 'select'),
('doi',             'DOI',                 'text', NULL, FALSE, FALSE, FALSE, 'Digital Object Identifier',               9,  'Rights', 'text_input'),
('access_notes',    'Access Notes',        'text', NULL, FALSE, FALSE, FALSE, 'Special access conditions',               10, 'Rights', 'textarea'),
-- Audio / Video
('duration_seconds',  'Duration (s)',        'decimal',    ARRAY['audio','video']::content_type_enum[], FALSE, FALSE, TRUE,  'Duration in seconds',                20, 'File Info',   'number'),
('file_format',       'File Format',         'text',       ARRAY['audio','video']::content_type_enum[], FALSE, FALSE, TRUE,  'mp3, wav, flac, mp4 …',              21, 'File Info',   'select'),
('file_size_bytes',   'File Size (bytes)',   'integer',    ARRAY['audio','video']::content_type_enum[], FALSE, FALSE, FALSE, 'File size in bytes',                 22, 'File Info',   'number'),
('equipment',         'Recording Equipment', 'text',       ARRAY['audio','video']::content_type_enum[], FALSE, TRUE,  FALSE, 'Microphone or recorder model',       23, 'Recording',   'text_input'),
('recording_context', 'Recording Context',  'text',       ARRAY['audio','video']::content_type_enum[], FALSE, TRUE,  TRUE,  'field | studio | online | elicited', 24, 'Recording',   'select'),
('topics',            'Topics',             'text_array', ARRAY['audio','video']::content_type_enum[], FALSE, TRUE,  TRUE,  'Thematic topics',                    25, 'Recording',   'multiselect'),
('discourse_type',    'Discourse / Genre',  'text',       ARRAY['audio','video','transcript']::content_type_enum[], FALSE, TRUE, TRUE, 'Genre or discourse type', 26, 'Recording',   'select'),
('linguistic_type',   'Linguistic Type',    'text',       ARRAY['audio','video','transcript']::content_type_enum[], FALSE, TRUE, TRUE, 'OLAC linguistic type',    27, 'Recording',   'select'),
('dialect',           'Dialect',            'text',       ARRAY['audio','video','transcript']::content_type_enum[], FALSE, TRUE, TRUE, 'Specific dialect',        28, 'Recording',   'text_input'),
-- Speaker
('speaker_gender',    'Speaker Gender',     'text',    ARRAY['audio','video']::content_type_enum[], FALSE, FALSE, TRUE, 'Reported gender',           30, 'Speaker', 'select'),
('speaker_age_range', 'Speaker Age Range',  'text',    ARRAY['audio','video']::content_type_enum[], FALSE, FALSE, TRUE, 'Age range e.g. 40–50',      31, 'Speaker', 'select'),
('speaker_generation','Speaker Generation', 'text',    ARRAY['audio','video']::content_type_enum[], FALSE, FALSE, TRUE, 'Generational cohort',        32, 'Speaker', 'select'),
('speaker_proficiency','Speaker Proficiency','text',   ARRAY['audio','video']::content_type_enum[], FALSE, FALSE, TRUE, 'Fluency level',             33, 'Speaker', 'select'),
('speaker_count',     'Number of Speakers', 'integer', ARRAY['audio','video']::content_type_enum[], FALSE, FALSE, TRUE, 'Total speakers in recording',34, 'Speaker', 'number'),
('native_speaker',    'Native Speaker',     'boolean', ARRAY['audio','video']::content_type_enum[], FALSE, FALSE, TRUE, 'Is a native speaker',        35, 'Speaker', 'checkbox'),
('speaker_consent_ref','Speaker Consent Ref','text',   ARRAY['audio','video']::content_type_enum[], FALSE, FALSE, FALSE,'Consent form reference',    36, 'Speaker', 'text_input'),
-- Cultural protocol
('cultural_sensitivity','Cultural Sensitivity','text', NULL, TRUE,  FALSE, TRUE,  'Cultural restriction level',            1,  'Cultural Protocol', 'select'),
('tk_label_codes',    'TK Labels',           'text_array', NULL, FALSE, FALSE, TRUE, 'TK/BC Labels from localcontexts.org', 2,  'Cultural Protocol', 'multiselect'),
('community_consent', 'Community Consent',   'text',  NULL, FALSE, FALSE, TRUE,  'Community approval status',             3,  'Cultural Protocol', 'select'),
('deposit_agreement_ref','Deposit Agreement','text',   NULL, FALSE, FALSE, FALSE, 'Signed agreement reference code',       4,  'Cultural Protocol', 'text_input'),
('has_gender_restriction','Gender Restricted','boolean',NULL,FALSE, FALSE, TRUE, 'Content is gender-restricted',           5,  'Cultural Protocol', 'checkbox'),
('cultural_notes',    'Cultural Notes',      'text',  NULL, FALSE, TRUE,  FALSE, 'Cultural context or restrictions',      6,  'Cultural Protocol', 'textarea'),
-- Location
('location_latitude',    'Latitude',               'decimal', ARRAY['audio','video']::content_type_enum[], FALSE, FALSE, FALSE, 'Decimal degrees',              50, 'Location', 'number'),
('location_longitude',   'Longitude',              'decimal', ARRAY['audio','video']::content_type_enum[], FALSE, FALSE, FALSE, 'Decimal degrees',              51, 'Location', 'number'),
('location_place_name',  'Place Name',             'text',    ARRAY['audio','video']::content_type_enum[], FALSE, TRUE,  TRUE,  'Official place name',          52, 'Location', 'text_input'),
('location_indigenous_name','Indigenous Place Name','text',   ARRAY['audio','video']::content_type_enum[], FALSE, TRUE,  FALSE, 'Traditional / indigenous name',53, 'Location', 'text_input'),
('traditional_territory','Traditional Territory',  'text',    ARRAY['audio','video']::content_type_enum[], FALSE, TRUE,  TRUE,  'Ancestral land name',          54, 'Location', 'text_input'),
-- Recording quality
('recording_quality',  'Recording Quality',  'text',    ARRAY['audio','video']::content_type_enum[], FALSE, FALSE, TRUE, 'Overall quality assessment',   40, 'File Info', 'select'),
('background_noise',   'Background Noise',   'text',    ARRAY['audio','video']::content_type_enum[], FALSE, FALSE, TRUE, 'Background noise level',       41, 'File Info', 'select'),
-- Transcript
('tool',             'Transcription Tool',   'text',    ARRAY['transcript']::content_type_enum[], FALSE, FALSE, TRUE, 'ELAN, Praat, Whisper …',   40, 'Transcript', 'text_input'),
('confidence',       'ASR Confidence',       'decimal', ARRAY['transcript']::content_type_enum[], FALSE, FALSE, TRUE, 'Score 0.0–1.0',            41, 'Transcript', 'number'),
('is_translation',   'Is Translation',       'boolean', ARRAY['transcript']::content_type_enum[], FALSE, FALSE, TRUE, 'Translation vs transcription',42,'Transcript', 'checkbox'),
-- Preservation
('is_digitised',         'Digitised from Analogue','boolean',NULL, FALSE, FALSE, TRUE,  'Digitised from physical media',       60, 'Preservation', 'checkbox'),
('original_format',      'Original Format',        'text',   NULL, FALSE, FALSE, TRUE,  'cassette, reel, DAT …',               61, 'Preservation', 'select'),
('digitisation_date',    'Digitisation Date',      'date',   NULL, FALSE, FALSE, FALSE, 'Date of digitisation',                62, 'Preservation', 'date'),
('digitisation_equipment','Digitisation Equipment','text',   NULL, FALSE, FALSE, FALSE, 'Equipment used',                      63, 'Preservation', 'text_input'),
('archival_master_exists','Archival Master Exists', 'boolean',NULL,FALSE, FALSE, TRUE,  'Separate master file exists',         64, 'Preservation', 'checkbox'),
('condition_notes',      'Physical Condition',     'text',   NULL, FALSE, FALSE, FALSE, 'Condition of original physical item', 65, 'Preservation', 'textarea'),
-- Bibliographic
('authors',         'Authors',         'text_array', ARRAY['document','source']::content_type_enum[], FALSE, TRUE, TRUE,  'Author names',         50, 'Bibliographic', 'text_input'),
('publisher',       'Publisher',       'text',       ARRAY['document','source']::content_type_enum[], FALSE, TRUE, TRUE,  'Publishing body',      51, 'Bibliographic', 'text_input'),
('publication_year','Publication Year','integer',    ARRAY['document','source']::content_type_enum[], FALSE, FALSE,TRUE,  'Year published',       52, 'Bibliographic', 'number'),
('isbn',            'ISBN',            'text',       ARRAY['document','source']::content_type_enum[], FALSE, FALSE,FALSE, 'ISBN',                 53, 'Bibliographic', 'text_input'),
('keywords',        'Keywords',        'text_array', ARRAY['document','source']::content_type_enum[], FALSE, TRUE, TRUE,  'Subject keywords',     54, 'Bibliographic', 'multiselect')
ON CONFLICT (field_key) DO NOTHING;

-- ── Helper: lift expired embargoes ───────────────────────────
CREATE OR REPLACE FUNCTION public.lift_expired_embargoes()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE v_count INTEGER;
BEGIN
    UPDATE public.content_items
    SET    visibility = 'public', updated_at = NOW()
    WHERE  visibility = 'embargoed' AND embargo_until <= NOW();
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.lift_expired_embargoes IS
    'Promotes embargoed items to public once their date has passed. Call on a schedule.';

-- ── Views ─────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_content_search AS
SELECT
    ci.id, ci.content_type, ci.entity_id,
    ci.title, ci.description, ci.region,
    ci.visibility, ci.cultural_sensitivity,
    ci.upload_date, ci.created_at,
    ci.extended_metadata, ci.fts_vector,
    l.name         AS language_name,
    l.iso_code     AS language_iso,
    l.family       AS language_family,
    c.full_name    AS contributor_name,
    c.institution  AS contributor_institution,
    c.orcid        AS contributor_orcid,
    CASE ci.content_type
        WHEN 'audio' THEN (
            SELECT ARRAY_AGG(t.name ORDER BY t.name)
            FROM   public.recording_tags rt
            JOIN   public.tags t ON t.id = rt.tag_id
            WHERE  rt.recording_id = ci.entity_id
        )
        WHEN 'transcript' THEN (
            SELECT ARRAY_AGG(t.name ORDER BY t.name)
            FROM   public.transcript_tags tt
            JOIN   public.tags t ON t.id = tt.tag_id
            WHERE  tt.transcript_id = ci.entity_id
        )
        ELSE ARRAY[]::TEXT[]
    END AS tags,
    (
        SELECT JSONB_AGG(jsonb_build_object(
            'name', con.full_name, 'role', cc.role, 'orcid', con.orcid
        ))
        FROM   public.content_contributors cc
        JOIN   public.contributors con ON con.id = cc.contributor_id
        WHERE  cc.content_item_id = ci.id
    ) AS all_contributors
FROM  public.content_items  ci
LEFT JOIN public.languages   l  ON l.id = ci.language_id
LEFT JOIN public.contributors c ON c.id = ci.contributor_id;

COMMENT ON VIEW public.v_content_search IS
    'Universal search view across all content types.';

CREATE OR REPLACE VIEW public.v_collection_contents AS
SELECT
    col.id AS collection_id, col.title AS collection_title,
    col.slug, col.visibility AS collection_visibility,
    ci.id  AS content_item_id, ci.content_type,
    ci.title AS content_title, ci.visibility AS content_visibility,
    l.name AS language_name, l.iso_code,
    cit.position, cit.notes AS curator_notes, cit.added_at
FROM       public.collections      col
JOIN       public.collection_items cit ON cit.collection_id  = col.id
JOIN       public.content_items    ci  ON ci.id              = cit.content_item_id
LEFT JOIN  public.languages        l   ON l.id               = ci.language_id
ORDER BY   col.id, cit.position NULLS LAST;

CREATE OR REPLACE VIEW public.v_contributor_works AS
SELECT
    con.id AS contributor_id, con.full_name,
    con.institution, con.orcid, cc.role,
    ci.id AS content_item_id, ci.content_type,
    ci.title, ci.visibility, ci.upload_date,
    l.name AS language_name
FROM   public.contributors         con
JOIN   public.content_contributors cc  ON cc.contributor_id = con.id
JOIN   public.content_items        ci  ON ci.id             = cc.content_item_id
LEFT JOIN public.languages          l  ON l.id              = ci.language_id;
