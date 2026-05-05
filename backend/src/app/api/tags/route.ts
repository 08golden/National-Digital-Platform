import { supabase } from '../../../lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const category = searchParams.get('category')
  const search = searchParams.get('search')

  let query = supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true })

  if (category) {
    query = query.eq('category', category)
  }

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, slug, category, description } = body

    if (!name || !slug) {
      return Response.json(
        { error: 'name and slug are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('tags')
      .insert({
        name,
        slug,
        category,
        description,
      })
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({
      message: 'Tag created successfully',
      data,
    })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
}