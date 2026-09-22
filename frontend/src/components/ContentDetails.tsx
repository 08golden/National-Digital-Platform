import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Play, Pause, SkipForward, SkipBack, 
  Volume2, Download, Share2, Clock, Calendar, 
  User, FileText, Music, Video, Book, 
  ChevronRight, ChevronLeft, Expand, Lock, Loader2, CheckCircle2
} from 'lucide-react';
import { ContentItem } from '../types';
import { cn } from '../lib/utils';
import { useShareRequests } from '../contexts/ShareRequestsContext';
import { ShareRequestModal } from './ShareRequestModal';
import { getRecordingSignedUrl } from '../lib/api/recordings';

interface ContentDetailsProps {
  item: ContentItem;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  nextItem?: ContentItem | null;
  previousItem?: ContentItem | null;
}

export const ContentDetails: React.FC<ContentDetailsProps> = ({
  item,
  onClose,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  nextItem = null,
  previousItem = null,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'done' | 'error'>('idle');
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(item.url);
  const [urlError, setUrlError] = useState('');

  const { getRequestForContent } = useShareRequests();

  const audioRef = useRef<HTMLAudioElement>(null);

  // Real uploads only carry a storagePath (the 'recordings' bucket is
  // private) — mock/demo items carry a ready-to-use url directly. Resolve a
  // short-lived signed URL on open rather than baking one into every list
  // item, since signed URLs expire and shouldn't be generated in bulk.
  useEffect(() => {
    setResolvedUrl(item.url);
    setUrlError('');
    if (!item.url && item.storagePath) {
      getRecordingSignedUrl(item.storagePath)
        .then(setResolvedUrl)
        .catch((e) => setUrlError(e instanceof Error ? e.message : 'Failed to load media'));
    }
  }, [item.id, item.url, item.storagePath]);

  // Per the platform's data-use policy: a recording without an explicit
  // dataUseConsent is treated as legacy/public content and defaults to
  // permissive. Once a contributor has set a policy, it's authoritative.
  const allowDownload = item.dataUseConsent?.allowDownload !== false;
  const allowSharing = item.dataUseConsent?.allowSharing !== false;
  const existingShareRequest = getRequestForContent(item.id);

  const handleDownload = async () => {
    if (!allowDownload || !resolvedUrl) return;
    setDownloadState('downloading');
    try {
      const res = await fetch(resolvedUrl);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      // Derive the extension from the actual storage path when we have one
      // (never has a query string) rather than the resolved URL: Supabase
      // signed URLs carry a JWT in the ?token= query param, and JWTs
      // contain dots (header.payload.signature) — naively splitting the
      // whole URL on '.' and taking the last piece grabs a chunk of the
      // token's signature instead of the real file extension, producing a
      // garbage filename the OS can't recognize.
      const extSource = item.storagePath || resolvedUrl.split('?')[0];
      const ext = extSource.split('.').pop() || 'bin';
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${item.title.replace(/[^a-z0-9\-_ ]/gi, '').trim() || 'download'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
      setDownloadState('done');
      setTimeout(() => setDownloadState('idle'), 2500);
    } catch {
      // CORS or network failure — fall back to opening the asset directly so
      // the user can still save it via the browser's own "Save As".
      window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
      setDownloadState('idle');
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);

    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.load();

      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [item.id]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleNextTrack = () => {
    if (!hasNext || !onNext) return;
    onNext();
  };

  const handlePreviousTrack = () => {
    if (!hasPrevious || !onPrevious) return;
    onPrevious();
  };

  const Icon = {
    Articles: FileText,
    Audio: Music,
    Video: Video,
    Books: Book,
  }[item.category];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
    >
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-6xl glass-dark rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[90vh]"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 glass rounded-full hover:bg-white/10 transition-all z-20"
        >
          <X size={20} />
        </button>

        {/* 70% Main Content Section */}
        <div id="main-content-section" className="md:w-[70%] h-full flex flex-col overflow-hidden bg-white/5 border-r border-white/10">
          <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
            {item.category === 'Audio' ? (
              <div className="h-full flex flex-col items-center justify-center space-y-12">
                <motion.div 
                  animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-64 h-64 glass rounded-3xl flex items-center justify-center shadow-2xl relative group"
                >
                  {item.thumbnail ? (
                    <img 
                      src={item.thumbnail} 
                      alt={item.title} 
                      className="w-full h-full object-cover rounded-3xl opacity-60"
                    />
                  ) : (
                    <Music size={80} className="text-amber-500/40" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center shadow-xl">
                      <Music size={32} className="text-black" />
                    </div>
                  </div>
                </motion.div>

                <div className="text-center">
                  <h2 className="text-4xl font-display font-bold mb-4 tracking-tight">{item.title}</h2>
                  <p className="text-white/40 text-lg">{item.author || "Cultural Heritage Audio"}</p>
                  {urlError && (
                    <p className="mt-2 text-sm text-red-400">Couldn't load this media: {urlError}</p>
                  )}
                </div>

                {/* Full Audio Player UI */}
                <div id="audio-player-container" className="w-full max-w-xl space-y-6 glass p-8 rounded-[2rem]">
                  <audio 
                    ref={audioRef}
                    src={resolvedUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => {
                      if (hasNext && onNext) {
                        onNext();
                      } else {
                        setIsPlaying(false);
                      }
                    }}
                  />
                  
                  <div className="space-y-2">
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSliderChange}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-white/30 uppercase tracking-widest">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-8">
                    <button
                      onClick={handlePreviousTrack}
                      disabled={!hasPrevious}
                      title={previousItem ? `Previous: ${previousItem.title}` : 'No previous track'}
                      className={cn(
                        "transition-colors",
                        hasPrevious ? "text-white/40 hover:text-white" : "cursor-not-allowed text-white/15"
                      )}
                    >
                      <SkipBack size={24} />
                    </button>
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-all font-bold shadow-lg"
                    >
                      {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                    </button>
                    <button
                      onClick={handleNextTrack}
                      disabled={!hasNext}
                      title={nextItem ? `Next: ${nextItem.title}` : 'No next track'}
                      className={cn(
                        "transition-colors",
                        hasNext ? "text-white/40 hover:text-white" : "cursor-not-allowed text-white/15"
                      )}
                    >
                      <SkipForward size={24} />
                    </button>
                  </div>

                  {(previousItem || nextItem) && (
                    <div className="grid gap-3 text-xs text-white/35 sm:grid-cols-2">
                      <button
                        onClick={handlePreviousTrack}
                        disabled={!hasPrevious}
                        className="min-w-0 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-left transition-colors enabled:hover:bg-white/[0.07] disabled:opacity-40"
                      >
                        <span className="block font-bold uppercase tracking-widest">Previous</span>
                        <span className="mt-1 block truncate text-white/65">{previousItem?.title || 'Start of queue'}</span>
                      </button>
                      <button
                        onClick={handleNextTrack}
                        disabled={!hasNext}
                        className="min-w-0 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-left transition-colors enabled:hover:bg-white/[0.07] disabled:opacity-40"
                      >
                        <span className="block font-bold uppercase tracking-widest">Next</span>
                        <span className="mt-1 block truncate text-white/65">{nextItem?.title || 'End of queue'}</span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <Volume2 size={18} className="text-white/40" />
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={volume}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setVolume(v);
                          if (audioRef.current) audioRef.current.volume = v;
                        }}
                        className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
                      />
                    </div>
                    <button 
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40"
                    >
                      <Expand size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 prose prose-invert max-w-none">
                <header className="mb-12">
                  <div className="flex items-center gap-3 text-amber-500 font-bold uppercase text-xs tracking-widest mb-4">
                    <Icon size={16} />
                    <span>{item.category}</span>
                  </div>
                  <h2 className="text-5xl font-display font-bold tracking-tight mb-6">{item.title}</h2>
                  <div className="flex flex-wrap gap-6 text-white/40 text-sm">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      {item.author || "Repository Contributor"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      {item.date || "March 2024"}
                    </div>
                  </div>
                </header>
                
                <div className="text-white/80 leading-relaxed text-lg font-serif">
                  {item.transcript || "This document content is being digitized and will be available as a full transcript shortly. This article explores the cultural significance of Namibian linguistic traditions and their preservation in the modern digital era. Language is not just a tool for communication; it is a repository of history, values, and community identity."}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 30% Details/Actions Section */}
        <div id="side-details-section" className="md:w-[30%] h-full flex flex-col p-8 md:p-10 space-y-10 overflow-y-auto">
          <section className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/30 px-1">Details</h3>
            <div className="space-y-4">
              <div className="glass p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-xl text-amber-500">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Access Level</div>
                  <div className="text-sm font-semibold">Scholar / Researcher</div>
                </div>
              </div>
              <div className="glass p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-xl text-amber-500">
                  <Calendar size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Added Region</div>
                  <div className="text-sm font-semibold">Zambezi Region, Namibia</div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/30 px-1">Actions</h3>
            <div className="flex flex-col gap-3">
              <button
                id="btn-download-resource"
                onClick={handleDownload}
                disabled={!allowDownload || !resolvedUrl || downloadState === 'downloading'}
                title={!allowDownload ? 'The contributor has restricted downloads for this item.' : undefined}
                className={cn(
                  "w-full h-14 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all",
                  allowDownload && resolvedUrl
                    ? "bg-white text-black hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-white/5 text-white/30 cursor-not-allowed"
                )}
              >
                {downloadState === 'downloading' ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Preparing download...
                  </>
                ) : downloadState === 'done' ? (
                  <>
                    <CheckCircle2 size={20} />
                    Downloaded
                  </>
                ) : allowDownload ? (
                  <>
                    <Download size={20} />
                    Download Resource
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    Download Restricted
                  </>
                )}
              </button>

              {!allowDownload && (
                <p className="text-xs text-white/30 px-1 leading-relaxed">
                  {allowSharing
                    ? "This item's data-use policy restricts direct downloads. You can request access instead."
                    : "This item's data-use policy restricts both downloads and share requests."}
                </p>
              )}

              {allowSharing && (
                <button
                  onClick={() => setShowShareModal(true)}
                  disabled={Boolean(existingShareRequest && existingShareRequest.status === 'pending')}
                  className="w-full h-14 glass rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Share2 size={20} />
                  {existingShareRequest?.status === 'pending'
                    ? 'Share Request Pending'
                    : existingShareRequest?.status === 'approved'
                    ? 'View Share Link'
                    : 'Request Share Access'}
                </button>
              )}
            </div>
          </section>

          <section className="flex-1 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/30 px-1">Recommended</h3>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="glass p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer group">
                  <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">Related {item.category} {i}</div>
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Oshiherero</div>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </section>

          {/* User Meta Card */}
          <div className="mt-auto pt-6 border-t border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-amber-500/20 flex items-center justify-center">
              <User size={24} className="text-amber-500" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Repository Author</div>
              <div className="text-sm font-semibold">T. Kambonde</div>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showShareModal && (
          <ShareRequestModal item={item} onClose={() => setShowShareModal(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};