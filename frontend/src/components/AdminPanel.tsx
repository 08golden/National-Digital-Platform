import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, AccessStatus } from '../types';
import { Check, X, UserCheck, Clock, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

interface AdminPanelProps {
  users: User[];
  onUpdateStatus: (userId: string, status: AccessStatus) => void;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ users, onUpdateStatus, onClose }) => {
  const pendingUsers = users.filter(u => u.status === 'pending');
  const otherUsers = users.filter(u => u.status !== 'pending');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8"
    >
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
        onClick={onClose} 
      />
      
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
              <h2 className="text-2xl font-display font-bold tracking-tight">Vetting & Oversight</h2>
              <p className="text-sm text-white/30 uppercase tracking-widest font-bold">Guardian of the Repository</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-12 custom-scrollbar">
          {/* Pending Requests Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500 flex items-center gap-3">
                <Clock size={16} className="animate-pulse" />
                Applications Awaiting Review ({pendingUsers.length})
              </h3>
            </div>
            
            {pendingUsers.length === 0 ? (
              <div className="py-20 glass rounded-[2rem] text-center border border-dashed border-white/10">
                <div className="mb-4 text-white/20">
                  <UserCheck size={48} className="mx-auto" />
                </div>
                <p className="text-white/40 italic font-serif">All paths are currently clear. No pending applications.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingUsers.map(user => (
                  <motion.div 
                    layout
                    key={user.id} 
                    className="glass rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.05] transition-all border border-white/5 shadow-lg group"
                  >
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-amber-500 font-bold group-hover:bg-amber-500 group-hover:text-black transition-all">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-lg">{user.name}</div>
                          <div className="text-xs text-white/30 font-serif">{user.email}</div>
                        </div>
                      </div>
                      <div className="bg-black/20 p-5 rounded-2xl border border-white/5 relative">
                        <div className="absolute top-0 right-4 -translate-y-1/2 px-2 bg-zinc-900 text-[10px] font-bold text-white/30 uppercase tracking-widest">Statement of Intent</div>
                        <p className="text-sm text-white/70 leading-relaxed italic pr-4">
                          "{user.intent}"
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onUpdateStatus(user.id, 'rejected')}
                        className="px-6 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-bold border border-transparent hover:border-red-500/20"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => onUpdateStatus(user.id, 'approved')}
                        className="px-8 py-3 bg-white text-black rounded-2xl hover:bg-amber-500 transition-all text-sm font-bold shadow-xl active:scale-95"
                      >
                        Grant Access
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* User Directory Section */}
          <section className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
              <UserCheck size={16} />
              Current Repository Access List
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {otherUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 glass rounded-2xl hover:bg-white/[0.03] transition-all group border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      user.status === 'approved' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-red-500"
                    )} />
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">{user.name}</div>
                      <div className="text-[10px] text-white/30 truncate">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "text-[9px] uppercase font-bold px-2 py-1 rounded-lg tracking-widest border transition-all",
                      user.role === 'admin' 
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                        : "bg-white/5 text-white/30 border-white/5"
                    )}>
                      {user.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        
        <footer className="p-6 bg-white/[0.02] border-t border-white/5 flex justify-center">
          <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Namibia Repo Administrator Protocol v1.2</p>
        </footer>
      </motion.div>
    </motion.div>
  );
};
