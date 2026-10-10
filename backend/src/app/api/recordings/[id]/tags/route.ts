import { supabasePublic, createUserClient, supabaseAdmin } from '../../../../../lib/supabase'
import { requireUser, requireAdmin } from '../../../../../lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabasePublic
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
    const { name, slug, category, description, metadata } = body

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
        metadata: metadata || {}, 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ message: 'Tag applied to recording', data })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
}