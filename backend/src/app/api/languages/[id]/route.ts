import { supabaseAdmin } from '../../../../lib/supabase'
import { requireAdmin } from '../../../../lib/auth'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('languages')
    .select('*')
    .or(`id.eq.${id},iso_code.eq.${id}`)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return Response.json({ error: 'Language not found' }, { status: 404 })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = await requireAdmin(request)

  if (admin.error) {
    return Response.json({ error: admin.error }, { status: 403 })
  }

  try {
    const body = await request.json()

    if (Object.keys(body).length === 0) {
      return Response.json({ error: 'No fields provided to update' }, { status: 400 })
    }

    const {
      iso_code,
      name,
      local_name,
      family,
      region,
      endangerment_level,
      is_active,
      metadata,
    } = body

    let resolvedMetadata: Record<string, unknown> | undefined
    if (metadata !== undefined) {
      const { data: current, error: readErr } = await supabaseAdmin
        .from('languages')
        .select('metadata')
        .eq('id', id)
        .single()

      if (readErr || !current) {
        return Response.json({ error: 'Language not found' }, { status: 404 })
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
    if (iso_code !== undefined) updates.iso_code = iso_code
    if (name !== undefined) updates.name = name
    if (local_name !== undefined) updates.local_name = local_name
    if (family !== undefined) updates.family = family
    if (region !== undefined) updates.region = region
    if (endangerment_level !== undefined) updates.endangerment_level = endangerment_level
    if (is_active !== undefined) updates.is_active = is_active
    if (resolvedMetadata !== undefined) updates.metadata = resolvedMetadata
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('languages')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json({ error: 'Language not found' }, { status: 404 })
      }
      if (error.code === '23505') {
        return Response.json(
          { error: 'A language with that iso_code already exists' },
          { status: 409 }
        )
      }
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ message: 'Language updated successfully', data })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = await requireAdmin(request)

  if (admin.error) {
    return Response.json({ error: admin.error }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('languages')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, iso_code, name')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return Response.json({ error: 'Language not found' }, { status: 404 })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ message: 'Language deactivated successfully', data })
}
