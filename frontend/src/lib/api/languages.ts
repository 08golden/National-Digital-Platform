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
  const res = await fetch(`${BASE_URL}/api/languages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}