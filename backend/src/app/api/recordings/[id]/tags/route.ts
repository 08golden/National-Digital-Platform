import { supabase } from '../../../../../lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabase
    .from('recording_tags')
    .select(`
      tag_id,
      tags ( id, name, slug, category )
    `)
    .eq('recording_id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { tag_id } = body

    if (!tag_id) {
      return Response.json(
        { error: 'tag_id is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('recording_tags')
      .insert({
        recording_id: id,
        tag_id,
      })
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({
      message: 'Tag applied to recording',
      data,
    })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
}