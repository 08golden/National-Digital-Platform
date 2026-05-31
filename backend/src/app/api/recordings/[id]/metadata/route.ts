import { supabasePublic, supabaseAdmin, createUserClient } from '../../../../../lib/supabase'
import { getBearerToken, requireAdmin, requireUser } from '../../../../../lib/auth'

// Core field validators (reused from main metadata API)
const CORE_FIELD_VALIDATORS: Record<string, (v: unknown) => string | null> = {
  visibility: (v) =>
    ['public', 'private', 'restricted'].includes(v as string)
      ? null
      : 'visibility must be "public", "private", or "restricted"',
  content_type: (v) =>
    typeof v === 'string' && v.length > 0
      ? null
      : 'content_type must be a non-empty string',
  upload_date: (v) =>
    typeof v === 'string' && !isNaN(Date.parse(v as string))
      ? null
      : 'upload_date must be an ISO date string',
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const token = getBearerToken(request)
  const client = token ? createUserClient(token) : supabasePublic

  const { data, error } = await client
    .from('recordings')
    .select('id, metadata')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return Response.json({ error: 'Recording not found' }, { status: 404 })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({
    recording_id: data.id,
    metadata: data.metadata ?? {},
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const adminAuth = await requireAdmin(request)
  const isAdmin = !adminAuth.error

  const userAuth = isAdmin ? adminAuth : await requireUser(request)
  if (userAuth.error || !userAuth.user || !userAuth.token) {
    return Response.json({ error: userAuth.error ?? 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json({ error: 'Body must be a JSON object of metadata fields' }, { status: 400 })
  }

  if (Object.keys(body).length === 0) {
    return Response.json({ error: 'No metadata fields provided' }, { status: 400 })
  }

  // Validate core fields if present
  for (const [field, validator] of Object.entries(CORE_FIELD_VALIDATORS)) {
    if (field in body && body[field] !== null) {
      const err = validator(body[field])
      if (err) return Response.json({ error: err }, { status: 400 })
    }
  }

  // Check ownership for non-admins
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
    // Only allow metadata edits on non-published recordings for non-admins
    if (existing.status === 'published') {
      return Response.json(
        { error: 'Cannot edit metadata on a published recording' },
        { status: 422 }
      )
    }
  }

  // Get current metadata
  const { data: current, error: readErr } = await supabaseAdmin
    .from('recordings')
    .select('id, metadata')
    .eq('id', id)
    .single()

  if (readErr || !current) {
    if (readErr?.code === 'PGRST116') {
      return Response.json({ error: 'Recording not found' }, { status: 404 })
    }
    return Response.json({ error: readErr?.message ?? 'Recording not found' }, { status: 500 })
  }

  // Merge metadata
  const existing = (current.metadata ?? {}) as Record<string, unknown>
  const merged: Record<string, unknown> = { ...existing }

  for (const [key, value] of Object.entries(body)) {
    if (value === null) {
      delete merged[key]
    } else {
      merged[key] = value
    }
  }

  // Update
  const { data: updated, error: writeErr } = await supabaseAdmin
    .from('recordings')
    .update({ metadata: merged, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, metadata')
    .single()

  if (writeErr) {
    return Response.json({ error: writeErr.message }, { status: 500 })
  }

  return Response.json({
    message: 'Metadata updated successfully',
    recording_id: updated.id,
    metadata: updated.metadata,
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const adminAuth = await requireAdmin(request)
  const isAdmin = !adminAuth.error

  const userAuth = isAdmin ? adminAuth : await requireUser(request)
  if (userAuth.error || !userAuth.user || !userAuth.token) {
    return Response.json({ error: userAuth.error ?? 'Unauthorized' }, { status: 401 })
  }

  // Check ownership for non-admins
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
        { error: 'Cannot clear metadata on a published recording' },
        { status: 422 }
      )
    }
  }

  // Clear all metadata (set to empty object)
  const { data: updated, error: writeErr } = await supabaseAdmin
    .from('recordings')
    .update({ metadata: {}, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, metadata')
    .single()

  if (writeErr) {
    if (writeErr.code === 'PGRST116') {
      return Response.json({ error: 'Recording not found' }, { status: 404 })
    }
    return Response.json({ error: writeErr.message }, { status: 500 })
  }

  return Response.json({
    message: 'All metadata cleared successfully',
    recording_id: updated.id,
    metadata: updated.metadata,
  })
}