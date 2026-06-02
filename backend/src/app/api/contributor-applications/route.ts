/**
 * Contributor Applications API
 *
 * Application state is stored on the user's profile under
 * `users.metadata.contributor_application`:
 *
 *   {
 *     "status": "pending" | "approved" | "rejected",
 *     "motivation": "...",
 *     "submitted_at": "<iso>",
 *     "reviewed_by": "<admin-user-id> | null",
 *     "reviewed_at": "<iso> | null",
 *     "review_note": "<string> | null"
 *   }
 *
 * POST /api/contributor-applications  — authenticated user submits an application
 * GET  /api/contributor-applications  — admin lists applications (?status=pending|approved|rejected)
 */

import { supabaseAdmin } from '../../../lib/supabase'
import { requireUser, requireAdmin } from '../../../lib/auth'

const VALID_STATUSES = ['pending', 'approved', 'rejected'] as const
type ApplicationStatus = (typeof VALID_STATUSES)[number]

type ContributorApplication = {
  status: ApplicationStatus
  motivation: string
  submitted_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
}

type ApplicantRow = {
  id: string
  username: string
  display_name: string | null
  email: string
  role: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export async function POST(request: Request) {
  const auth = await requireUser(request)
  if (auth.error || !auth.user) {
    return Response.json({ error: auth.error }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const motivation = typeof body.motivation === 'string' ? body.motivation.trim() : ''
  if (!motivation) {
    return Response.json({ error: 'motivation is required' }, { status: 400 })
  }

  // Load current profile to check role and existing application state.
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('role, metadata')
    .eq('id', auth.user.id)
    .single()

  if (profileError || !profile) {
    return Response.json({ error: 'User profile not found' }, { status: 404 })
  }

  if (profile.role === 'contributor' || profile.role === 'admin') {
    return Response.json(
      { error: 'You are already an approved contributor' },
      { status: 409 }
    )
  }

  const metadata = (profile.metadata ?? {}) as Record<string, unknown>
  const existing = metadata.contributor_application as ContributorApplication | undefined

  if (existing && existing.status === 'pending') {
    return Response.json(
      { error: 'You already have a pending application' },
      { status: 409 }
    )
  }

  const application: ContributorApplication = {
    status: 'pending',
    motivation,
    submitted_at: new Date().toISOString(),
    reviewed_by: null,
    reviewed_at: null,
    review_note: null,
  }

  const merged = { ...metadata, contributor_application: application }

  const { error: writeErr } = await supabaseAdmin
    .from('users')
    .update({ metadata: merged, updated_at: new Date().toISOString() })
    .eq('id', auth.user.id)

  if (writeErr) {
    return Response.json({ error: writeErr.message }, { status: 500 })
  }

  return Response.json(
    { message: 'Contributor application submitted', application },
    { status: 201 }
  )
}

export async function GET(request: Request) {
  const adminAuth = await requireAdmin(request)
  if (adminAuth.error) {
    return Response.json({ error: adminAuth.error }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = (searchParams.get('status') ?? 'pending') as ApplicationStatus

  if (!VALID_STATUSES.includes(status)) {
    return Response.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, username, display_name, email, role, metadata, created_at')
    .eq('metadata->contributor_application->>status', status)
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const applications = ((data ?? []) as ApplicantRow[]).map((u) => ({
    user_id: u.id,
    username: u.username,
    display_name: u.display_name,
    email: u.email,
    role: u.role,
    application: u.metadata?.contributor_application ?? null,
  }))

  return Response.json({ data: applications })
}
