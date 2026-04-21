import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Library, Upload as UploadIcon, Info } from 'lucide-react';
import { LanguageSelector } from './components/LanguageSelector';
import { GreetingAnimation } from './components/GreetingAnimation';
import { SearchBar } from './components/SearchBar';
import { CategoryTabs } from './components/CategoryTabs';
import { LibraryView } from './components/LibraryView';
import { UploadModal } from './components/UploadModal';
import { LANGUAGES } from './constants';
import { Category } from './types';
import { cn } from './lib/utils';

// This is the main "App" component. 
// It manages the state (the current information) of the entire app.

export default function App() {
  // We use "useState" to remember things that change while the app is running.
  // 1. Which language is currently selected?
  const [selectedLanguageId, setSelectedLanguageId] = useState('all');
  // 2. Which category (Articles, Audio, etc.) is active?
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  // 3. Should we show the Library view?
  const [showLibrary, setShowLibrary] = useState(false);
  // 4. Should we show the Upload window?
  const [showUpload, setShowUpload] = useState(false);
  // 5. What is the user searching for?
  const [searchQuery, setSearchQuery] = useState('');
  // 6. Has the app finished loading?
  const [isLoaded, setIsLoaded] = useState(false);

  // We find the language object that matches the selected ID.
  const selectedLanguage = LANGUAGES.find(l => l.id === selectedLanguageId) || LANGUAGES[0];

  // This runs once when the app starts.
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // This function handles what happens when a user searches for something.
  const handleSearch = (query: string) => {
    setSearchQuery(query); // Remember the search text
    setShowLibrary(true);   // Open the library to show results
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden selection:bg-white selection:text-black">
      {/* Dynamic Background: This changes when you pick a different language. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedLanguageId}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="fixed inset-0 z-0"
        >
          <div className="absolute inset-0 bg-black/40 z-10" />
          <div 
            className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/50 z-20" 
          />
          <img
            src={selectedLanguage.bgImage}
            alt={selectedLanguage.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </AnimatePresence>

      {/* Main Content Layer: This is where all the buttons and text are. */}
      <div className="relative z-30 min-h-screen flex flex-col">
        {/* Header: The top part with the language picker and library button. */}
        <header className="p-6 flex items-center justify-between">
          <LanguageSelector 
            selectedId={selectedLanguageId} 
            onSelect={setSelectedLanguageId} 
          />
          
          <div className="hidden md:block">
            <CategoryTabs 
              activeCategory={activeCategory} 
              onSelect={setActiveCategory} 
            />
          </div>

          <button
            onClick={() => setShowLibrary(true)}
            className="flex items-center gap-2 px-4 py-2 glass rounded-full hover:bg-white/20 transition-all text-sm font-medium"
          >
            <Library size={16} />
            <span>Library</span>
          </button>
        </header>

        {/* Center Search Area: The middle part with the greeting and search bar. */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="w-full flex flex-col items-center gap-12"
          >
            <GreetingAnimation languageId={selectedLanguageId} />
            
            <div className="w-full flex flex-col items-center gap-6">
              <SearchBar onSearch={handleSearch} />
              
              <div className="flex flex-wrap justify-center gap-3">
                {['Culture', 'Traditions', 'History', 'Folklore'].map((tag) => (
                  <button 
                    key={tag}
                    onClick={() => handleSearch(tag)}
                    className="px-4 py-1.5 glass rounded-full text-xs font-medium text-white/50 hover:text-white hover:bg-white/20 transition-all"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </main>

        {/* Footer: The bottom part with the upload button and cultural info. */}
        <footer className="p-6 flex items-end justify-between">
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setShowUpload(true)}
              className="group flex items-center gap-3 p-2 glass rounded-full hover:bg-amber-500 hover:text-black transition-all pr-6"
            >
              <div className="p-3 bg-white/10 rounded-full group-hover:bg-black/10">
                <UploadIcon size={20} />
              </div>
              <span className="font-bold text-sm">Upload Content</span>
            </button>
          </div>

          <div className="max-w-xs text-right hidden sm:block">
            <div className="flex items-center justify-end gap-2 text-white/40 mb-1">
              <Info size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Cultural Context</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed italic">
              "{selectedLanguage.cultureDescription}"
            </p>
          </div>
        </footer>
      </div>

      {/* Overlays: These are the windows that pop up over the main screen. */}
      <AnimatePresence>
        {showLibrary && (
          <LibraryView 
            languageId={selectedLanguageId} 
            initialSearchQuery={searchQuery}
            onClose={() => {
              setShowLibrary(false);
              setSearchQuery('');
            }} 
          />
        )}
        {showUpload && (
          <UploadModal 
            onClose={() => setShowUpload(false)} 
          />
        )}
      </AnimatePresence>

      {/* Mobile Category Tabs: These only show up on small screens (like phones). */}
      <div className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
        <CategoryTabs 
          activeCategory={activeCategory} 
          onSelect={setActiveCategory} 
        />
      </div>
    </div>
  );
}
