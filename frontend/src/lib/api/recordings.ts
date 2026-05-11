const BASE_URL = import.meta.env.VITE_API_URL;

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