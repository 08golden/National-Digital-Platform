/**
 * Contributor Applications API (frontend wrapper)
 *
 * Talks to the Next.js backend routes under /api/contributor-applications,
 * which store application state on `users.metadata.contributor_application`
 * (see backend/src/app/api/contributor-applications for the source of truth).
 *
 * Every call needs the current user's Supabase access token, since the
 * backend authorizes with `requireUser` / `requireAdmin` against it.
 */
import { supabase } from '../supabaseClient';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export type ContributorApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface ContributorApplication {
  status: ContributorApplicationStatus;
  motivation: string;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
}

export interface ContributorApplicant {
  user_id: string;
  username: string;
  display_name: string | null;
  email: string;
  role: string;
  application: ContributorApplication | null;
}

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('You must be signed in to do this.');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function parse(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

/** Submit (or resubmit, once rejected) a contributor application for the current user. */
export async function submitContributorApplication(motivation: string) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/api/contributor-applications`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ motivation }),
  });
  return parse(res);
}

/** Admin only: list applications, defaults to pending. */
export async function getContributorApplications(
  status: ContributorApplicationStatus = 'pending'
): Promise<ContributorApplicant[]> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/api/contributor-applications?status=${status}`, { headers });
  const json = await parse(res);
  return json.data as ContributorApplicant[];
}

/** Admin only: approve an applicant — promotes them to 'contributor'. */
export async function approveContributorApplication(userId: string, reviewNote?: string) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/api/contributor-applications/${userId}/approve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ review_note: reviewNote ?? null }),
  });
  return parse(res);
}

/** Admin only: reject an applicant — role stays unchanged (viewer). */
export async function rejectContributorApplication(userId: string, reviewNote?: string) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/api/contributor-applications/${userId}/reject`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ review_note: reviewNote ?? null }),
  });
  return parse(res);
}
