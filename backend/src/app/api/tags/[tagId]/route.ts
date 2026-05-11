import { createUserClient } from '../../../../lib/supabase'
import { requireUser } from '../../../../lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  const { id, tagId } = await params

  const auth = await requireUser(request)

  if (auth.error || !auth.user || !auth.token) {
    return Response.json({ error: auth.error }, { status: 401 })
  }

  const supabase = createUserClient(auth.token)

  const { error } = await supabase
    .from('recording_tags')
    .delete()
    .eq('recording_id', id)
    .eq('tag_id', tagId)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ message: 'Tag removed from recording' })
}