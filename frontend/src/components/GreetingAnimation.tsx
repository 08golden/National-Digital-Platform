import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LANGUAGES } from '../constants';

interface GreetingAnimationProps {
  languageId: string;
}

// This component shows the "Hello" greeting in the middle of the screen.
// If "All Languages" is selected, it cycles through different greetings automatically.

export const GreetingAnimation: React.FC<GreetingAnimationProps> = ({ languageId }) => {
  // "index" keeps track of which language greeting we are currently showing from our list.
  const [index, setIndex] = useState(0);
  const selectedLanguage = LANGUAGES.find(l => l.id === languageId);
  const greetingLanguages = LANGUAGES.filter(language => language.id !== 'all');

  // "useEffect" is used to run code at specific times.
  // Here, we use it to start a timer that changes the greeting every 2.5 seconds.
  useEffect(() => {
    setIndex(0);

    // If the user has picked a specific language, we don't need the timer.
    if (languageId !== 'all') return;

    const interval = setInterval(() => {
      // We update the index to the next one in the list.
      // The "%" (modulo) operator makes it go back to 0 when it reaches the end.
      setIndex((prev) => (prev + 1) % greetingLanguages.length);
    }, 2500);

    // This "cleanup" function stops the timer if the component is removed from the screen.
    return () => clearInterval(interval);
  }, [languageId, greetingLanguages.length]);

  // We decide which greeting to show based on whether the user picked a language or not.
  const displayGreeting = languageId === 'all' 
    ? greetingLanguages[index]?.greeting || 'Hello'
    : selectedLanguage?.greeting || 'Hello';

  return (
    <div className="h-24 flex items-center justify-center overflow-hidden">
      {/* "AnimatePresence" handles the smooth fading in and out of the text. */}
      <AnimatePresence mode="wait">
        <motion.h1
          key={displayGreeting}
          initial={{ y: 40, opacity: 0, filter: 'blur(10px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -40, opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="text-6xl md:text-8xl font-display font-bold tracking-tighter text-white"
        >
          {displayGreeting}
        </motion.h1>
      </AnimatePresence>
    </div>
  );
};
