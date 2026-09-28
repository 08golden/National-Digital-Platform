-- Migration: persistent share requests (2026-09-28)
--
-- Share requests (the "Request Share Access" flow for content whose
-- data-use policy restricts direct downloads) have been in-memory only
-- since they were first wired up — every request vanished on page reload
-- and was never actually seen by an admin unless they happened to be in
-- the same browser session. This gives it a real table.
--
-- Field names below deliberately match frontend/src/types.ts's
-- ShareRequest interface (snake_case -> camelCase), and
-- lib/api/shareRequests.ts's TODO comments, which already documented this
-- exact expected shape.

DO $$ BEGIN
  CREATE TYPE share_request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.share_requests (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id        UUID NOT NULL REFERENCES public.recordings(id) ON DELETE CASCADE,
    content_title     TEXT NOT NULL,
    requested_by      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    requested_by_name TEXT NOT NULL,
    requested_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason            TEXT NOT NULL,
    status            share_request_status NOT NULL DEFAULT 'pending',
    share_token       UUID,
    reviewed_by       UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_share_requests_content ON public.share_requests(content_id);
CREATE INDEX IF NOT EXISTS idx_share_requests_requester ON public.share_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_share_requests_status ON public.share_requests(status);

ALTER TABLE public.share_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS share_requests_select_own_or_admin ON public.share_requests;
CREATE POLICY share_requests_select_own_or_admin ON public.share_requests
  FOR SELECT
  USING (requested_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS share_requests_insert_own ON public.share_requests;
CREATE POLICY share_requests_insert_own ON public.share_requests
  FOR INSERT
  WITH CHECK (requested_by = auth.uid());

DROP POLICY IF EXISTS share_requests_admin_update ON public.share_requests;
CREATE POLICY share_requests_admin_update ON public.share_requests
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
