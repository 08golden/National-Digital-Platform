import { supabasePublic, createUserClient } from '../../../lib/supabase'
import { requireContributor } from '../../../lib/auth'


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const status = searchParams.get('status')
  const language = searchParams.get('language')

  let query = supabasePublic
    .from('recordings')
    .select('*')
    .order('created_at', { ascending: false })

 
  if (status) {
    query = query.eq('status', status)
  } else {
    query = query.eq('status', 'published')
  }

  if (language) {
    query = query.eq('language_id', language)
  }

  const { data, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data })
}


export async function POST(request: Request) {
  const auth = await requireContributor(request)

  if (auth.error || !auth.user || !auth.token) {
    const status = auth.error === 'Approved contributor access required' ? 403 : 401
    return Response.json({ error: auth.error }, { status })
  }

  const supabase = createUserClient(auth.token)

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
        uploaded_by: auth.user.id, 
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