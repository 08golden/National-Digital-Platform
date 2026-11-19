import React from 'react';
import { motion } from 'motion/react';
import { X, Check, ShieldCheck, Mail, Building2, MapPin, ClipboardList, CalendarDays } from 'lucide-react';
import { AppUser } from '../types';
import { cn } from '../lib/utils';

interface UserProfileModalProps {
  user: AppUser;
  onClose: () => void;
  /** Provided only while the registration is still pending. */
  onApprove?: () => void;
  onReject?: () => void;
  busy?: boolean;
}

const Field: React.FC<{ icon: React.ReactNode; label: string; value?: string | null; wide?: boolean }> = ({ icon, label, value, wide }) => (
  <div className={cn('rounded-2xl border border-white/10 bg-white/[0.04] p-4', wide && 'sm:col-span-2')}>
    <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/35">
      {icon}
      {label}
    </p>
    {value ? (
      <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-white/85">{value}</p>
    ) : (
      <p className="mt-1.5 text-sm italic text-white/25">Not provided</p>
    )}
  </div>
);

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-green-500/15 text-green-400',
  rejected: 'bg-red-500/15 text-red-400',
};

/**
 * Everything the platform knows about a person, so an admin can check who they
 * are — and why they want access — before approving them.
 */
export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose, onApprove, onReject, busy }) => {
  const m = user.metadata || {};
  const application = m.contributor_application as
    | { status?: string; motivation?: string; submitted_at?: string; review_note?: string | null }
    | undefined;
  const name = user.display_name || user.username;
  const regStatus = user.registration_status;
  const hasAnySignupDetail = ['intent', 'affiliation', 'country', 'contribution_details'].some((k) => m[k]);
  const wantsToContribute = m.desired_role === 'contributor';

  return (
    <div role="dialog" aria-modal="true" aria-label={`Profile of ${name}`} className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-2xl"
      >
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
          <X size={16} />
        </button>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          <header className="flex items-center gap-4 pr-10">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-xl font-bold text-black">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-bold tracking-tight">{name}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/60">{user.role}</span>
                {regStatus && (
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest', STATUS_STYLE[regStatus] || 'bg-white/10 text-white/60')}>
                    Registration {regStatus}
                  </span>
                )}
                {!user.is_active && (
                  <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-400">Inactive</span>
                )}
              </div>
            </div>
          </header>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field icon={<Mail size={12} />} label="Email" value={user.email} />
            <Field icon={<CalendarDays size={12} />} label="Registered" value={user.created_at ? new Date(user.created_at).toLocaleString() : null} />
            <Field icon={<Building2 size={12} />} label="Organisation / institution" value={m.affiliation} />
            <Field icon={<MapPin size={12} />} label="Country" value={m.country} />
            <Field icon={<ClipboardList size={12} />} label="Describes themselves as" value={m.intent} />
            <Field
              icon={<ShieldCheck size={12} />}
              label="Wants to"
              value={m.desired_role ? (wantsToContribute ? 'Contribute content' : 'Browse and research') : null}
            />
            {(m.contribution_details || application?.motivation) && (
              <Field
                wide
                icon={<ClipboardList size={12} />}
                label={wantsToContribute || application ? 'Why they want to contribute' : 'Additional details'}
                value={application?.motivation || m.contribution_details}
              />
            )}
          </div>

          {application && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Contributor application</p>
              <p className="mt-1.5 text-white/80">
                Status: <span className="font-semibold capitalize">{application.status || 'unknown'}</span>
                {application.submitted_at && <span className="text-white/40"> · submitted {new Date(application.submitted_at).toLocaleDateString()}</span>}
              </p>
              {application.review_note && <p className="mt-1 text-white/50">Note: {application.review_note}</p>}
            </div>
          )}

          {!hasAnySignupDetail && (
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-white/40">
              No sign-up details are recorded for this account. It was probably created before those questions were
              added to the form, so there is nothing more to verify here than the email address.
            </p>
          )}
        </div>

        {(onApprove || onReject) && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 bg-white/[0.02] p-4 sm:px-8">
            <button onClick={onClose} className="rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white/60 hover:bg-white/10">
              Close
            </button>
            {onReject && (
              <button onClick={onReject} disabled={busy} className="flex items-center gap-1.5 rounded-xl bg-red-500/20 px-4 py-2.5 text-sm font-bold text-red-300 hover:bg-red-500/30 disabled:opacity-50">
                <X size={15} /> Reject
              </button>
            )}
            {onApprove && (
              <button onClick={onApprove} disabled={busy} className="flex items-center gap-1.5 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-green-400 disabled:opacity-50">
                <Check size={15} /> Approve
              </button>
            )}
          </footer>
        )}
      </motion.div>
    </div>
  );
};
