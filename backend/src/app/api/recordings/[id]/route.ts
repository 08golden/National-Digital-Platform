/**
 * Recordings API — single recording
 *
 * GET    /api/recordings/[id]  — token-aware, RLS handles visibility (existing)
 * PATCH  /api/recordings/[id]  — owner or admin
 * DELETE /api/recordings/[id]  — owner (pending only) or admin; soft-delete
 *
 * For metadata-only updates use PATCH /api/metadata/recordings/[id].
 */

import { supabasePublic, supabaseAdmin, createUserClient } from '../../../../lib/supabase'
import { getBearerToken, requireAdmin, requireUser } from '../../../../lib/auth'

const VALID_STATUSES = ['pending', 'published', 'rejected', 'archived'] as const

// ─── GET ─────────────────────────────────────────────────────────────────────
// Unchanged from original — token-aware via RLS.

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const token = getBearerToken(request)
  const supabaseClient = token ? createUserClient(token) : supabasePublic

  const { data, error } = await supabaseClient
    .from('recordings')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 404 })
  }

  return Response.json({ data })
}

// ─── PATCH ───────────────────────────────────────────────────────────────────
// Owners can update title / description / language_id on their own pending recordings.
// Admins can additionally update status and metadata.
// metadata is merged — existing keys not in the body are preserved.
// Pass a metadata key with null to remove it.
//
// Body (all optional):
//   title        string
//   description  string
//   language_id  string
//   status       string  — admin only: pending | published | rejected | archived
//   metadata     object  — merged; admin or owner
//     Core keys: title, description, language, contributor_id,
//                region, content_type, visibility, upload_date

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const adminAuth = await requireAdmin(request)
  const isAdmin   = !adminAuth.error

  const userAuth = isAdmin ? adminAuth : await requireUser(request)
  if (userAuth.error || !userAuth.user || !userAuth.token) {
    return Response.json({ error: userAuth.error ?? 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    if (Object.keys(body).length === 0) {
      return Response.json({ error: 'No fields provided to update' }, { status: 400 })
    }

    const { title, description, language_id, status, metadata } = body

    // Non-admins: must own the recording and it must be pending
    if (!isAdmin) {
      const { data: existing, error: fetchErr } = await supabasePublic
        .from('recordings')
        .select('uploaded_by, status')
        .eq('id', id)
        .single()

      if (fetchErr || !existing) {
        return Response.json({ error: 'Recording not found' }, { status: 404 })
      }
      if (existing.uploaded_by !== userAuth.user.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (['published', 'archived'].includes(existing.status)) {
        return Response.json(
          { error: 'Cannot edit a recording that is already published or archived' },
          { status: 422 }
        )
      }
      if (status !== undefined) {
        return Response.json({ error: 'Only admins may update status' }, { status: 403 })
      }
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return Response.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Merge metadata if provided
    let resolvedMetadata: Record<string, unknown> | undefined
    if (metadata !== undefined) {
      const { data: current, error: readErr } = await supabaseAdmin
        .from('recordings')
        .select('metadata')
        .eq('id', id)
        .single()

      if (readErr || !current) {
        return Response.json({ error: 'Recording not found' }, { status: 404 })
      }

      const existing = (current.metadata ?? {}) as Record<string, unknown>
      resolvedMetadata = { ...existing }
      for (const [key, value] of Object.entries(metadata as Record<string, unknown>)) {
        if (value === null) {
          delete resolvedMetadata[key]
        } else {
          resolvedMetadata[key] = value
        }
      }
    }

    const updates: Record<string, unknown> = {}
    if (title              !== undefined) updates.title       = title
    if (description        !== undefined) updates.description = description
    if (language_id        !== undefined) updates.language_id = language_id
    if (status             !== undefined) updates.status      = status
    if (resolvedMetadata   !== undefined) updates.metadata    = resolvedMetadata
    updates.updated_at = new Date().toISOString()

    const client = isAdmin ? supabaseAdmin : createUserClient(userAuth.token!)
    const { data, error } = await client
      .from('recordings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json({ error: 'Recording not found' }, { status: 404 })
      }
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ message: 'Recording updated successfully', data })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
// Soft-delete: status = 'archived'.
// Owners can archive their own pending recordings.
// Admins can archive any recording.

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const adminAuth = await requireAdmin(request)
  const isAdmin   = !adminAuth.error

  const userAuth = isAdmin ? adminAuth : await requireUser(request)
  if (userAuth.error || !userAuth.user || !userAuth.token) {
    return Response.json({ error: userAuth.error ?? 'Unauthorized' }, { status: 401 })
  }

  if (!isAdmin) {
    const { data: existing, error: fetchErr } = await supabasePublic
      .from('recordings')
      .select('uploaded_by, status')
      .eq('id', id)
      .single()

    if (fetchErr || !existing) {
      return Response.json({ error: 'Recording not found' }, { status: 404 })
    }
    if (existing.uploaded_by !== userAuth.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (existing.status === 'published') {
      return Response.json(
        { error: 'Cannot delete a published recording — contact an admin' },
        { status: 422 }
      )
    }
  }

  const { data, error } = await supabaseAdmin
    .from('recordings')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, title, status')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return Response.json({ error: 'Recording not found' }, { status: 404 })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ message: 'Recording archived successfully', data })
}