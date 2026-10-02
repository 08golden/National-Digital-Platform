-- Migration: public-safe contributor names (2026-09-30)
--
-- Every non-admin, non-owner viewer sees "Unknown contributor" on every
-- single item in the Digital Library, regardless of who actually uploaded
-- it. Root cause: the recordings query embeds users(username, display_name)
-- via the uploaded_by foreign key, and users_select_own_or_admin RLS
-- (20260921000001_rls_policies.sql) only lets someone read a users row
-- that is their own or if they're an admin -- so the embedded join comes
-- back null for literally everyone else. This has been broken since that
-- RLS migration; it is not something recent uploads did differently.
--
-- RLS is row-level, not column-level, so a looser SELECT policy on
-- public.users to fix this would also expose email and metadata to any
-- logged-in viewer for any contributor -- not appropriate for a public
-- national platform. The correct minimal-exposure fix is a SECURITY
-- DEFINER function with a narrow return type: it can only ever return the
-- three safe columns, because that's all its signature allows, regardless
-- of what it reads internally.

CREATE OR REPLACE FUNCTION public.get_public_profiles(user_ids UUID[])
RETURNS TABLE (id UUID, username TEXT, display_name TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT u.id, u.username, u.display_name
  FROM public.users u
  WHERE u.id = ANY(user_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profiles(UUID[]) TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_profiles IS
  'Returns only username/display_name for a set of user ids, bypassing users_select_own_or_admin RLS by design -- this is the public "who uploaded this" attribution shown in the Digital Library, intentionally narrower than the full users row (no email/metadata/role exposed).';
