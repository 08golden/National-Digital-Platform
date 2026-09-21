-- Migration: fix content_items RLS violation (2026-09-21)
--
-- public.content_items is a system-maintained denormalised registry, kept
-- in sync by triggers on public.recordings and public.transcripts
-- (trg_sync_recording_to_content_item / trg_sync_transcript_to_content_item,
-- see 20260425000003_universal_triggers_indexes.sql). Those trigger
-- functions were declared without SECURITY DEFINER, so they run with the
-- privileges of whichever role fired the original INSERT — i.e. the
-- uploading contributor's own authenticated role, subject to RLS.
--
-- content_items apparently already has RLS enabled on this project (most
-- likely a project-level "enable RLS on new tables" default, same as the
-- users/recordings tables addressed in 20260921000001_rls_policies.sql)
-- but has never had a single policy defined for it. A contributor uploading
-- a recording therefore hits:
--   "new row violates row-level security policy for table content_items"
-- even though they have every right to create their own recording — the
-- failure is in an internal sync step they don't even know exists.
--
-- Fix: make the sync trigger functions SECURITY DEFINER (the standard
-- Postgres pattern for a trigger that maintains derived/denormalised data
-- on behalf of the user — the user needs rights on `recordings`, not on the
-- internal registry table it feeds). Also add explicit RLS policies on
-- content_items for the cases where it *is* queried directly by a
-- normal (non-definer) role, so read access is correct either way.

ALTER FUNCTION public.sync_recording_to_content_item() SECURITY DEFINER;
ALTER FUNCTION public.sync_recording_to_content_item() SET search_path = public;

ALTER FUNCTION public.sync_transcript_to_content_item() SECURITY DEFINER;
ALTER FUNCTION public.sync_transcript_to_content_item() SET search_path = public;

COMMENT ON FUNCTION public.sync_recording_to_content_item IS
  'Mirrors a recording into the content_items registry. SECURITY DEFINER: this is internal bookkeeping the uploading user should not need direct content_items privileges for.';
COMMENT ON FUNCTION public.sync_transcript_to_content_item IS
  'Mirrors a transcript into the content_items registry. SECURITY DEFINER: this is internal bookkeeping the uploading user should not need direct content_items privileges for.';

-- ─────────────────────────────────────────────────────────────
-- CONTENT_ITEMS — explicit policies for direct reads/writes by
-- non-definer roles (e.g. a future frontend query straight against this
-- table, or an admin editing extended_metadata by hand).
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_items_select_public_or_own_or_admin ON public.content_items;
CREATE POLICY content_items_select_public_or_own_or_admin ON public.content_items
  FOR SELECT
  USING (
    visibility = 'public'
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.contributors c
      WHERE c.id = content_items.contributor_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS content_items_admin_manage ON public.content_items;
CREATE POLICY content_items_admin_manage ON public.content_items
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
