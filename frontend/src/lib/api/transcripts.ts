/**
 * Transcripts API
 *
 * Backend already has a full draft -> approved moderation workflow for
 * transcripts (see backend/src/app/api/recordings/[id]/transcripts) — this
 * was simply never connected to anything in the UI. The original version
 * of this file also had the same bug fixed earlier for recording uploads:
 * POST sent no Authorization header, so requireContributor on the backend
 * rejected every submission outright.
 *
 * Ownership/moderation rules enforced by the backend, not duplicated here:
 * - Anyone can read an approved transcript for a published recording.
 * - The recording's owner (or an admin) can create one, as 'draft'.
 * - Only the owner can edit their own draft; only an admin can change status.
 */
import { supabase } from '../supabaseClient';

const BASE_URL = import.meta.env.VITE_API_URL;

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('You must be signed in to do this.');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export interface Transcript {
  id: string;
  recording_id: string;
  created_by: string;
  content: string;
  language_id: string | null;
  is_translation: boolean;
  source_language_id: string | null;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

/**
 * Approved transcripts for anyone; also includes the caller's own drafts
 * for this recording if signed in (sending auth when available, since the
 * route behaves differently with vs without it).
 */
export async function getTranscriptsByRecording(recordingId: string): Promise<Transcript[]> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(`${BASE_URL}/api/recordings/${recordingId}/transcripts`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data as Transcript[];
}

export async function createTranscript(
  recordingId: string,
  body: {
    content: string;
    language_id: string;
    is_translation?: boolean;
    source_language_id?: string;
  }
): Promise<Transcript> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/api/recordings/${recordingId}/transcripts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data as Transcript;
}

export async function updateTranscript(
  recordingId: string,
  transcriptId: string,
  body: Partial<{ content: string; status: Transcript['status'] }>
): Promise<Transcript> {
  const headers = await authHeaders();
  const res = await fetch(
    `${BASE_URL}/api/recordings/${recordingId}/transcripts?transcriptId=${transcriptId}`,
    { method: 'PATCH', headers, body: JSON.stringify(body) }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json.data as Transcript;
}
