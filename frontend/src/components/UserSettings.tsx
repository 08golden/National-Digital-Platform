import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, ClipboardList, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { AppUser } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { submitContributorApplication } from '../lib/api/contributorApplications';
import { cn } from '../lib/utils';

interface UserSettingsProps {
  user: AppUser;
  onClose: () => void;
}

type ContributorApplicationMeta = {
  status: 'pending' | 'approved' | 'rejected';
  motivation: string;
  submitted_at: string;
  review_note: string | null;
} | undefined;

export const UserSettings: React.FC<UserSettingsProps> = ({ user, onClose }) => {
  const { refreshAppUser } = useAuth();
  const [motivation, setMotivation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const application = user.metadata?.contributor_application as ContributorApplicationMeta;

  const handleApply = async () => {
    if (!motivation.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await submitContributorApplication(motivation.trim());
      await refreshAppUser();
      setMotivation('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

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

          {user.role === 'viewer' && (
            <div className="glass rounded-3xl p-6 border border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-amber-500 mb-3 flex items-center gap-2">
                <ClipboardList size={16} />
                Contributor Application
              </h3>

              {!application || application.status === 'rejected' ? (
                <div className="space-y-3">
                  {application?.status === 'rejected' && (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                      <XCircle size={18} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold">Your previous application was rejected.</p>
                        {application.review_note && <p className="mt-1 text-red-200/70">{application.review_note}</p>}
                        <p className="mt-1 text-red-200/70">You're welcome to submit a new application below.</p>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-white/50">
                    Contributors can upload recordings, transcripts and metadata. Tell us why you'd like to contribute
                    and an admin will review your request.
                  </p>
                  <textarea
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    placeholder="e.g. I'm a linguist researching Oshiwambo oral traditions and would like to contribute recordings from my fieldwork."
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-amber-500/50"
                  />
                  {error && <p className="text-xs font-bold text-red-400">{error}</p>}
                  <button
                    onClick={handleApply}
                    disabled={!motivation.trim() || submitting}
                    className={cn(
                      "h-12 w-full rounded-xl bg-amber-500 font-bold text-black transition-all disabled:cursor-not-allowed disabled:opacity-50",
                      "hover:bg-amber-400 active:scale-[0.98]"
                    )}
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              ) : application.status === 'pending' ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
                  <Clock size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Please hold on while our team reviews your application.</p>
                    <p className="mt-1 text-amber-200/70">
                      Submitted {new Date(application.submitted_at).toLocaleDateString()}. An admin will respond soon.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Application approved!</p>
                    <p className="mt-1 text-green-200/70">Sign out and back in to refresh your contributor access.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
