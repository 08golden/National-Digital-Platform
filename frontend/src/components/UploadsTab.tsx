import React from 'react';
import { Archive, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

export interface UploadItem {
  id: string;
  filename: string;
  uploadedBy: string;
  status: string;
  languageName?: string;
  createdAt?: string;
}

interface UploadsTabProps {
  uploads: UploadItem[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onArchive: (id: string) => void;
  archivingId?: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'text-amber-400',
  published: 'text-green-400',
  rejected: 'text-red-400',
  archived: 'text-white/30',
};

export const UploadsTab: React.FC<UploadsTabProps> = ({
  uploads,
  loading,
  error,
  onRetry,
  onArchive,
  archivingId,
}) => {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold">Uploads</h3>
        <p className="text-sm text-white/50">Full log of every submission, across every status.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-white/40">Loading uploads...</div>
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
          No uploads yet.
        </div>
      ) : (
        <div className="space-y-4">
          {uploads.map((item) => (
            <div key={item.id} className="glass rounded-3xl p-5 border border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{item.filename}</p>
                  <p className="text-sm text-white/50">
                    Uploaded by {item.uploadedBy}
                    {item.languageName ? ` · ${item.languageName}` : ''}
                    {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn('text-xs uppercase tracking-[0.25em] font-bold', STATUS_STYLES[item.status] || 'text-white/40')}>
                    {item.status}
                  </span>
                  {item.status !== 'archived' && (
                    <button
                      onClick={() => onArchive(item.id)}
                      disabled={archivingId === item.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white/5 text-white/70 rounded-lg text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                      <Archive size={14} /> Archive
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
