import React from 'react';
import { CATEGORIES } from '../constants';
import { Category } from '../types';
import { cn } from '../lib/utils';
import { FileText, Music, Video, Book } from 'lucide-react';

interface CategoryTabsProps {
  activeCategory: Category | null;
  onSelect: (category: Category | null) => void;
}

const ICON_MAP = {
  Articles: FileText,
  Audio: Music,
  Video: Video,
  Books: Book,
};

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeCategory, onSelect }) => {
  return (
    <div id="category-tabs-container" className="flex items-center gap-2 p-1 glass rounded-full">
      <button
        id="tab-category-all"
        onClick={() => onSelect(null)}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-all",
          activeCategory === null 
            ? "bg-white text-black shadow-lg" 
            : "text-white/60 hover:text-white hover:bg-white/10"
        )}
      >
        All
      </button>
      {CATEGORIES.map((cat) => {
        const Icon = ICON_MAP[cat];
        return (
          <button
            id={`tab-category-${cat.toLowerCase()}`}
            key={cat}
            onClick={() => onSelect(cat)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              activeCategory === cat 
                ? "bg-white text-black shadow-lg" 
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            <Icon size={14} />
            {cat}
          </button>
        );
      })}
    </div>
  );
};
