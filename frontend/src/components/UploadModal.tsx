import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Loader2, FileCheck, ArrowLeft, Share2, Download, EyeOff } from 'lucide-react';
import { Category, DataUseConsent } from '../types';
import { CATEGORIES } from '../constants';
import { cn } from '../lib/utils';

interface UploadModalProps {
  onClose: () => void;
}

type UploadStep = 'upload' | 'consent' | 'scanning' | 'result';

export const UploadModal: React.FC<UploadModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<UploadStep>('upload');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [consent, setConsent] = useState<DataUseConsent>({
    allowSharing: true,
    allowDownload: true,
  });

  const isPlatformOnly = !consent.allowSharing && !consent.allowDownload;

  const handleContinueToConsent = () => {
    if (!selectedCategory) return;
    setStep('consent');
  };

  const handleStartScanning = () => {
    setStep('scanning');
    setTimeout(() => setStep('result'), 3000);
  };

  const toggleConsent = (field: keyof DataUseConsent) => {
    setConsent(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

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
          <AnimatePresence mode="wait">

            {/* ── Step 1: Upload ── */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-2xl font-bold mb-2">Upload Content</h3>
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
                  onClick={handleContinueToConsent}
                  disabled={!selectedCategory}
                  className="w-full h-12 bg-white text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* ── Step 2: Consent ── */}
            {step === 'consent' && (
              <motion.div
                key="consent"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => setStep('upload')}
                  className="flex items-center gap-1 text-white/40 hover:text-white text-xs mb-6 transition-colors"
                >
                  <ArrowLeft size={14} /> Back
                </button>

                <h3 className="text-2xl font-bold mb-1">Data Use Consent</h3>
                <p className="text-white/50 text-sm mb-8">
                  Choose how others may use your contribution. You can update these later.
                </p>

                <div className="space-y-3 mb-8">
                  {/* Allow sharing */}
                  <button
                    onClick={() => toggleConsent('allowSharing')}
                    className={cn(
                      "w-full p-5 rounded-2xl border text-left transition-all",
                      consent.allowSharing
                        ? "border-amber-500/60 bg-amber-500/10"
                        : "border-white/10 glass hover:border-white/20"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all",
                        consent.allowSharing ? "bg-amber-500" : "bg-white/10"
                      )}>
                        {consent.allowSharing && (
                          <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <Share2 size={14} className="text-amber-500" />
                          Allow sharing
                        </div>
                        <p className="text-xs text-white/40 mt-1">
                          Others may submit a request to share this content externally. Requires admin approval.
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Allow download */}
                  <button
                    onClick={() => toggleConsent('allowDownload')}
                    className={cn(
                      "w-full p-5 rounded-2xl border text-left transition-all",
                      consent.allowDownload
                        ? "border-amber-500/60 bg-amber-500/10"
                        : "border-white/10 glass hover:border-white/20"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all",
                        consent.allowDownload ? "bg-amber-500" : "bg-white/10"
                      )}>
                        {consent.allowDownload && (
                          <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <Download size={14} className="text-amber-500" />
                          Allow download
                        </div>
                        <p className="text-xs text-white/40 mt-1">
                          Others may download this file directly from the platform.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Platform-only indicator */}
                {isPlatformOnly && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 mb-6 rounded-xl bg-white/5 border border-white/10"
                  >
                    <EyeOff size={14} className="text-white/40 shrink-0" />
                    <p className="text-xs text-white/40">
                      Platform view only — this content will not be shareable or downloadable.
                    </p>
                  </motion.div>
                )}

                <button
                  onClick={handleStartScanning}
                  className="w-full h-12 bg-white text-black font-bold rounded-xl transition-all"
                >
                  Start Scanning
                </button>
              </motion.div>
            )}

            {/* ── Step 3: Scanning ── */}
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

            {/* ── Step 4: Result ── */}
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

                <div className="glass rounded-2xl p-6 mb-4 text-left">
                  <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Detected Output</div>
                  <div className="text-2xl font-display font-bold">Oshiherero Article</div>
                  <div className="text-sm text-white/40 mt-2">Confidence: 98.4%</div>
                </div>

                <div className="glass rounded-2xl p-4 mb-8 text-left">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Data Use Policy</div>
                  <div className="flex gap-3">
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-lg font-bold",
                      consent.allowSharing ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-white/30"
                    )}>
                      {consent.allowSharing ? '✓ Sharing allowed' : '✗ No sharing'}
                    </span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-lg font-bold",
                      consent.allowDownload ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-white/30"
                    )}>
                      {consent.allowDownload ? '✓ Download allowed' : '✗ No download'}
                    </span>
                  </div>
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
