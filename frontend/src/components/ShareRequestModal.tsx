import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, SendHorizonal, CheckCircle2, Copy, Check, Clock, XCircle } from 'lucide-react';
import { ContentItem, ShareRequest } from '../types';
import { useShareRequests } from '../contexts/ShareRequestsContext';

interface ShareRequestModalProps {
  item: ContentItem;
  existingRequest?: ShareRequest;
  onClose: () => void;
}

export const ShareRequestModal: React.FC<ShareRequestModalProps> = ({ item, existingRequest, onClose }) => {
  const { submitRequest } = useShareRequests();
  const [affiliation, setAffiliation] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isComplete = affiliation.trim() && reason.trim();

  const handleSubmit = async () => {
    if (!isComplete || loading) return;
    setLoading(true);
    // Folded into one text field for now since the affiliation/reason split
    // exists in the UI but not as separate columns on share_requests yet —
    // keeps this readable in the admin Share Requests tab without another
    // schema change for what's currently just a display concern.
    const combined = `Affiliation / Institution: ${affiliation.trim()}\n\n${reason.trim()}`;
    await submitRequest(item.id, item.title, combined);
    setSubmitted(true);
    setLoading(false);
  };

  const shareUrl = existingRequest?.shareToken
    ? `${window.location.origin}/share/${existingRequest.shareToken}`
    : '';

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — the link is still shown as selectable text below
    }
  };

  // An existing request (of any status) means the person already asked —
  // show what's actually happening instead of the blank submit form again.
  const showExisting = existingRequest && !submitted;

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
            {showExisting && existingRequest!.status === 'approved' ? (
              <motion.div key="approved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-2">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-green-500/20 rounded-full">
                    <CheckCircle2 size={48} className="text-green-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">Access Granted</h3>
                <p className="text-white/50 text-sm mb-6">
                  Your request for "{item.title}" was approved. This link is tied to your account —
                  it won't work for anyone you forward it to.
                </p>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 mb-6">
                  <code className="flex-1 truncate text-left text-xs text-amber-300">{shareUrl}</code>
                  <button
                    onClick={copyLink}
                    className="shrink-0 rounded-xl bg-white/10 p-2 hover:bg-white/20 transition-colors"
                    title="Copy link"
                  >
                    {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>
                <button
                  onClick={onClose}
                  className="w-full h-12 bg-white text-black font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Done
                </button>
              </motion.div>
            ) : showExisting && existingRequest!.status === 'pending' ? (
              <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-4">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-amber-500/20 rounded-full">
                    <Clock size={48} className="text-amber-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">Request Pending</h3>
                <p className="text-white/40 text-sm mb-8">
                  Submitted {new Date(existingRequest!.requestedAt).toLocaleDateString()}. An admin still needs to review it —
                  the link will appear here once it's approved.
                </p>
                <button
                  onClick={onClose}
                  className="w-full h-12 bg-white text-black font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Done
                </button>
              </motion.div>
            ) : showExisting && existingRequest!.status === 'rejected' ? (
              <motion.div key="rejected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-4">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-red-500/20 rounded-full">
                    <XCircle size={48} className="text-red-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">Request Declined</h3>
                <p className="text-white/40 text-sm mb-8">
                  Your previous request for this item wasn't approved. Contact an administrator if you'd like to discuss it.
                </p>
                <button
                  onClick={onClose}
                  className="w-full h-12 bg-white text-black font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Done
                </button>
              </motion.div>
            ) : !submitted ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 className="text-2xl font-bold mb-1">Request Share Access</h3>
                <p className="text-white/50 text-sm mb-1 truncate">"{item.title}"</p>
                <p className="text-white/30 text-xs mb-6">
                  Describe your intended use. An admin will review your request and generate a secure access link if approved.
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
                  An admin will review your request. The access link will appear here once approved.
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
