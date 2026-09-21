import { supabasePublic, createUserClient, supabaseAdmin } from '../../../lib/supabase'
import { requireContributor } from '../../../lib/auth'


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const status = searchParams.get('status')
  const language = searchParams.get('language')

  let query = supabasePublic
    .from('recordings')
    .select('*')
    .order('created_at', { ascending: false })

 
  if (status) {
    query = query.eq('status', status)
  } else {
    query = query.eq('status', 'published')
  }

  if (language) {
    query = query.eq('language_id', language)
  }

  const { data, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data })
}


export async function POST(request: Request) {
  // Development bypass: allow test scripts to POST with a special header
  // WARNING: only enabled when NODE_ENV !== 'production'
  // Dev bypass requires explicit opt-in via ALLOW_E2E in addition to header and non-production
  const bypass = request.headers.get('x-dev-bypass') === '1' && process.env.NODE_ENV !== 'production' && process.env.ALLOW_E2E === '1'

  type AuthState = Awaited<ReturnType<typeof requireContributor>>
  let auth: AuthState | null = null
  if (!bypass) {
    auth = await requireContributor(request)

    if (auth.error || !auth.user || !auth.token) {
      const status = auth.error === 'Approved contributor access required' ? 403 : 401
      return Response.json({ error: auth.error }, { status })
    }
  }

  // At this point, when !bypass, auth is guaranteed non-null with a valid
  // token (checked above) — TS can't infer that correlation across the two
  // conditionals on its own, hence the assertion.
  const supabase = bypass ? supabaseAdmin : createUserClient(auth!.token)

  try {
    const body = (await request.json()) as Partial<{
      title: string
      description: string | null
      language_id: string | null
      storage_path: string | null
    }>
    const { title, description, language_id, storage_path } = body

    if (!title || (!language_id && !bypass)) {
      return Response.json(
        { error: 'title and language_id are required' },
        { status: 400 }
      )
    }

    // If a storage path was provided, verify the object exists in the recordings bucket
    if (storage_path) {
      try {
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
          .from('recordings')
          .download(storage_path)

        if (downloadError) {
          return Response.json({ error: 'Uploaded file not found in storage' }, { status: 400 })
        }
        // We don't need the file bytes here; presence is enough.
        void fileData
      } catch (e) {
        return Response.json({ error: 'Error checking storage for file' }, { status: 500 })
      }
    }

    // Determine uploaded_by: prefer authenticated user, else pick any existing user when bypassing
    let uploadedBy = auth?.user?.id ?? null
    if (bypass && !uploadedBy) {
      try {
        const { data: someUser } = await supabaseAdmin.from('users').select('id').limit(1).single()
        uploadedBy = someUser?.id ?? null
      } catch (e) {
        uploadedBy = null
      }
    }

    // If bypass and no language_id provided, pick any existing language id to satisfy DB constraints
    let resolvedLanguageId = language_id
    if (bypass && !resolvedLanguageId) {
      try {
        const { data: someLang } = await supabaseAdmin.from('languages').select('id').limit(1).single()
        resolvedLanguageId = someLang?.id ?? null
      } catch (e) {
        resolvedLanguageId = null
      }
    }

    const insertPayload: Record<string, string | null> = {
      title: title ?? null,
      description: description ?? null,
      language_id: resolvedLanguageId ?? null,
      uploaded_by: uploadedBy ?? null,
      status: 'pending',
    }

    if (storage_path) insertPayload.storage_path = storage_path

    const { data, error } = await supabase
      .from('recordings')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({
      message: 'Recording submitted for review',
      data,
    })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
}