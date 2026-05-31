import { supabasePublic, supabaseAdmin } from '../../../lib/supabase'

export async function GET() {
  const { data, error } = await supabasePublic
    .from('languages')
    .select('*')
    .eq('is_active', true)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { iso_code, name, local_name, family, region, endangerment_level, metadata } = body

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
        metadata,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return Response.json(
          { error: 'A language with that iso_code already exists' },
          { status: 409 }
        )
      }
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ data }, { status: 201 })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
