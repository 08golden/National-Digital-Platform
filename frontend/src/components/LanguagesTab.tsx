import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Eye, EyeOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { cn } from '../lib/utils';

interface LanguageRow {
  id: string;
  iso_code: string;
  name: string;
  local_name: string | null;
  region: string | null;
  is_active: boolean;
  recordings: number;
}

type WriteResult = { error: { message: string; code?: string } | null };

// Postgres error codes -> something an admin can act on.
const FRIENDLY_ERRORS: Record<string, string> = {
  '23505': 'A language with that code already exists.',
  '23503': "This language is still used by recordings or transcripts, so it can't be deleted. Hide it instead.",
  '42501': 'Only administrators can change languages.',
};

const ISO_CODE = /^[a-z]{3}$/;

const inputClass =
  'h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-white/25 outline-none focus:border-amber-500/50';

export const LanguagesTab: React.FC = () => {
  const [languages, setLanguages] = useState<LanguageRow[]>([]);
  const [loading, setLoading] = useState(true); // first load only — refreshes happen in place
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newLocal, setNewLocal] = useState('');
  const [newRegion, setNewRegion] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: '', local_name: '', region: '' });

  // Refreshing deliberately does NOT clear `error` or swap the tab for a
  // loading screen: a failed action's explanation has to survive the refresh
  // that follows it, and the list shouldn't blank (and lose scroll position)
  // after every click.
  const load = async () => {
    const { data, error: err } = await supabase
      .from('languages')
      .select('id, iso_code, name, local_name, region, is_active')
      .order('name');
    if (err) {
      setError(err.message || 'Failed to load languages.');
      setLoading(false);
      return;
    }

    // Exact usage counts, one head-only query per language (there are only a
    // handful, and a plain row fetch would silently stop at 1000 rows).
    const rows: LanguageRow[] = await Promise.all(
      (data || []).map(async (l: any) => {
        const { count } = await supabase
          .from('recordings')
          .select('id', { count: 'exact', head: true })
          .eq('language_id', l.id);
        return { ...l, iso_code: String(l.iso_code).trim(), recordings: count ?? 0 };
      })
    );
    rows.sort((a, b) => Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name));
    setLanguages(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const run = async (fn: () => PromiseLike<WriteResult>) => {
    setBusy(true);
    setError('');
    const { error: err } = await fn();
    if (err) {
      setError((err.code && FRIENDLY_ERRORS[err.code]) || err.message);
    } else {
      setEditingId(null);
    }
    setBusy(false);
    await load();
  };

  const nameTaken = (name: string, exceptId?: string) =>
    languages.some((l) => l.id !== exceptId && l.name.trim().toLowerCase() === name.trim().toLowerCase());

  const code = newCode.trim().toLowerCase();
  const addInvalid = !newName.trim() || !ISO_CODE.test(code);

  const addLanguage = async () => {
    if (addInvalid || busy) return;
    if (nameTaken(newName)) {
      setError(`A language named "${newName.trim()}" already exists.`);
      return;
    }
    await run(() =>
      supabase.from('languages').insert({
        iso_code: code,
        name: newName.trim(),
        local_name: newLocal.trim() || null,
        region: newRegion.trim() || null,
        is_active: true,
      })
    );
    setNewName('');
    setNewCode('');
    setNewLocal('');
    setNewRegion('');
  };

  const startEdit = (l: LanguageRow) => {
    setEditingId(l.id);
    setDraft({ name: l.name, local_name: l.local_name || '', region: l.region || '' });
    setError('');
  };

  const saveEdit = async (l: LanguageRow) => {
    const name = draft.name.trim();
    if (!name || busy) return;
    if (nameTaken(name, l.id)) {
      setError(`A language named "${name}" already exists.`);
      return;
    }
    await run(() =>
      supabase
        .from('languages')
        .update({
          name,
          local_name: draft.local_name.trim() || null,
          region: draft.region.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', l.id)
    );
  };

  const setActive = (l: LanguageRow, active: boolean) => {
    if (!active) {
      const used = l.recordings > 0 ? ` Its ${l.recordings} recording(s) stay in the library.` : '';
      if (!window.confirm(`Hide "${l.name}"? It will disappear from the upload form and the Digital Library menu.${used}`)) return;
    }
    run(() =>
      supabase.from('languages').update({ is_active: active, updated_at: new Date().toISOString() }).eq('id', l.id)
    );
  };

  const remove = (l: LanguageRow) => {
    if (!window.confirm(`Permanently delete "${l.name}"? This can't be undone.`)) return;
    run(() => supabase.from('languages').delete().eq('id', l.id));
  };

  if (loading) return <div className="py-20 text-center text-white/40">Loading languages...</div>;

  const activeCount = languages.filter((l) => l.is_active).length;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold">Languages</h3>
        <p className="text-sm text-white/50">
          The languages contributors can choose when uploading, and that appear in the Digital Library menu.
          {' '}{activeCount} active, {languages.length - activeCount} hidden.
        </p>
        <p className="mt-1 text-xs text-white/30">
          Hiding is reversible and keeps every recording. Only a language with no recordings can be deleted.
          The names of the five built-in languages (Oshiwambo, Herero, Khoekhoegowab, Rukwangali, Afrikaans) link
          to the home-screen language picker, so rename those with care.
        </p>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => { setError(''); load(); }}
            className="flex items-center gap-1 text-xs font-bold hover:text-white"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      <section className="space-y-2">
        {languages.map((l) => (
          <div
            key={l.id}
            data-testid={`language-${l.iso_code}`}
            className={cn('glass rounded-2xl border border-white/10 p-4', !l.is_active && 'opacity-60')}
          >
            {editingId === l.id ? (
              <div className="flex flex-wrap items-center gap-2">
                <input aria-label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name" className={inputClass} />
                <input aria-label="Local name" value={draft.local_name} onChange={(e) => setDraft({ ...draft, local_name: e.target.value })} placeholder="Local name" className={inputClass} />
                <input aria-label="Region" value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value })} placeholder="Region" className={inputClass} />
                <button aria-label="Save" onClick={() => saveEdit(l)} disabled={busy || !draft.name.trim()} className="rounded-lg bg-green-500/20 p-2 text-green-400 hover:bg-green-500/30 disabled:opacity-50">
                  <Check size={14} />
                </button>
                <button aria-label="Cancel" onClick={() => setEditingId(null)} className="rounded-lg bg-white/5 p-2 text-white/50 hover:bg-white/10">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold">
                    {l.name}
                    <span className="ml-2 rounded border border-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-white/35">
                      {l.iso_code}
                    </span>
                    <span className={cn('ml-2 text-[10px] font-bold uppercase tracking-widest', l.is_active ? 'text-green-400' : 'text-amber-400')}>
                      {l.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </p>
                  <p className="text-xs text-white/40">
                    {[l.local_name, l.region].filter(Boolean).join(' · ') || 'No local name or region'}
                    {' · '}{l.recordings} recording{l.recordings === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button aria-label={`Edit ${l.name}`} onClick={() => startEdit(l)} className="rounded-lg bg-white/5 p-2 text-white/60 hover:bg-white/10" title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setActive(l, !l.is_active)}
                    disabled={busy}
                    className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
                  >
                    {l.is_active ? <><EyeOff size={13} /> Hide</> : <><Eye size={13} /> Show</>}
                  </button>
                  <button
                    aria-label={`Delete ${l.name}`}
                    onClick={() => remove(l)}
                    disabled={busy || l.recordings > 0}
                    title={l.recordings > 0 ? 'Used by recordings — hide it instead' : 'Delete'}
                    className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">Add a language</h4>
        <div className="flex flex-wrap items-start gap-2">
          <input aria-label="New language name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name (e.g. Oshiwambo)" className={inputClass} />
          <div>
            <input
              aria-label="New language code"
              value={newCode}
              maxLength={3}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Code"
              className={cn(inputClass, 'w-24 uppercase')}
            />
          </div>
          <input aria-label="New language local name" value={newLocal} onChange={(e) => setNewLocal(e.target.value)} placeholder="Local name (optional)" className={inputClass} />
          <input aria-label="New language region" value={newRegion} onChange={(e) => setNewRegion(e.target.value)} placeholder="Region (optional)" className={inputClass} />
          <button
            onClick={addLanguage}
            disabled={busy || addInvalid}
            className="flex h-10 items-center gap-1 rounded-lg bg-amber-500 px-4 text-xs font-bold text-black disabled:opacity-50"
          >
            <Plus size={14} /> Add language
          </button>
        </div>
        <p className="text-xs text-white/30">
          The code is the 3-letter ISO 639-3 code (for example <code>ndo</code>, <code>her</code>, <code>naq</code>).
          It identifies the language and can't be changed later.
        </p>
      </section>
    </div>
  );
};
