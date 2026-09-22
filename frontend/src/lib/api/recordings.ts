const BASE_URL = import.meta.env.VITE_API_URL;
import { supabase } from '../supabaseClient';

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