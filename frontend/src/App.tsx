// App.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Library, Upload as UploadIcon, Info, LayoutGrid, Sparkles } from 'lucide-react';
import { LanguageSelector } from './components/LanguageSelector';
import { GreetingAnimation } from './components/GreetingAnimation';
import { SearchBar } from './components/SearchBar';
import { CategoryTabs } from './components/CategoryTabs';
import { LibraryView } from './components/LibraryView';
import { UploadModal } from './components/UploadModal';
import { AuthGate } from './components/AuthGate';
import { AdminPanel } from './components/AdminPanel';
import { UserMenu } from './components/UserMenu';
import { UserSettings } from './components/UserSettings';
import { LANGUAGES } from './constants';
import { useAuth } from './contexts/AuthContext';
import { AppUser, Category } from './types';

export default function App() {
  const { appUser, signOut, loading } = useAuth();
  const [selectedLanguageId, setSelectedLanguageId] = useState('all');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowLibrary(true);
  };

  const handleCategorySelect = (category: Category | null) => {
    setActiveCategory(category);
    setSearchQuery('');
    setShowLibrary(true);
  };

  const handleLogout = async () => {
    await signOut();
    setShowAdminPanel(false);
    setShowLibrary(false);
    setShowSettings(false);
  };

  const selectedLanguage = LANGUAGES.find(l => l.id === selectedLanguageId) || LANGUAGES[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500" />
      </div>
    );
  }

  if (!appUser) {
    return <AuthGate />;
  }

  if (!appUser.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <p>Your account has been deactivated. Contact an administrator.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden selection:bg-white selection:text-black">
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
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/50 z-20" />
          <img
            src={selectedLanguage.bgImage}
            alt={selectedLanguage.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-30 min-h-screen flex flex-col">
        <header className="p-6 md:p-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-black shadow-xl">
                <Sparkles size={24} />
              </div>
              <h1 className="text-xl font-display font-bold tracking-tight hidden sm:block">Namibia Repo</h1>
            </motion.div>
            
            <div className="h-8 w-px bg-white/10 mx-2 hidden md:block" />
            
            <LanguageSelector 
              selectedId={selectedLanguageId} 
              onSelect={setSelectedLanguageId} 
            />
          </div>
          
          <div className="hidden lg:block">
            <CategoryTabs 
              activeCategory={activeCategory} 
              onSelect={handleCategorySelect} 
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowLibrary(true)}
              className="group flex items-center gap-2 px-5 py-2.5 glass rounded-full hover:bg-white/20 transition-all text-sm font-bold border border-white/5 active:scale-95"
            >
              <LayoutGrid size={18} className="text-amber-500 group-hover:rotate-90 transition-transform duration-500" />
              <span>Library</span>
            </button>

            <UserMenu 
              user={appUser}
              onLogout={handleLogout}
              onOpenUpload={() => setShowUpload(true)}
              onOpenAdmin={() => setShowAdminPanel(true)}
              onOpenSettings={() => setShowSettings(true)}
              hasPendingUsers={false}
            />
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
            className="w-full flex flex-col items-center gap-14"
          >
            <GreetingAnimation languageId={selectedLanguageId} />
            
            <div className="w-full flex flex-col items-center gap-8">
              <SearchBar onSearch={handleSearch} />
              
              <div className="flex flex-wrap justify-center gap-4">
                {['Culture', 'Linguistics', 'History', 'Music'].map((tag, idx) => (
                  <motion.button 
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 + (idx * 0.1) }}
                    onClick={() => handleSearch(tag)}
                    className="px-6 py-2 glass rounded-full text-xs font-bold text-white/40 hover:text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all border border-transparent flex items-center gap-2 group"
                  >
                    <span className="text-amber-500 opacity-50 group-hover:opacity-100">#</span>
                    {tag}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </main>

        <footer className="p-8 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex flex-col gap-4">
            {(appUser.role === 'admin' || appUser.role === 'contributor') && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUpload(true)}
                className="group flex items-center gap-4 p-2.5 glass rounded-full hover:bg-amber-500 hover:text-black transition-all pr-8 shadow-2xl"
              >
                <div className="p-3.5 bg-white/10 rounded-full group-hover:bg-black/10">
                  <UploadIcon size={24} />
                </div>
                <span className="font-bold text-base">Contribute Content</span>
              </motion.button>
            )}
          </div>

          <div className="max-w-md text-right">
            <div className="flex items-center justify-end gap-2 text-white/30 mb-2">
              <Info size={16} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Context: {selectedLanguage.name}</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed italic font-serif">
              "{selectedLanguage.cultureDescription}"
            </p>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {showLibrary && (
          <LibraryView 
            languageId={selectedLanguageId} 
            initialSearchQuery={searchQuery}
            initialCategory={activeCategory}
            onCategoryChange={setActiveCategory}
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
        {showAdminPanel && (
          <AdminPanel 
            onClose={() => setShowAdminPanel(false)}
          />
        )}
        {showSettings && (
          <UserSettings onClose={() => setShowSettings(false)} user={appUser} />
        )}
      </AnimatePresence>

      <div className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
        <CategoryTabs 
          activeCategory={activeCategory} 
          onSelect={handleCategorySelect} 
        />
      </div>
    </div>
  );
}
