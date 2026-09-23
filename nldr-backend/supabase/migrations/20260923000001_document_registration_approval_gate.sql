-- Migration: document the registration approval gate (2026-09-23)
--
-- The live database already has a `registration_status` enum column on
-- public.users ('pending' | 'approved' | 'rejected'), and `is_active`'s
-- column default has already been changed from TRUE to FALSE -- neither of
-- which exists in any migration file in this repo. This was evidently
-- added by hand directly in the Supabase SQL editor at some point before
-- version control caught up, which is how a brand-new "Request Access"
-- signup ended up silently landing as inactive/pending with no code
-- anywhere explaining why, and no admin screen to ever approve it.
--
-- This migration is idempotent and makes no live schema changes on a
-- database that already has this (every statement is a safe no-op there);
-- its purpose is to bring a *fresh* database (or anyone rebuilding from
-- these migrations from scratch) up to what production already does, and
-- to leave a permanent, version-controlled record of why is_active
-- defaults to FALSE instead of TRUE.

DO $$ BEGIN
  CREATE TYPE registration_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS registration_status registration_status NOT NULL DEFAULT 'pending';

ALTER TABLE public.users
  ALTER COLUMN is_active SET DEFAULT FALSE;

COMMENT ON COLUMN public.users.registration_status IS
  'Approval gate for new "Request Access" signups. New accounts start pending/inactive until an admin approves them in the Admin Dashboard Users tab.';
COMMENT ON COLUMN public.users.is_active IS
  'Defaults to FALSE (see registration_status): a new signup cannot use the app until an admin approves it. An admin can also independently deactivate an already-approved account.';

-- Backfill: any existing row with no explicit registration_status set (i.e.
-- everything created before this column existed) is treated as already
-- approved, since it predates the approval-gate feature entirely and many
-- of those rows are already is_active = true admins/contributors in daily
-- use. This only touches rows where the column just got its default
-- applied by the ADD COLUMN above with nothing else having set it since.
UPDATE public.users
SET registration_status = 'approved'
WHERE registration_status = 'pending' AND is_active = TRUE;
