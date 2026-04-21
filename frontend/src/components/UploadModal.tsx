import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, ShieldCheck, Loader2, FileCheck } from 'lucide-react';
import { Category } from '../types';
import { CATEGORIES } from '../constants';
import { cn } from '../lib/utils';

interface UploadModalProps {
  onClose: () => void;
}

// This component shows a pop-up window (a "Modal") where users can upload content.
// It has several steps: Login, Selecting a Category, Scanning the file, and showing the Result.

export const UploadModal: React.FC<UploadModalProps> = ({ onClose }) => {
  // "useState" is how we keep track of things that change in our app.
  // We keep track of the current step, the user's email/password, and what they selected.
  const [step, setStep] = useState<'login' | 'upload' | 'scanning' | 'result'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isError, setIsError] = useState(false);

  // This function runs when the user clicks "Sign In".
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault(); // This stops the page from refreshing.
    // We check if the email and password match our "hardcoded" (fixed) credentials.
    if (email === 'admin@namibia.org' && password === 'namibia2026') {
      setStep('upload');
      setIsError(false);
    } else {
      setIsError(true);
    }
  };

  // This function runs when the user clicks "Start Scanning".
  const handleUpload = () => {
    if (!selectedCategory) return;
    setStep('scanning');
    // We wait for 3 seconds (3000 milliseconds) to pretend we are scanning the file.
    setTimeout(() => {
      setStep('result');
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* This is the dark background behind the pop-up. Clicking it closes the window. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      {/* This is the actual pop-up box. */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md glass-dark rounded-3xl overflow-hidden shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          {/* "AnimatePresence" helps us animate things when they appear or disappear. */}
          <AnimatePresence mode="wait">
            {step === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-amber-500/20 rounded-2xl">
                    <ShieldCheck size={40} className="text-amber-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-center mb-2">Contributor Login</h3>
                <p className="text-center text-white/40 text-sm mb-8">
                  Please sign in to contribute to the repository.
                  <br />
                  <span className="text-[10px] opacity-50">Hint: admin@namibia.org / namibia2026</span>
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 px-4 glass rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 px-4 glass rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      required
                    />
                  </div>
                  {isError && (
                    <p className="text-red-400 text-xs text-center">Invalid credentials. Try the hint above.</p>
                  )}
                  <button
                    type="submit"
                    className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20"
                  >
                    Sign In
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-2xl font-bold mb-6">Upload Content</h3>
                <p className="text-white/60 text-sm mb-6">Select a category for your contribution.</p>
                
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "h-14 rounded-xl border transition-all text-sm font-medium",
                        selectedCategory === cat
                          ? "bg-amber-500 border-amber-500 text-black"
                          : "glass border-white/10 text-white/60 hover:border-white/30"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 mb-8">
                  <Upload size={32} className="text-white/20" />
                  <p className="text-xs text-white/40 text-center">Drag and drop your file here or click to browse</p>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!selectedCategory}
                  className="w-full h-12 bg-white text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Scanning
                </button>
              </motion.div>
            )}

            {step === 'scanning' && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 flex flex-col items-center justify-center text-center"
              >
                <Loader2 size={48} className="text-amber-500 animate-spin mb-6" />
                <h3 className="text-2xl font-bold mb-2">Scanning...</h3>
                <p className="text-white/40 text-sm">Identifying language and content type</p>
                
                <div className="mt-8 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3 }}
                    className="h-full bg-amber-500"
                  />
                </div>
              </motion.div>
            )}

            {step === 'result' && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-green-500/20 rounded-full">
                    <FileCheck size={48} className="text-green-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">Scan Complete!</h3>
                <p className="text-white/40 text-sm mb-8">The system has successfully categorized your content.</p>
                
                <div className="glass rounded-2xl p-6 mb-8 text-left">
                  <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Detected Output</div>
                  <div className="text-2xl font-display font-bold">Oshiherero Article</div>
                  <div className="text-sm text-white/40 mt-2">Confidence: 98.4%</div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full h-12 bg-white text-black font-bold rounded-xl transition-all"
                >
                  Finish & Submit
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
