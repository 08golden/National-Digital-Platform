/**
 * Transcripts API — sub-collection of a recording
 *
 * GET    /api/recordings/[id]/transcripts                     — public (approved) or own drafts
 * POST   /api/recordings/[id]/transcripts                     — authenticated user (unchanged)
 * PATCH  /api/recordings/[id]/transcripts?transcriptId=<uuid> — owner (draft) or admin
 * DELETE /api/recordings/[id]/transcripts?transcriptId=<uuid> — owner (draft) or admin
 *
 * For metadata-only updates use PATCH /api/metadata/transcripts/[transcriptId].
 */

import { supabasePublic, supabaseAdmin, createUserClient } from '../../../../../lib/supabase'
import { requireUser, requireAdmin, requireContributor } from '../../../../../lib/auth'

const VALID_STATUSES = ['draft', 'pending_review', 'approved', 'rejected'] as const

// ─── GET ─────────────────────────────────────────────────────────────────────
// Public: approved transcripts only.
// Authenticated: approved + caller's own drafts for this recording.

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const userAuth = await requireUser(request)
  const isAuthed = !userAuth.error && !!userAuth.user && !!userAuth.token

  if (isAuthed) {
    const supabase = createUserClient(userAuth.token!)
    const { data, error } = await supabase
      .from('transcripts')
      .select('*')
      .eq('recording_id', id)
      .or(`status.eq.approved,created_by.eq.${userAuth.user!.id}`)
      .order('created_at', { ascending: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ data })
  }

  // Unauthenticated — approved only (original behaviour)
  const { data, error } = await supabasePublic
    .from('transcripts')
    .select('*')
    .eq('recording_id', id)
    .eq('status', 'approved')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

// ─── POST ────────────────────────────────────────────────────────────────────
// Unchanged from original.

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const auth = await requireContributor(request)
  if (auth.error || !auth.user || !auth.token) {
    const status = auth.error === 'Approved contributor access required' ? 403 : 401
    return Response.json({ error: auth.error }, { status })
  }

  const supabase = createUserClient(auth.token)

  try {
    const body = await request.json()
    const { content, language_id, is_translation, source_language_id } = body

    if (!content || !language_id) {
      return Response.json(
        { error: 'content and language_id are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('transcripts')
      .insert({
        recording_id: id,
        created_by: auth.user.id,
        content,
        language_id,
        is_translation:     is_translation     ?? false,
        source_language_id: source_language_id ?? null,
        status: 'draft',
        metadata: {},
      })
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })

    return Response.json({ message: 'Transcript submitted successfully', data })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// ─── PATCH ───────────────────────────────────────────────────────────────────
// Query param: ?transcriptId=<uuid>
//
// Owners: can edit content / language_id / is_translation / source_language_id
//         on their own draft transcripts.
// Admins: can additionally update status and metadata.
//
// metadata is merged — existing keys not in the body are preserved.
// Pass a metadata key with null to remove it.

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recordingId } = await params
  const { searchParams }    = new URL(request.url)
  const transcriptId        = searchParams.get('transcriptId')

  if (!transcriptId) {
    return Response.json({ error: 'transcriptId query param is required' }, { status: 400 })
  }

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

    const { content, language_id, is_translation, source_language_id, status, metadata } = body

    if (!isAdmin) {
      const { data: existing, error: fetchErr } = await supabasePublic
        .from('transcripts')
        .select('created_by, status')
        .eq('id', transcriptId)
        .eq('recording_id', recordingId)
        .single()

      if (fetchErr || !existing) {
        return Response.json({ error: 'Transcript not found' }, { status: 404 })
      }
      if (existing.created_by !== userAuth.user.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (existing.status !== 'draft') {
        return Response.json({ error: 'Only draft transcripts can be edited' }, { status: 422 })
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
        .from('transcripts')
        .select('metadata')
        .eq('id', transcriptId)
        .single()

      if (readErr || !current) {
        return Response.json({ error: 'Transcript not found' }, { status: 404 })
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
    if (content            !== undefined) updates.content            = content
    if (language_id        !== undefined) updates.language_id        = language_id
    if (is_translation     !== undefined) updates.is_translation     = is_translation
    if (source_language_id !== undefined) updates.source_language_id = source_language_id
    if (isAdmin && status  !== undefined) updates.status             = status
    if (resolvedMetadata   !== undefined) updates.metadata           = resolvedMetadata
    updates.updated_at = new Date().toISOString()

    const client = isAdmin ? supabaseAdmin : createUserClient(userAuth.token!)
    const { data, error } = await client
      .from('transcripts')
      .update(updates)
      .eq('id', transcriptId)
      .eq('recording_id', recordingId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json({ error: 'Transcript not found' }, { status: 404 })
      }
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ message: 'Transcript updated successfully', data })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
// Query param: ?transcriptId=<uuid>
// Owners: hard-delete their own draft transcripts.
// Admins: hard-delete any transcript.

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recordingId } = await params
  const { searchParams }    = new URL(request.url)
  const transcriptId        = searchParams.get('transcriptId')

  if (!transcriptId) {
    return Response.json({ error: 'transcriptId query param is required' }, { status: 400 })
  }

  const adminAuth = await requireAdmin(request)
  const isAdmin   = !adminAuth.error

  const userAuth = isAdmin ? adminAuth : await requireUser(request)
  if (userAuth.error || !userAuth.user || !userAuth.token) {
    return Response.json({ error: userAuth.error ?? 'Unauthorized' }, { status: 401 })
  }

  if (!isAdmin) {
    const { data: existing, error: fetchErr } = await supabasePublic
      .from('transcripts')
      .select('created_by, status')
      .eq('id', transcriptId)
      .eq('recording_id', recordingId)
      .single()

    if (fetchErr || !existing) {
      return Response.json({ error: 'Transcript not found' }, { status: 404 })
    }
    if (existing.created_by !== userAuth.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (existing.status !== 'draft') {
      return Response.json(
        { error: 'Only draft transcripts can be deleted — contact an admin to remove others' },
        { status: 422 }
      )
    }
  }

  const { error } = await supabaseAdmin
    .from('transcripts')
    .delete()
    .eq('id', transcriptId)
    .eq('recording_id', recordingId)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ message: 'Transcript deleted successfully' })
}