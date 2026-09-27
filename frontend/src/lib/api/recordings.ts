const BASE_URL = import.meta.env.VITE_API_URL;
import { supabase } from '../supabaseClient';
import { ContentItem } from '../../types';
import { LANGUAGES } from '../../constants';
import { getCategoryTreeFlat, CategoryNode } from './categories';

export async function getRecordings() {
  const res = await fetch(`${BASE_URL}/api/recordings`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}

export async function getRecordingById(id: string) {
  const res = await fetch(`${BASE_URL}/api/recordings/${id}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}

export async function createRecording(body: {
  title: string;
  language_id: string;
  description?: string;
}) {
  const res = await fetch(`${BASE_URL}/api/recordings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('You must be signed in to do this.');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

/** Admin only: change a recording's moderation status. */
export async function updateRecordingStatus(
  id: string,
  status: 'pending' | 'published' | 'rejected' | 'archived'
) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/api/recordings/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}

/** Admin (or owner of a pending recording): soft-delete (archive). */
export async function deleteRecording(id: string) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/api/recordings/${id}`, {
    method: 'DELETE',
    headers,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error);
  return json;
}

/**
 * Maps a `recordings` row (as returned by the query below, with its
 * `languages`/`users` embeds) onto the ContentItem shape the Library/Search
 * UI expects.
 */
/**
 * The Library sidebar/filters compare against the decorative LANGUAGES
 * list in constants.ts (slug ids like 'oshiwambo', 'afrikaans'), which is
 * separate from the real `languages` table (real UUIDs, the actual
 * language_id foreign key on recordings). A raw UUID would never match a
 * slug id, so every per-language count/filter would silently show zero for
 * real data. Resolve by matching the DB language's name against the
 * constants list instead, falling back to the raw UUID only if the DB has
 * a language with no matching entry there (keeps it counted under "All
 * Languages" even if it won't match a specific filter).
 */
function resolveLanguageId(dbLanguageName?: string, fallbackUuid?: string): string {
  if (dbLanguageName) {
    const match = LANGUAGES.find(
      (l) => l.name.toLowerCase() === dbLanguageName.toLowerCase()
    );
    if (match) return match.id;
  }
  return fallbackUuid || 'all';
}

function mapRecordingToContentItem(row: any, categoryById: Map<string, any>): ContentItem {
  const subtype = row.category_id ? categoryById.get(row.category_id) : undefined;
  const group = subtype?.parentId ? categoryById.get(subtype.parentId) : undefined;
  const topics: string[] = (row.recording_tags || [])
    .map((rt: any) => rt.tags?.name)
    .filter(Boolean);

  return {
    id: row.id,
    title: row.title,
    category: row.category || 'Audio',
    languageId: resolveLanguageId(row.languages?.name, row.language_id),
    description: row.description || '',
    storagePath: row.storage_path || undefined,
    author: row.users?.display_name || row.users?.username || undefined,
    date: row.created_at,
    dataUseConsent: {
      allowDownload: row.allow_download !== false,
      allowSharing: row.allow_sharing !== false,
    },
    categoryGroupId: group?.id,
    categoryGroupName: group?.name,
    categorySubtypeId: subtype?.id,
    categorySubtypeName: subtype?.name,
    mediaKind: subtype?.mediaKind || undefined,
    topics,
  };
}

/**
 * Fetches every published recording directly via the Supabase client (RLS
 * allows anyone to read status='published' rows), joined with language,
 * uploader, category and topic-tag names, and maps them onto ContentItem
 * for the Library/Search UI. The category tree is fetched once and used to
 * resolve each row's group/sub-type client-side rather than attempting a
 * PostgREST self-join embed on categories.parent_id, which is awkward to
 * express reliably.
 */
export async function getPublishedContentItems(): Promise<ContentItem[]> {
  const [{ data, error }, categoryTree] = await Promise.all([
    supabase
      .from('recordings')
      .select('id, title, description, category, category_id, storage_path, created_at, language_id, allow_download, allow_sharing, languages(name), users(username, display_name), recording_tags(tags(name))')
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
    getCategoryTreeFlat().catch(() => []),
  ]);

  if (error) throw new Error(error.message);
  const categoryById = new Map<string, CategoryNode>(categoryTree.map((c) => [c.id, c] as [string, CategoryNode]));
  return (data || []).map((row) => mapRecordingToContentItem(row, categoryById));
}

/**
 * The 'recordings' storage bucket is private, so playback/download needs a
 * short-lived signed URL rather than a public one. Resolved lazily (e.g.
 * when a ContentDetails view opens) rather than for every item in a grid.
 */
export async function getRecordingSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from('recordings')
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Failed to create signed URL');
  return data.signedUrl;
}