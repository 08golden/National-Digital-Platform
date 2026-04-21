import React from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { LANGUAGES } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

interface LanguageSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

// This component is the dropdown menu in the top-left corner.
// It allows users to pick which Namibian language they want to explore.

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedId, onSelect }) => {
  // "isOpen" keeps track of whether the dropdown menu is currently visible or hidden.
  const [isOpen, setIsOpen] = React.useState(false);
  // We find the language that matches the "selectedId" so we can show its name on the button.
  const selected = LANGUAGES.find(l => l.id === selectedId) || LANGUAGES[0];

  return (
    <div className="relative z-50">
      {/* This is the main button you click to open the menu. */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 glass rounded-full hover:bg-white/20 transition-all text-sm font-medium"
      >
        <Globe size={16} className="text-white/70" />
        <span>{selected.name}</span>
        <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* This part only shows up if "isOpen" is true. */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* This invisible "overlay" closes the menu if you click anywhere else on the screen. */}
            <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
            
            {/* This is the actual list of languages. */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-2 w-56 glass-dark rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      // When a language is clicked, we tell the main app which one was picked.
                      onSelect(lang.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl transition-colors text-sm",
                      selectedId === lang.id 
                        ? "bg-white/20 text-white" 
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <div className="font-semibold">{lang.name}</div>
                    <div className="text-xs opacity-50">{lang.greeting}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

import { cn } from '../lib/utils';
