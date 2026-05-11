import { supabasePublic, createUserClient } from '../../../../../lib/supabase'
import { requireUser } from '../../../../../lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabasePublic
    .from('transcripts')
    .select('*')
    .eq('recording_id', id)
    .eq('status', 'approved')

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

  const auth = await requireUser(request)

  if (auth.error || !auth.user || !auth.token) {
    return Response.json({ error: auth.error }, { status: 401 })
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
        is_translation: is_translation ?? false,
        source_language_id: source_language_id ?? null,
        status: 'draft',
        metadata: {},
      })
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({
      message: 'Transcript submitted successfully',
      data,
    })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
}