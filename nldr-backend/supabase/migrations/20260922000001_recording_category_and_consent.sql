-- Migration: category + data-use consent fields on recordings (2026-09-22)
--
-- The Digital Library UI (frontend/src/types.ts ContentItem) has always
-- expected every item to carry a `category` (Articles/Audio/Video/Books,
-- driving the category tabs/filtering) and an optional `dataUseConsent`
-- (allowDownload/allowSharing, which the Download Resource button now
-- enforces) -- but recordings never had columns for either, so every real
-- upload was falling back to defaults with no way for a contributor to set
-- them. This adds both, so the upload form can capture them and the
-- library can filter/display on them.

DO $$ BEGIN
  CREATE TYPE content_category AS ENUM ('Articles', 'Audio', 'Video', 'Books');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.recordings
  ADD COLUMN IF NOT EXISTS category content_category NOT NULL DEFAULT 'Audio',
  ADD COLUMN IF NOT EXISTS allow_download BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_sharing  BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.recordings.category IS
  'Drives the Digital Library category tabs/filtering (frontend Category type).';
COMMENT ON COLUMN public.recordings.allow_download IS
  'Contributor-set data-use policy: may other users download this asset directly?';
COMMENT ON COLUMN public.recordings.allow_sharing IS
  'Contributor-set data-use policy: may other users submit a share request for this asset?';

CREATE INDEX IF NOT EXISTS idx_recordings_category ON public.recordings(category);
