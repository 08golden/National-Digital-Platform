# Backend Integration Guide — Consent & Share Request Features

This document describes the database schema, RLS policies, and API endpoints the
backend team needs to implement to replace the frontend's in-memory mock state with
persistent Supabase-backed data.

---

## 1. Data-Use Consent

### What the frontend stores

Consent is captured during upload as a `DataUseConsent` object and must be persisted
alongside the asset record. The two boolean flags are:

| Field | Type | Meaning |
|---|---|---|
| `allow_sharing` | boolean | Users may submit share requests for this asset |
| `allow_download` | boolean | Users may download the file directly |

When both are `false`, the asset is **platform-view only**.

### Recommended storage location

Add a `data_use_consent` JSONB column to the table that stores the uploaded asset.
Depending on your schema, this is either `recordings` or `content_items`.

```sql
-- Option A: on the recordings table
ALTER TABLE recordings
  ADD COLUMN data_use_consent JSONB NOT NULL DEFAULT '{"allow_sharing": true, "allow_download": true}';

-- Option B: on content_items (preferred if using the universal registry)
ALTER TABLE content_items
  ADD COLUMN data_use_consent JSONB NOT NULL DEFAULT '{"allow_sharing": true, "allow_download": true}';
```

> **Tip:** You can also map `allow_sharing` + `allow_download` to the existing
> `visibility` enum (`public | restricted | private | embargoed`) if you prefer a
> normalised column. The frontend reads `dataUseConsent.allowSharing /
> allowDownload` from the `ContentItem` object — just keep those two keys available.

### POST /api/recordings (or equivalent upload endpoint)

Extend the request body to accept consent flags:

```json
{
  "title": "string",
  "language_id": "uuid",
  "description": "string",
  "data_use_consent": {
    "allow_sharing": true,
    "allow_download": false
  }
}
```

Persist `data_use_consent` on insert. Return the full row (including consent) in the
response so the frontend can update its local state.

### GET /api/recordings (and single-item fetches)

Include `data_use_consent` in the response payload so the `ContentItem` object the
frontend receives has the consent flags.

---

## 2. Share Requests

### New table: `share_requests`

```sql
CREATE TABLE share_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id       UUID NOT NULL,          -- FK to recordings.id or content_items.id
  content_title    TEXT NOT NULL,          -- denormalised for display convenience
  requested_by     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_by_name TEXT NOT NULL,         -- denormalised display name at request time
  reason           TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
  share_token      UUID UNIQUE,            -- set on approval; build URL: /share/{share_token}
  reviewed_by      UUID REFERENCES users(id),
  reviewed_at      TIMESTAMPTZ,
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for the most common query pattern (fetch by requester + content)
CREATE INDEX share_requests_requester_content
  ON share_requests (requested_by, content_id);

-- Index for admin list view (pending first)
CREATE INDEX share_requests_status_date
  ON share_requests (status, requested_at DESC);
```

### Row-Level Security

