/**
 * Reject a contributor application — admin only.
 *
 * POST /api/contributor-applications/[id]/reject
 *   [id] = the applicant's user id.
 *   Optional body: { "review_note": "reason for rejection" }
 *
 * Sets the application status to "rejected". The user's role is left unchanged
 * (remains a viewer), so uploads stay blocked.
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
    // Body is optional for rejection.
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('metadata')
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
    status: 'rejected',
    reviewed_by: adminAuth.user.id,
    reviewed_at: new Date().toISOString(),
    review_note: note,
  }

  const merged = { ...metadata, contributor_application: application }

  const { error: writeErr } = await supabaseAdmin
    .from('users')
    .update({ metadata: merged, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (writeErr) {
    return Response.json({ error: writeErr.message }, { status: 500 })
  }

  return Response.json({
    message: 'Application rejected',
    user_id: id,
    application,
  })
}
