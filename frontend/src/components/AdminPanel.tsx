import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { AppUser } from '../types';
import { Check, X, UserCheck, Clock, ShieldAlert, MessageSquare, Upload, Share2, ClipboardList, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabaseClient';
import { ModerationTab } from './ModerationTab';
import { UploadsTab } from './UploadsTab';
import { ShareRequestsTab } from './ShareRequestsTab';
import { useShareRequests } from '../contexts/ShareRequestsContext';
import {
  ContributorApplicant,
  approveContributorApplication,
  getContributorApplications,
  rejectContributorApplication,
} from '../lib/api/contributorApplications';
import { updateRecordingStatus, deleteRecording } from '../lib/api/recordings';
import { ModerationItem } from './ModerationTab';
import { UploadItem } from './UploadsTab';

interface AdminPanelProps {
  onClose: () => void;
  onPendingApplicationsChange?: (count: number) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onPendingApplicationsChange }) => {
  const { appUser } = useAuth();
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'applications' | 'moderation' | 'uploads' | 'share-requests'>('users');
  const { requests: shareRequests, pendingCount, approveRequest, rejectRequest } = useShareRequests();

  const [applications, setApplications] = useState<ContributorApplicant[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const [recordings, setRecordings] = useState<any[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [recordingsError, setRecordingsError] = useState('');
  const [recordingActionId, setRecordingActionId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchApplications();
    fetchRecordings();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setUsersError('');
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) {
      setUsersError(error.message || 'Failed to load users.');
    } else if (data) {
      setAllUsers(data);
    }
    setLoading(false);
  };

  const fetchApplications = async () => {
    setApplicationsLoading(true);
    setApplicationsError('');
    try {
      const data = await getContributorApplications('pending');
      setApplications(data);
      onPendingApplicationsChange?.(data.length);
    } catch (e) {
      setApplicationsError(e instanceof Error ? e.message : 'Failed to load applications.');
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setReviewingId(userId);
    try {
      await approveContributorApplication(userId);
      await Promise.all([fetchApplications(), fetchUsers()]);
    } catch (e) {
      setApplicationsError(e instanceof Error ? e.message : 'Failed to approve application.');
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    setReviewingId(userId);
    try {
      await rejectContributorApplication(userId);
      await fetchApplications();
    } catch (e) {
      setApplicationsError(e instanceof Error ? e.message : 'Failed to reject application.');
    } finally {
      setReviewingId(null);
    }
  };

  const fetchRecordings = async () => {
    setRecordingsLoading(true);
    setRecordingsError('');
    const { data, error } = await supabase
      .from('recordings')
      .select('id, title, status, created_at, uploaded_by, language_id, users(username, display_name), languages(name)')
      .order('created_at', { ascending: false });
    if (error) {
      setRecordingsError(error.message || 'Failed to load uploads.');
    } else if (data) {
      setRecordings(data);
    }
    setRecordingsLoading(false);
  };

  const toModerationItem = (r: any): ModerationItem => ({
    id: r.id,
    filename: r.title,
    uploadedBy: r.users?.display_name || r.users?.username || 'Unknown contributor',
    status: r.status,
    languageName: r.languages?.name,
    createdAt: r.created_at,
  });

  const handlePublish = async (id: string) => {
    setRecordingActionId(id);
    try {
      await updateRecordingStatus(id, 'published');
      await fetchRecordings();
    } catch (e) {
      setRecordingsError(e instanceof Error ? e.message : 'Failed to publish recording.');
    } finally {
      setRecordingActionId(null);
    }
  };

  const handleRejectRecording = async (id: string) => {
    setRecordingActionId(id);
    try {
      await updateRecordingStatus(id, 'rejected');
      await fetchRecordings();
    } catch (e) {
      setRecordingsError(e instanceof Error ? e.message : 'Failed to reject recording.');
    } finally {
      setRecordingActionId(null);
    }
  };

  const handleArchiveRecording = async (id: string) => {
    setRecordingActionId(id);
    try {
      await deleteRecording(id);
      await fetchRecordings();
    } catch (e) {
      setRecordingsError(e instanceof Error ? e.message : 'Failed to archive recording.');
    } finally {
      setRecordingActionId(null);
    }
  };

  const updateRole = async (userId: string, newRole: 'admin' | 'contributor' | 'viewer') => {
    await supabase.from('users').update({ role: newRole }).eq('id', userId);
    fetchUsers();
  };

  const toggleActive = async (userId: string, isActive: boolean) => {
    await supabase.from('users').update({ is_active: isActive }).eq('id', userId);
    fetchUsers();
  };

  const approveRegistration = async (userId: string) => {
    setReviewingId(userId);
    await supabase.from('users').update({ registration_status: 'approved', is_active: true }).eq('id', userId);
    await fetchUsers();
    setReviewingId(null);
  };

  const rejectRegistration = async (userId: string) => {
    setReviewingId(userId);
    await supabase.from('users').update({ registration_status: 'rejected', is_active: false }).eq('id', userId);
    await fetchUsers();
    setReviewingId(null);
  };

  if (appUser?.role !== 'admin') return null;

  const admins = allUsers.filter(u => u.role === 'admin');
  const contributors = allUsers.filter(u => u.role === 'contributor');
  const viewers = allUsers.filter(u => u.role === 'viewer');
  const pendingRegistrations = allUsers.filter(u => u.registration_status === 'pending');

  const pendingModeration = recordings.filter(r => r.status === 'pending').map(toModerationItem);
  const allUploads: UploadItem[] = recordings.map(toModerationItem);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        className="relative w-full max-w-5xl glass-dark rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-white/10"
      >
        <header className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-black shadow-xl shadow-amber-500/20">
              <ShieldAlert size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold tracking-tight">Admin Dashboard</h2>
              <p className="text-sm text-white/30 uppercase tracking-widest font-bold">Full Control</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white">
            <X size={20} />
          </button>
        </header>

        <div className="flex gap-2 px-8 pt-6 border-b border-white/5 overflow-x-auto">
          {(['users', 'applications', 'moderation', 'uploads', 'share-requests'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-3 rounded-t-2xl font-bold text-sm uppercase tracking-wider transition-all whitespace-nowrap relative",
                activeTab === tab
                  ? "bg-amber-500 text-black shadow-xl"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              {tab === 'users' && (
                <>
                  <UserCheck size={16} className="inline mr-2" />
                  Users
                  {pendingRegistrations.length > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-black">
                      {pendingRegistrations.length}
                    </span>
                  )}
                </>
              )}
              {tab === 'applications' && (
                <>
                  <ClipboardList size={16} className="inline mr-2" />
                  Applications
                  {applications.length > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-black">
                      {applications.length}
                    </span>
                  )}
                </>
              )}
              {tab === 'moderation' && (
                <>
                  <MessageSquare size={16} className="inline mr-2" />
                  Moderation
                  {pendingModeration.length > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-black">
                      {pendingModeration.length}
                    </span>
                  )}
                </>
              )}
              {tab === 'uploads' && <><Upload size={16} className="inline mr-2" /> Uploads</>}
              {tab === 'share-requests' && (
                <>
                  <Share2 size={16} className="inline mr-2" />
                  Share Requests
                  {pendingCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-black">
                      {pendingCount}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar">
          {activeTab === 'users' && (
            loading ? (
              <div className="text-center py-20 text-white/40">Loading users...</div>
            ) : usersError ? (
              <div className="flex flex-col items-center gap-4 py-20 text-center">
                <AlertTriangle className="text-red-400" size={32} />
                <p className="text-red-400 font-bold">Couldn't load users</p>
                <p className="text-white/40 text-sm max-w-sm">{usersError}</p>
                <button
                  onClick={fetchUsers}
                  className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
                >
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            ) : allUsers.length === 0 ? (
              <div className="text-center py-20 text-white/40">No users found yet.</div>
            ) : (
              <div className="space-y-10">
                {pendingRegistrations.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500 mb-4">
                      Pending Registrations ({pendingRegistrations.length})
                    </h3>
                    {pendingRegistrations.map(u => (
                      <div key={u.id} className="flex items-center justify-between p-4 glass rounded-2xl mb-2 border border-amber-500/20">
                        <div>
                          <p className="font-bold">{u.display_name || u.username}</p>
                          <p className="text-sm text-white/40">{u.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveRegistration(u.id)}
                            disabled={reviewingId === u.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/30 transition-all disabled:opacity-50"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            onClick={() => rejectRegistration(u.id)}
                            disabled={reviewingId === u.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-all disabled:opacity-50"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500 mb-4">Admins</h3>
                  {admins.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-4 glass rounded-2xl mb-2">
                      <div>
                        <p className="font-bold">{u.display_name || u.username}</p>
                        <p className="text-sm text-white/40">{u.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toggleActive(u.id, !u.is_active)}
                          className={cn("px-3 py-1 rounded-lg text-xs", u.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>
                  ))}
                </section>

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400 mb-4">Contributors</h3>
                  {contributors.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-4 glass rounded-2xl mb-2">
                      <div>
                        <p className="font-bold">{u.display_name || u.username}</p>
                        <p className="text-sm text-white/40">{u.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => updateRole(u.id, 'viewer')} className="px-3 py-1 bg-white/5 rounded-lg text-xs">Demote</button>
                        <button onClick={() => toggleActive(u.id, !u.is_active)}
                          className={cn("px-3 py-1 rounded-lg text-xs", u.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>
                  ))}
                </section>

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 mb-4">Viewers</h3>
                  {viewers.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-4 glass rounded-2xl mb-2">
                      <div>
                        <p className="font-bold">{u.display_name || u.username}</p>
                        <p className="text-sm text-white/40">{u.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => updateRole(u.id, 'contributor')} className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-xs">Promote</button>
                        <button onClick={() => toggleActive(u.id, !u.is_active)}
                          className={cn("px-3 py-1 rounded-lg text-xs", u.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>
                  ))}
                </section>
              </div>
            )
          )}

          {activeTab === 'applications' && (
            applicationsLoading ? (
              <div className="text-center py-20 text-white/40">Loading applications...</div>
            ) : applicationsError ? (
              <div className="flex flex-col items-center gap-4 py-20 text-center">
                <AlertTriangle className="text-red-400" size={32} />
                <p className="text-red-400 font-bold">Couldn't load applications</p>
                <p className="text-white/40 text-sm max-w-sm">{applicationsError}</p>
                <button
                  onClick={fetchApplications}
                  className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
                >
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-20 text-white/40">No pending contributor applications.</div>
            ) : (
              <div className="space-y-3">
                {applications.map(app => (
                  <div key={app.user_id} className="glass rounded-2xl p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold">{app.display_name || app.username}</p>
                        <p className="text-sm text-white/40">{app.email}</p>
                        {app.application?.submitted_at && (
                          <p className="text-xs text-white/25 mt-1">
                            Applied {new Date(app.application.submitted_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(app.user_id)}
                          disabled={reviewingId === app.user_id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/30 transition-all disabled:opacity-50"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(app.user_id)}
                          disabled={reviewingId === app.user_id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-all disabled:opacity-50"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </div>
                    {app.application?.motivation && (
                      <p className="text-sm text-white/60 bg-white/5 rounded-xl p-3">{app.application.motivation}</p>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'moderation' && (
            <ModerationTab
              uploads={pendingModeration}
              loading={recordingsLoading}
              error={recordingsError}
              onRetry={fetchRecordings}
              onApprove={handlePublish}
              onReject={handleRejectRecording}
              reviewingId={recordingActionId}
            />
          )}

          {activeTab === 'uploads' && (
            <UploadsTab
              uploads={allUploads}
              loading={recordingsLoading}
              error={recordingsError}
              onRetry={fetchRecordings}
              onArchive={handleArchiveRecording}
              archivingId={recordingActionId}
            />
          )}

          {activeTab === 'share-requests' && (
            <ShareRequestsTab
              requests={shareRequests}
              onApprove={approveRequest}
              onReject={rejectRequest}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
