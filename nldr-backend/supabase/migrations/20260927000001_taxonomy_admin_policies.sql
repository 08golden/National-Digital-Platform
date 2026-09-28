-- Migration: admin management of topic tags (2026-09-27)
--
-- 20260924000001_content_taxonomy.sql gave tags read + authenticated-insert
-- policies only, so nobody could rename or delete a topic. The Admin
-- Dashboard's new Taxonomy tab needs admins to be able to do both.
-- (recording_tags.tag_id already cascades on delete, so deleting a topic
-- detaches it from recordings automatically.)

DROP POLICY IF EXISTS tags_admin_update ON public.tags;
CREATE POLICY tags_admin_update ON public.tags
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS tags_admin_delete ON public.tags;
CREATE POLICY tags_admin_delete ON public.tags
  FOR DELETE USING (public.is_admin());
