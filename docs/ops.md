# Operations: Applying Migrations & Importing Backups

This document explains how to apply the SQL migrations in `nldr-backend/supabase/migrations` to a Supabase project, and how to import existing backups.

Prerequisites
- You need access to the Supabase project (Dashboard) with a role that can run SQL or the Supabase CLI authenticated with your account.

Option A — Apply migrations via Supabase Dashboard (SQL Editor)
1. Open https://app.supabase.com and select your project (staging or production).
2. Go to "SQL" → "New query".
3. Open the migration file (e.g. `20260908000001_honours_schema.sql`) from this repo, copy its SQL, paste into the editor, and click "RUN".
4. Repeat for each migration file in chronological order (seed file last).

Option B — Apply migrations via Supabase CLI
1. Install Supabase CLI: https://supabase.com/docs/guides/cli
2. Authenticate:
   supabase login
3. Apply migration files:
   supabase db reset --project-ref <PROJECT_REF> --file nldr-backend/supabase/migrations/20260908000001_honours_schema.sql
   # Repeat for other migration files or create a script to run them in order.

Importing an existing backup (SQL dump)
1. In Supabase Dashboard → Settings → Database → Backups, you can upload/import SQL files if allowed.
2. Alternatively, run the SQL dump in the SQL Editor (if file size is manageable).
3. For large backups, use `psql` against the project's direct database connection string (requires network access and credentials):
   psql "postgresql://<user>:<password>@<host>:<port>/<db>" -f backup.sql

Notes
- Run migrations on a staging project first before applying to production.
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is kept secret and not stored in the repo.
- If migrations alter sensitive data, backup the DB first via Dashboard → Backups.
