import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Music, Video, Globe2,
  ArrowLeft, Search, Play, Eye, Download, 
  MoreVertical, Clock, GitBranch, Archive, History,
  UploadCloud, Star, User, ShieldCheck, ChevronRight, SlidersHorizontal, Database
} from 'lucide-react';
import { Category, ContentItem } from '../types';
import { LANGUAGES } from '../constants';
import { cn } from '../lib/utils';
import { searchContent } from '../lib/search';
import { ContentDetails } from './ContentDetails';
import { useAuth } from '../contexts/AuthContext';
import { getPublishedContentItems, resolveLanguageId } from '../lib/api/recordings';
import { getLanguages } from '../lib/api/languages';
import { getCategoryTree, getTopics, CategoryNode, Topic } from '../lib/api/categories';

interface LibraryViewProps {
  languageId: string;
  initialSearchQuery?: string;
  initialCategory?: string | null; // content-group id
  onCategoryChange?: (categoryGroupId: string | null) => void;
  onClose: () => void;
}

const isAudioItem = (item: ContentItem) =>
  item.mediaKind === 'audio' || (!item.mediaKind && item.category === 'Audio');

// Icons/colours/labels follow the item's real media kind and taxonomy type
// (falling back to the legacy flat category only for pre-taxonomy rows), so
// a document retagged as "Story Book" stops showing a music note.
type DisplayKind = 'audio' | 'video' | 'document' | 'dataset';

const displayKind = (item: ContentItem): DisplayKind =>
  item.mediaKind || (item.category === 'Audio' ? 'audio' : item.category === 'Video' ? 'video' : 'document');

const KIND_ICON = { audio: Music, video: Video, document: FileText, dataset: Database };

const KIND_STYLE: Record<DisplayKind, string> = {
  audio: 'border-red-400/20 bg-red-500/10 text-red-300',
  video: 'border-green-400/20 bg-green-500/10 text-green-300',
  document: 'border-blue-400/20 bg-blue-500/10 text-blue-300',
  dataset: 'border-amber-400/20 bg-amber-500/10 text-amber-300',
};

const itemLabel = (item: ContentItem) => item.categorySubtypeName || item.category;

const formatDate = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

type SidebarItem = {
  label: string;
  meta: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  onClick?: () => void;
  active?: boolean;
};

type LibraryScope = 'all' | 'pushed';

