import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Loader2, FileCheck, ClipboardList, User, Building2, Languages, Tag } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { getLanguages } from '../lib/api/languages';
import { getCategoryTree, getTopics, CategoryNode, Topic, MediaKind } from '../lib/api/categories';
import { createTranscript } from '../lib/api/transcripts';
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

const MEDIA_KIND_RULES: Record<MediaKind, { accept: string; test: (f: File) => boolean; hint: string }> = {
  document: {
    accept: '.pdf,.doc,.docx,.txt,.epub,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/epub+zip',
    test: (f) => /\.(pdf|docx?|txt|epub)$/i.test(f.name) || f.type === 'application/pdf' || f.type.startsWith('text/') || f.type === 'application/epub+zip',
    hint: 'This should be a PDF, Word document, text, or EPUB file.',
  },
  audio: {
    accept: 'audio/*,.mp3,.wav,.m4a',
    test: (f) => f.type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg)$/i.test(f.name),
    hint: 'This should be an audio file (MP3, WAV, M4A...).',
  },
  video: {
    accept: 'video/*,.mp4,.mov,.mkv',
    test: (f) => f.type.startsWith('video/') || /\.(mp4|mov|mkv|webm)$/i.test(f.name),
    hint: 'This should be a video file (MP4, MOV...).',
  },
  dataset: {
    accept: '.csv,.json,.tsv,.txt,.zip,text/csv,application/json,text/tab-separated-values,application/zip',
    test: (f) => /\.(csv|json|tsv|txt|zip)$/i.test(f.name),
    hint: 'This should be a data file (CSV, JSON, TSV, or a ZIP of files).',
  },
};

