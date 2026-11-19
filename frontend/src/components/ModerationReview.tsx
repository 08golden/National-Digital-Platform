import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, ExternalLink, FileText, Database, Loader2, ShieldCheck, Download, Share2, AlertTriangle } from 'lucide-react';
import { AppUser, ContentItem } from '../types';
import { getContentItemById, getRecordingSignedUrl } from '../lib/api/recordings';
import { getTranscriptsByRecording, Transcript } from '../lib/api/transcripts';
import { cn } from '../lib/utils';

interface ModerationReviewProps {
  recordingId: string;
  status: string;
  languageName?: string;
  uploader?: AppUser;
  onClose: () => void;
  /** Supplied only while the submission is still pending. */
  onPublish?: () => void;
  onReject?: () => void;
  busy?: boolean;
}

const Row: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-4 text-sm">
    <span className="shrink-0 text-white/40">{label}</span>
    <span className={cn('min-w-0 break-words text-right', value ? 'text-white/85' : 'italic text-white/25')}>{value || 'Not provided'}</span>
  </div>
);

/**
 * Lets an admin look at what was actually submitted — the file itself, its
 * description and transcript, and who sent it — before deciding to publish.
 */
export const ModerationReview: React.FC<ModerationReviewProps> = ({
  recordingId, status, languageName, uploader, onClose, onPublish, onReject, busy,
}) => {
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loadError, setLoadError] = useState('');
  const [fileUrl, setFileUrl] = useState<string | undefined>();
  const [fileError, setFileError] = useState('');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);

  useEffect(() => {
    let live = true;
    getContentItemById(recordingId)
      .then((i) => { if (live) i ? setItem(i) : setLoadError('This submission could not be found.'); })
      .catch((e) => { if (live) setLoadError(e instanceof Error ? e.message : 'Failed to load the submission.'); });
    getTranscriptsByRecording(recordingId).then((t) => live && setTranscripts(t)).catch(() => {});
    return () => { live = false; };
  }, [recordingId]);

  useEffect(() => {
    if (!item?.storagePath) return;
    getRecordingSignedUrl(item.storagePath)
      .then(setFileUrl)
      .catch((e) => setFileError(e instanceof Error ? e.message : 'Could not open the file.'));
  }, [item?.storagePath]);

  const kind = item?.mediaKind;
  const fileName = item?.storagePath?.split('/').pop() || '';
  const transcript = transcripts.find((t) => t.status === 'approved') || transcripts[0];
  const pending = status === 'pending';

  return (
    <div role="dialog" aria-modal="true" aria-label="Review submission" className="fixed inset-0 z-[210] flex items-center justify-center p-3 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:px-8">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500">
              Reviewing a submission{!pending && ` · already ${status}`}
            </p>
            <h2 className="mt-1 break-words text-xl font-bold tracking-tight sm:text-2xl">{item?.title || 'Loading...'}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
            <X size={16} />
          </button>
        </header>

        {loadError ? (
          <div className="flex items-center gap-3 p-8 text-red-300"><AlertTriangle size={18} /> {loadError}</div>
        ) : !item ? (
          <div className="flex items-center justify-center gap-2 p-16 text-white/40"><Loader2 className="animate-spin" size={18} /> Loading submission...</div>
        ) : (
          <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] custom-scrollbar">
            {/* The submission itself */}
            <div className="space-y-6 p-5 sm:p-8">
              <div className="flex flex-wrap gap-2 text-xs">
                {[item.categoryGroupName, item.categorySubtypeName, languageName].filter(Boolean).map((t) => (
                  <span key={t} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-white/70">{t}</span>
                ))}
                {(item.topics || []).map((t) => (
                  <span key={t} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-300">#{t}</span>
                ))}
              </div>

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/35">The file</p>
                {fileError ? (
                  <p className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{fileError}</p>
                ) : !fileUrl ? (
                  <p className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/40"><Loader2 className="animate-spin" size={14} /> Preparing the file...</p>
                ) : kind === 'audio' ? (
                  <audio controls src={fileUrl} className="w-full" />
                ) : kind === 'video' ? (
                  <video controls src={fileUrl} className="max-h-[50vh] w-full rounded-2xl bg-black" />
                ) : (
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      {kind === 'dataset' ? <Database size={22} className="shrink-0 text-amber-500" /> : <FileText size={22} className="shrink-0 text-amber-500" />}
                      <span className="truncate text-sm text-white/80" title={fileName}>{fileName}</span>
                    </div>
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-black hover:bg-amber-400">
                      Open file <ExternalLink size={13} />
                    </a>
                  </div>
                )}
                {fileUrl && (kind === 'audio' || kind === 'video') && (
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-amber-300">
                    Open in a new tab <ExternalLink size={12} />
                  </a>
                )}
              </div>

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/35">Description from the contributor</p>
                <p className={cn('whitespace-pre-wrap break-words text-sm leading-relaxed', item.description ? 'text-white/80' : 'italic text-white/25')}>
                  {item.description || 'No description was provided.'}
                </p>
              </div>

              {transcript && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/35">Transcript ({transcript.status})</p>
                  <p className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-white/[0.03] p-4 font-serif text-sm leading-relaxed text-white/70 custom-scrollbar">
                    {transcript.content}
                  </p>
                </div>
              )}
            </div>

            {/* Who sent it, and what they allow */}
            <aside className="space-y-6 border-t border-white/10 bg-white/[0.02] p-5 sm:p-8 lg:border-l lg:border-t-0">
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/35">Submitted by</p>
                <div className="space-y-2.5">
                  <Row label="Name" value={uploader?.display_name || uploader?.username || item.author} />
                  <Row label="Email" value={uploader?.email} />
                  <Row label="Organisation" value={uploader?.metadata?.affiliation} />
                  <Row label="Country" value={uploader?.metadata?.country} />
                  <Row label="Role" value={uploader?.role} />
                  <Row label="Member since" value={uploader?.created_at ? new Date(uploader.created_at).toLocaleDateString() : null} />
                  <Row label="Submitted" value={item.date ? new Date(item.date).toLocaleString() : null} />
                </div>
              </div>

              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/35">How the contributor allows it to be used</p>
                <div className="space-y-2 text-sm text-white/70">
                  <p className="flex items-center gap-2"><Download size={14} className="text-white/40" /> Direct download: {item.dataUseConsent?.allowDownload === false ? 'not allowed' : 'allowed'}</p>
                  <p className="flex items-center gap-2"><Share2 size={14} className="text-white/40" /> Share requests: {item.dataUseConsent?.allowSharing === false ? 'not allowed' : 'allowed'}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-white/45">
                <p className="mb-1 flex items-center gap-1.5 font-bold text-white/60"><ShieldCheck size={13} className="text-amber-500" /> Before you publish</p>
                Open the file and check that it matches its title and language, that the description and topics make
                sense, and that it doesn't contain personal or restricted information the contributor hasn't
                cleared for public access.
              </div>
            </aside>
          </div>
        )}

        {pending && (onPublish || onReject) && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 bg-white/[0.02] p-4 sm:px-8">
            <button onClick={onClose} className="rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white/60 hover:bg-white/10">Close</button>
            {onReject && (
              <button onClick={onReject} disabled={busy} className="flex items-center gap-1.5 rounded-xl bg-red-500/20 px-4 py-2.5 text-sm font-bold text-red-300 hover:bg-red-500/30 disabled:opacity-50">
                <X size={15} /> Reject
              </button>
            )}
            {onPublish && (
              <button onClick={onPublish} disabled={busy} className="flex items-center gap-1.5 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-green-400 disabled:opacity-50">
                <Check size={15} /> Publish
              </button>
            )}
          </footer>
        )}
      </motion.div>
    </div>
  );
};