```sql
ALTER TABLE share_requests ENABLE ROW LEVEL SECURITY;

-- Requesters can read their own requests
CREATE POLICY "own requests are visible"
  ON share_requests FOR SELECT
  USING (requested_by = auth.uid());

-- Admins can read all requests
CREATE POLICY "admins read all"
  ON share_requests FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Authenticated users can create requests
CREATE POLICY "authenticated users can create"
  ON share_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND requested_by = auth.uid());

-- Only admins can update (approve/reject)
CREATE POLICY "admins can update"
  ON share_requests FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### API Endpoints

#### `GET /api/share-requests`

- **Admin**: returns all requests, ordered by `requested_at DESC`.
- **Non-admin**: returns only the caller's own requests.

Response:
```json
[
  {
    "id": "uuid",
    "content_id": "uuid",
    "content_title": "string",
    "requested_by": "uuid",
    "requested_by_name": "string",
    "reason": "string",
    "status": "pending | approved | rejected",
    "share_token": "uuid | null",
    "reviewed_by": "uuid | null",
    "reviewed_at": "ISO timestamp | null",
    "requested_at": "ISO timestamp"
  }
]
```

#### `POST /api/share-requests`

Auth: authenticated users only.

Request body:
```json
{
  "content_id": "uuid",
  "content_title": "string",
  "reason": "string"
}
```

- Reads `display_name` / `username` from the session user to set `requested_by_name`.
- Inserts with `status = 'pending'`.
- Returns the created row.

#### `PATCH /api/share-requests/:id/approve`

Auth: admin only.

- Sets `status = 'approved'`.
- Generates a new `share_token = gen_random_uuid()`.
- Sets `reviewed_by = auth.uid()`, `reviewed_at = now()`.
- Returns the updated row.

#### `PATCH /api/share-requests/:id/reject`

Auth: admin only.

- Sets `status = 'rejected'`.
- Sets `reviewed_by = auth.uid()`, `reviewed_at = now()`.
- Returns the updated row.

---

## 3. Share Link Resolution Endpoint

When a recipient follows a `/share/{token}` URL, the backend must resolve the token
to an asset. You need either:

**Option A — New API endpoint:**
```
GET /api/share-links/:token
```
Returns the `content_id` (and optionally a pre-signed file URL) if the token exists
and belongs to an approved request. The frontend then navigates to the content detail
view with that `content_id`.

**Option B — Supabase edge function:**
A lightweight function that looks up `share_requests` by `share_token`, validates
`status = 'approved'`, and returns the content metadata.

> **Security note:** Tokens are single-use UUIDs. Consider adding an `expires_at`
> column and rejecting expired tokens if your use case requires it.

---

## 4. Connecting the Frontend Mock to Real Supabase

The frontend mock is isolated in one file:
`frontend/src/lib/api/shareRequests.ts`

Each function has a `// TODO (backend):` comment showing the exact Supabase query to
swap in. Example replacement for `createShareRequest`:

```ts
// Before (mock):
export async function createShareRequest(...): Promise<ShareRequest> {
  const request: ShareRequest = { id: crypto.randomUUID(), ... };
  _store.push(request);
  return request;
}

// After (Supabase):
export async function createShareRequest(
  contentId: string, contentTitle: string,
  requestedBy: string, requestedByName: string,
  reason: string
): Promise<ShareRequest> {
  const { data, error } = await supabase
    .from('share_requests')
    .insert({
      content_id: contentId,
      content_title: contentTitle,
      requested_by: requestedBy,
      requested_by_name: requestedByName,
      reason,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);   // camelCase adapter
}
```

A `mapRow` helper is needed to convert Supabase's `snake_case` columns to the
frontend's `camelCase` `ShareRequest` interface.

---

## 5. Consent — Connecting the Upload Form

The frontend `UploadModal` captures consent in state but the current `POST
/api/recordings` call is not yet implemented. When the upload endpoint is wired up,
include the consent flags in the request body as shown in section 1.

The `ContentItem` objects returned from the API should include:

```json
{
  "dataUseConsent": {
    "allowSharing": true,
    "allowDownload": false
  }
}
```

(camelCase to match the TypeScript `DataUseConsent` interface in `src/types.ts`)

---

## 6. Summary Checklist

- [ ] Add `data_use_consent` JSONB column to `recordings` or `content_items`
- [ ] Update POST upload endpoint to persist consent flags
- [ ] Include `data_use_consent` in GET responses for content
- [ ] Create `share_requests` table with schema above
- [ ] Apply RLS policies to `share_requests`
- [ ] Implement `GET /api/share-requests`
- [ ] Implement `POST /api/share-requests`
- [ ] Implement `PATCH /api/share-requests/:id/approve`
- [ ] Implement `PATCH /api/share-requests/:id/reject`
- [ ] Implement share link resolution endpoint (`GET /api/share-links/:token`)
- [ ] Swap mock functions in `frontend/src/lib/api/shareRequests.ts` with real Supabase queries
