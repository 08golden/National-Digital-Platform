import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Play, Pause, SkipForward, SkipBack, 
  Volume2, Download, Share2, Clock, Calendar, 
  User, FileText, Music, Video, Book, 
  ChevronRight, ChevronLeft, Expand
} from 'lucide-react';
import { ContentItem } from '../types';
import { cn } from '../lib/utils';

interface ContentDetailsProps {
  item: ContentItem;
  onClose: () => void;
}

export const ContentDetails: React.FC<ContentDetailsProps> = ({ item, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

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
                </div>

                {/* Full Audio Player UI */}
                <div id="audio-player-container" className="w-full max-w-xl space-y-6 glass p-8 rounded-[2rem]">
                  <audio 
                    ref={audioRef}
                    src={item.url || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
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
                    <button className="text-white/40 hover:text-white transition-colors">
                      <SkipBack size={24} />
                    </button>
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-all font-bold shadow-lg"
                    >
                      {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                    </button>
                    <button className="text-white/40 hover:text-white transition-colors">
                      <SkipForward size={24} />
                    </button>
                  </div>

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
              <button id="btn-download-resource" className="w-full h-14 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <Download size={20} />
                Download Resource
              </button>
              <button className="w-full h-14 glass rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                <Share2 size={20} />
                Share Link
              </button>
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
    </motion.div>
  );
};
