import { supabasePublic, supabaseAdmin, createUserClient } from '../../../../../lib/supabase'
import { requireAdmin, requireUser, getBearerToken } from '../../../../../lib/auth'
 

const SUPPORTED_TABLES = [
  'recordings',
  'transcripts',
  'languages',
  'sources',
  'contributors',
  'collections',
  'documents',
] as const
 
type SupportedTable = (typeof SUPPORTED_TABLES)[number]
 

const CORE_FIELD_VALIDATORS: Record<string, (v: unknown) => string | null> = {
  visibility: (v) =>
    ['public', 'private', 'restricted'].includes(v as string)
      ? null
      : 'visibility must be "public", "private", or "restricted"',
  content_type: (v) =>
    typeof v === 'string' && v.length > 0
      ? null
      : 'content_type must be a non-empty string',
  upload_date: (v) =>
    typeof v === 'string' && !isNaN(Date.parse(v as string))
      ? null
      : 'upload_date must be an ISO date string',
}
 
function isSupportedTable(t: string): t is SupportedTable {
  return (SUPPORTED_TABLES as readonly string[]).includes(t)
}
 

 
export async function GET(
  request: Request,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  const { table, id } = await params
 
  if (!isSupportedTable(table)) {
    return Response.json(
      { error: `Unsupported table "${table}". Supported: ${SUPPORTED_TABLES.join(', ')}` },
      { status: 400 }
    )
  }
 
  const token = getBearerToken(request)
  const client = token ? createUserClient(token) : supabasePublic
 
  const { data, error } = await client
    .from(table)
    .select('id, metadata')
    .eq('id', id)
    .single()
 
  if (error) {
    if (error.code === 'PGRST116') {
      return Response.json({ error: `${table} record not found` }, { status: 404 })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }
 
  return Response.json({
    table,
    id: data.id,
    metadata: data.metadata ?? {},
  })
}
 

 
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  const { table, id } = await params
 
  if (!isSupportedTable(table)) {
    return Response.json(
      { error: `Unsupported table "${table}". Supported: ${SUPPORTED_TABLES.join(', ')}` },
      { status: 400 }
    )
  }
 

  const adminAuth = await requireAdmin(request)
  const isAdmin   = !adminAuth.error
 
  const OWNER_EDITABLE: SupportedTable[] = ['recordings', 'transcripts']
  const needsUserAuth = !isAdmin && OWNER_EDITABLE.includes(table)
 
  const userAuth = needsUserAuth ? await requireUser(request) : adminAuth
  if (!isAdmin && (userAuth.error || !userAuth.user)) {
    return Response.json({ error: userAuth.error ?? 'Unauthorized' }, { status: 401 })
  }
 
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
 
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json({ error: 'Body must be a JSON object of metadata fields' }, { status: 400 })
  }
 
  if (Object.keys(body).length === 0) {
    return Response.json({ error: 'No metadata fields provided' }, { status: 400 })
  }
 
  
  for (const [field, validator] of Object.entries(CORE_FIELD_VALIDATORS)) {
    if (field in body && body[field] !== null) {
      const err = validator(body[field])
      if (err) return Response.json({ error: err }, { status: 400 })
    }
  }
 
  
  if (needsUserAuth && userAuth.user) {
    const ownerColumn: Record<string, string> = {
      recordings:  'uploaded_by',
      transcripts: 'created_by',
    }
    const col = ownerColumn[table]
 
    const { data: existing, error: fetchErr } = await supabasePublic
      .from(table)
      .select(`id, ${col}`)
      .eq('id', id)
      .single()
 
    if (fetchErr || !existing) {
      return Response.json({ error: `${table} record not found` }, { status: 404 })
    }
    if ((existing as unknown as Record<string, unknown>)[col] !== userAuth.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
 
  
  const { data: current, error: readErr } = await supabaseAdmin
    .from(table)
    .select('id, metadata')
    .eq('id', id)
    .single()
 
  if (readErr || !current) {
    if (readErr?.code === 'PGRST116') {
      return Response.json({ error: `${table} record not found` }, { status: 404 })
    }
    return Response.json({ error: readErr?.message ?? 'Record not found' }, { status: 500 })
  }
 
 
  const existing = (current.metadata ?? {}) as Record<string, unknown>
  const merged: Record<string, unknown> = { ...existing }
 
  for (const [key, value] of Object.entries(body)) {
    if (value === null) {
      delete merged[key] 
    } else {
      merged[key] = value
    }
  }
 
  const { data: updated, error: writeErr } = await supabaseAdmin
    .from(table)
    .update({ metadata: merged, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, metadata')
    .single()
 
  if (writeErr) {
    return Response.json({ error: writeErr.message }, { status: 500 })
  }
 
  return Response.json({
    message: `Metadata updated on ${table}`,
    table,
    id: updated.id,
    metadata: updated.metadata,
  })
}