# Metadata schema & data model (suggested)

This document lists the main tables and sample SQL for migrations. Adjust types and constraints to fit project needs.

Tables overview
- `languages` — language metadata
- `contributors` — user profiles
- `recordings` — media items
- `transcripts` — text transcriptions linked to recordings
- `tags` — controlled vocabulary
- `recordings_tags` — many-to-many join
- `collections` — groupings of recordings
- `permissions` — visibility/consent records

Sample SQL (Postgres)

-- languages
CREATE TABLE public.languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iso_code text,
  name text NOT NULL,
  alternative_names text[],
  region text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- contributors
CREATE TABLE public.contributors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id),
  display_name text,
  email text,
  affiliation text,
  created_at timestamptz DEFAULT now()
);

-- recordings
CREATE TABLE public.recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id uuid REFERENCES public.languages(id),
  contributor_id uuid REFERENCES public.contributors(id),
  title text,
  description text,
  storage_path text NOT NULL, -- Supabase Storage path or URL
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
CREATE TABLE public.transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid REFERENCES public.recordings(id) ON DELETE CASCADE,
  language text,
  text_content text,
  format text DEFAULT 'plain',
  created_at timestamptz DEFAULT now()
);

-- tags
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL
);

-- recordings_tags
CREATE TABLE public.recordings_tags (
  recording_id uuid REFERENCES public.recordings(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recording_id, tag_id)
);

-- collections
CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- permissions / consent
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid REFERENCES public.recordings(id) ON DELETE CASCADE,
  consent_text text,
  consent_date date,
  consent_by text,
  notes text
);

Indexes and suggestions
- Add full-text index on transcripts: `ALTER TABLE public.transcripts ADD COLUMN search_vector tsvector;
  UPDATE public.transcripts SET search_vector = to_tsvector('english', coalesce(text_content,'')); CREATE INDEX transcripts_search_idx ON public.transcripts USING GIN(search_vector);`
- Add indexes on `language_id`, `created_at` for queries.

Migration placement
- Put SQL into `nldr-backend/supabase/migrations/` with timestamped filenames.

Next: I can generate a timestamped migration file with this SQL if you want.
