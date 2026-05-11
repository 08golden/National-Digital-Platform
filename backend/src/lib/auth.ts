import { createUserClient, supabaseAdmin } from './supabase'

export function getBearerToken(request: Request) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  return authHeader.replace('Bearer ', '')
}

export async function requireUser(request: Request) {
  const token = getBearerToken(request)

  if (!token) {
    return { user: null, token: null, error: 'Missing authorization token' }
  }

  const supabase = createUserClient(token)

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return { user: null, token: null, error: 'Invalid or expired token' }
  }

  return { user: data.user, token, error: null }
}
export async function requireAdmin(request: Request) {
  const { user, error } = await requireUser(request)

  if (error || !user) {
    return { user: null, error }
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return { user: null, error: 'Admin access required' }
  }

  return { user, error: null }
}