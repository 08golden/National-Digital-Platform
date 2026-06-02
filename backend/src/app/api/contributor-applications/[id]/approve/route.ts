/**
 * Approve a contributor application — admin only.
 *
 * POST /api/contributor-applications/[id]/approve
 *   [id] = the applicant's user id.
 *
 * Sets the application status to "approved" and promotes the user's role to
 * "contributor", which is what gates uploads (see lib/auth requireContributor).
 */

import { supabaseAdmin } from '../../../../../lib/supabase'
import { requireAdmin } from '../../../../../lib/auth'

type ContributorApplication = {
  status: 'pending' | 'approved' | 'rejected'
  motivation: string
  submitted_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const adminAuth = await requireAdmin(request)
  if (adminAuth.error || !adminAuth.user) {
    return Response.json({ error: adminAuth.error }, { status: 401 })
  }

  let note: string | null = null
  try {
    const body = await request.json()
    if (body && typeof body.review_note === 'string') note = body.review_note
  } catch {
    // Body is optional for approval.
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('role, metadata')
    .eq('id', id)
    .single()

  if (profileError || !profile) {
    if (profileError?.code === 'PGRST116') {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }
    return Response.json({ error: profileError?.message ?? 'User not found' }, { status: 500 })
  }

  const metadata = (profile.metadata ?? {}) as Record<string, unknown>
  const existing = metadata.contributor_application as ContributorApplication | undefined

  if (!existing) {
    return Response.json({ error: 'No contributor application found' }, { status: 404 })
  }

  const application: ContributorApplication = {
    ...existing,
    status: 'approved',
    reviewed_by: adminAuth.user.id,
    reviewed_at: new Date().toISOString(),
    review_note: note,
  }

  const merged = { ...metadata, contributor_application: application }

  const { error: writeErr } = await supabaseAdmin
    .from('users')
    .update({ role: 'contributor', metadata: merged, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (writeErr) {
    return Response.json({ error: writeErr.message }, { status: 500 })
  }

  return Response.json({
    message: 'Application approved — user promoted to contributor',
    user_id: id,
    application,
  })
}
