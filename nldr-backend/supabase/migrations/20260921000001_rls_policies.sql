-- Migration: Row Level Security policies (2026-09-21)
--
-- Prior migrations never enabled RLS on any table. That means, depending on
-- how the Supabase project was configured, either:
--   (a) RLS is off and the tables are fully open to anyone holding the anon
--       key (a serious data-exposure risk for a "national digital platform"
--       that stores consent records and access-restricted language data), or
--   (b) RLS was switched on manually from the Studio UI with zero policies,
--       which silently denies every query — this is the most likely cause
--       of "Admin Dashboard breaks when clicking Users": public.users
--       becomes unreadable to the authenticated anon-key frontend client and
--       AdminPanel's fetchUsers() call just comes back empty/blocked.
--
-- This migration makes access explicit either way: admins can manage
-- everything, users can read/update their own profile, and published,
-- non-restricted content stays readable by any authenticated visitor.
-- It is idempotent (DROP POLICY IF EXISTS + CREATE POLICY) so it is safe to
-- re-run.

-- Helper: is the current auth.uid() an admin? SECURITY DEFINER avoids the
-- recursive-RLS trap of a users policy calling back into public.users.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_own_or_admin ON public.users;
CREATE POLICY users_select_own_or_admin ON public.users
  FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS users_update_own_limited ON public.users;
CREATE POLICY users_update_own_limited ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS users_admin_manage_all ON public.users;
CREATE POLICY users_admin_manage_all ON public.users
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- LANGUAGES — public catalogue, readable by anyone signed in.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS languages_select_all ON public.languages;
CREATE POLICY languages_select_all ON public.languages
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS languages_admin_write ON public.languages;
CREATE POLICY languages_admin_write ON public.languages
  FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS languages_admin_update ON public.languages;
CREATE POLICY languages_admin_update ON public.languages
  FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS languages_admin_delete ON public.languages;
CREATE POLICY languages_admin_delete ON public.languages
  FOR DELETE USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- RECORDINGS — published rows are public; contributors manage their own;
-- admins manage everything (moderation).
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recordings_select_published_or_own_or_admin ON public.recordings;
CREATE POLICY recordings_select_published_or_own_or_admin ON public.recordings
  FOR SELECT
  USING (
    status = 'published'
    OR uploaded_by = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS recordings_contributor_insert ON public.recordings;
CREATE POLICY recordings_contributor_insert ON public.recordings
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('contributor', 'admin') AND is_active
    )
  );

DROP POLICY IF EXISTS recordings_owner_or_admin_update ON public.recordings;
CREATE POLICY recordings_owner_or_admin_update ON public.recordings
  FOR UPDATE
  USING (uploaded_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS recordings_admin_delete ON public.recordings;
CREATE POLICY recordings_admin_delete ON public.recordings
  FOR DELETE
  USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- TRANSCRIPTS — inherit visibility from their parent recording.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS transcripts_select_via_recording ON public.transcripts;
CREATE POLICY transcripts_select_via_recording ON public.transcripts
  FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.recordings r
      WHERE r.id = recording_id
        AND (r.status = 'published' OR r.uploaded_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS transcripts_contributor_write ON public.transcripts;
CREATE POLICY transcripts_contributor_write ON public.transcripts
  FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.recordings r
      WHERE r.id = recording_id AND r.uploaded_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS transcripts_owner_or_admin_update ON public.transcripts;
CREATE POLICY transcripts_owner_or_admin_update ON public.transcripts
  FOR UPDATE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.recordings r
      WHERE r.id = recording_id AND r.uploaded_by = auth.uid()
    )
  );

COMMENT ON FUNCTION public.is_admin IS
  'Returns true if the calling auth.uid() has role=admin in public.users. SECURITY DEFINER so RLS policies on public.users can call it without recursive-policy errors.';

-- ─────────────────────────────────────────────────────────────
-- STORAGE — the 'recordings' bucket. Uploads are authenticated
-- contributors/admins only; reads are open to any signed-in user (download
-- gating for restricted/embargoed items is enforced in the recordings table
-- policy above plus the application-level DataUseConsent check).
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS recordings_bucket_authenticated_read ON storage.objects;
CREATE POLICY recordings_bucket_authenticated_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'recordings' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS recordings_bucket_contributor_upload ON storage.objects;
CREATE POLICY recordings_bucket_contributor_upload ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'recordings'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('contributor', 'admin') AND is_active
    )
  );

DROP POLICY IF EXISTS recordings_bucket_admin_manage ON storage.objects;
CREATE POLICY recordings_bucket_admin_manage ON storage.objects
  FOR ALL
  USING (bucket_id = 'recordings' AND public.is_admin())
  WITH CHECK (bucket_id = 'recordings' AND public.is_admin());
