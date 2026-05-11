# API Test Report

**Project:** Digital Language Repository
**Tested folder:** `frontend/src/lib/api`
**Backend server:** `backend` (Next.js API routes)
**Local base URL:** `http://localhost:3000`
**Report generated:** 2026-05-10

## Tested endpoints

- `GET /api/languages`
- `GET /api/recordings`
- `GET /api/tags`

## Execution summary

The backend server was launched locally using `npm run dev` from `backend`, and the API routes were tested against `http://localhost:3000`.

The local `backend/.env.local` file was updated to include the correct Next.js environment variable names for Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Results

| Endpoint | Method | Result | Response |
| --- | --- | --- | --- |
| `/api/languages` | GET | Passed | `200` - JSON array of languages |
| `/api/recordings` | GET | Passed | `200` - `data: []` |
| `/api/tags` | GET | Passed | `200` - `data: []` |

## Observations

- The API route handlers in `backend/src/app/api` are valid and match the frontend client wrappers in `frontend/src/lib/api`.
- All tested endpoints are implemented with Supabase access and depend on environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- The local backend server was started successfully and port `3000` was listening.
- After correcting the backend env variable names, the previously failing requests now return `200`.

## Root cause

The initial failure was caused by the backend environment file using frontend-style variables (`VITE_SUPABASE_*`) rather than the Next.js backend variables required by `backend/src/lib/supabase.ts`.

## Recommendations

1. Verify the correct Supabase project URL and API key pair.
2. Ensure the backend uses a valid environment file such as `backend/.env.local` with the proper values.
3. After fixing credentials, rerun the following requests in Postman or another HTTP client:
   - `GET /api/languages`
   - `GET /api/recordings`
   - `GET /api/tags`
   - `POST /api/languages`
   - `POST /api/recordings`
   - `POST /api/tags`
   - `GET /api/recordings/:id/transcripts`
   - `POST /api/recordings/:id/transcripts`

## Postman collection

A Postman collection has been generated at `reports/api-postman-collection.json` for convenient replay of the API endpoints.
