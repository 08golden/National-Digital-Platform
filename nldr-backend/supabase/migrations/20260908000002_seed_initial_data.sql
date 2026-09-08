-- Seed: initial sample data for honours project
-- Insert a few sample languages, contributors, recordings, transcripts, and tags

INSERT INTO public.languages (id, iso_code, name, region, description, created_at)
VALUES
  (gen_random_uuid(), 'afr', 'Afrikaans', 'Southern Namibia', 'Sample language entry for Afrikaans', now()),
  (gen_random_uuid(), 'kua', 'Khoekhoe', 'Central Namibia', 'Sample language entry for Khoekhoe', now()),
  (gen_random_uuid(), 'nya', 'Nama', 'Northern Namibia', 'Sample language entry for Nama', now());

-- Contributors
INSERT INTO public.contributors (id, display_name, email, affiliation, created_at)
VALUES
  (gen_random_uuid(), 'Test Contributor', 'contrib@example.com', 'University', now());

-- Tags
INSERT INTO public.tags (id, name)
VALUES
  (gen_random_uuid(), 'folk-story'),
  (gen_random_uuid(), 'song'),
  (gen_random_uuid(), 'interview');

-- Recordings (link to first language and contributor)
INSERT INTO public.recordings (id, language_id, contributor_id, title, description, storage_path, duration_seconds, license, visibility, created_at)
SELECT gen_random_uuid(), l.id, c.id, 'Sample recording - ' || l.name, 'Auto-seeded sample recording for ' || l.name, '', 120, 'CC-BY-4.0', 'public', now()
FROM public.languages l, public.contributors c
LIMIT 3;

-- Transcripts: create a simple transcript for each recording
INSERT INTO public.transcripts (id, recording_id, language, text_content, format, created_at)
SELECT gen_random_uuid(), r.id, COALESCE(l.iso_code, 'und'), 'This is a sample transcript for ' || r.title, 'plain', now()
FROM public.recordings r
JOIN public.languages l ON l.id = r.language_id;
