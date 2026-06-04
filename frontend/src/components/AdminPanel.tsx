import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { AppUser } from '../types';
import { Check, X, UserCheck, Clock, ShieldAlert, MessageSquare, Upload, Share2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabaseClient';
import { ModerationTab } from './ModerationTab';
import { UploadsTab } from './UploadsTab';
import { ShareRequestsTab } from './ShareRequestsTab';
import { useShareRequests } from '../contexts/ShareRequestsContext';

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { appUser } = useAuth();
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'moderation' | 'uploads' | 'share-requests'>('users');
  const { requests: shareRequests, pendingCount, approveRequest, rejectRequest } = useShareRequests();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (!error && data) setAllUsers(data);
    setLoading(false);
  };

  const updateRole = async (userId: string, newRole: 'admin' | 'contributor' | 'viewer') => {
    await supabase.from('users').update({ role: newRole }).eq('id', userId);
    fetchUsers();
  };

  const toggleActive = async (userId: string, isActive: boolean) => {
    await supabase.from('users').update({ is_active: isActive }).eq('id', userId);
    fetchUsers();
  };

  if (appUser?.role !== 'admin') return null;

  const admins = allUsers.filter(u => u.role === 'admin');
  const contributors = allUsers.filter(u => u.role === 'contributor');
  const viewers = allUsers.filter(u => u.role === 'viewer');

  const mockUploads: any[] = [];
  const mockModerationFiles: any[] = [];

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
          {(['users', 'moderation', 'uploads', 'share-requests'] as const).map(tab => (
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
              {tab === 'users' && <><UserCheck size={16} className="inline mr-2" /> Users</>}
              {tab === 'moderation' && <><MessageSquare size={16} className="inline mr-2" /> Moderation</>}
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
            ) : (
              <div className="space-y-10">
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

          {activeTab === 'moderation' && (
            <ModerationTab
              uploads={mockModerationFiles}
              onSelectFile={() => {}}
              onDeleteFiles={() => {}}
              onChangeStatus={() => {}}
            />
          )}

          {activeTab === 'uploads' && (
            <UploadsTab
              uploads={mockUploads}
              onDeleteFiles={() => {}}
              onChangeStatus={() => {}}
              onSelectFile={() => {}}
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
