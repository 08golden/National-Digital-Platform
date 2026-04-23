import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Settings, Upload, LogOut, ChevronDown, Shield, Bell } from 'lucide-react';
import { User as UserType } from '../types';
import { cn } from '../lib/utils';

interface UserMenuProps {
  user: UserType;
  onLogout: () => void;
  onOpenUpload: () => void;
  onOpenAdmin?: () => void;
  hasPendingUsers?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({ 
  user, 
  onLogout, 
  onOpenUpload, 
  onOpenAdmin,
  hasPendingUsers 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        id="user-profile-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 pl-4 glass rounded-full hover:bg-white/10 transition-all border border-white/5 group"
      >
        <div className="flex flex-col items-end hidden sm:flex">
          <span className="text-xs font-bold tracking-tight">{user.name}</span>
          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest leading-none">
            {user.role}
          </span>
        </div>
        <div className="relative w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold shadow-lg group-hover:scale-105 transition-transform">
          {user.name.charAt(0)}
          {hasPendingUsers && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-zinc-950 rounded-full animate-pulse" />
          )}
        </div>
        <ChevronDown size={14} className={cn("text-white/40 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-64 glass-dark rounded-[2rem] border border-white/10 shadow-2xl p-4 z-50 overflow-hidden"
            >
              <div className="flex flex-col gap-1">
                <div className="px-4 py-3 mb-2 border-b border-white/5">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Account</div>
                  <div className="text-sm font-semibold truncate">{user.email}</div>
                </div>

                {user.role === 'admin' && onOpenAdmin && (
                  <button
                    id="btn-admin-dashboard"
                    onClick={() => { onOpenAdmin(); setIsOpen(false); }}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-amber-500 hover:text-black rounded-xl transition-all group"
                  >
                    <Shield size={18} className="text-amber-500 group-hover:text-black" />
                    <span className="text-sm font-bold flex-1 text-left">Admin Dashboard</span>
                    {hasPendingUsers && <span className="w-2 h-2 bg-red-500 rounded-full" />}
                  </button>
                )}

                <button
                  id="btn-user-settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white"
                >
                  <Settings size={18} />
                  <span className="text-sm font-medium">Settings</span>
                </button>

                {user.role === 'admin' && (
                  <button
                    id="btn-my-uploads"
                    onClick={() => { onOpenUpload(); setIsOpen(false); }}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white"
                  >
                    <Upload size={18} />
                    <span className="text-sm font-medium">My Uploads</span>
                  </button>
                )}

                <div className="h-px bg-white/5 my-2" />

                <button
                  id="btn-logout"
                  onClick={() => { onLogout(); setIsOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-500/20 text-red-500 rounded-xl transition-all"
                >
                  <LogOut size={18} />
                  <span className="text-sm font-bold">Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
