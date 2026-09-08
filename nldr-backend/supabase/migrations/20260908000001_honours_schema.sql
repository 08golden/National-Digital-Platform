-- Migration: honours project schema (2026-09-08)
-- Creates core tables for languages, contributors, recordings, transcripts, tags, collections, permissions

-- Enable extension for UUID generation if not present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- languages
CREATE TABLE IF NOT EXISTS public.languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iso_code text,
  name text NOT NULL,
  alternative_names text[],
  region text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- contributors
CREATE TABLE IF NOT EXISTS public.contributors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id),
  display_name text,
  email text,
  affiliation text,
  created_at timestamptz DEFAULT now()
);

-- recordings
CREATE TABLE IF NOT EXISTS public.recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id uuid REFERENCES public.languages(id),
  contributor_id uuid REFERENCES public.contributors(id),
  title text,
  description text,
  storage_path text NOT NULL,
  duration_seconds integer,
  recorded_at date,
  sample_rate integer,
  channels integer,
  license text,
  visibility text DEFAULT 'restricted', -- public|restricted|embargo
  embargo_until date,
  created_at timestamptz DEFAULT now()
);

-- transcripts
CREATE TABLE IF NOT EXISTS public.transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid REFERENCES public.recordings(id) ON DELETE CASCADE,
  language text,
  text_content text,
  format text DEFAULT 'plain',
  created_at timestamptz DEFAULT now()
);

-- tags
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL
);

-- recordings_tags
CREATE TABLE IF NOT EXISTS public.recordings_tags (
  recording_id uuid REFERENCES public.recordings(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recording_id, tag_id)
);

-- collections
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- permissions / consent
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid REFERENCES public.recordings(id) ON DELETE CASCADE,
  consent_text text,
  consent_date date,
  consent_by text,
  notes text
);

-- Full-text search for transcripts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transcripts' AND column_name='search_vector') THEN
    ALTER TABLE public.transcripts ADD COLUMN search_vector tsvector;
    UPDATE public.transcripts SET search_vector = to_tsvector('english', coalesce(text_content,''));
    CREATE INDEX IF NOT EXISTS transcripts_search_idx ON public.transcripts USING GIN(search_vector);
    CREATE TRIGGER transcripts_search_update BEFORE INSERT OR UPDATE ON public.transcripts
    FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger('search_vector', 'pg_catalog.english', 'text_content');
  END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS recordings_language_idx ON public.recordings(language_id);
CREATE INDEX IF NOT EXISTS recordings_created_idx ON public.recordings(created_at DESC);
