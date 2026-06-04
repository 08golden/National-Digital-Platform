import React from 'react';
import { CheckCircle, XCircle, Link, Clock } from 'lucide-react';
import { ShareRequest } from '../types';
import { cn } from '../lib/utils';

interface ShareRequestsTabProps {
  requests: ShareRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const shareUrl = (token: string) => `${window.location.origin}/share/${token}`;

const StatusBadge = ({ status }: { status: ShareRequest['status'] }) => {
  const styles = {
    pending: 'bg-amber-500/20 text-amber-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={cn('text-[10px] uppercase tracking-[0.2em] font-bold px-2 py-1 rounded-lg', styles[status])}>
      {status}
    </span>
  );
};

export const ShareRequestsTab: React.FC<ShareRequestsTabProps> = ({ requests, onApprove, onReject }) => {
  const pending = requests.filter(r => r.status === 'pending');
  const reviewed = requests.filter(r => r.status !== 'pending');

  if (requests.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h3 className="text-xl font-bold">Share Requests</h3>
          <p className="text-sm text-white/50">Review and approve user share requests for content.</p>
        </div>
        <div className="glass rounded-3xl border border-white/10 p-12 flex flex-col items-center justify-center text-center">
          <Clock size={32} className="text-white/20 mb-3" />
          <p className="text-white/40 text-sm">No share requests yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold">Share Requests</h3>
        <p className="text-sm text-white/50">Review and approve user share requests for content.</p>
      </div>

      <div className="space-y-8">
        {pending.length > 0 && (
          <section>
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500 mb-4">
              Pending Review ({pending.length})
            </h4>
            <div className="space-y-3">
              {pending.map(req => (
                <div key={req.id} className="glass rounded-3xl p-5 border border-amber-500/20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{req.contentTitle}</p>
                      <p className="text-sm text-white/50 mt-0.5">
                        Requested by <span className="text-white/70">{req.requestedByName}</span>
                      </p>
                      <blockquote className="text-xs text-white/40 mt-2 italic border-l-2 border-white/10 pl-3">
                        "{req.reason}"
                      </blockquote>
                      <p className="text-[10px] text-white/20 mt-2">
                        {new Date(req.requestedAt).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => onApprove(req.id)}
                        className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-green-500/30 transition-all"
                      >
                        <CheckCircle size={12} /> Approve
                      </button>
                      <button
                        onClick={() => onReject(req.id)}
                        className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-red-500/30 transition-all"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {reviewed.length > 0 && (
          <section>
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-white/30 mb-4">
              Reviewed ({reviewed.length})
            </h4>
            <div className="space-y-3">
              {reviewed.map(req => (
                <div key={req.id} className="glass rounded-3xl p-5 border border-white/5 opacity-80">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-0.5">
                        <p className="font-bold truncate">{req.contentTitle}</p>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-sm text-white/40">by {req.requestedByName}</p>

                      {req.shareToken && (
                        <div className="flex items-center gap-2 mt-3 p-2.5 bg-white/5 rounded-xl border border-white/10">
                          <Link size={12} className="text-amber-500 shrink-0" />
                          <span className="text-[11px] text-white/40 font-mono truncate">
                            {shareUrl(req.shareToken)}
                          </span>
                        </div>
                      )}

                      {req.reviewedAt && (
                        <p className="text-[10px] text-white/20 mt-2">
                          Reviewed {new Date(req.reviewedAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
