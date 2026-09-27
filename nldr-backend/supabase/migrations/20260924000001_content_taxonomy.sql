-- Migration: hierarchical content taxonomy (2026-09-24)
--
-- Replaces the flat category enum (Articles/Audio/Video/Books) with a real
-- two-level taxonomy, per the supervisor meeting: Language (already the
-- top-level org unit) -> Content Group (Cultural Material / Educational
-- Material / Datasets) -> Sub-type (Grammar Book, Dance Recording, Raw
-- Corpus, etc). Built as a self-referencing tree rather than another enum
-- so admins can extend it later without a migration for every new leaf.
--
-- `media_kind` lives on the leaf (sub-type) rows and is the thing that
-- actually drives file-type validation on upload and which player renders
-- in ContentDetails -- decoupled from the taxonomy label itself, so
-- "what kind of file is this" and "how do we classify it" aren't the same
-- brittle string anymore.
--
-- The old `recordings.category` enum column is left in place for backward
-- compatibility with rows uploaded before this migration; `category_id` is
-- the new authoritative field going forward. Nothing here is destructive.

CREATE TABLE IF NOT EXISTS public.categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    parent_id   UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    media_kind  TEXT CHECK (media_kind IN ('audio', 'video', 'document', 'dataset')),
    description TEXT,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.categories IS
  'Two-level content taxonomy: root rows (parent_id NULL) are the content group (Cultural Material, Educational Material, Datasets); child rows are the specific sub-type. media_kind is only meaningful on leaf/child rows and drives upload file-type validation + which player ContentDetails renders.';

CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);

ALTER TABLE public.recordings
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

CREATE INDEX IF NOT EXISTS idx_recordings_category_id ON public.recordings(category_id);

-- ─────────────────────────────────────────────────────────────
-- Seed the starter taxonomy from the meeting.
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.categories (name, slug, parent_id, media_kind, sort_order) VALUES
  ('Cultural Material', 'cultural-material', NULL, NULL, 1),
  ('Educational Material', 'educational-material', NULL, NULL, 2),
  ('Datasets', 'datasets', NULL, NULL, 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, parent_id, media_kind, sort_order)
SELECT 'Audio Recording', 'cultural-audio-recording', id, 'audio', 1 FROM public.categories WHERE slug = 'cultural-material'
UNION ALL
SELECT 'Video / Dance', 'cultural-video-dance', id, 'video', 2 FROM public.categories WHERE slug = 'cultural-material'
UNION ALL
SELECT 'Song', 'cultural-song', id, 'audio', 3 FROM public.categories WHERE slug = 'cultural-material'
UNION ALL
SELECT 'Story / Folklore', 'cultural-story-folklore', id, 'document', 4 FROM public.categories WHERE slug = 'cultural-material'
UNION ALL
SELECT 'Ceremony Recording', 'cultural-ceremony', id, 'video', 5 FROM public.categories WHERE slug = 'cultural-material'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, parent_id, media_kind, sort_order)
SELECT 'Grammar Book', 'edu-grammar-book', id, 'document', 1 FROM public.categories WHERE slug = 'educational-material'
UNION ALL
SELECT 'Story Book', 'edu-story-book', id, 'document', 2 FROM public.categories WHERE slug = 'educational-material'
UNION ALL
SELECT 'Lesson Recording', 'edu-lesson-recording', id, 'audio', 3 FROM public.categories WHERE slug = 'educational-material'
UNION ALL
SELECT 'Vocabulary List', 'edu-vocabulary-list', id, 'document', 4 FROM public.categories WHERE slug = 'educational-material'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, parent_id, media_kind, sort_order)
SELECT 'Raw Language Corpus', 'data-raw-corpus', id, 'dataset', 1 FROM public.categories WHERE slug = 'datasets'
UNION ALL
SELECT 'Transcribed Dataset', 'data-transcribed', id, 'dataset', 2 FROM public.categories WHERE slug = 'datasets'
UNION ALL
SELECT 'Annotated Dataset', 'data-annotated', id, 'dataset', 3 FROM public.categories WHERE slug = 'datasets'
ON CONFLICT (slug) DO NOTHING;

-- Starter topic tags (the cross-cutting "subject" dimension — Food,
-- Culture, etc. from the meeting). Reuses the existing tags/recording_tags
-- tables already in the schema rather than adding new ones.
INSERT INTO public.tags (name, slug, category) VALUES
  ('Culture', 'culture', 'topic'),
  ('Food', 'food', 'topic'),
  ('History', 'history', 'topic'),
  ('Ceremony', 'ceremony', 'topic'),
  ('Folklore', 'folklore', 'topic'),
  ('Music', 'music', 'topic'),
  ('Oral Tradition', 'oral-tradition', 'topic'),
  ('Language Learning', 'language-learning', 'topic')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- RLS: categories and tags are public reference/lookup data — readable by
-- anyone, writable only by admins.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS categories_select_all ON public.categories;
CREATE POLICY categories_select_all ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS categories_admin_write ON public.categories;
CREATE POLICY categories_admin_write ON public.categories
  FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS categories_admin_update ON public.categories;
CREATE POLICY categories_admin_update ON public.categories
  FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS categories_admin_delete ON public.categories;
CREATE POLICY categories_admin_delete ON public.categories
  FOR DELETE USING (public.is_admin());

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tags_select_all ON public.tags;
CREATE POLICY tags_select_all ON public.tags FOR SELECT USING (true);

DROP POLICY IF EXISTS tags_authenticated_insert ON public.tags;
CREATE POLICY tags_authenticated_insert ON public.tags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE public.recording_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recording_tags_select_all ON public.recording_tags;
CREATE POLICY recording_tags_select_all ON public.recording_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS recording_tags_owner_insert ON public.recording_tags;
CREATE POLICY recording_tags_owner_insert ON public.recording_tags
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.recordings r WHERE r.id = recording_id AND r.uploaded_by = auth.uid())
  );
