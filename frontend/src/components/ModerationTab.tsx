import React from 'react';
import { Check, X, AlertTriangle, RefreshCw } from 'lucide-react';

export interface ModerationItem {
  id: string;
  filename: string;
  uploadedBy: string;
  status: string;
  languageName?: string;
  createdAt?: string;
}

interface ModerationTabProps {
  uploads: ModerationItem[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  reviewingId?: string | null;
}

export const ModerationTab: React.FC<ModerationTabProps> = ({
  uploads,
  loading,
  error,
  onRetry,
  onApprove,
  onReject,
  reviewingId,
}) => {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold">Moderation</h3>
        <p className="text-sm text-white/50">Review recordings awaiting approval before they go live.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-white/40">Loading pending uploads...</div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <AlertTriangle className="text-red-400" size={32} />
          <p className="text-red-400 font-bold">Couldn't load uploads</p>
          <p className="text-white/40 text-sm max-w-sm">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
            >
              <RefreshCw size={14} /> Retry
            </button>
          )}
        </div>
      ) : uploads.length === 0 ? (
        <div className="glass rounded-3xl border border-white/10 p-8 text-white/50 text-center">
          No moderation items yet. New contributor uploads will appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {uploads.map((item) => (
            <div key={item.id} className="glass rounded-3xl p-5 border border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{item.filename}</p>
                  <p className="text-sm text-white/50">
                    {item.uploadedBy}
                    {item.languageName ? ` · ${item.languageName}` : ''}
                    {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ''}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => onApprove(item.id)}
                    disabled={reviewingId === item.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/30 transition-all disabled:opacity-50"
                  >
                    <Check size={14} /> Publish
                  </button>
                  <button
                    onClick={() => onReject(item.id)}
                    disabled={reviewingId === item.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-all disabled:opacity-50"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
