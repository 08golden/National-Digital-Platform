/**
 * Share Requests API
 *
 * Backed by the real public.share_requests table (see migration
 * 20260928000001_share_requests_table.sql). RLS does the access control:
 * a non-admin only ever sees their own requests, an admin sees everything —
 * so getShareRequests() is correct for both ShareRequestsContext's
 * "does the current user already have a request for this item" check and
 * the admin-only ShareRequestsTab, with no special-casing needed here.
 *
 * Field names on ShareRequest (types.ts) are camelCase; the table is
 * snake_case — mapped explicitly below rather than relying on Supabase's
 * column aliasing so this stays readable.
 */
import { ShareRequest } from '../../types';
import { supabase } from '../supabaseClient';

function mapRow(row: any): ShareRequest {
  return {
    id: row.id,
    contentId: row.content_id,
    contentTitle: row.content_title,
    requestedBy: row.requested_by,
    requestedByName: row.requested_by_name,
    requestedAt: row.requested_at,
    reason: row.reason,
    status: row.status,
    shareToken: row.share_token || undefined,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at || undefined,
  };
}

export async function getShareRequests(): Promise<ShareRequest[]> {
  const { data, error } = await supabase
    .from('share_requests')
    .select('*')
    .order('requested_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapRow);
}

/**
 * Looks up an approved share request by its token — used by the /share/:token
 * link flow. RLS still applies (share_requests_select_own_or_admin), so this
 * only ever succeeds for the original requester (or an admin) viewing their
 * own approved grant, not an arbitrary third party who receives the link —
 * see the note in App.tsx on why that's the current scope.
 */
export async function getShareRequestByToken(token: string): Promise<ShareRequest | null> {
  const { data, error } = await supabase
    .from('share_requests')
    .select('*')
    .eq('share_token', token)
    .eq('status', 'approved')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}

export async function createShareRequest(
  contentId: string,
  contentTitle: string,
  requestedBy: string,
  requestedByName: string,
  reason: string
): Promise<ShareRequest> {
  const { data, error } = await supabase
    .from('share_requests')
    .insert({
      content_id: contentId,
      content_title: contentTitle,
      requested_by: requestedBy,
      requested_by_name: requestedByName,
      reason,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data);
}

export async function approveShareRequest(id: string, reviewedBy: string): Promise<ShareRequest> {
  const { data, error } = await supabase
    .from('share_requests')
    .update({
      status: 'approved',
      share_token: crypto.randomUUID(),
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data);
}

export async function rejectShareRequest(id: string, reviewedBy: string): Promise<ShareRequest> {
  const { data, error } = await supabase
    .from('share_requests')
    .update({
      status: 'rejected',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data);
}
