import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getCategoryTree, getTopics, CategoryNode, Topic, MediaKind } from '../lib/api/categories';

const MEDIA_KINDS: MediaKind[] = ['audio', 'video', 'document', 'dataset'];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

interface UncategorizedRecording {
  id: string;
  title: string;
  created_at: string;
  status: string;
  languages: { name: string } | null;
}

const inputClass =
  'h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-white/25 outline-none focus:border-amber-500/50';

export const TaxonomyTab: React.FC = () => {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [uncategorized, setUncategorized] = useState<UncategorizedRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Inline editing state (one thing edited at a time keeps this simple)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubKind, setNewSubKind] = useState<MediaKind>('document');
  const [newTopicName, setNewTopicName] = useState('');
  // Per-recording chosen sub-type while re-tagging
  const [retagChoice, setRetagChoice] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [t, tp, recs] = await Promise.all([
        getCategoryTree(),
        getTopics(),
        supabase
          .from('recordings')
          .select('id, title, created_at, status, languages(name)')
          .is('category_id', null)
          .neq('status', 'archived')
          .order('created_at', { ascending: false }),
      ]);
      setTree(t);
      setTopics(tp);
      if (recs.error) throw new Error(recs.error.message);
      setUncategorized((recs.data || []) as unknown as UncategorizedRecording[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load taxonomy.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Run a write, surface any DB error (e.g. FK violation when deleting a
  // category that recordings still use), and refresh.
  const run = async (fn: () => PromiseLike<{ error: { message: string } | null }>, friendly?: string) => {
    setBusy(true);
    setError('');
    const { error: err } = await fn();
    if (err) {
      setError(
        friendly && /foreign key|violates/i.test(err.message) ? friendly : err.message
      );
    } else {
      setEditingId(null);
      setAddingSubFor(null);
      setNewGroupName('');
      setNewSubName('');
      setNewTopicName('');
    }
    setBusy(false);
    await load();
  };

  const addGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    run(() =>
      supabase.from('categories').insert({
        name,
        slug: slugify(name),
        parent_id: null,
        sort_order: tree.length + 1,
      })
    );
  };

  const addSubtype = (group: CategoryNode) => {
    const name = newSubName.trim();
    if (!name) return;
    run(() =>
      supabase.from('categories').insert({
        name,
        slug: `${slugify(group.name)}-${slugify(name)}`,
        parent_id: group.id,
        media_kind: newSubKind,
        sort_order: group.children.length + 1,
      })
    );
  };

  const renameCategory = (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    run(() => supabase.from('categories').update({ name }).eq('id', id));
  };

  const deleteCategory = (node: CategoryNode) => {
    const what = node.parentId ? `the type "${node.name}"` : `the group "${node.name}" and all its types`;
    if (!window.confirm(`Delete ${what}?`)) return;
    run(
      () => supabase.from('categories').delete().eq('id', node.id),
      `"${node.name}" can't be deleted while recordings are still filed under it. Move those recordings to another type first.`
    );
  };

  const addTopic = () => {
    const name = newTopicName.trim();
    if (!name) return;
    run(() => supabase.from('tags').insert({ name, slug: slugify(name), category: 'topic' }));
  };

  const renameTopic = (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    run(() => supabase.from('tags').update({ name }).eq('id', id));
  };

  const deleteTopic = (topic: Topic) => {
    if (!window.confirm(`Delete the topic "${topic.name}"? It will be removed from any recordings using it.`)) return;
    run(() => supabase.from('tags').delete().eq('id', topic.id));
  };

  const retag = (recordingId: string) => {
    const categoryId = retagChoice[recordingId];
    if (!categoryId) return;
    run(() => supabase.from('recordings').update({ category_id: categoryId }).eq('id', recordingId));
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const renderEditRow = (onSave: () => void) => (
    <span className="flex items-center gap-2">
      <input
        autoFocus
        value={editingName}
        onChange={(e) => setEditingName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSave()}
        className={inputClass}
      />
      <button onClick={onSave} disabled={busy} className="rounded-lg bg-green-500/20 p-2 text-green-400 hover:bg-green-500/30">
        <Check size={14} />
      </button>
      <button onClick={() => setEditingId(null)} className="rounded-lg bg-white/5 p-2 text-white/50 hover:bg-white/10">
        <X size={14} />
      </button>
    </span>
  );

  if (loading) return <div className="py-20 text-center text-white/40">Loading taxonomy...</div>;

  return (
    <div className="space-y-12">
      <div>
        <h3 className="text-xl font-bold">Taxonomy</h3>
        <p className="text-sm text-white/50">
          Manage how content is organised: groups, the types inside them, and topics.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={load} className="flex items-center gap-1 text-xs font-bold hover:text-white">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Groups and types */}
      <section className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">Content groups and types</h4>
        {tree.map((group) => (
          <div key={group.id} className="glass rounded-2xl border border-white/10 p-5">
            <div className="flex items-center justify-between gap-3">
              {editingId === group.id ? (
                renderEditRow(() => renameCategory(group.id))
              ) : (
                <span className="font-bold">{group.name}</span>
              )}
              <span className="flex gap-2">
                <button onClick={() => startEdit(group.id, group.name)} className="rounded-lg bg-white/5 p-2 text-white/60 hover:bg-white/10" title="Rename">
                  <Pencil size={14} />
                </button>
                <button onClick={() => deleteCategory(group)} className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20" title="Delete">
                  <Trash2 size={14} />
                </button>
              </span>
            </div>

            <div className="mt-4 space-y-2 border-l border-white/10 pl-4">
              {group.children.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between gap-3 text-sm">
                  {editingId === sub.id ? (
                    renderEditRow(() => renameCategory(sub.id))
                  ) : (
                    <span className="text-white/80">
                      {sub.name}
                      <span className="ml-2 rounded border border-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-white/35">
                        {sub.mediaKind}
                      </span>
                    </span>
                  )}
                  <span className="flex gap-2">
                    <button onClick={() => startEdit(sub.id, sub.name)} className="rounded-lg bg-white/5 p-1.5 text-white/60 hover:bg-white/10" title="Rename">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => deleteCategory(sub)} className="rounded-lg bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20" title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </span>
                </div>
              ))}

              {addingSubFor === group.id ? (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <input
                    autoFocus
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="New type name"
                    className={inputClass}
                  />
                  <select
                    value={newSubKind}
                    onChange={(e) => setNewSubKind(e.target.value as MediaKind)}
                    className={inputClass}
                  >
                    {MEDIA_KINDS.map((k) => (
                      <option key={k} value={k} className="bg-zinc-900">{k}</option>
                    ))}
                  </select>
                  <button onClick={() => addSubtype(group)} disabled={busy || !newSubName.trim()} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-50">
                    Add
                  </button>
                  <button onClick={() => setAddingSubFor(null)} className="rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setAddingSubFor(group.id); setNewSubName(''); }}
                  className="flex items-center gap-1 pt-1 text-xs font-bold text-amber-400 hover:text-amber-300"
                >
                  <Plus size={12} /> Add type
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2">
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGroup()}
            placeholder="New group name"
            className={inputClass}
          />
          <button onClick={addGroup} disabled={busy || !newGroupName.trim()} className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-50">
            <Plus size={14} /> Add group
          </button>
        </div>
      </section>

      {/* Topics */}
      <section className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">Topics</h4>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) =>
            editingId === topic.id ? (
              <React.Fragment key={topic.id}>{renderEditRow(() => renameTopic(topic.id))}</React.Fragment>
            ) : (
              <span key={topic.id} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-3 pr-1 text-sm">
                {topic.name}
                <button onClick={() => startEdit(topic.id, topic.name)} className="rounded-full p-1.5 text-white/50 hover:bg-white/10" title="Rename">
                  <Pencil size={11} />
                </button>
                <button onClick={() => deleteTopic(topic)} className="rounded-full p-1.5 text-red-400 hover:bg-red-500/20" title="Delete">
                  <Trash2 size={11} />
                </button>
              </span>
            )
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTopic()}
            placeholder="New topic"
            className={inputClass}
          />
          <button onClick={addTopic} disabled={busy || !newTopicName.trim()} className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-50">
            <Plus size={14} /> Add topic
          </button>
        </div>
      </section>

      {/* Re-tag uncategorized */}
      <section className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">
          Uncategorized recordings ({uncategorized.length})
        </h4>
        <p className="text-sm text-white/40">
          Recordings uploaded before the taxonomy existed. Pick a type for each and they'll appear under that group in the Digital Library.
        </p>
        {uncategorized.length === 0 ? (
          <div className="glass rounded-2xl border border-white/10 p-6 text-center text-white/40">
            Everything is categorized.
          </div>
        ) : (
          <div className="space-y-2">
            {uncategorized.map((rec) => (
              <div key={rec.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 p-4">
                <div className="min-w-0">
                  <p className="truncate font-bold">{rec.title}</p>
                  <p className="text-xs text-white/40">
                    {rec.languages?.name || 'No language'} · {rec.status} · {new Date(rec.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={retagChoice[rec.id] || ''}
                    onChange={(e) => setRetagChoice((c) => ({ ...c, [rec.id]: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="" className="bg-zinc-900">Choose type...</option>
                    {tree.map((group) => (
                      <optgroup key={group.id} label={group.name} className="bg-zinc-900">
                        {group.children.map((sub) => (
                          <option key={sub.id} value={sub.id} className="bg-zinc-900">{sub.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <button
                    onClick={() => retag(rec.id)}
                    disabled={busy || !retagChoice[rec.id]}
                    className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
