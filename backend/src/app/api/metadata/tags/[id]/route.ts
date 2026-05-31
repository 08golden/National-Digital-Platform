import { supabasePublic, supabaseAdmin, createUserClient } from '../../../../../lib/supabase'
import { getBearerToken, requireAdmin } from '../../../../../lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const token = getBearerToken(request)
  const client = token ? createUserClient(token) : supabasePublic

  const { data, error } = await client
    .from('tags')
    .select('id, metadata')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return Response.json({ error: 'Tag not found' }, { status: 404 })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({
    table: 'tags',
    id: data.id,
    metadata: data.metadata ?? {},
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Check admin access (tags are admin-only)
  const adminAuth = await requireAdmin(request)
  if (adminAuth.error) {
    return Response.json({ error: adminAuth.error }, { status: 401 })
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

  // Get current metadata
  const { data: current, error: readErr } = await supabaseAdmin
    .from('tags')
    .select('id, metadata')
    .eq('id', id)
    .single()

  if (readErr || !current) {
    if (readErr?.code === 'PGRST116') {
      return Response.json({ error: 'Tag not found' }, { status: 404 })
    }
    return Response.json({ error: readErr?.message ?? 'Tag not found' }, { status: 500 })
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
    .from('tags')
    .update({ metadata: merged, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, metadata')
    .single()

  if (writeErr) {
    return Response.json({ error: writeErr.message }, { status: 500 })
  }

  return Response.json({
    message: 'Metadata updated on tags',
    table: 'tags',
    id: updated.id,
    metadata: updated.metadata,
  })
}