import React from 'react';
import { motion } from 'motion/react';
import { Folder, FileText, Music, Video, Book, ArrowLeft, Search } from 'lucide-react';
import { Category, ContentItem } from '../types';
import { MOCK_CONTENT, CATEGORIES } from '../constants';
import { cn } from '../lib/utils';

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
// It can show folders for each category, or a list of items if the user is searching.

export const LibraryView: React.FC<LibraryViewProps> = ({ languageId, initialSearchQuery = '', onClose }) => {
  // We use state to remember which folder (category) the user clicked on.
  const [selectedCategory, setSelectedCategory] = React.useState<Category | null>(null);
  // We also remember what the user is currently typing in the search box.
  const [searchQuery, setSearchQuery] = React.useState(initialSearchQuery);

  // This is where we filter our big list of items based on:
  // 1. The selected language
  // 2. The selected category (folder)
  // 3. The search text
  const filteredContent = MOCK_CONTENT.filter(item => {
    const langMatch = languageId === 'all' || item.languageId === languageId;
    const catMatch = !selectedCategory || item.category === selectedCategory;
    const searchMatch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return langMatch && catMatch && searchMatch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[60] bg-zinc-950/95 backdrop-blur-2xl p-6 md:p-12 overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto">
        {/* The top part of the library with the title and search box. */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-3 glass rounded-full hover:bg-white/20 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-3xl font-display font-bold">Digital Library</h2>
          </div>

          <div className="flex flex-1 max-w-md relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={18} className="text-white/40" />
            </div>
            <input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 glass rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm"
            />
          </div>
          
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Back to Folders
            </button>
          )}
        </header>

        {/* If no folder is selected and no search is happening, show the folders. */}
        {!selectedCategory && !searchQuery ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORIES.map((cat) => {
              const Icon = ICON_MAP[cat];
              const count = MOCK_CONTENT.filter(i => i.category === cat && (languageId === 'all' || i.languageId === languageId)).length;
              
              return (
                <motion.button
                  key={cat}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCategory(cat)}
                  className="group relative aspect-square glass rounded-3xl p-8 flex flex-col items-center justify-center gap-4 hover:bg-white/20 transition-all"
                >
                  <div className="relative">
                    <Folder size={80} className="text-amber-400/80 group-hover:text-amber-400 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center pt-2">
                      <Icon size={24} className="text-white/80" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold">{cat}</h3>
                    <p className="text-sm text-white/40">{count} items</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          /* Otherwise, show the list of items. */
          <div className="space-y-8">
            {searchQuery && (
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white/80">
                  {filteredContent.length > 0 
                    ? `Results for "${searchQuery}"` 
                    : `No matches for "${searchQuery}" - showing featured items`}
                </h3>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(filteredContent.length > 0 ? filteredContent : MOCK_CONTENT.slice(0, 6)).map((item) => {
                const Icon = ICON_MAP[item.category];
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass rounded-2xl p-6 hover:bg-white/10 transition-all group cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white/10 rounded-xl group-hover:bg-amber-500/20 group-hover:text-amber-500 transition-all">
                        <Icon size={24} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-white/10 rounded-md">
                        {item.category}
                      </span>
                    </div>
                    <h4 className="text-xl font-semibold mb-2 group-hover:text-amber-500 transition-colors">{item.title}</h4>
                    <p className="text-sm text-white/60 line-clamp-2 mb-4">{item.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-white/30 font-bold uppercase tracking-tighter">
                      <span>Language:</span>
                      <span className="text-white/60">{item.languageId}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
