import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { AppUser } from '../types';

interface UserSettingsProps {
  user: AppUser;
  onClose: () => void;
}

export const UserSettings: React.FC<UserSettingsProps> = ({ user, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        className="relative w-full max-w-3xl glass-dark rounded-[2rem] border border-white/10 p-8 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white"
        >
          <X size={20} />
        </button>
        <h2 className="text-2xl font-display font-bold tracking-tight">User Settings</h2>
        <p className="mt-3 text-sm text-white/60">
          Manage your profile and preferences. Changes are saved automatically.
        </p>

        <div className="mt-8 grid gap-6">
          <div className="glass rounded-3xl p-6 border border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-amber-500 mb-3">Profile</h3>
            <div className="space-y-3 text-sm text-white/60">
              <p><span className="font-semibold text-white">Username:</span> {user.username}</p>
              <p><span className="font-semibold text-white">Display name:</span> {user.display_name || 'N/A'}</p>
              <p><span className="font-semibold text-white">Email:</span> {user.email}</p>
            </div>
          </div>
          <div className="glass rounded-3xl p-6 border border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-amber-500 mb-3">Account</h3>
            <div className="space-y-3 text-sm text-white/60">
              <p><span className="font-semibold text-white">Role:</span> {user.role}</p>
              <p><span className="font-semibold text-white">Status:</span> {user.is_active ? 'Active' : 'Inactive'}</p>
              <p><span className="font-semibold text-white">Created:</span> {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
