-- Migration: carry sign-up details into the profile (2026-10-21)
--
-- Everything a person types on the sign-up form (name, what describes them,
-- affiliation, country, whether they want to contribute and why) is stored by
-- Supabase Auth in auth.users.raw_user_meta_data. It only ever reached
-- public.users — the table the Admin Panel reads — if the person later signed
-- in successfully, because the frontend copied it across at that point. Someone
-- who never confirmed their email, or whose registration is still pending, was
-- therefore a blank row to the admin deciding whether to approve them, and some
-- accounts ended up with no display name at all.
--
-- This copies the details at the moment the profile row is created, so an admin
-- can see them straight away. It is a BEFORE INSERT trigger on public.users, so
-- it works whichever function creates the profile row (your database has two
-- triggers on auth.users, and this does not depend on which one runs first).
--
-- Values already present on the row always win, and blank answers are not stored.

CREATE OR REPLACE FUNCTION public.copy_signup_details_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta    JSONB;
  carried JSONB;
BEGIN
  SELECT raw_user_meta_data INTO meta FROM auth.users WHERE id = NEW.id;
  IF meta IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.display_name := COALESCE(NULLIF(NEW.display_name, ''), NULLIF(meta ->> 'full_name', ''));

  carried := jsonb_strip_nulls(jsonb_build_object(
    'intent',               NULLIF(meta ->> 'intent', ''),
    'affiliation',          NULLIF(meta ->> 'affiliation', ''),
    'country',              NULLIF(meta ->> 'country', ''),
    'desired_role',         NULLIF(meta ->> 'desired_role', ''),
    'contribution_details', NULLIF(meta ->> 'contribution_details', '')
  ));
  NEW.metadata := carried || COALESCE(NEW.metadata, '{}'::jsonb);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_copy_signup_details ON public.users;
CREATE TRIGGER trg_copy_signup_details
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.copy_signup_details_to_profile();

-- One-time backfill for people who already signed up. Idempotent: anything
-- already on the profile is kept, so running this twice changes nothing.
UPDATE public.users u
SET display_name = COALESCE(NULLIF(u.display_name, ''), NULLIF(a.raw_user_meta_data ->> 'full_name', '')),
    metadata = jsonb_strip_nulls(jsonb_build_object(
      'intent',               NULLIF(a.raw_user_meta_data ->> 'intent', ''),
      'affiliation',          NULLIF(a.raw_user_meta_data ->> 'affiliation', ''),
      'country',              NULLIF(a.raw_user_meta_data ->> 'country', ''),
      'desired_role',         NULLIF(a.raw_user_meta_data ->> 'desired_role', ''),
      'contribution_details', NULLIF(a.raw_user_meta_data ->> 'contribution_details', '')
    )) || COALESCE(u.metadata, '{}'::jsonb)
FROM auth.users a
WHERE a.id = u.id
  AND a.raw_user_meta_data IS NOT NULL;