export const UploadModal: React.FC<UploadModalProps> = ({ onClose }) => {
  // Who is contributing is already known from signup/profile — don't ask
  // for it again on every upload. Affiliation isn't collected at signup, so
  // it's asked once here and then remembered on the profile.
  const { appUser, refreshAppUser } = useAuth();
  const contributorName = appUser?.display_name || appUser?.username || 'you';
  const savedAffiliation: string = appUser?.metadata?.affiliation || '';

  // "useState" is how we keep track of things that change in our app.
  // We keep track of the current step and what they selected.
  const [step, setStep] = useState<'details' | 'upload' | 'scanning' | 'result'>('details');
  const [details, setDetails] = useState({
    affiliation: savedAffiliation,
    languageId: '',
    contributionPurpose: '',
    title: '',
    transcript: '',
  });
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [languagesError, setLanguagesError] = useState('');

  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [categoryError, setCategoryError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<CategoryNode | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<CategoryNode | null>(null);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  const [allowDownload, setAllowDownload] = useState(true);
  const [allowSharing, setAllowSharing] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    getLanguages()
      .then((data) => setLanguages(data))
      .catch((e) => setLanguagesError(e instanceof Error ? e.message : 'Failed to load languages'));
    getCategoryTree()
      .then(setCategoryTree)
      .catch((e) => setCategoryError(e instanceof Error ? e.message : 'Failed to load categories'));
    getTopics()
      .then(setTopics)
      .catch(() => {});
  }, []);

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((current) =>
      current.includes(id) ? current.filter((t) => t !== id) : [...current, id]
    );
  };

  const isDetailsComplete = [
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
  const [fileError, setFileError] = useState('');

  // Turns "Land_and_landscape_in_Otjiherero_oral_culture.pdf" into a
  // readable starting point ("Land and landscape in Otjiherero oral
  // culture") instead of the item's title being the raw filename forever —
  // this is just a suggestion though; the Title field below is editable
  // and that's what actually gets saved, not this guess.
  const suggestTitleFromFilename = (filename: string) =>
    filename
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const handleFileChange = (file?: File) => {
    setFileError('');
    if (!file) return;
    if (selectedSubtype?.mediaKind) {
      const rule = MEDIA_KIND_RULES[selectedSubtype.mediaKind];
      if (!rule.test(file)) {
        setFileError(`"${file.name}" doesn't look right for ${selectedSubtype.name}. ${rule.hint}`);
        setSelectedFile(null);
        return;
      }
    }
    setSelectedFile(file);
    // Only suggest if they haven't typed a title yet — never clobber
    // something they already wrote.
    if (!details.title.trim()) {
      updateDetailField('title', suggestTitleFromFilename(file.name));
    }
  };

  // Upload file to Supabase Storage and create a recording via backend
  const handleUpload = async () => {
    if (!selectedSubtype || !selectedFile) return;
    setStep('scanning');
    try {
      const fileExt = selectedFile.name.split('.').pop() || 'bin';
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const storagePath = `${selectedSubtype.slug}/${fileName}`;

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
        title: details.title.trim() || selectedFile.name,
        description: details.contributionPurpose || '',
        language_id: details.languageId,
        storage_path: uploadData.path,
        category_id: selectedSubtype.id,
        topic_ids: selectedTopicIds,
        allow_download: allowDownload,
        allow_sharing: allowSharing,
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

      const { data: recordingData } = await res.json();

      // Transcript is optional at upload time — most contributors won't
      // have one ready yet (transcribing audio/video takes real time after
      // the fact). Non-fatal if it fails: the recording itself already
      // succeeded, and a transcript can always be added later from the
      // item's detail page.
      if (details.transcript.trim() && recordingData?.id) {
        try {
          await createTranscript(recordingData.id, {
            content: details.transcript.trim(),
            language_id: details.languageId,
          });
        } catch {
          // non-fatal
        }
      }

      setUploadProgress(100);
      // Remember affiliation so the next upload doesn't ask again (best
      // effort — never fail an otherwise-successful upload over this).
      if (appUser && details.affiliation.trim() && details.affiliation.trim() !== savedAffiliation) {
        try {
          await supabase
            .from('users')
            .update({ metadata: { ...(appUser.metadata || {}), affiliation: details.affiliation.trim() } })
            .eq('id', appUser.id);
          await refreshAppUser();
        } catch {
          // ignore
        }
      }
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
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/60">
                    <User size={14} className="text-white/35" />
                    Contributing as <span className="font-semibold text-white">{contributorName}</span>
                  </div>

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
                      title="Saved to your profile — you only need to enter this once"
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
                      About this contribution
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
                    <span className="truncate">{contributorName}</span>
                    <span className="truncate">{details.affiliation}</span>
                    <span className="truncate">{languages.find(l => l.id === details.languageId)?.name || details.languageId}</span>
                  </div>
                </div>
                
                {categoryError && (
                  <p className="mb-4 text-xs text-red-400">{categoryError}</p>
                )}

                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-3">Content Group</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {categoryTree.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => { setSelectedGroup(group); setSelectedSubtype(null); setSelectedFile(null); setFileError(''); }}
                        className={cn(
                          "h-14 rounded-xl border transition-all text-sm font-medium px-3",
                          selectedGroup?.id === group.id
                            ? "bg-amber-500 border-amber-500 text-black"
                            : "glass border-white/10 text-white/60 hover:border-white/30"
                        )}
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {selectedGroup && (
                    <motion.div
                      key={selectedGroup.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-3">
                        {selectedGroup.name} — Type
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedGroup.children.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => { setSelectedSubtype(sub); setSelectedFile(null); setFileError(''); }}
                            className={cn(
                              "h-14 rounded-xl border transition-all text-sm font-medium px-3",
                              selectedSubtype?.id === sub.id
                                ? "bg-amber-500 border-amber-500 text-black"
                                : "glass border-white/10 text-white/60 hover:border-white/30"
                            )}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {topics.length > 0 && (
                  <div className="mb-8">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
                      <Tag size={12} /> Topics (optional)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {topics.map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => toggleTopic(topic.id)}
                          className={cn(
                            "px-4 py-2 rounded-full text-xs font-medium border transition-all",
                            selectedTopicIds.includes(topic.id)
                              ? "bg-amber-500 border-amber-500 text-black"
                              : "border-white/10 text-white/50 hover:border-white/30"
                          )}
                        >
                          {topic.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-8 space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Data-Use Policy</div>
                  <label className="flex items-center justify-between gap-4 text-sm text-white/70">
                    <span>Allow other users to download this directly</span>
                    <input
                      type="checkbox"
                      checked={allowDownload}
                      onChange={(e) => setAllowDownload(e.target.checked)}
                      className="h-5 w-5 accent-amber-500"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-4 text-sm text-white/70">
                    <span>Allow other users to request share access</span>
                    <input
                      type="checkbox"
                      checked={allowSharing}
                      onChange={(e) => setAllowSharing(e.target.checked)}
                      className="h-5 w-5 accent-amber-500"
                    />
                  </label>
                  <p className="text-xs text-white/35">
                    You can restrict access if this content is culturally sensitive or you'd rather review requests individually.
                  </p>
                </div>

                <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 mb-8">
                  <Upload size={32} className="text-white/20" />
                  <p className="text-xs text-white/40 text-center">
                    {selectedSubtype
                      ? `Drag and drop your ${selectedSubtype.name.toLowerCase()} file here or click to browse`
                      : 'Pick a content group and type above first'}
                  </p>
                  <input
                    type="file"
                    accept={selectedSubtype?.mediaKind ? MEDIA_KIND_RULES[selectedSubtype.mediaKind].accept : undefined}
                    disabled={!selectedSubtype}
                    onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : undefined)}
                    className="mt-2 w-full text-sm text-white/40 disabled:opacity-40"
                  />
                  {fileError && (
                    <p className="text-xs text-red-400 text-center">{fileError}</p>
                  )}
                  {selectedFile && !fileError && (
                    <div className="mt-2 text-xs text-white/60">Selected: {selectedFile.name}</div>
                  )}
                </div>

                {selectedFile && (
                  <label className="block mb-8">
                    <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/35">
                      Title
                    </span>
                    <input
                      type="text"
                      value={details.title}
                      onChange={(e) => updateDetailField('title', e.target.value)}
                      placeholder="A readable title — not the filename"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none transition-all placeholder:text-white/25 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                    />
                    <span className="mt-1 block text-xs text-white/25">
                      Suggested from the filename — edit it to something a reader would recognize.
                    </span>
                  </label>
                )}

                {selectedFile && (
                  <label className="block mb-8">
                    <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/35">
                      Transcript (optional)
                    </span>
                    <textarea
                      value={details.transcript}
                      onChange={(e) => updateDetailField('transcript', e.target.value)}
                      placeholder="If you already have a transcript ready, paste it here. You can also add or edit this later from the item's page."
                      className="min-h-28 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 text-sm outline-none transition-all placeholder:text-white/25 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                    />
                    <span className="mt-1 block text-xs text-white/25">
                      Reviewed by an admin before it's shown publicly — leave this blank and add it later if it's not ready.
                    </span>
                  </label>
                )}

                <button
                  onClick={handleUpload}
                  disabled={!selectedSubtype || !selectedFile || !details.title.trim()}
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
                  <div className="text-xl font-display font-bold truncate">{details.title.trim() || selectedFile?.name}</div>
                  <div className="text-sm text-white/40 mt-2">
                    {selectedSubtype?.name} · {languages.find(l => l.id === details.languageId)?.name || 'Unknown language'}
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