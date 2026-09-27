import { supabase } from '../supabaseClient';

export type MediaKind = 'audio' | 'video' | 'document' | 'dataset';

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  mediaKind: MediaKind | null;
  sortOrder: number;
  children: CategoryNode[];
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
}

/** Fetches the full two-level category tree (group -> sub-type). */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id, media_kind, sort_order')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);

  const rows = data || [];
  const byId = new Map<string, CategoryNode>();
  rows.forEach((r) => {
    byId.set(r.id, {
      id: r.id,
      name: r.name,
      slug: r.slug,
      parentId: r.parent_id,
      mediaKind: r.media_kind,
      sortOrder: r.sort_order,
      children: [],
    });
  });

  const roots: CategoryNode[] = [];
  byId.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else if (!node.parentId) {
      roots.push(node);
    }
  });
  return roots;
}

/** Fetches every category row flat (root groups and leaf sub-types together). */
export async function getCategoryTreeFlat(): Promise<CategoryNode[]> {
  const tree = await getCategoryTree();
  const flat: CategoryNode[] = [];
  tree.forEach((root) => {
    flat.push(root);
    root.children.forEach((child) => flat.push(child));
  });
  return flat;
}

/** Fetches the starter topic tags (the cross-cutting "subject" dimension). */
export async function getTopics(): Promise<Topic[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('id, name, slug')
    .eq('category', 'topic')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as Topic[];
}