// This component shows the "Library" where all the articles, books, etc., are stored.
export const LibraryView: React.FC<LibraryViewProps> = ({
  languageId,
  initialSearchQuery = '',
  initialCategory = null,
  onCategoryChange,
  onClose,
}) => {
  const { appUser } = useAuth();
  const [browseLanguageId, setBrowseLanguageId] = useState(languageId);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialCategory);
  const [selectedSubtypeId, setSelectedSubtypeId] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [libraryScope, setLibraryScope] = useState<LibraryScope>('all');
  const isAdmin = appUser?.role === 'admin';

  const [content, setContent] = useState<ContentItem[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState('');

  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [dbLanguages, setDbLanguages] = useState<{ id: string; name: string; local_name?: string }[]>([]);

  const fetchContent = () => {
    setContentLoading(true);
    setContentError('');
    getPublishedContentItems()
      .then(setContent)
      .catch((e) => setContentError(e instanceof Error ? e.message : 'Failed to load the library.'))
      .finally(() => setContentLoading(false));
  };

  useEffect(() => {
    fetchContent();
    getCategoryTree().then(setCategoryTree).catch(() => {});
    getTopics().then(setTopics).catch(() => {});
    getLanguages().then(setDbLanguages).catch(() => {});
  }, []);

  const updateSelectedGroup = (groupId: string | null) => {
    setLibraryScope('all');
    setSelectedGroupId(groupId);
    setSelectedSubtypeId(null);
    setSelectedTopics([]);
    onCategoryChange?.(groupId);
  };

  const toggleSubtypeFilter = (subtypeId: string) => {
    setLibraryScope('all');
    setSelectedSubtypeId((current) => (current === subtypeId ? null : subtypeId));
  };

  const toggleTopicFilter = (topicName: string) => {
    setLibraryScope('all');
    setSelectedTopics((current) =>
      current.includes(topicName) ? current.filter((t) => t !== topicName) : [...current, topicName]
    );
  };

  const updateBrowseLanguage = (nextLanguageId: string) => {
    setLibraryScope('all');
    setBrowseLanguageId(nextLanguageId);
    updateSelectedGroup(null);
  };

  const searchedContent = useMemo(
    () => searchContent(content, {
      query: searchQuery,
      languageId: browseLanguageId,
      categoryGroupId: selectedGroupId,
      categorySubtypeId: selectedSubtypeId,
      topics: selectedTopics,
    }),
    [content, browseLanguageId, searchQuery, selectedGroupId, selectedSubtypeId, selectedTopics]
  );

  const scopedContent = useMemo(
    () => content.filter(item => browseLanguageId === 'all' || item.languageId === browseLanguageId),
    [content, browseLanguageId]
  );

  // One language list for the whole platform: the same active rows in the
  // `languages` table that the contributor upload dropdown offers. Each
  // option's id goes through resolveLanguageId — the exact function that
  // sets every item's languageId — so item counts and filters line up for
  // any language, including ones added later that the hardcoded home-screen
  // list has never heard of. The constants list now only contributes the
  // decorative greeting text where a name matches.
  const languageOptions = useMemo(() => {
    const fromDb = dbLanguages.map((l) => {
      const id = resolveLanguageId(l.name, l.id);
      const themed = LANGUAGES.find((c) => c.id === id);
      return { id, name: l.name as string, greeting: themed?.greeting || l.local_name || '' };
    });
    return [{ id: 'all', name: 'All Languages', greeting: 'Hello' }, ...fromDb];
  }, [dbLanguages]);

  const LANGUAGE_LABELS = useMemo(
    () => Object.fromEntries(languageOptions.map((l) => [l.id, l.name])) as Record<string, string>,
    [languageOptions]
  );

  const recentlyAccessed = scopedContent.slice(0, 3);
  const lastViewed = [...scopedContent].reverse().slice(0, 3);
  const pushedContent = scopedContent.slice(0, Math.min(2, scopedContent.length));
  const filteredContent = libraryScope === 'pushed'
    ? pushedContent.filter(item => !selectedGroupId || item.categoryGroupId === selectedGroupId)
    : searchedContent;
  const audioQueue = filteredContent.some(item => item.id === selectedItem?.id)
    ? filteredContent.filter(isAudioItem)
    : scopedContent.filter(isAudioItem);
  const selectedAudioIndex = selectedItem && isAudioItem(selectedItem)
    ? audioQueue.findIndex(item => item.id === selectedItem.id)
    : -1;
  const previousAudioItem = selectedAudioIndex > 0 ? audioQueue[selectedAudioIndex - 1] : null;
  const nextAudioItem = selectedAudioIndex >= 0 && selectedAudioIndex < audioQueue.length - 1
    ? audioQueue[selectedAudioIndex + 1]
    : null;

  const sidebarItems: SidebarItem[] = [
    {
      label: 'My repositories',
      meta: `${scopedContent.length} managed`,
      icon: ShieldCheck,
      adminOnly: true,
      active: libraryScope === 'all' && !selectedGroupId && !searchQuery,
      onClick: () => {
        setLibraryScope('all');
        updateSelectedGroup(null);
        setSearchQuery('');
      },
    },
    {
      label: 'Items the user has pushed',
      meta: `${pushedContent.length} recent`,
      icon: UploadCloud,
      adminOnly: true,
      active: libraryScope === 'pushed',
      onClick: () => {
        setLibraryScope('pushed');
        setSearchQuery('');
      },
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="fixed inset-0 z-[60] bg-zinc-950 text-zinc-100 overflow-hidden flex flex-col"
    >
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-5 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <button
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-white/70 transition-all hover:bg-white/10 hover:text-white"
                aria-label="Close library"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/35">
                  <Archive size={14} />
                  Namibian Digital Platform
                </div>
                <h2 className="mt-1 truncate font-display text-2xl font-bold tracking-tight md:text-3xl">Digital Library</h2>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 md:max-w-xl md:flex-row">
              <div className="group relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <Search size={17} className="text-white/30 transition-colors group-focus-within:text-amber-400" />
                </div>
                <input
                  id="library-search-input"
                  type="text"
                  placeholder="Find a repository item..."
                  value={searchQuery}
                  onChange={(e) => {
                    setLibraryScope('all');
                    setSearchQuery(e.target.value);
                  }}
                  className="h-10 w-full rounded-md border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm transition-all placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              {(browseLanguageId !== 'all' || selectedGroupId || selectedTopics.length > 0 || searchQuery || libraryScope !== 'all') && (
                <button
                  id="btn-reset-filters"
                  onClick={() => {
                    setLibraryScope('all');
                    setBrowseLanguageId('all');
                    updateSelectedGroup(null);
                    setSearchQuery('');
                  }}
                  className="h-10 rounded-md border border-white/10 px-4 text-xs font-bold uppercase tracking-widest text-white/65 transition-all hover:bg-white/10 hover:text-white"
                >
                  Reset
                </button>
              )}
            </div>
          </header>

          <div className="grid flex-1 gap-8 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="space-y-6">
              <section className="rounded-md border border-white/10 bg-white/[0.03]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <h3 className="text-sm font-semibold text-white/85">Languages</h3>
                  <span className="text-xs text-white/35">{languageOptions.length - 1}</span>
                </div>
                <div className="p-2">
                  {languageOptions.map((language) => {
                    const count = language.id === 'all'
                      ? content.length
                      : content.filter(item => item.languageId === language.id).length;
                    const isActive = browseLanguageId === language.id;

                    return (
                      <button
                        key={language.id}
                        onClick={() => updateBrowseLanguage(language.id)}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                          isActive ? "bg-amber-500/10 text-amber-200" : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                        )}
                      >
                        <Globe2 size={17} className={cn("shrink-0 text-white/40 group-hover:text-amber-400", isActive && "text-amber-300")} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{language.name}</span>
                          <span className="block truncate text-xs text-white/35">{language.greeting}</span>
                        </span>
                        <span className="text-xs text-white/35">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-md border border-white/10 bg-white/[0.03]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <h3 className="text-sm font-semibold text-white/85">Content type</h3>
                  <span className="text-xs text-white/35">{scopedContent.length}</span>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => updateSelectedGroup(null)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                      !selectedGroupId ? "bg-amber-500/10 text-amber-300" : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    <Archive size={17} />
                    <span className="flex-1">All content</span>
                    <span className="text-xs text-white/35">{scopedContent.length}</span>
                  </button>
                  {categoryTree.map((group) => {
                    const count = scopedContent.filter(i => i.categoryGroupId === group.id).length;
                    return (
                      <button
                        key={group.id}
                        onClick={() => updateSelectedGroup(group.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                          selectedGroupId === group.id ? "bg-amber-500/10 text-amber-300" : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                        )}
                      >
                        <Archive size={17} />
                        <span className="flex-1">{group.name}</span>
                        <span className="text-xs text-white/35">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {topics.length > 0 && (
                <section className="rounded-md border border-white/10 bg-white/[0.03]">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <h3 className="text-sm font-semibold text-white/85">Topics</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3">
                    {topics.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => toggleTopicFilter(topic.name)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          selectedTopics.includes(topic.name)
                            ? "border-amber-500 bg-amber-500/10 text-amber-300"
                            : "border-white/10 text-white/60 hover:border-white/30"
                        )}
                      >
                        {topic.name}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-md border border-white/10 bg-white/[0.03]">
                <div className="border-b border-white/10 px-4 py-3">
                  <h3 className="text-sm font-semibold text-white/85">Library navigation</h3>
                </div>
                <div className="p-2">
                  {sidebarItems
                    .filter(item => !item.adminOnly || isAdmin)
                    .map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          onClick={item.onClick}
                          className={cn(
                            "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-white/[0.06]",
                            item.active && "bg-amber-500/10"
                          )}
                        >
                          <Icon size={17} className={cn("shrink-0 text-white/45 group-hover:text-amber-400", item.active && "text-amber-300")} />
                          <span className="min-w-0 flex-1">
                            <span className={cn("block truncate text-sm font-medium text-white/80", item.active && "text-amber-200")}>{item.label}</span>
                            <span className="block truncate text-xs text-white/35">{item.meta}</span>
                          </span>
                        </button>
                      );
                    })}
                </div>
              </section>

              <section className="space-y-3">
                  <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-white/35">Last viewed</h3>
                <div className="space-y-2">
                  {lastViewed.map((item) => {
                    const Icon = KIND_ICON[displayKind(item)];
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="flex w-full items-start gap-3 rounded-md border border-transparent px-2 py-2 text-left transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                      >
                        <Icon size={15} className="mt-0.5 shrink-0 text-white/35" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-white/75">{item.title}</span>
                          <span className="text-xs text-white/30">{formatDate(item.date) || 'Recently viewed'}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-white/35">Recently accessed items</h3>
                <div className="space-y-2">
                  {recentlyAccessed.map((item) => {
                    const Icon = KIND_ICON[displayKind(item)];
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="flex w-full items-start gap-3 rounded-md border border-transparent px-2 py-2 text-left transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                      >
                        <Icon size={15} className="mt-0.5 shrink-0 text-white/35" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-white/75">{item.title}</span>
                          <span className="text-xs text-white/30">{itemLabel(item)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </aside>

            <main className="min-w-0 space-y-4">
              <div className="flex flex-col gap-4 rounded-md border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
                    <button onClick={() => updateSelectedGroup(null)} className="font-semibold text-white/75 hover:text-amber-300">
                      Digital Library
                    </button>
                    <ChevronRight size={14} />
                    <span className="font-semibold text-white/75">{LANGUAGE_LABELS[browseLanguageId] || browseLanguageId}</span>
                    {selectedGroupId && (
                      <>
                        <ChevronRight size={14} />
                        <span className="font-semibold text-amber-300">
                          {categoryTree.find(g => g.id === selectedGroupId)?.name}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="mt-2 truncate text-xl font-bold tracking-tight">
                    {libraryScope === 'pushed' ? 'Items the user has pushed' : LANGUAGE_LABELS[browseLanguageId] || 'Repository items'}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {categoryTree.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => updateSelectedGroup(selectedGroupId === group.id ? null : group.id)}
                      className={cn(
                        "flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition-colors",
                        selectedGroupId === group.id
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                          : "border-white/10 bg-zinc-900/80 text-white/60 hover:bg-white/[0.06] hover:text-white"
                      )}
                    >
                      <Archive size={15} />
                      {group.name}
                    </button>
                  ))}
                  <button
                    id="btn-toggle-filters"
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition-colors",
                      showFilters || selectedTopics.length > 0
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                        : "border-white/10 bg-zinc-900/80 text-white/60 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    <SlidersHorizontal size={15} />
                    Filters
                    {selectedTopics.length > 0 && (
                      <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black">
                        {selectedTopics.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="flex flex-wrap items-center gap-4 rounded-md border border-white/10 bg-white/[0.03] p-4">
                  {selectedGroupId && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-white/30">Type:</span>
                      {(categoryTree.find(g => g.id === selectedGroupId)?.children || []).map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => toggleSubtypeFilter(sub.id)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs transition-colors",
                            selectedSubtypeId === sub.id
                              ? "border-amber-500 bg-amber-500/10 text-amber-300"
                              : "border-white/10 text-white/60 hover:border-amber-500/40 hover:text-amber-300"
                          )}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {topics.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-white/30">Topic:</span>
                      {topics.map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => toggleTopicFilter(topic.name)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs transition-colors",
                            selectedTopics.includes(topic.name)
                              ? "border-amber-500 bg-amber-500/10 text-amber-300"
                              : "border-white/10 text-white/60 hover:border-amber-500/40 hover:text-amber-300"
                          )}
                        >
                          {topic.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="overflow-hidden rounded-md border border-white/10 bg-white/[0.03]">
                <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.025] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2 text-sm text-white/60">
                    <GitBranch size={16} className="text-amber-400" />
                    <span className="truncate">
                      Showing <span className="font-semibold text-white">{filteredContent.length}</span> resources
                    </span>
                  </div>
                  <div className="hidden items-center gap-2 text-xs text-white/35 sm:flex">
                    <Star size={14} />
                    Updated recently
                  </div>
                </div>

                {contentLoading ? (
                  <div className="flex flex-col items-center justify-center px-6 py-20 text-center text-white/40">
                    Loading library...
                  </div>
                ) : contentError ? (
                  <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                    <h4 className="text-lg font-bold text-red-400">Couldn't load the library</h4>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-white/40">{contentError}</p>
                    <button
                      onClick={fetchContent}
                      className="mt-6 rounded-md bg-white px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-amber-200"
                    >
                      Retry
                    </button>
                  </div>
                ) : filteredContent.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05]">
                      <Search size={28} className="text-white/25" />
                    </div>
                    <h4 className="text-lg font-bold">No resources found</h4>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-white/40">
                      {content.length === 0
                        ? "Nothing has been published yet — approved contributor uploads will appear here."
                        : "Try adjusting your search terms or selected repository type."}
                    </p>
                    {content.length > 0 && (
                      <button
                        onClick={() => { setSearchQuery(''); setBrowseLanguageId('all'); updateSelectedGroup(null); }}
                        className="mt-6 rounded-md bg-white px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-amber-200"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div id="content-items-container" className="divide-y divide-white/10">
                    {filteredContent.map((item, idx) => {
                      const Icon = KIND_ICON[displayKind(item)];
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (idx % 12) * 0.035 }}
                          className="group grid gap-4 px-4 py-4 transition-colors hover:bg-white/[0.045] md:grid-cols-[minmax(0,1fr)_auto]"
                        >
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="min-w-0 text-left"
                          >
                            <div className="flex min-w-0 items-start gap-3">
                              <div className={cn(
                                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border",
                                KIND_STYLE[displayKind(item)]
                              )}>
                                <Icon size={18} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="truncate text-base font-semibold text-white transition-colors group-hover:text-amber-300">
                                    {item.title}
                                  </h4>
                                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/45">
                                    {itemLabel(item)}
                                  </span>
                                </div>
                                <p className="mt-1 line-clamp-2 max-w-3xl text-sm leading-6 text-white/45">
                                  {item.description}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/35">
                                  <span className="flex items-center gap-1.5">
                                    <User size={13} />
                                    {item.author || 'Repository contributor'}
                                  </span>
                                  <span>{LANGUAGE_LABELS[item.languageId] || item.languageId}</span>
                                  <span>{formatDate(item.date) || 'Draft date'}</span>
                                </div>
                              </div>
                            </div>
                          </button>

                          <div className="flex items-center gap-2 pl-12 md:pl-0">
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                              title={displayKind(item) === 'audio' || displayKind(item) === 'video' ? 'Play' : 'View'}
                            >
                              {displayKind(item) === 'audio' || displayKind(item) === 'video' ? <Play size={16} /> : <Eye size={16} />}
                            </button>
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                              title="Open to download"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              className="flex h-9 w-9 items-center justify-center rounded-md text-white/35 transition-colors hover:bg-white/10 hover:text-white"
                              title="More options"
                            >
                              <MoreVertical size={17} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Content Details Modal Overlay */}
      <AnimatePresence>
        {selectedItem && (
          <ContentDetails 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
            previousItem={previousAudioItem}
            nextItem={nextAudioItem}
            hasPrevious={Boolean(previousAudioItem)}
            hasNext={Boolean(nextAudioItem)}
            onPrevious={() => {
              if (previousAudioItem) setSelectedItem(previousAudioItem);
            }}
            onNext={() => {
              if (nextAudioItem) setSelectedItem(nextAudioItem);
            }}
            allItems={content}
            onSelectItem={setSelectedItem}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
