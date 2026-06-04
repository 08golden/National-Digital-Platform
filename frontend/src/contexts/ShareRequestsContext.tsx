import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ShareRequest } from '../types';
import * as api from '../lib/api/shareRequests';
import { useAuth } from './AuthContext';

interface ShareRequestsContextValue {
  requests: ShareRequest[];
  submitRequest: (contentId: string, contentTitle: string, reason: string) => Promise<void>;
  approveRequest: (id: string) => Promise<void>;
  rejectRequest: (id: string) => Promise<void>;
  getRequestForContent: (contentId: string) => ShareRequest | undefined;
  pendingCount: number;
}

const ShareRequestsContext = createContext<ShareRequestsContextValue>({} as ShareRequestsContextValue);
export const useShareRequests = () => useContext(ShareRequestsContext);

export const ShareRequestsProvider = ({ children }: { children: ReactNode }) => {
  const { appUser } = useAuth();
  const [requests, setRequests] = useState<ShareRequest[]>([]);

  const refresh = useCallback(async () => {
    const data = await api.getShareRequests();
    setRequests(data);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submitRequest = async (contentId: string, contentTitle: string, reason: string) => {
    if (!appUser) return;
    await api.createShareRequest(
      contentId,
      contentTitle,
      appUser.id,
      appUser.display_name || appUser.username,
      reason
    );
    await refresh();
  };

  const approveRequest = async (id: string) => {
    if (!appUser) return;
    await api.approveShareRequest(id, appUser.id);
    await refresh();
  };

  const rejectRequest = async (id: string) => {
    if (!appUser) return;
    await api.rejectShareRequest(id, appUser.id);
    await refresh();
  };

  // Returns the current user's most recent request for a specific content item.
  const getRequestForContent = (contentId: string): ShareRequest | undefined => {
    if (!appUser) return undefined;
    return requests.find(r => r.contentId === contentId && r.requestedBy === appUser.id);
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <ShareRequestsContext.Provider
      value={{ requests, submitRequest, approveRequest, rejectRequest, getRequestForContent, pendingCount }}
    >
      {children}
    </ShareRequestsContext.Provider>
  );
};
