import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Loader2, FileCheck, ClipboardList, User, Building2, Languages } from 'lucide-react';
import { Category } from '../types';
import { CATEGORIES } from '../constants';
import { cn } from '../lib/utils';

interface UploadModalProps {
  onClose: () => void;
}

// This component shows a pop-up window (a "Modal") where users can upload content.
// It has several steps: Selecting a Category, Scanning the file, and showing the Result.

export const UploadModal: React.FC<UploadModalProps> = ({ onClose }) => {
  // "useState" is how we keep track of things that change in our app.
  // We keep track of the current step and what they selected.
  const [step, setStep] = useState<'application' | 'upload' | 'scanning' | 'result'>('application');
  const [application, setApplication] = useState({
    name: '',
    affiliation: '',
    languageCommunity: '',
    contributionPurpose: '',
  });
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const isApplicationComplete = [
    application.name,
    application.affiliation,
    application.languageCommunity,
    application.contributionPurpose,
  ].every(value => value.trim().length > 1);

  const updateApplicationField = (field: keyof typeof application, value: string) => {
    setApplication((current) => ({
      ...current,
      [field]: value,
    }));
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
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-4">
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
        className="relative my-4 w-full max-w-xl glass-dark rounded-3xl overflow-hidden shadow-2xl sm:my-0"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="max-h-[calc(100vh-2rem)] overflow-y-auto p-5 custom-scrollbar sm:max-h-[90vh] sm:p-8">
          {/* "AnimatePresence" helps us animate things when they appear or disappear. */}
          <AnimatePresence mode="wait">
            {step === 'application' && (
              <motion.div
                key="application"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-6 flex items-start gap-3 sm:gap-4">
                  <div className="rounded-2xl bg-amber-500/15 p-2.5 text-amber-400 sm:p-3">
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <h3 className="pr-8 text-xl font-bold sm:text-2xl">Contributor Application</h3>
                    <p className="mt-1 text-sm text-white/50">
                      Complete this dummy application before moving to the upload tab.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/35">
                      <User size={14} />
                      Name
                    </span>
                    <input
                      type="text"
                      value={application.name}
                      onChange={(e) => updateApplicationField('name', e.target.value)}
                      placeholder="e.g. Dr. Helena Amutenya"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none transition-all placeholder:text-white/25 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/35">
                      <Building2 size={14} />
                      Affiliation
                    </span>
                    <input
                      type="text"
                      value={application.affiliation}
                      onChange={(e) => updateApplicationField('affiliation', e.target.value)}
                      placeholder="e.g. University of Namibia"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none transition-all placeholder:text-white/25 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/35">
                      <Languages size={14} />
                      Language community
                    </span>
                    <input
                      type="text"
                      value={application.languageCommunity}
                      onChange={(e) => updateApplicationField('languageCommunity', e.target.value)}
                      placeholder="e.g. Oshiwambo"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none transition-all placeholder:text-white/25 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/35">
                      <ClipboardList size={14} />
                      Contribution purpose
                    </span>
                    <textarea
                      value={application.contributionPurpose}
                      onChange={(e) => updateApplicationField('contributionPurpose', e.target.value)}
                      placeholder="Briefly describe the content and why it belongs in the repository."
                      className="min-h-24 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 text-sm outline-none transition-all placeholder:text-white/25 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </label>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-5 text-white/45 sm:mt-8">
                  This is a temporary demo form. It does not save data, submit records, or upload files yet.
                </div>

                <button
                  onClick={() => setStep('upload')}
                  disabled={!isApplicationComplete}
                  className="mt-6 h-12 w-full rounded-xl bg-white font-bold text-black transition-all disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue to Upload
                </button>
              </motion.div>
            )}

            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="pr-8 text-xl font-bold sm:text-2xl">Upload Content</h3>
                    <p className="mt-1 text-sm text-white/60">Select a category for your contribution.</p>
                  </div>
                  <button
                    onClick={() => setStep('application')}
                    className="w-full rounded-xl border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/45 transition-colors hover:bg-white/10 hover:text-white sm:w-auto"
                  >
                    Edit application
                  </button>
                </div>

                <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Application Summary</div>
                  <div className="mt-2 grid gap-2 text-sm text-white/65 sm:grid-cols-2">
                    <span className="truncate">{application.name}</span>
                    <span className="truncate">{application.affiliation}</span>
                    <span className="truncate">{application.languageCommunity}</span>
                    <span className="truncate text-white/35">Demo only</span>
                  </div>
                </div>
                
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
