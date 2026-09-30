// App.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload as UploadIcon, Info, LayoutGrid } from 'lucide-react';
import { LanguageSelector } from './components/LanguageSelector';
import { GreetingAnimation } from './components/GreetingAnimation';
import { SearchBar } from './components/SearchBar';
import { LibraryView } from './components/LibraryView';
import { UploadModal } from './components/UploadModal';
import { AuthGate } from './components/AuthGate';
import { AdminPanel } from './components/AdminPanel';
import { UserMenu } from './components/UserMenu';
import { UserSettings } from './components/UserSettings';
import { LANGUAGES } from './constants';
import { useAuth } from './contexts/AuthContext';
import { AppUser, Category, ContentItem } from './types';
import { getContributorApplications } from './lib/api/contributorApplications';
import { getShareRequestByToken } from './lib/api/shareRequests';
import { getContentItemById } from './lib/api/recordings';
import { ContentDetails } from './components/ContentDetails';

export default function App() {
  const { appUser, signOut, loading } = useAuth();
  const [selectedLanguageId, setSelectedLanguageId] = useState('all');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingApplications, setPendingApplications] = useState(0);

  // /share/:token — a personal access grant, not a public link (RLS only
  // lets the original requester or an admin resolve the token; someone
  // else receiving the link would see "invalid or expired" below, not the
  // content). See getShareRequestByToken for the full reasoning.
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [sharedItem, setSharedItem] = useState<ContentItem | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');

  useEffect(() => {
    const match = window.location.pathname.match(/^\/share\/([a-f0-9-]{36})\/?$/i);
    if (match) setShareToken(match[1]);
  }, []);

  useEffect(() => {
    if (!shareToken || !appUser) return;
    setShareLoading(true);
    setShareError('');
    (async () => {
      try {
        const request = await getShareRequestByToken(shareToken);
        if (!request || request.requestedBy !== appUser.id) {
          setShareError("This share link is invalid, expired, or wasn't issued to your account.");
          return;
        }
        const item = await getContentItemById(request.contentId);
        if (!item) {
          setShareError('This item is no longer available.');
          return;
        }
        // The whole point of an approved share grant is bypassing the
        // item's own restriction for this one person.
        setSharedItem({ ...item, dataUseConsent: { allowDownload: true, allowSharing: true } });
      } catch (e) {
        setShareError(e instanceof Error ? e.message : 'Failed to load shared content.');
      } finally {
        setShareLoading(false);
      }
    })();
  }, [shareToken, appUser]);

  const closeSharedItem = () => {
    setShareToken(null);
    setSharedItem(null);
    setShareError('');
    window.history.replaceState({}, '', '/');
  };

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (appUser?.role !== 'admin') return;
    getContributorApplications('pending')
      .then(apps => setPendingApplications(apps.length))
      .catch(() => {});
  }, [appUser?.role]);

  const handleSearch = (query: string, category: Category | null = null) => {
    setSearchQuery(query);
    setActiveCategory(category);
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
    const status = appUser.registration_status;
    const message =
      status === 'pending'
        ? "Please hold on while our team reviews your application — you'll be able to sign in as soon as it's approved."
        : status === 'rejected'
        ? "Your application wasn't approved. Contact an administrator if you think this is a mistake."
        : "Your account has been deactivated. Contact an administrator.";
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white px-6 text-center">
        <p>{message}</p>
      </div>
    );
  }

  if (shareToken) {
    if (shareLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500" />
        </div>
      );
    }
    if (shareError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-950 text-white px-6 text-center">
          <p>{shareError}</p>
          <button
            onClick={closeSharedItem}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black"
          >
            Go to the Digital Platform
          </button>
        </div>
      );
    }
    if (sharedItem) {
      return <ContentDetails item={sharedItem} onClose={closeSharedItem} />;
    }
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
        <header className="p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-start sm:gap-6">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center overflow-hidden shadow-xl">
                <img
                  src="/images/repo-logo.png"
                  alt="Namibian Digital Platform logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <h1 className="text-xl font-display font-bold tracking-tight hidden sm:block">Namibian Digital Platform</h1>
            </motion.div>

            <div className="sm:hidden">
              <UserMenu 
                user={appUser}
                onLogout={handleLogout}
                onOpenUpload={() => setShowUpload(true)}
                onOpenAdmin={() => setShowAdminPanel(true)}
                onOpenSettings={() => setShowSettings(true)}
                hasPendingUsers={pendingApplications > 0}
              />
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start sm:gap-6">
            <div className="min-w-0">
              <LanguageSelector 
                selectedId={selectedLanguageId} 
                onSelect={setSelectedLanguageId} 
              />
            </div>
            
            <div className="h-8 w-px bg-white/10 mx-2 hidden md:block" />

            <button
              onClick={() => setShowLibrary(true)}
              className="group flex shrink-0 items-center gap-2 px-4 py-2.5 sm:px-5 glass rounded-full hover:bg-white/20 transition-all text-sm font-bold border border-white/5 active:scale-95"
            >
              <LayoutGrid size={18} className="text-amber-500 group-hover:rotate-90 transition-transform duration-500" />
              <span>Library</span>
            </button>

            <div className="hidden sm:block">
              <UserMenu 
                user={appUser}
                onLogout={handleLogout}
                onOpenUpload={() => setShowUpload(true)}
                onOpenAdmin={() => setShowAdminPanel(true)}
                onOpenSettings={() => setShowSettings(true)}
                hasPendingUsers={pendingApplications > 0}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6 sm:-mt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
            className="w-full flex flex-col items-center gap-14"
          >
            <GreetingAnimation languageId={selectedLanguageId} />
            
            <div className="w-full flex flex-col items-center gap-8">
              <SearchBar onSearch={handleSearch} />
            </div>
          </motion.div>
        </main>

        <footer className="p-4 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
          <div className="flex flex-col gap-4">
            {(appUser.role === 'admin' || appUser.role === 'contributor') && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUpload(true)}
                className="group flex w-full items-center justify-center gap-4 p-2.5 glass rounded-full hover:bg-amber-500 hover:text-black transition-all sm:w-auto sm:justify-start sm:pr-8 shadow-2xl"
              >
                <div className="p-3.5 bg-white/10 rounded-full group-hover:bg-black/10">
                  <UploadIcon size={24} />
                </div>
                <span className="font-bold text-base">Contribute Content</span>
              </motion.button>
            )}
          </div>

          <div className="max-w-md text-left md:text-right">
            <div className="flex items-center justify-start gap-2 text-white/30 mb-2 md:justify-end">
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
            onPendingApplicationsChange={setPendingApplications}
          />
        )}
        {showSettings && (
          <UserSettings onClose={() => setShowSettings(false)} user={appUser} />
        )}
      </AnimatePresence>
    </div>
  );
}
