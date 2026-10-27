import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Globe2, Library, Users, ShieldCheck, Share2, ExternalLink, FileCheck2 } from 'lucide-react';
import { getCategoryTree, CategoryNode } from '../lib/api/categories';
import { getLanguages } from '../lib/api/languages';

interface AboutPageProps {
  onClose: () => void;
}

/**
 * Partner / institution logos. Drop the image files into
 * frontend/public/images/partners/ using these names and they appear here
 * automatically; until then a labelled placeholder is shown. (Logos are not
 * bundled because they belong to the partners and should be supplied by them.)
 */
const PARTNERS = [
  { name: 'UNESCO Chair', file: '/images/partners/unesco-chair.png' },
  { name: 'Partner institution', file: '/images/partners/partner-1.png' },
  { name: 'Partner institution', file: '/images/partners/partner-2.png' },
];

const PartnerLogo: React.FC<{ name: string; file: string }> = ({ name, file }) => {
  const [missing, setMissing] = useState(false);
  return (
    <div className="flex h-24 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      {missing ? (
        <span className="text-center text-xs font-semibold uppercase tracking-widest text-white/30">
          {name}
          <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal text-white/20">logo to be added</span>
        </span>
      ) : (
        <img src={file} alt={name} onError={() => setMissing(true)} className="max-h-full max-w-full object-contain" />
      )}
    </div>
  );
};

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <section className="space-y-3">
    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-amber-500">
      {icon}
      {title}
    </h3>
    {children}
  </section>
);

export const AboutPage: React.FC<AboutPageProps> = ({ onClose }) => {
  const [groups, setGroups] = useState<CategoryNode[]>([]);
  const [languages, setLanguages] = useState<{ id: string; name: string }[]>([]);

  // Both are public reference data, so this works before signing in too.
  useEffect(() => {
    getCategoryTree().then(setGroups).catch(() => {});
    getLanguages().then(setLanguages).catch(() => {});
  }, []);

  return (
    <div role="dialog" aria-modal="true" aria-label="About the Namibian Digital Platform" className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <X size={18} />
        </button>

        <div className="min-h-0 flex-1 space-y-10 overflow-y-auto p-6 sm:p-10 custom-scrollbar">
          <header className="flex flex-col gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-center">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/5">
              <img src="/images/repo-logo.png" alt="Namibian Digital Platform logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500">About</p>
              <h2 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Namibian Digital Platform</h2>
              <p className="mt-2 max-w-2xl text-white/60">
                A national digital home for the languages of Namibia that have few written and digital resources.
              </p>
            </div>
          </header>

          <Section icon={<Globe2 size={14} />} title="Why this platform exists">
            <p className="leading-relaxed text-white/70">
              Many Namibian languages are spoken every day but are barely present online. Recordings sit on personal
              devices, books go out of print, and knowledge held by elders is at risk of being lost. This platform gives
              that material a lasting, organised home — and makes it accessible to the communities it belongs to, to
              teachers and students, and to researchers.
            </p>
            <p className="leading-relaxed text-white/70">
              It stores recordings, stories, learning materials and language datasets, organises them by language and
              type, and lets people find them again.
            </p>
          </Section>

          <Section icon={<Library size={14} />} title="What you will find">
            {groups.length === 0 ? (
              <p className="text-sm text-white/40">Cultural material, educational material and language datasets.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {groups.map((g) => (
                  <div key={g.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="font-bold">{g.name}</p>
                    <p className="mt-2 text-sm text-white/50">{g.children.map((c) => c.name).join(' · ')}</p>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-white/50">
              Everything can be filtered by language, by type and by topic (for example culture, food or oral tradition).
            </p>
          </Section>

          {languages.length > 0 && (
            <Section icon={<Globe2 size={14} />} title="Languages">
              <div className="flex flex-wrap gap-2">
                {languages.map((l) => (
                  <span key={l.id} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/70">
                    {l.name}
                  </span>
                ))}
              </div>
            </Section>
          )}

          <Section icon={<Users size={14} />} title="How it works">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="flex items-center gap-2 font-bold"><FileCheck2 size={15} className="text-amber-500" /> Explore</p>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  Anyone with an approved account can browse, listen and read. Accounts are reviewed before access is
                  granted, so we know who is using the archive.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="flex items-center gap-2 font-bold"><Users size={15} className="text-amber-500" /> Contribute</p>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  Approved contributors upload recordings, documents and datasets, and can add transcripts. Each
                  contribution is reviewed by an administrator before it is published.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:col-span-2">
                <p className="flex items-center gap-2 font-bold"><ShieldCheck size={15} className="text-amber-500" /> Respecting ownership and culture</p>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  Some knowledge is not meant to be shared freely. Contributors decide how their material may be used —
                  they can turn off direct downloads and allow access requests instead. A request records who is asking,
                  where they come from and why; the content owner reviews it first, and an administrator gives the final
                  sign-off.
                </p>
              </div>
            </div>
          </Section>

          <Section icon={<Share2 size={14} />} title="A companion platform">
            <a
              href="https://www.namtalkiescrowdsourcing.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-amber-500/40"
            >
              <div>
                <p className="font-bold">NamTalkies</p>
                <p className="mt-1 text-sm leading-relaxed text-white/60">
                  A crowdsourcing platform for Namibia's indigenous languages, where the community contributes
                  translations and audio, helps validate submissions, and builds a growing multilingual database.
                  This platform and NamTalkies are designed to work alongside each other.
                </p>
              </div>
              <ExternalLink size={18} className="mt-1 shrink-0 text-white/30 transition-colors group-hover:text-amber-400" />
            </a>
          </Section>

          <Section icon={<ShieldCheck size={14} />} title="Partners">
            <div className="grid gap-3 sm:grid-cols-3">
              {PARTNERS.map((p, i) => (
                <PartnerLogo key={i} name={p.name} file={p.file} />
              ))}
            </div>
          </Section>
        </div>
      </motion.div>
    </div>
  );
};
