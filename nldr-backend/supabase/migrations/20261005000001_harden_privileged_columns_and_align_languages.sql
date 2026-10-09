-- Migration: harden privileged columns + align languages (2026-10-05)
--
-- PART 1 — Privilege-escalation gaps in 20260921000001_rls_policies.sql
--
-- RLS is row-level, not column-level. Three policies from that migration
-- therefore allowed more than their names implied:
--
--   users_update_own_limited       -> a user may UPDATE their own row, which
--                                     includes `role`, `is_active` and
--                                     `registration_status`. Anyone signed in
--                                     could make themselves an admin, or
--                                     approve their own pending registration,
--                                     by calling Supabase directly with the
--                                     public anon key.
--   recordings_contributor_insert  -> never constrained `status`, so a
--                                     contributor could insert a recording as
--                                     'published' and skip moderation.
--   recordings_owner_or_admin_update / transcripts_owner_or_admin_update
--                                  -> an owner could flip their own item's
--                                     `status` to 'published' / 'approved'.
--
-- The app's own API routes already behave correctly; the gap is only
-- reachable by calling Supabase directly. Column rules can't be expressed in
-- RLS, so they're enforced with BEFORE triggers. Trusted callers are
-- unaffected: the backend's service-role client and the SQL editor carry no
-- end-user JWT, so auth.uid() is NULL for them.

CREATE OR REPLACE FUNCTION public.protect_user_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  other_active_admins INT;
BEGIN
  -- Trusted callers: the backend's service-role client and the SQL editor.
  -- Checked two ways (no end-user id, or an explicit service_role) so a
  -- change in how either is represented can't lock moderation out.
  IF auth.uid() IS NULL OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF public.is_admin() THEN
    -- Never allow the platform to end up with no active administrator.
    IF OLD.role = 'admin' AND OLD.is_active
       AND (NEW.role IS DISTINCT FROM 'admin' OR NEW.is_active IS DISTINCT FROM TRUE) THEN
      SELECT count(*) INTO other_active_admins
      FROM public.users
      WHERE role = 'admin' AND is_active AND id <> OLD.id;

      IF other_active_admins = 0 THEN
        RAISE EXCEPTION 'You cannot demote or deactivate the last active administrator.'
          USING ERRCODE = 'P0001';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Everyone else may edit their own profile, but not these three fields.
  -- to_jsonb() keeps this working even if registration_status is absent.
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.is_active IS DISTINCT FROM OLD.is_active
     OR (to_jsonb(NEW) ->> 'registration_status') IS DISTINCT FROM (to_jsonb(OLD) ->> 'registration_status') THEN
    RAISE EXCEPTION 'Only an administrator can change role, active status or registration status.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_privileged_columns ON public.users;
CREATE TRIGGER trg_protect_user_privileged_columns
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_privileged_columns();

CREATE OR REPLACE FUNCTION public.protect_recording_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.role() = 'service_role' OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Non-admin uploads always start in moderation, whatever the client sent.
    NEW.status := 'pending';
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status::text <> 'archived' THEN
    RAISE EXCEPTION 'Only an administrator can change a recording''s moderation status.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_recording_status ON public.recordings;
CREATE TRIGGER trg_protect_recording_status
  BEFORE INSERT OR UPDATE ON public.recordings
  FOR EACH ROW EXECUTE FUNCTION public.protect_recording_status();

CREATE OR REPLACE FUNCTION public.protect_transcript_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.role() = 'service_role' OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'draft';
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Only an administrator can change a transcript''s review status.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_transcript_status ON public.transcripts;
CREATE TRIGGER trg_protect_transcript_status
  BEFORE INSERT OR UPDATE ON public.transcripts
  FOR EACH ROW EXECUTE FUNCTION public.protect_transcript_status();

-- ─────────────────────────────────────────────────────────────
-- PART 2 — One language list for contributors and the Library
--
-- The contributor upload dropdown reads public.languages (active rows); the
-- Digital Library menu is now built from the same table. The repo's seeds
-- only ever added Khoekhoegowab and Afrikaans (plus English and Māori as
-- test rows), so Herero and Rukwangali may be missing and the two test rows
-- show up in the contributor dropdown even though this platform is about
-- Namibian languages.
--
-- Inserts are guarded by name AND iso_code so an Oshiwambo row you already
-- added by hand is reused rather than duplicated. English and Māori are
-- deactivated rather than deleted: recordings that point at them keep
-- working, and re-enabling is `UPDATE public.languages SET is_active = true`.
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.languages (iso_code, name, local_name, region, is_active)
SELECT v.iso_code, v.name, v.local_name, v.region, TRUE
FROM (VALUES
  ('ndo', 'Oshiwambo',     'Oshiwambo',     'Northern Namibia'),
  ('her', 'Herero',        'Otjiherero',    'North-western and eastern Namibia'),
  ('naq', 'Khoekhoegowab', 'Khoekhoegowab', 'Central and southern Namibia'),
  ('kwn', 'Rukwangali',    'Rukwangali',    'Kavango regions, Namibia'),
  ('afr', 'Afrikaans',     'Afrikaans',     'Southern Africa')
) AS v(iso_code, name, local_name, region)
WHERE NOT EXISTS (
  SELECT 1 FROM public.languages l
  WHERE lower(l.name) = lower(v.name) OR l.iso_code = v.iso_code
);

UPDATE public.languages
SET is_active = TRUE
WHERE lower(name) IN ('oshiwambo', 'herero', 'khoekhoegowab', 'rukwangali', 'afrikaans');

UPDATE public.languages
SET is_active = FALSE
WHERE iso_code IN ('en', 'mi');
