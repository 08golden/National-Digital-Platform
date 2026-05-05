import { supabase } from '../../../../../../lib/supabase'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  const { id, tagId } = await params

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