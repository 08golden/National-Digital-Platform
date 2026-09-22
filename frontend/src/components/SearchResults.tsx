import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Music, Video, Book, X, Search as SearchIcon, Globe } from 'lucide-react';
import { Category, ContentItem } from '../types';
import { CATEGORIES, LANGUAGES } from '../constants';
import { cn } from '../lib/utils';
import { searchContent } from '../lib/search';
import { getPublishedContentItems } from '../lib/api/recordings';

interface SearchResultsProps {
  query: string;
  languageId: string;
  onClose: () => void;
}

const ICON_MAP = {
  Articles: FileText,
  Audio: Music,
  Video: Video,
  Books: Book,
};

export const SearchResults: React.FC<SearchResultsProps> = ({ query, languageId, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getPublishedContentItems()
      .then(setContent)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load results.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredResults = useMemo(() => {
    return searchContent(content, {
      query,
      languageId,
      category: activeCategory,
    });
  }, [content, query, languageId, activeCategory]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute top-full left-0 right-0 mt-4 z-[100] glass-dark rounded-3xl shadow-2xl overflow-hidden border border-white/20"
      style={{ maxHeight: '70vh' }}
    >
      {/* Search Header / Filters */}
      <div className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest">
            <SearchIcon size={12} />
            <span>Search Results</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X size={16} className="text-white/40" />
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
              activeCategory === null 
                ? "bg-white text-black" 
                : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5",
                activeCategory === cat 
                  ? "bg-amber-500 text-black" 
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {React.createElement(ICON_MAP[cat], { size: 12 })}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar" style={{ maxHeight: 'calc(70vh - 120px)' }}>
        {loading ? (
          <div className="py-12 text-center text-white/40">Loading...</div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : filteredResults.length > 0 ? (
          filteredResults.map((item) => {
            const lang = LANGUAGES.find(l => l.id === item.languageId);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group cursor-pointer"
              >
                <div className="flex items-center gap-2 text-[10px] text-white/40 mb-1">
                  <Globe size={10} />
                  <span>repository.na › {item.languageId} › {item.category.toLowerCase()}</span>
                </div>
                <h3 className="text-xl font-display font-semibold text-amber-400 group-hover:underline mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-2 py-0.5 border border-white/10 rounded">
                    {item.category}
                  </span>
                  <span className="text-[10px] font-medium text-amber-500/60">
                    {lang?.name} Culture
                  </span>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="py-12 text-center">
            <p className="text-white/40 italic">No results found for your search.</p>
            <button 
              onClick={() => setActiveCategory(null)}
              className="mt-4 text-amber-500 text-sm hover:underline"
            >
              Clear filters and try again
            </button>
          </div>
        )}
      </div>

      {/* Footer link */}
      <div className="bg-white/5 p-4 text-center border-t border-white/10">
        <button 
          onClick={() => {
            onClose();
            // We need a way to trigger LibraryView from here.
            // I'll emit a custom event or use a prop in a real app.
            // For now, I'll just close and let the user click Library.
            window.dispatchEvent(new CustomEvent('open-library'));
          }}
          className="text-xs font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest"
        >
          View all items in full library
        </button>
      </div>
    </motion.div>
  );
};
