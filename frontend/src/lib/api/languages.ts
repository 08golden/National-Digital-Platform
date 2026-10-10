import { supabase } from '../supabaseClient';

const BASE_URL = import.meta.env.VITE_API_URL;

export async function getLanguages() {
  const res = await fetch(`${BASE_URL}/api/languages`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}

export async function createLanguage(body: {
  iso_code: string;
  name: string;
  local_name?: string;
}) {
  // Admin-only on the server; it checks the caller's token.
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error('You must be signed in as an admin to do this.');
  const res = await fetch(`${BASE_URL}/api/languages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}