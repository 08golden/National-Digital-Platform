import { supabasePublic, createUserClient } from '../../../../lib/supabase'
import { getBearerToken } from '../../../../lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const token = getBearerToken(request)
  const supabaseClient = token ? createUserClient(token) : supabasePublic

  const { data, error } = await supabaseClient
    .from('recordings')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 404 })
  }

  return Response.json({ data })
}