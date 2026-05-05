import { supabase } from '../../../lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('status', 'published')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, language_id } = body

    if (!title || !language_id) {
      return Response.json(
        { error: 'title and language_id are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('recordings')
      .insert({
        title,
        description,
        language_id,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({
      message: 'Recording submitted for review',
      data,
    })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
}