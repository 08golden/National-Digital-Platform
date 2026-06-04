import React, { useState } from 'react';
import {
  AlertCircle,
  Book,
  ChevronDown,
  FileText,
  Loader2,
  Music,
  Search,
  SlidersHorizontal,
  Video,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { CATEGORIES } from '../constants';
import { Category } from '../types';

interface SearchBarProps {
  onSearch: (query: string, category: Category | null) => void;
  isLoading?: boolean;
}

const ICON_MAP = {
  Articles: FileText,
  Audio: Music,
  Video: Video,
  Books: Book,
};

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading = false }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (value.trim().length < 2) {
      setError('Please enter at least 2 characters');
      return;
    }

    setError('');
    onSearch(value.trim(), selectedCategory);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (error && e.target.value.trim().length >= 2) {
      setError('');
    }
  };

  const isEmpty = value.trim().length === 0;
  const SelectedIcon = selectedCategory ? ICON_MAP[selectedCategory] : SlidersHorizontal;

  return (
    <div className="w-full max-w-3xl space-y-3">
      <form
        onSubmit={handleSubmit}
        className={cn(
          "w-full group rounded-[2rem] glass bg-white/5 p-2 transition-all duration-500 sm:relative sm:rounded-[2.5rem] sm:p-0",
          error ? "scale-[1.02]" : "focus-within:scale-[1.01]"
        )}
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none sm:left-6">
            {isLoading ? (
              <Loader2 size={22} className="text-amber-500 animate-spin sm:size-6" />
            ) : (
              <Search size={22} className={cn(
                "transition-colors duration-300 sm:size-6",
                error ? "text-red-400" : "text-white/25 group-focus-within:text-amber-500"
              )} />
            )}
          </div>

          <input
            id="main-search-input"
            type="text"
            placeholder="Search voices, stories, topics..."
            value={value}
            onChange={handleInputChange}
            className={cn(
              "h-14 w-full rounded-[1.5rem] bg-transparent pl-12 pr-4 text-base focus:outline-none transition-all duration-300 sm:h-20 sm:rounded-[2.5rem] sm:pl-16 sm:pr-72 sm:text-xl",
              "placeholder:text-white/25",
              error
                ? "ring-2 ring-red-500/50 bg-red-500/5"
                : "focus:ring-2 focus:ring-amber-500/30 focus:bg-white/10"
            )}
          />
        </div>

        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:absolute sm:right-3 sm:inset-y-0 sm:mt-0 sm:flex sm:items-center sm:gap-3">
          <div className="relative">
            <button
              id="btn-search-content-filter"
              type="button"
              onClick={() => setIsFilterOpen((open) => !open)}
              className={cn(
                "flex h-12 w-full items-center justify-center gap-2 rounded-full border px-4 text-sm font-bold transition-all sm:h-14 sm:w-auto",
                selectedCategory
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-200"
                  : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white"
              )}
            >
              <SelectedIcon size={16} />
              <span>{selectedCategory || 'All'}</span>
              <ChevronDown size={14} className={cn("transition-transform", isFilterOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-xl"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(null);
                        setIsFilterOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors",
                        selectedCategory === null ? "bg-white text-black" : "text-white/65 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <SlidersHorizontal size={15} />
                      All content
                    </button>
                    {CATEGORIES.map((category) => {
                      const Icon = ICON_MAP[category];
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsFilterOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors",
                            selectedCategory === category ? "bg-white text-black" : "text-white/65 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <Icon size={15} />
                          {category}
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button
            id="btn-search-submit"
            type="submit"
            disabled={isEmpty || isLoading}
            className={cn(
              "h-12 rounded-full px-5 font-display font-bold text-base transition-all duration-500 flex items-center gap-2 sm:h-14 sm:px-10 sm:text-lg",
              isEmpty || isLoading
                ? "bg-white/5 text-white/20 cursor-not-allowed opacity-50"
                : "bg-white text-black hover:bg-amber-500 hover:scale-105 active:scale-95 shadow-xl shadow-black/20"
            )}
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      <div className="h-6 px-6">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-red-400 text-sm font-medium"
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
