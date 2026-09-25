import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, SendHorizonal, CheckCircle2 } from 'lucide-react';
import { ContentItem } from '../types';
import { useShareRequests } from '../contexts/ShareRequestsContext';

interface ShareRequestModalProps {
  item: ContentItem;
  onClose: () => void;
}

export const ShareRequestModal: React.FC<ShareRequestModalProps> = ({ item, onClose }) => {
  const { submitRequest } = useShareRequests();
  const [affiliation, setAffiliation] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const isComplete = affiliation.trim() && reason.trim();

  const handleSubmit = async () => {
    if (!isComplete || loading) return;
    setLoading(true);
    // Folded into one text field for now since share requests are still on
    // an in-memory mock store (see lib/api/shareRequests.ts) rather than a
    // real table — keeps this readable in the admin Share Requests tab
    // without needing a schema change there too.
    const combined = `Affiliation / Institution: ${affiliation.trim()}\n\n${reason.trim()}`;
    await submitRequest(item.id, item.title, combined);
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
            {!submitted ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 className="text-2xl font-bold mb-1">Request Share Access</h3>
                <p className="text-white/50 text-sm mb-1 truncate">"{item.title}"</p>
                <p className="text-white/30 text-xs mb-6">
                  Describe your intended use. An admin will review your request and generate a secure share link if approved.
                </p>

                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                  Affiliation / Institution
                </label>
                <input
                  type="text"
                  value={affiliation}
                  onChange={e => setAffiliation(e.target.value)}
                  placeholder="e.g. University of Namibia, Linguistics Department"
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors mb-4"
                />

                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                  Purpose / Reason
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Educational research on Oshiwambo phonology for my university thesis."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-amber-500/50 transition-colors mb-6"
                />

                <button
                  onClick={handleSubmit}
                  disabled={!isComplete || loading}
                  className="w-full h-12 bg-amber-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-amber-400 active:scale-[0.98]"
                >
                  <SendHorizonal size={18} />
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-green-500/20 rounded-full">
                    <CheckCircle2 size={48} className="text-green-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">Request Submitted</h3>
                <p className="text-white/40 text-sm mb-8">
                  An admin will review your request. The share link will appear on this content once approved.
                </p>
                <button
                  onClick={onClose}
                  className="w-full h-12 bg-white text-black font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
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
