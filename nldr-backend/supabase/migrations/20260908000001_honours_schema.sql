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
-- Safely add a tsvector column, populate using whichever text column exists,
-- create a trigger function that handles possible column-name variations,
-- and create a GIN index. This avoids touching rows unnecessarily.
BEGIN;
ALTER TABLE IF EXISTS public.transcripts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate search_vector using the first available text column
DO $$
DECLARE
  col text;
BEGIN
  SELECT column_name INTO col
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'transcripts'
    AND column_name IN ('text_content','content','body','transcript_text')
  LIMIT 1;

  IF col IS NOT NULL THEN
    EXECUTE format(
      'UPDATE public.transcripts SET search_vector = to_tsvector(''english'', coalesce(%I::text, '''')) WHERE search_vector IS NULL',
      col
    );
  ELSE
    RAISE NOTICE 'No transcript text column found (looked for text_content, content, body, transcript_text) - skipping population.';
  END IF;
END
$$ LANGUAGE plpgsql;

-- Create/update trigger function that reads the available text column dynamically
CREATE OR REPLACE FUNCTION public.update_transcripts_search_vector() RETURNS trigger AS $$
DECLARE
  val text := NULL;
BEGIN
  -- Try known field names one by one; undefined_column exceptions are caught
  BEGIN
    val := NEW.text_content;
  EXCEPTION WHEN undefined_column THEN
    val := NULL;
  END;

  IF val IS NULL THEN
    BEGIN
      val := NEW.content;
    EXCEPTION WHEN undefined_column THEN
      val := NULL;
    END;
  END IF;

  IF val IS NULL THEN
    BEGIN
      val := NEW.body;
    EXCEPTION WHEN undefined_column THEN
      val := NULL;
    END;
  END IF;

  IF val IS NULL THEN
    BEGIN
      val := NEW.transcript_text;
    EXCEPTION WHEN undefined_column THEN
      val := NULL;
    END;
  END IF;

  NEW.search_vector := to_tsvector('english', coalesce(val::text, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transcripts_search_update ON public.transcripts;
CREATE TRIGGER transcripts_search_update
  BEFORE INSERT OR UPDATE ON public.transcripts
  FOR EACH ROW EXECUTE PROCEDURE public.update_transcripts_search_vector();

CREATE INDEX IF NOT EXISTS transcripts_search_idx ON public.transcripts USING GIN(search_vector);
COMMIT;

-- Indexes
CREATE INDEX IF NOT EXISTS recordings_language_idx ON public.recordings(language_id);
CREATE INDEX IF NOT EXISTS recordings_created_idx ON public.recordings(created_at DESC);
