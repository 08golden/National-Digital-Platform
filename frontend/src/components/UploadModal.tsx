import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Loader2, FileCheck, ClipboardList, User, Building2, Languages } from 'lucide-react';
import { Category } from '../types';
import { supabase } from '../lib/supabaseClient';
import { getLanguages } from '../lib/api/languages';
import { CATEGORIES } from '../constants';
import { cn } from '../lib/utils';

interface UploadModalProps {
  onClose: () => void;
}

interface LanguageOption {
  id: string;
  name: string;
}

// This component shows a pop-up window (a "Modal") where users can upload content.
// It has several steps: contribution details, selecting a file/category, and confirmation.
// Note: this modal only opens for users who are already approved contributors or admins
// (see UserMenu) — becoming a contributor happens separately via the Contributor
// Application flow in User Settings.

export const UploadModal: React.FC<UploadModalProps> = ({ onClose }) => {
  // "useState" is how we keep track of things that change in our app.
  // We keep track of the current step and what they selected.
  const [step, setStep] = useState<'details' | 'upload' | 'scanning' | 'result'>('details');
  const [details, setDetails] = useState({
    name: '',
    affiliation: '',
    languageId: '',
    contributionPurpose: '',
  });
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [languagesError, setLanguagesError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    getLanguages()
      .then((data) => setLanguages(data))
      .catch((e) => setLanguagesError(e instanceof Error ? e.message : 'Failed to load languages'));
  }, []);

  const isDetailsComplete = [
    details.name,
    details.affiliation,
    details.languageId,
    details.contributionPurpose,
  ].every(value => value.trim().length > 1);

  const updateDetailField = (field: keyof typeof details, value: string) => {
    setDetails((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // Handle file selection
  const handleFileChange = (file?: File) => {
    if (!file) return;
    setSelectedFile(file);
  };

  // Upload file to Supabase Storage and create a recording via backend
  const handleUpload = async () => {
    if (!selectedCategory || !selectedFile) return;
    setStep('scanning');
    try {
      const fileExt = selectedFile.name.split('.').pop() || 'bin';
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const storagePath = `${selectedCategory.toLowerCase()}/${fileName}`;

      // Upload to 'recordings' bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(storagePath, selectedFile, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // Create DB record via backend API — requireContributor on the
      // backend needs the caller's Supabase access token.
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Your session has expired. Please sign in again.');

      const payload = {
        title: selectedFile.name,
        description: details.contributionPurpose || '',
        language_id: details.languageId,
        storage_path: uploadData.path,
      };

      const BASE_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${BASE_URL}/api/recordings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create recording');
      }

      setUploadProgress(100);
      setStep('result');
    } catch (e) {
      console.error('Upload error', e);
      setStep('upload');
      alert('Upload failed: ' + (e instanceof Error ? e.message : String(e)));
    }
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
            {step === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-6 flex items-start gap-3 sm:gap-4">
                  <div className="rounded-2xl bg-amber-500/15 p-2.5 text-amber-400 sm:p-3">
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <h3 className="pr-8 text-xl font-bold sm:text-2xl">Contribution Details</h3>
                    <p className="mt-1 text-sm text-white/50">
                      Tell us about this contribution before uploading the file.
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
                      value={details.name}
                      onChange={(e) => updateDetailField('name', e.target.value)}
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
                      value={details.affiliation}
                      onChange={(e) => updateDetailField('affiliation', e.target.value)}
                      placeholder="e.g. University of Namibia"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none transition-all placeholder:text-white/25 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/35">
                      <Languages size={14} />
                      Language
                    </span>
                    <select
                      value={details.languageId}
                      onChange={(e) => updateDetailField('languageId', e.target.value)}
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none transition-all focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                    >
                      <option value="" className="bg-zinc-900">Select a language...</option>
                      {languages.map((lang) => (
                        <option key={lang.id} value={lang.id} className="bg-zinc-900">{lang.name}</option>
                      ))}
                    </select>
                    {languagesError && (
                      <span className="mt-1 block text-xs text-red-400">{languagesError}</span>
                    )}
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/35">
                      <ClipboardList size={14} />
                      Contribution purpose
                    </span>
                    <textarea
                      value={details.contributionPurpose}
                      onChange={(e) => updateDetailField('contributionPurpose', e.target.value)}
                      placeholder="Briefly describe the content and why it belongs on the platform."
                      className="min-h-24 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 text-sm outline-none transition-all placeholder:text-white/25 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </label>
                </div>

                <button
                  onClick={() => setStep('upload')}
                  disabled={!isDetailsComplete}
                  className="mt-6 h-12 w-full rounded-xl bg-white font-bold text-black transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:mt-8"
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
                    onClick={() => setStep('details')}
                    className="w-full rounded-xl border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/45 transition-colors hover:bg-white/10 hover:text-white sm:w-auto"
                  >
                    Edit details
                  </button>
                </div>

                <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Contribution Summary</div>
                  <div className="mt-2 grid gap-2 text-sm text-white/65 sm:grid-cols-2">
                    <span className="truncate">{details.name}</span>
                    <span className="truncate">{details.affiliation}</span>
                    <span className="truncate">{languages.find(l => l.id === details.languageId)?.name || details.languageId}</span>
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
                  <input
                    type="file"
                    accept="audio/*,video/*,text/*"
                    onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : undefined)}
                    className="mt-2 w-full text-sm text-white/40"
                  />
                  {selectedFile && (
                    <div className="mt-2 text-xs text-white/60">Selected: {selectedFile.name}</div>
                  )}
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
                <h3 className="text-2xl font-bold mb-2">Uploading...</h3>
                <p className="text-white/40 text-sm">Saving your file to storage and creating the record</p>
                
                <div className="mt-8 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: uploadProgress === 100 ? '100%' : '70%' }}
                    transition={{ duration: 1.2 }}
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
                <h3 className="text-2xl font-bold mb-2">Upload Complete!</h3>
                <p className="text-white/40 text-sm mb-8">
                  Your contribution has been saved and is now pending moderation.
                </p>
                
                <div className="glass rounded-2xl p-6 mb-8 text-left">
                  <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Submitted</div>
                  <div className="text-xl font-display font-bold truncate">{selectedFile?.name}</div>
                  <div className="text-sm text-white/40 mt-2">
                    {selectedCategory} · {languages.find(l => l.id === details.languageId)?.name || 'Unknown language'}
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full h-12 bg-white text-black font-bold rounded-xl transition-all"
                >
                  Done
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};