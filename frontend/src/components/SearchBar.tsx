import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

// This component is the search bar in the middle of the landing page.
// It allows users to type in a query and click "Search" to find items.

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  // "value" keeps track of what the user is currently typing in the input field.
  const [value, setValue] = React.useState('');

  // This function runs when the user clicks the "Search" button or presses "Enter".
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // This stops the page from refreshing.
    if (value.trim()) {
      // If the user typed something, we tell the main app to start searching.
      onSearch(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl group">
      {/* This is the search icon on the left side of the bar. */}
      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
        <Search size={20} className="text-white/40 group-focus-within:text-white/80 transition-colors" />
      </div>
      
      {/* This is the actual input field where the user types. */}
      <input
        type="text"
        placeholder="Search for articles, audio, books..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full h-16 pl-14 pr-32 glass rounded-full text-lg focus:outline-none focus:ring-2 focus:ring-white/30 transition-all placeholder:text-white/30"
      />
      
      {/* This is the "Search" button and the keyboard shortcut hint on the right. */}
      <div className="absolute right-2 inset-y-0 flex items-center gap-2">
        <kbd className="hidden sm:inline-flex h-8 items-center gap-1 rounded border border-white/20 bg-white/10 px-2 font-mono text-[10px] font-medium text-white/50">
          <span className="text-xs">⌘</span>K
        </kbd>
        <button
          type="submit"
          className="h-12 px-6 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
};
