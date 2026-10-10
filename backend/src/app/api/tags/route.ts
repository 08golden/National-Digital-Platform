import { supabasePublic, supabaseAdmin } from '../../../lib/supabase'
import { requireAdmin } from '../../../lib/auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')

  let query = supabasePublic
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
    // These endpoints write with the service-role key, which bypasses
    // row-level security — so the check has to happen here. Without it,
    // anyone who knew the backend URL could create entries (this is how a
    // stray "Test" language ended up in the live list).
    const adminAuth = await requireAdmin(request)
    if (adminAuth.error) {
      return Response.json(
        { error: adminAuth.error },
        { status: adminAuth.error === 'Admin access required' ? 403 : 401 }
      )
    }

    const body = await request.json()
    const { name, slug, category, description } = body

    if (!name || !slug) {
      return Response.json(
        { error: 'name and slug are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('tags')
      .insert({
        name,
        slug,
        category,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return Response.json(
          { error: 'A tag with that slug already exists' },
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
