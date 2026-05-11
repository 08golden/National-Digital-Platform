const BASE_URL = import.meta.env.VITE_API_URL;

export async function getTranscriptsByRecording(recordingId: string) {
  const res = await fetch(`${BASE_URL}/api/recordings/${recordingId}/transcripts`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}

export async function createTranscript(
  recordingId: string,
  body: {
    content: string;
    language_id: string;
    is_translation?: boolean;
    source_language_id?: string;
  }
) {
  const res = await fetch(`${BASE_URL}/api/recordings/${recordingId}/transcripts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data;
}