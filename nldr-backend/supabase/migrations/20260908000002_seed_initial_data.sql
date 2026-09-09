-- Seed: initial languages, contributors, tags, sample recordings, transcripts, collections, permissions
-- Safe to run multiple times (uses INSERT ... SELECT ... WHERE NOT EXISTS patterns)

-- Ensure the safe `update_transcripts_search_vector` trigger function is installed
-- This replaces any older dynamic-EXECUTE implementation that can fail in some DB setups.
CREATE OR REPLACE FUNCTION public.update_transcripts_search_vector() RETURNS trigger AS $$
DECLARE
  val text := NULL;
BEGIN
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


INSERT INTO public.languages (id, iso_code, name, local_name, region, created_at, is_active, updated_at)
SELECT gen_random_uuid(), 'en', 'English', 'English', 'Worldwide', now(), true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.languages WHERE iso_code = 'en');

INSERT INTO public.languages (id, iso_code, name, local_name, region, created_at, is_active, updated_at)
SELECT gen_random_uuid(), 'mi', 'Māori', 'Māori', 'Aotearoa/New Zealand', now(), true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.languages WHERE iso_code = 'mi');

-- Contributors
INSERT INTO public.contributors (id, full_name, email, institution, is_active, role_label, created_at, updated_at, user_id)
SELECT gen_random_uuid(), 'Seed Contributor', 'contrib@example.com', 'Example University', true, 'contributor', now(), now(), NULL
WHERE NOT EXISTS (SELECT 1 FROM public.contributors WHERE email = 'contrib@example.com');

-- Tags (provide `slug` and `created_at` to satisfy not-null constraints)
INSERT INTO public.tags (id, name, slug, created_at)
SELECT gen_random_uuid(), 'example', lower(regexp_replace('example','[^a-z0-9]+','-','g')), now()
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE name = 'example');

INSERT INTO public.tags (id, name, slug, created_at)
SELECT gen_random_uuid(), 'interview', lower(regexp_replace('interview','[^a-z0-9]+','-','g')), now()
WHERE NOT EXISTS (SELECT 1 FROM public.tags WHERE name = 'interview');

-- Collections
-- Collections (include `slug` and timestamps to satisfy not-null constraints)
INSERT INTO public.collections (id, title, slug, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Seed Collection', lower(regexp_replace('Seed Collection','[^a-z0-9]+','-','g')), 'A small collection created by seeds', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.collections WHERE title = 'Seed Collection');

-- Create a sample recording (only if same storage_path not present)
WITH lang AS (
  SELECT id AS language_id FROM public.languages WHERE iso_code = 'en' LIMIT 1
)
INSERT INTO public.recordings (id, language_id, uploaded_by, title, description, storage_path, duration_seconds, file_format, file_size_bytes, file_url, published_at, created_at, updated_at, metadata)
SELECT gen_random_uuid(), lang.language_id, (SELECT id FROM public.users LIMIT 1), 'Sample Recording A', 'Seed sample recording uploaded for testing', 'recordings/sample-audio-a.wav', 12, 'wav', 0, NULL, NULL, now(), now(), '{}'::jsonb
FROM lang
WHERE NOT EXISTS (SELECT 1 FROM public.recordings WHERE storage_path = 'recordings/sample-audio-a.wav')
  AND EXISTS (SELECT 1 FROM public.users);

-- Create another sample recording
WITH lang AS (
  SELECT id AS language_id FROM public.languages WHERE iso_code = 'mi' LIMIT 1
)
INSERT INTO public.recordings (id, language_id, uploaded_by, title, description, storage_path, duration_seconds, file_format, file_size_bytes, file_url, published_at, created_at, updated_at, metadata)
SELECT gen_random_uuid(), lang.language_id, (SELECT id FROM public.users LIMIT 1), 'Māori Sample B', 'Seed sample in te reo Māori', 'recordings/sample-audio-mi.wav', 18, 'wav', 0, NULL, NULL, now(), now(), '{}'::jsonb
FROM lang
WHERE NOT EXISTS (SELECT 1 FROM public.recordings WHERE storage_path = 'recordings/sample-audio-mi.wav')
  AND EXISTS (SELECT 1 FROM public.users);

-- Link tags to recordings
WITH r AS (SELECT id FROM public.recordings WHERE storage_path = 'recordings/sample-audio-a.wav' LIMIT 1),
t_example AS (SELECT id FROM public.tags WHERE name = 'example' LIMIT 1),
t_interview AS (SELECT id FROM public.tags WHERE name = 'interview' LIMIT 1)
INSERT INTO public.recordings_tags (recording_id, tag_id)
SELECT r.id, t_example.id FROM r CROSS JOIN t_example
WHERE NOT EXISTS (SELECT 1 FROM public.recordings_tags WHERE recording_id = r.id AND tag_id = t_example.id);

WITH r2 AS (SELECT id FROM public.recordings WHERE storage_path = 'recordings/sample-audio-a.wav' LIMIT 1),
t_interview2 AS (SELECT id FROM public.tags WHERE name = 'interview' LIMIT 1)
INSERT INTO public.recordings_tags (recording_id, tag_id)
SELECT r2.id, t_interview2.id FROM r2 CROSS JOIN t_interview2
WHERE NOT EXISTS (SELECT 1 FROM public.recordings_tags WHERE recording_id = r2.id AND tag_id = t_interview2.id);

-- Add transcripts for the sample recordings
WITH rec AS (
  SELECT id FROM public.recordings WHERE storage_path = 'recordings/sample-audio-a.wav' LIMIT 1
)
INSERT INTO public.transcripts (id, recording_id, content, created_by, created_at)
SELECT gen_random_uuid(), rec.id, 'This is a short sample transcript for recording A.', (SELECT id FROM public.users LIMIT 1), now()
FROM rec
WHERE rec.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.transcripts WHERE recording_id = rec.id)
  AND EXISTS (SELECT 1 FROM public.users);

WITH rec2 AS (
  SELECT id FROM public.recordings WHERE storage_path = 'recordings/sample-audio-mi.wav' LIMIT 1
)
INSERT INTO public.transcripts (id, recording_id, content, created_by, created_at)
SELECT gen_random_uuid(), rec2.id, 'Tēnei he tauira o te tuhinga mō te rekoata B.', (SELECT id FROM public.users LIMIT 1), now()
FROM rec2
WHERE rec2.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.transcripts WHERE recording_id = rec2.id)
  AND EXISTS (SELECT 1 FROM public.users);

-- Add a permission/consent record for sample recording A
WITH rec AS (SELECT id FROM public.recordings WHERE storage_path = 'recordings/sample-audio-a.wav' LIMIT 1)
INSERT INTO public.permissions (id, recording_id, consent_text, consent_date, consent_by, notes)
SELECT gen_random_uuid(), rec.id, 'Contributor consented for research use', now()::date, 'Seed Contributor', 'Seeded consent record'
FROM rec
WHERE rec.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.permissions WHERE recording_id = rec.id);

-- (Optional) If you later add a join table for collections->recordings,
-- insert idempotent records here linking `public.collections` and `public.recordings`.

-- Final safety/VF: ensure search_vector is populated for transcripts (if search_vector column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transcripts' AND column_name='search_vector') THEN
    UPDATE public.transcripts
    SET search_vector = to_tsvector('english', coalesce(content, ''))
    WHERE search_vector IS NULL;
  END IF;
END
$$;

-- End of seed file
