-- Migration: friendlier taxonomy names (2026-10-20)
--
-- From the supervisor review: shorten and soften some content-type names.
--   "Video / Dance"      -> "Video"
--   "Song"               -> "Music"
--   "Story / Folklore"   -> "Storytelling"
--   "Ceremony Recording" -> "Cultural Content"
--     ("ceremonial" is the wrong word: some ceremonies aren't meant to be shared,
--      so the label shouldn't invite that.)
-- The topic list is unchanged.
--
-- Each rename is keyed by the type's slug AND only applies if the name is still
-- the original seeded one, so a name an admin has already changed in the
-- Taxonomy tab is left alone. Safe to run more than once.
--
-- Note: "Cultural Content" keeps its original file kind (video). If it should
-- accept any kind of file, that needs a separate change.

UPDATE public.categories SET name = 'Video'            WHERE slug = 'cultural-video-dance'     AND name = 'Video / Dance';
UPDATE public.categories SET name = 'Music'            WHERE slug = 'cultural-song'            AND name = 'Song';
UPDATE public.categories SET name = 'Storytelling'     WHERE slug = 'cultural-story-folklore'  AND name = 'Story / Folklore';
UPDATE public.categories SET name = 'Cultural Content' WHERE slug = 'cultural-ceremony'        AND name = 'Ceremony Recording';
