import type { User } from '@supabase/supabase-js'
import { createUserClient, supabaseAdmin } from './supabase'

type AuthResult =
  | { user: User; token: string; error: null }
  | { user: null;  token: null;  error: string }

export function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.replace('Bearer ', '')
}

export async function requireUser(request: Request): Promise<AuthResult> {
  const token = getBearerToken(request)

  if (!token) {
    return { user: null, token: null, error: 'Missing authorization token' }
  }

  // Your original: verify via a user-scoped client
  const supabase = createUserClient(token)
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return { user: null, token: null, error: 'Invalid or expired token' }
  }

  return { user: data.user, token, error: null }
}

export async function requireAdmin(request: Request): Promise<AuthResult> {
  const result = await requireUser(request)

  if (result.error || !result.user) {
    return result
  }

  // Your original: check role from the users table, not app_metadata
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', result.user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return { user: null, token: null, error: 'Admin access required' }
  }

  return result
}

export async function requireContributor(request: Request): Promise<AuthResult> {
  const result = await requireUser(request)

  if (result.error || !result.user) {
    return result
  }

  // Only approved contributors (or admins) may upload. Role is the source of
  // truth: an application is "approved" once role has been promoted.
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('role, is_active')
    .eq('id', result.user.id)
    .single()

  if (
    profileError ||
    !profile?.is_active ||
    (profile.role !== 'contributor' && profile.role !== 'admin')
  ) {
    return { user: null, token: null, error: 'Approved contributor access required' }
  }

  return result
}