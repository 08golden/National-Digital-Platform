const BASE_URL = import.meta.env.VITE_API_URL;

export async function getTags(filters?: { category?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.search) params.set('search', filters.search);

  const res = await fetch(`${BASE_URL}/api/tags?${params.toString()}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}

export async function createTag(body: {
  name: string;
  slug: string;
  category?: string;
  description?: string;
}) {
  const res = await fetch(`${BASE_URL}/api/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}