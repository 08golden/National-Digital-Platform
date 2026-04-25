-- ============================================================
-- NLDR — National Language Digital Repository
-- Database Schema Migration
-- Engineer: Marcel Namaseb 221009736
-- Target:   Supabase (PostgreSQL 15+)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        
CREATE EXTENSION IF NOT EXISTS "unaccent";       


-- ─────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────
CREATE TYPE user_role      AS ENUM ('admin', 'contributor', 'viewer');
CREATE TYPE recording_status AS ENUM ('pending', 'processing', 'published', 'rejected', 'archived');
CREATE TYPE transcript_status AS ENUM ('draft', 'review', 'approved', 'rejected');


-- ═════════════════════════════════════════════════════════════
-- TABLE: users
-- Extends Supabase Auth — links auth.users → public profile.
-- ═════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.users (
    id              UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username        TEXT          NOT NULL UNIQUE,
    display_name    TEXT,
    email           TEXT          NOT NULL UNIQUE,
    role            user_role     NOT NULL DEFAULT 'viewer',
    avatar_url      TEXT,
    
    metadata        JSONB         NOT NULL DEFAULT '{}'::JSONB,
    /*  Expected metadata shape (example):
        {
          "bio": "Linguist at UoN",
          "institution": "University of Namibia",
          "preferred_languages": ["naq", "afr"],
          "social_links": { "orcid": "0000-0000-0000-0000" }
        }
    */
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.users IS 'Public user profiles — linked 1-to-1 with auth.users.';
COMMENT ON COLUMN public.users.metadata IS 'Flexible JSONB bag for bio, institution, preferences, etc.';


-- ═════════════════════════════════════════════════════════════
-- TABLE: languages
-- ISO 639-3 language catalogue for the repository.
-- ═════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.languages (
    id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    iso_code        CHAR(3)       NOT NULL UNIQUE,   
    name            TEXT          NOT NULL,           
    local_name      TEXT,                             
    family          TEXT,                             
    region          TEXT,                             
    endangerment_level TEXT,                          
    
    metadata        JSONB         NOT NULL DEFAULT '{}'::JSONB,
    /*  Expected metadata shape:
        {
          "glottolog_id": "khoe1241",
          "alternate_names": ["Nama", "Damara"],
          "dialects": ["Nama", "Damara", "Haillom"],
          "writing_systems": ["Latin"],
          "countries": ["NA", "ZA", "BW"]
        }
    */
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.languages IS 'ISO 639-3 language catalogue with rich JSONB metadata.';
COMMENT ON COLUMN public.languages.iso_code IS '3-letter ISO 639-3 language code.';


-- ═════════════════════════════════════════════════════════════
-- TABLE: recordings
-- Audio/video media files uploaded to Supabase Storage.
-- ═════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.recordings (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    uploaded_by     UUID            NOT NULL REFERENCES public.users(id)      ON DELETE SET NULL,
    language_id     UUID            NOT NULL REFERENCES public.languages(id)  ON DELETE RESTRICT,
    
    title           TEXT            NOT NULL,
    description     TEXT,
    storage_path    TEXT            UNIQUE,        
    file_url        TEXT,                          
    file_format     TEXT,                          
    file_size_bytes BIGINT,
    duration_seconds NUMERIC(10,2),
    status          recording_status NOT NULL DEFAULT 'pending',
    
    metadata        JSONB           NOT NULL DEFAULT '{}'::JSONB,
    /*  Expected metadata shape:
        {
          "speaker": {
            "age_range": "40-50",
            "gender": "female",
            "native_speaker": true
          },
          "recording_context": "field",
          "location": { "country": "NA", "region": "Erongo" },
          "equipment": "Zoom H5",
          "topics": ["greetings", "kinship terms"],
          "license": "CC-BY-4.0",
          "doi": "10.xxxxx/nldr.001"
        }
    */
    
    fts_vector      TSVECTOR,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.recordings IS 'Audio/video recordings stored in Supabase Storage.';
COMMENT ON COLUMN public.recordings.metadata IS 'JSONB with speaker info, location, equipment, license, DOI, etc.';
COMMENT ON COLUMN public.recordings.fts_vector IS 'Auto-maintained tsvector for full-text search across title + description + metadata.';


-- ═════════════════════════════════════════════════════════════
-- TABLE: transcripts
-- Text transcriptions linked to a recording.
-- ═════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.transcripts (
    id              UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id    UUID             NOT NULL REFERENCES public.recordings(id) ON DELETE CASCADE,
    created_by      UUID             NOT NULL REFERENCES public.users(id)       ON DELETE SET NULL,
    
    content         TEXT             NOT NULL,          
    language_id     UUID             REFERENCES public.languages(id) ON DELETE SET NULL,
                                                        
                                                        
    is_translation  BOOLEAN          NOT NULL DEFAULT FALSE,
    source_language_id UUID          REFERENCES public.languages(id) ON DELETE SET NULL,
    status          transcript_status NOT NULL DEFAULT 'draft',
    
    metadata        JSONB            NOT NULL DEFAULT '{}'::JSONB,
    /*  Expected metadata shape:
        {
          "tool": "ELAN",
          "version": "6.4",
          "segments": [
            { "start": 0.0, "end": 3.5, "speaker": "S1", "text": "!Gâi tsî ..." },
            { "start": 3.5, "end": 7.2, "speaker": "S2", "text": "..." }
          ],
          "confidence": 0.92
        }
    */
    
    fts_vector      TSVECTOR,
    reviewed_by     UUID             REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.transcripts IS 'Text transcripts / translations linked to recordings.';
COMMENT ON COLUMN public.transcripts.metadata IS 'JSONB for time-aligned segments, speaker labels, tool info, confidence scores.';


-- ═════════════════════════════════════════════════════════════
-- TABLE: tags
-- Flat tag catalogue (reusable across recordings & transcripts).
-- ═════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.tags (
    id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT    NOT NULL UNIQUE,
    slug        TEXT    NOT NULL UNIQUE,   
    category    TEXT,                      
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.tags IS 'Shared tag catalogue — applied to recordings via recording_tags.';


-- ═════════════════════════════════════════════════════════════
-- JUNCTION TABLE: recording_tags
-- Many-to-many: recordings ↔ tags
-- ═════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.recording_tags (
    recording_id    UUID    NOT NULL REFERENCES public.recordings(id) ON DELETE CASCADE,
    tag_id          UUID    NOT NULL REFERENCES public.tags(id)       ON DELETE CASCADE,
    tagged_by       UUID    REFERENCES public.users(id) ON DELETE SET NULL,
    tagged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (recording_id, tag_id)
);

COMMENT ON TABLE public.recording_tags IS 'Junction: many recordings ↔ many tags.';


-- ═════════════════════════════════════════════════════════════
-- JUNCTION TABLE: transcript_tags
-- Many-to-many: transcripts ↔ tags
-- ═════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.transcript_tags (
    transcript_id   UUID    NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
    tag_id          UUID    NOT NULL REFERENCES public.tags(id)        ON DELETE CASCADE,
    tagged_by       UUID    REFERENCES public.users(id) ON DELETE SET NULL,
    tagged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (transcript_id, tag_id)
);

COMMENT ON TABLE public.transcript_tags IS 'Junction: many transcripts ↔ many tags.';


-- ─────────────────────────────────────────────────────────────
-- TRIGGERS — updated_at auto-stamp
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_languages_updated_at
    BEFORE UPDATE ON public.languages
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_recordings_updated_at
    BEFORE UPDATE ON public.recordings
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_transcripts_updated_at
    BEFORE UPDATE ON public.transcripts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─────────────────────────────────────────────────────────────
-- TRIGGERS — Full-Text Search (FTS) vector maintenance
-- ─────────────────────────────────────────────────────────────


CREATE OR REPLACE FUNCTION public.update_recording_fts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.fts_vector :=
        setweight(to_tsvector('simple', unaccent(COALESCE(NEW.title, ''))),       'A') ||
        setweight(to_tsvector('simple', unaccent(COALESCE(NEW.description, ''))), 'B') ||
        setweight(
            to_tsvector('simple', unaccent(
                COALESCE(NEW.metadata->>'topics', '') || ' ' ||
                COALESCE(NEW.metadata->'speaker'->>'name', '')
            )),
            'C'
        );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recordings_fts
    BEFORE INSERT OR UPDATE ON public.recordings
    FOR EACH ROW EXECUTE FUNCTION public.update_recording_fts();



CREATE OR REPLACE FUNCTION public.update_transcript_fts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.fts_vector :=
        setweight(to_tsvector('simple', unaccent(COALESCE(NEW.content, ''))), 'A');
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transcripts_fts
    BEFORE INSERT OR UPDATE ON public.transcripts
    FOR EACH ROW EXECUTE FUNCTION public.update_transcript_fts();


-- ─────────────────────────────────────────────────────────────
-- TRIGGER — new Supabase auth user → auto-create public profile
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.users (id, email, username, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        'viewer'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- ─────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────


CREATE INDEX idx_users_role        ON public.users(role);
CREATE INDEX idx_users_email       ON public.users(email);
CREATE INDEX idx_users_metadata    ON public.users USING GIN (metadata);


CREATE INDEX idx_languages_iso     ON public.languages(iso_code);
CREATE INDEX idx_languages_family  ON public.languages(family);
CREATE INDEX idx_languages_metadata ON public.languages USING GIN (metadata);

CREATE INDEX idx_languages_name_trgm ON public.languages USING GIN (name gin_trgm_ops);


CREATE INDEX idx_recordings_language    ON public.recordings(language_id);
CREATE INDEX idx_recordings_uploaded_by ON public.recordings(uploaded_by);
CREATE INDEX idx_recordings_status      ON public.recordings(status);
CREATE INDEX idx_recordings_created_at  ON public.recordings(created_at DESC);
CREATE INDEX idx_recordings_fts         ON public.recordings USING GIN (fts_vector);
CREATE INDEX idx_recordings_metadata    ON public.recordings USING GIN (metadata);

CREATE INDEX idx_recordings_native_speaker
    ON public.recordings ((metadata -> 'speaker' -> 'native_speaker'));


CREATE INDEX idx_transcripts_recording  ON public.transcripts(recording_id);
CREATE INDEX idx_transcripts_created_by ON public.transcripts(created_by);
CREATE INDEX idx_transcripts_language   ON public.transcripts(language_id);
CREATE INDEX idx_transcripts_status     ON public.transcripts(status);
CREATE INDEX idx_transcripts_fts        ON public.transcripts USING GIN (fts_vector);
CREATE INDEX idx_transcripts_metadata   ON public.transcripts USING GIN (metadata);


CREATE INDEX idx_tags_slug     ON public.tags(slug);
CREATE INDEX idx_tags_category ON public.tags(category);

CREATE INDEX idx_tags_name_trgm ON public.tags USING GIN (name gin_trgm_ops);


CREATE INDEX idx_recording_tags_tag_id    ON public.recording_tags(tag_id);
CREATE INDEX idx_transcript_tags_tag_id   ON public.transcript_tags(tag_id);


-- ─────────────────────────────────────────────────────────────
-- SEED DATA — language samples (ISO 639-3)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.languages (iso_code, name, local_name, family, region, endangerment_level, metadata)
VALUES
  ('naq', 'Khoekhoegowab', 'Khoekhoegowab', 'Khoe-Kwadi', 'Southern Africa',
   'vulnerable',
   '{"glottolog_id":"khoe1241","alternate_names":["Nama","Damara","Hottentot"],"countries":["NA","ZA","BW"]}'::JSONB),

  ('afr', 'Afrikaans', 'Afrikaans', 'Indo-European', 'Southern Africa',
   NULL,
   '{"glottolog_id":"afri1274","countries":["ZA","NA"]}'::JSONB),

  ('osh', 'Oshiwambo', 'Oshiwambo', 'Niger-Congo', 'Southern Africa',
   NULL,
   '{"glottolog_id":"ndon1242","dialects":["Oshindonga","Oshikwanyama"],"countries":["NA","AO"]}'::JSONB),

  ('her', 'Otjiherero', 'Otjiherero', 'Niger-Congo', 'Southern Africa',
   NULL,
   '{"glottolog_id":"hero1242","countries":["NA","BW"]}'::JSONB),

  ('zul', 'isiZulu', 'isiZulu', 'Niger-Congo', 'Southern Africa',
   NULL,
   '{"glottolog_id":"zulu1248","countries":["ZA"]}'::JSONB)

ON CONFLICT (iso_code) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- SEED DATA — tag categories
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.tags (name, slug, category, description)
VALUES
  ('Field Recording',    'field-recording',    'genre',  'Recorded in natural/field settings'),
  ('Studio Recording',   'studio-recording',   'genre',  'Recorded in a controlled studio'),
  ('Oral Tradition',     'oral-tradition',     'topic',  'Folklore, proverbs, and oral history'),
  ('Narrative',          'narrative',          'topic',  'Storytelling and personal narratives'),
  ('Conversation',       'conversation',       'topic',  'Spontaneous or elicited conversation'),
  ('Elicitation',        'elicitation',        'topic',  'Word list or structured elicitation'),
  ('Song',               'song',               'topic',  'Musical / sung content'),
  ('Namibia',            'namibia',            'region', 'Recorded in Namibia'),
  ('South Africa',       'south-africa',       'region', 'Recorded in South Africa'),
  ('Endangered',         'endangered',         'status', 'Critically endangered or at-risk language'),
  ('Native Speaker',     'native-speaker',     'speaker','Recording features a native speaker'),
  ('Annotated',          'annotated',          'quality','Has time-aligned annotations')
ON CONFLICT (slug) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- USEFUL VIEWS (optional helpers for the API team)
-- ─────────────────────────────────────────────────────────────


CREATE OR REPLACE VIEW public.v_recordings_full AS
SELECT
    r.*,
    l.name            AS language_name,
    l.iso_code        AS language_iso,
    l.family          AS language_family,
    u.username        AS uploader_username,
    COALESCE(
        (SELECT ARRAY_AGG(t.name ORDER BY t.name)
         FROM   public.recording_tags rt
         JOIN   public.tags t ON t.id = rt.tag_id
         WHERE  rt.recording_id = r.id),
        ARRAY[]::TEXT[]
    )                 AS tags
FROM  public.recordings r
JOIN  public.languages  l ON l.id = r.language_id
JOIN  public.users      u ON u.id = r.uploaded_by;

COMMENT ON VIEW public.v_recordings_full IS 'Denormalised recording view — language info, uploader, and aggregated tags.';



CREATE OR REPLACE VIEW public.v_transcripts_full AS
SELECT
    t.*,
    r.title           AS recording_title,
    l.name            AS language_name,
    l.iso_code        AS language_iso,
    u.username        AS creator_username
FROM  public.transcripts t
JOIN  public.recordings  r ON r.id = t.recording_id
JOIN  public.languages   l ON l.id = t.language_id
JOIN  public.users       u ON u.id = t.created_by;

COMMENT ON VIEW public.v_transcripts_full IS 'Denormalised transcript view — recording, language, and creator info.';


-- ─────────────────────────────────────────────────────────────
-- END OF MIGRATION
-- ─────────────────────────────────────────────────────────────

