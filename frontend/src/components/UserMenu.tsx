import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Upload, Shield, ChevronDown, User } from 'lucide-react';
import { AppUser } from '../types';

interface UserMenuProps {
  user: AppUser;
  onLogout: () => void;
  onOpenUpload: () => void;
  onOpenAdmin: () => void;
  hasPendingUsers: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout, onOpenUpload, onOpenAdmin, hasPendingUsers }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user.display_name || user.username || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 pr-4 glass rounded-full hover:bg-white/10 transition-all border border-white/5 group"
      >
        <div className="w-9 h-9 bg-amber-500 rounded-full flex items-center justify-center text-black font-bold text-sm shadow-lg">
          {initial}
        </div>
        <span className="text-sm font-bold hidden md:block max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown size={16} className={`text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-64 glass-dark rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50"
          >
            <div className="p-4 border-b border-white/5">
              <p className="font-bold text-sm">{displayName}</p>
              <p className="text-xs text-white/40">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
                {user.role}
              </span>
            </div>

            <div className="p-2 space-y-1">
              {(user.role === 'admin' || user.role === 'contributor') && (
                <button
                  onClick={() => { onOpenUpload(); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-sm font-bold"
                >
                  <Upload size={18} className="text-amber-500" />
                  Contribute Content
                </button>
              )}

              {user.role === 'admin' && (
                <button
                  onClick={() => { onOpenAdmin(); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-sm font-bold relative"
                >
                  <Shield size={18} className="text-amber-500" />
                  Admin Panel
                  {hasPendingUsers && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </button>
              )}
            </div>

            <div className="p-2 border-t border-white/5">
              <button
                onClick={() => { onLogout(); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all text-sm font-bold text-red-400"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};