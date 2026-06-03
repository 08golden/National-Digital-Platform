import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, FileText, Music, Video, Book, 
  ArrowLeft, Search, Play, Eye, Download, 
  MoreVertical, Clock, Info
} from 'lucide-react';
import { Category, ContentItem } from '../types';
import { MOCK_CONTENT, CATEGORIES } from '../constants';
import { cn } from '../lib/utils';
import { searchContent } from '../lib/search';
import { ContentDetails } from './ContentDetails';

interface LibraryViewProps {
  languageId: string;
  initialSearchQuery?: string;
  onClose: () => void;
}

const ICON_MAP = {
  Articles: FileText,
  Audio: Music,
  Video: Video,
  Books: Book,
};

// This component shows the "Library" where all the articles, books, etc., are stored.
export const LibraryView: React.FC<LibraryViewProps> = ({ languageId, initialSearchQuery = '', onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  const filteredContent = useMemo(
    () => searchContent(MOCK_CONTENT, {
      query: searchQuery,
      languageId,
      category: selectedCategory,
    }),
    [languageId, searchQuery, selectedCategory]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="fixed inset-0 z-[60] bg-zinc-950/98 backdrop-blur-3xl overflow-hidden flex flex-col"
    >
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto p-6 md:p-12">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
            <div className="flex items-center gap-6">
              <button
                onClick={onClose}
                className="w-12 h-12 glass rounded-full flex items-center justify-center hover:bg-white/20 transition-all shadow-lg"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-4xl font-display font-bold tracking-tight">Digital Library</h2>
                <p className="text-white/30 text-sm mt-1">Preserve and explore Namibian heritage</p>
              </div>
            </div>

            <div className="flex flex-1 max-w-lg relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Search size={20} className="text-white/20 group-focus-within:text-amber-500 transition-colors" />
              </div>
              <input
                id="library-search-input"
                type="text"
                placeholder="Search resources, authors, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-14 pr-6 glass rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-base bg-white/5"
              />
            </div>
            
            {(selectedCategory || searchQuery) && (
              <button
                id="btn-reset-filters"
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery('');
                }}
                className="text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-widest px-4 py-2 bg-amber-500/10 rounded-xl"
              >
                Reset Filters
              </button>
            )}
          </header>

          {/* Folders View */}
          {!selectedCategory && !searchQuery ? (
            <div id="category-folders" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {CATEGORIES.map((cat, idx) => {
                const Icon = ICON_MAP[cat];
                const count = MOCK_CONTENT.filter(i => i.category === cat && (languageId === 'all' || i.languageId === languageId)).length;
                
                return (
                  <motion.button
                    key={cat}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    onClick={() => setSelectedCategory(cat)}
                    className="group relative aspect-[4/5] glass rounded-[2.5rem] p-10 flex flex-col shadow-2xl overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8">
                      <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-all shadow-inner">
                        <Icon size={24} />
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="relative mb-6">
                        <Folder size={96} className="text-amber-500/20 group-hover:text-amber-500/40 transition-colors -ml-4" />
                        <Icon size={32} className="absolute bottom-4 left-4 text-white/50 group-hover:text-white transition-all transform group-hover:scale-110" />
                      </div>
                      <h3 className="text-2xl font-bold mb-1">{cat}</h3>
                      <p className="text-sm font-bold text-white/30 uppercase tracking-widest">{count} Items Available</p>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
                  </motion.button>
                );
              })}
            </div>
          ) : (
            /* Items Grid */
            <div id="content-items-container" className="space-y-12">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                  {selectedCategory && (
                    <button 
                      onClick={() => setSelectedCategory(null)}
                      className="text-xs font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-tighter"
                    >
                      Library <ChevronRight size={14} className="inline-block" /> {selectedCategory}
                    </button>
                  )}
                </div>
                <div className="text-sm text-white/40">
                  Showing <span className="text-white font-bold">{filteredContent.length}</span> resources
                </div>
              </div>

              {filteredContent.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-center space-y-6 glass rounded-[3rem]">
                  <div className="p-8 bg-white/5 rounded-full">
                    <Search size={48} className="text-white/20" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4">No resources found</h3>
                    <p className="text-white/40 max-w-sm mx-auto">Try adjusting your search terms or filters to find what you're looking for.</p>
                  </div>
                  <button 
                    onClick={() => {setSearchQuery(''); setSelectedCategory(null);}}
                    className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-all"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div id="items-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredContent.map((item, idx) => {
                    const Icon = ICON_MAP[item.category];
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (idx % 12) * 0.05 }}
                        className="group relative flex flex-col glass rounded-[2rem] p-6 hover:bg-white/10 transition-all shadow-xl cursor-default"
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="flex items-start justify-between mb-8">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all shadow-lg",
                            item.category === 'Audio' ? "bg-red-500/20 text-red-400" :
                            item.category === 'Articles' ? "bg-blue-500/20 text-blue-400" :
                            item.category === 'Video' ? "bg-green-500/20 text-green-400" :
                            "bg-amber-500/20 text-amber-500"
                          )}>
                            <Icon size={28} />
                          </div>
                          
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button className="p-2 glass rounded-lg hover:bg-white/20 transition-all" title="Fast Play">
                              {item.category === 'Audio' ? <Play size={16} /> : <Eye size={16} />}
                            </button>
                            <button className="p-2 glass rounded-lg hover:bg-white/20 transition-all" title="Download">
                              <Download size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-2xl font-bold tracking-tight leading-tight group-hover:text-amber-500 transition-colors line-clamp-2">
                            {item.title}
                          </h4>
                          <p className="text-white/40 text-sm line-clamp-3 leading-relaxed mb-6">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">
                              {item.languageId}
                            </span>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <div className="flex items-center gap-1.5 text-white/30 text-[10px] font-bold">
                              <Clock size={12} />
                              5 MIN READ
                            </div>
                          </div>
                          
                          <button className="text-white/30 hover:text-white transition-colors">
                            <MoreVertical size={18} />
                          </button>
                        </div>

                        {/* Hover Overlay Action */}
                        <div className="absolute inset-0 bg-amber-500 opacity-0 group-hover:opacity-5 transition-all rounded-[2rem] pointer-events-none" />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Details Modal Overlay */}
      <AnimatePresence>
        {selectedItem && (
          <ContentDetails 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ChevronRight = ({ size, className }: { size: number, className: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
