
import { supabase } from '../../../lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('languages')
    .select('*')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { iso_code, name, local_name } = body

    // basic validation
    if (!iso_code || !name) {
      return Response.json(
        { error: 'iso_code and name are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('languages')
      .insert({
        iso_code,
        name,
        local_name,
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
  } catch (err) {
    return Response.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}