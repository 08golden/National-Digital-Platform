import { supabasePublic, supabaseAdmin } from '../../../lib/supabase'
import { requireAdmin } from '../../../lib/auth'

export async function GET() {
  const { data, error } = await supabasePublic
    .from('languages')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data })
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request)

  if (admin.error) {
    return Response.json({ error: admin.error }, { status: 403 })
  }

  try {
    const body = await request.json()

    const {
      iso_code,
      name,
      local_name,
      family,
      region,
      endangerment_level,
      metadata,
    } = body

    if (!iso_code || !name) {
      return Response.json(
        { error: 'iso_code and name are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('languages')
      .insert({
        iso_code,
        name,
        local_name,
        family,
        region,
        endangerment_level,
        metadata: metadata ?? {},
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({
      message: 'Language created successfully',
      data,
    })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
}