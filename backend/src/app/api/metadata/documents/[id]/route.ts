import { supabasePublic, supabaseAdmin, createUserClient } from '../../../../../lib/supabase'
import { getBearerToken, requireAdmin, requireUser } from '../../../../../lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const token = getBearerToken(request)
  const client = token ? createUserClient(token) : supabasePublic

  const { data, error } = await client
    .from('documents')
    .select('id, metadata')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return Response.json({ error: 'Document not found' }, { status: 404 })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({
    table: 'documents',
    id: data.id,
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

  // Documents can be edited by uploader or admin
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

  // Check ownership for non-admins
  if (!isAdmin) {
    const { data: existing, error: fetchErr } = await supabasePublic
      .from('documents')
      .select('uploaded_by')
      .eq('id', id)
      .single()

    if (fetchErr || !existing) {
      return Response.json({ error: 'Document not found' }, { status: 404 })
    }
    if (existing.uploaded_by !== userAuth.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Get current metadata
  const { data: current, error: readErr } = await supabaseAdmin
    .from('documents')
    .select('id, metadata')
    .eq('id', id)
    .single()

  if (readErr || !current) {
    if (readErr?.code === 'PGRST116') {
      return Response.json({ error: 'Document not found' }, { status: 404 })
    }
    return Response.json({ error: readErr?.message ?? 'Document not found' }, { status: 500 })
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
    .from('documents')
    .update({ metadata: merged, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, metadata')
    .single()

  if (writeErr) {
    return Response.json({ error: writeErr.message }, { status: 500 })
  }

  return Response.json({
    message: 'Metadata updated on documents',
    table: 'documents',
    id: updated.id,
    metadata: updated.metadata,
  })
}