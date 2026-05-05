import React, { useState } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading = false }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (value.trim().length < 2) {
      setError('Please enter at least 2 characters');
      return;
    }

    setError('');
    onSearch(value.trim());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (error && e.target.value.trim().length >= 2) {
      setError('');
    }
  };

  const isEmpty = value.trim().length === 0;

  return (
    <div className="w-full max-w-3xl space-y-3">
      <form 
        onSubmit={handleSubmit} 
        className={cn(
          "relative w-full group transition-all duration-500",
          error ? "scale-[1.02]" : "focus-within:scale-[1.01]"
        )}
      >
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 size={24} className="text-amber-500 animate-spin" />
          ) : (
            <Search size={24} className={cn(
              "transition-colors duration-300",
              error ? "text-red-400" : "text-white/20 group-focus-within:text-amber-500"
            )} />
          )}
        </div>
        
        <input
          id="main-search-input"
          type="text"
          placeholder="Experience the voices of Namibia..."
          value={value}
          onChange={handleInputChange}
          className={cn(
            "w-full h-20 pl-16 pr-40 glass rounded-[2.5rem] text-xl focus:outline-none transition-all duration-300",
            "placeholder:text-white/20 bg-white/5 backdrop-blur-3xl",
            error 
              ? "ring-2 ring-red-500/50 bg-red-500/5" 
              : "focus:ring-2 focus:ring-amber-500/30 focus:bg-white/10"
          )}
        />
        
        <div className="absolute right-3 inset-y-0 flex items-center gap-4">
          {!isEmpty && (
            <kbd className="hidden md:inline-flex h-9 items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 font-mono text-[10px] font-bold text-white/20">
              <span className="text-sm">⌘</span>K
            </kbd>
          )}
          
          <button
            id="btn-search-submit"
            type="submit"
            disabled={isEmpty || isLoading}
            className={cn(
              "h-14 px-10 rounded-full font-display font-bold text-lg transition-all duration-500 flex items-center gap-2",
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
