/**
 * Share Requests API
 *
 * Currently backed by in-memory mock state.
 * To connect to Supabase, replace each function body with the corresponding
 * Supabase query (see backend integration docs for the expected table schema).
 */

import { ShareRequest } from '../../types';

// Module-level store — survives re-renders, reset on page refresh.
// Replace with Supabase table queries when the backend table is ready.
let _store: ShareRequest[] = [];

export async function getShareRequests(): Promise<ShareRequest[]> {
  // TODO (backend): return supabase.from('share_requests').select('*').order('requested_at', { ascending: false })
  return [..._store].sort(
    (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
  );
}

export async function createShareRequest(
  contentId: string,
  contentTitle: string,
  requestedBy: string,
  requestedByName: string,
  reason: string
): Promise<ShareRequest> {
  // TODO (backend): insert into share_requests
  const request: ShareRequest = {
    id: crypto.randomUUID(),
    contentId,
    contentTitle,
    requestedBy,
    requestedByName,
    requestedAt: new Date().toISOString(),
    reason,
    status: 'pending',
  };
  _store.push(request);
  return request;
}

export async function approveShareRequest(id: string, reviewedBy: string): Promise<ShareRequest> {
  // TODO (backend): update share_requests set status='approved', share_token=gen_token, reviewed_by, reviewed_at
  const idx = _store.findIndex(r => r.id === id);
  if (idx === -1) throw new Error(`Share request ${id} not found`);
  _store[idx] = {
    ..._store[idx],
    status: 'approved',
    shareToken: crypto.randomUUID(),
    reviewedBy,
    reviewedAt: new Date().toISOString(),
  };
  return _store[idx];
}

export async function rejectShareRequest(id: string, reviewedBy: string): Promise<ShareRequest> {
  // TODO (backend): update share_requests set status='rejected', reviewed_by, reviewed_at
  const idx = _store.findIndex(r => r.id === id);
  if (idx === -1) throw new Error(`Share request ${id} not found`);
  _store[idx] = {
    ..._store[idx],
    status: 'rejected',
    reviewedBy,
    reviewedAt: new Date().toISOString(),
  };
  return _store[idx];
}
