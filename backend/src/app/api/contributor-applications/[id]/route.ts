/**
 * Contributor Application (single) API
 *
 * GET /api/contributor-applications/[id]
 *   [id] = the applicant's user id.
 *   Accessible to admins or the applicant themselves.
 */

import { supabaseAdmin } from '../../../../lib/supabase'
import { requireUser, requireAdmin } from '../../../../lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const adminAuth = await requireAdmin(request)
  const isAdmin = !adminAuth.error

  const userAuth = isAdmin ? adminAuth : await requireUser(request)
  if (userAuth.error || !userAuth.user) {
    return Response.json({ error: userAuth.error ?? 'Unauthorized' }, { status: 401 })
  }

  if (!isAdmin && userAuth.user.id !== id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, username, display_name, email, role, metadata, created_at')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  const application =
    (data.metadata as Record<string, unknown>)?.contributor_application ?? null

  if (!application) {
    return Response.json({ error: 'No contributor application found' }, { status: 404 })
  }

  return Response.json({
    user_id: data.id,
    username: data.username,
    display_name: data.display_name,
    email: data.email,
    role: data.role,
    application,
  })
}
