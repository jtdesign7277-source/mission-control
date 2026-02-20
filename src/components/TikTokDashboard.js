'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Video, Plus, X, Loader2, Send, Trash2, Copy, Check,
  Flame, Edit3, ChevronDown, ChevronUp, FolderOpen,
  Clock, CheckCircle2, Film, Archive, Inbox, Eye,
} from 'lucide-react';

const STATUSES = [
  { key: 'all', label: 'All', icon: Inbox, color: 'text-zinc-400' },
  { key: 'draft', label: 'Drafts', icon: Edit3, color: 'text-yellow-400' },
  { key: 'ready', label: 'Ready', icon: CheckCircle2, color: 'text-emerald-400' },
  { key: 'filming', label: 'Filming', icon: Film, color: 'text-blue-400' },
  { key: 'posted', label: 'Posted', icon: Send, color: 'text-purple-400' },
  { key: 'archived', label: 'Archived', icon: Archive, color: 'text-zinc-600' },
];

const VIRALITY = {
  1: { label: '🔥', title: 'Low' },
  2: { label: '🔥🔥', title: 'Medium' },
  3: { label: '🔥🔥🔥', title: 'High' },
};

const STATUS_BADGE = {
  draft:    { bg: 'bg-yellow-500/15', border: 'border-yellow-400/30', text: 'text-yellow-300' },
  ready:    { bg: 'bg-emerald-500/15', border: 'border-emerald-400/30', text: 'text-emerald-300' },
  filming:  { bg: 'bg-blue-500/15', border: 'border-blue-400/30', text: 'text-blue-300' },
  posted:   { bg: 'bg-purple-500/15', border: 'border-purple-400/30', text: 'text-purple-300' },
  archived: { bg: 'bg-zinc-500/15', border: 'border-zinc-600/30', text: 'text-zinc-500' },
};

export default function TikTokDashboard() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [sendingId, setSendingId] = useState(null);

  // Form state
  const [formTopic, setFormTopic] = useState('');
  const [formHook, setFormHook] = useState('');
  const [formScript, setFormScript] = useState('');
  const [formBroll, setFormBroll] = useState('');
  const [formVirality, setFormVirality] = useState(2);
  const [formTags, setFormTags] = useState('');
  const [formStatus, setFormStatus] = useState('draft');
  const [saving, setSaving] = useState(false);

  const fetchScripts = useCallback(async () => {
    try {
      const res = await fetch('/api/tiktok/scripts', { cache: 'no-store' });
      const data = await res.json();
      if (data.scripts) setScripts(data.scripts);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchScripts(); }, [fetchScripts]);

  const filtered = filter === 'all' ? scripts : scripts.filter(s => s.status === filter);

  const counts = scripts.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  const resetForm = () => {
    setFormTopic(''); setFormHook(''); setFormScript(''); setFormBroll('');
    setFormVirality(2); setFormTags(''); setFormStatus('draft');
    setEditingId(null);
  };

  const openEdit = (s) => {
    setFormTopic(s.topic || '');
    setFormHook(s.hook || '');
    setFormScript(s.script || '');
    setFormBroll(s.broll_notes || '');
    setFormVirality(s.virality || 2);
    setFormTags((s.tags || []).join(', '));
    setFormStatus(s.status || 'draft');
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!formTopic.trim()) return;
    setSaving(true);
    try {
      const payload = {
        topic: formTopic.trim(),
        hook: formHook.trim() || null,
        script: formScript.trim() || null,
        broll_notes: formBroll.trim() || null,
        virality: formVirality,
        status: formStatus,
        tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
      };

      if (editingId) {
        const res = await fetch('/api/tiktok/scripts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        const data = await res.json();
        if (data.script) setScripts(prev => prev.map(s => s.id === editingId ? data.script : s));
      } else {
        const res = await fetch('/api/tiktok/scripts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.script) setScripts(prev => [data.script, ...prev]);
      }
      resetForm();
      setShowForm(false);
    } catch {} finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch('/api/tiktok/scripts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.script) setScripts(prev => prev.map(s => s.id === id ? data.script : s));
    } catch {}
  };

  const deleteScript = async (id) => {
    if (!confirm('Delete this script?')) return;
    try {
      await fetch('/api/tiktok/scripts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setScripts(prev => prev.filter(s => s.id !== id));
    } catch {}
  };

  const copyScript = (id, script) => {
    navigator.clipboard.writeText(script || '');
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendToTelegram = async (s) => {
    setSendingId(s.id);
    try {
      const text = `📹 TikTok Script: ${s.topic}\n\n🎣 Hook: ${s.hook || 'N/A'}\n\n📝 Script:\n${s.script || 'No script yet'}\n\n🎬 B-Roll: ${s.broll_notes || 'N/A'}`;
      const res = await fetch('/api/tiktok/send-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: text }),
      });
      const data = await res.json();
      if (!data.ok) alert('❌ Failed: ' + (data.error || 'Unknown'));
    } catch { alert('❌ Failed to send'); }
    finally { setSendingId(null); }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Video className="h-5 w-5 text-pink-400" />
          <h2 className="text-lg font-semibold text-zinc-100" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            TikTok Content
          </h2>
          <span className="text-xs text-zinc-500">{scripts.length} scripts</span>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(v => !v); }}
          className="flex items-center gap-1.5 rounded-lg border border-pink-400/40 bg-pink-500/15 px-3 py-1.5 text-xs text-pink-300 hover:bg-pink-500/25 transition"
        >
          {showForm && !editingId ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm && !editingId ? 'Cancel' : 'New Script'}
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUSES.map(s => {
          const Icon = s.icon;
          const count = s.key === 'all' ? scripts.length : (counts[s.key] || 0);
          const active = filter === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${
                active
                  ? 'bg-white/10 text-zinc-100 border border-white/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? s.color : ''}`} />
              {s.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/10' : 'bg-white/5'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl border border-pink-400/20 bg-pink-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-pink-300">
              {editingId ? '✏️ Edit Script' : '✨ New Script'}
            </span>
            {editingId && (
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
                className="text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
            )}
          </div>

          <input
            value={formTopic}
            onChange={e => setFormTopic(e.target.value)}
            placeholder="Topic / Title *"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-pink-400/40 focus:outline-none"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          />

          <input
            value={formHook}
            onChange={e => setFormHook(e.target.value)}
            placeholder="🎣 Hook (first 3 seconds)"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-pink-400/40 focus:outline-none"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          />

          <textarea
            value={formScript}
            onChange={e => setFormScript(e.target.value)}
            placeholder="📝 Full script / voiceover text"
            rows={5}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-pink-400/40 focus:outline-none resize-none"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          />

          <textarea
            value={formBroll}
            onChange={e => setFormBroll(e.target.value)}
            placeholder="🎬 B-Roll / visual notes"
            rows={2}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-pink-400/40 focus:outline-none resize-none"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          />

          <div className="flex gap-3 items-end flex-wrap">
            {/* Virality */}
            <div>
              <label className="text-[11px] text-zinc-500 mb-1 block">Virality</label>
              <div className="flex gap-1">
                {[1, 2, 3].map(v => (
                  <button key={v} type="button" onClick={() => setFormVirality(v)}
                    className={`rounded-md px-2.5 py-1 text-sm transition ${
                      formVirality >= v ? 'bg-orange-500/20 text-orange-300' : 'bg-white/5 text-zinc-600'
                    }`}>
                    🔥
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-[11px] text-zinc-500 mb-1 block">Status</label>
              <select value={formStatus} onChange={e => setFormStatus(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-zinc-200 focus:outline-none">
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="filming">Filming</option>
                <option value="posted">Posted</option>
              </select>
            </div>

            {/* Tags */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-[11px] text-zinc-500 mb-1 block">Tags (comma separated)</label>
              <input value={formTags} onChange={e => setFormTags(e.target.value)}
                placeholder="finance, trending, gold"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              />
            </div>

            <button type="submit" disabled={saving || !formTopic.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-pink-500/80 px-4 py-1.5 text-sm text-white hover:bg-pink-500 disabled:opacity-40 transition ml-auto">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading scripts...
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <FolderOpen className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">{filter === 'all' ? 'No scripts yet' : `No ${filter} scripts`}</p>
          <p className="text-xs mt-1 text-zinc-600">Scripts from your AI agents will appear here automatically</p>
        </div>
      )}

      {/* Script Cards */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(s => {
            const badge = STATUS_BADGE[s.status] || STATUS_BADGE.draft;
            const expanded = expandedId === s.id;
            const vir = VIRALITY[s.virality] || VIRALITY[2];

            return (
              <div key={s.id}
                className="rounded-xl border border-white/10 bg-black/30 hover:border-white/15 transition overflow-hidden">
                {/* Card Header */}
                <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => setExpandedId(expanded ? null : s.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 rounded-full ${badge.bg} ${badge.border} border px-2 py-0.5 text-[10px] font-medium ${badge.text}`}>
                        {s.status}
                      </span>
                      <span className="text-sm" title={`Virality: ${vir.title}`}>{vir.label}</span>
                      {s.source && s.source !== 'manual' && (
                        <span className="text-[10px] text-zinc-600 bg-white/5 rounded px-1.5 py-0.5">{s.source}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-zinc-100 truncate" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {s.topic}
                    </h3>
                    {s.hook && (
                      <p className="text-xs text-pink-300/70 mt-1 truncate">🎣 {s.hook}</p>
                    )}
                    {/* Tags */}
                    {s.tags?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {s.tags.map(tag => (
                          <span key={tag} className="text-[10px] text-zinc-500 bg-white/5 rounded px-1.5 py-0.5">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-zinc-600">{fmtDate(s.created_at)}</span>
                    {expanded ? <ChevronUp className="h-4 w-4 text-zinc-600" /> : <ChevronDown className="h-4 w-4 text-zinc-600" />}
                  </div>
                </div>

                {/* Expanded Content */}
                {expanded && (
                  <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-3">
                    {s.script && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">📝 Script</p>
                        <pre className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed bg-black/40 rounded-lg p-3 max-h-[300px] overflow-y-auto"
                          style={{ fontFamily: 'JetBrains Mono, monospace', scrollbarWidth: 'thin' }}>
                          {s.script}
                        </pre>
                      </div>
                    )}

                    {s.broll_notes && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">🎬 B-Roll Notes</p>
                        <pre className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed bg-black/30 rounded-lg p-3"
                          style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {s.broll_notes}
                        </pre>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-1.5 pt-1 flex-wrap">
                      <button onClick={() => copyScript(s.id, s.script || s.topic)}
                        className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition">
                        {copiedId === s.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        {copiedId === s.id ? 'Copied' : 'Copy Script'}
                      </button>

                      <button onClick={() => openEdit(s)}
                        className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition">
                        <Edit3 className="h-3 w-3" /> Edit
                      </button>

                      <button onClick={() => sendToTelegram(s)} disabled={sendingId === s.id}
                        className="flex items-center gap-1 rounded-md border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 text-[10px] text-blue-400 hover:bg-blue-500/20 disabled:opacity-40 transition">
                        {sendingId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        📱 Send to Phone
                      </button>

                      {s.status === 'draft' && (
                        <button onClick={() => updateStatus(s.id, 'ready')}
                          className="flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-400 hover:bg-emerald-500/20 transition">
                          <CheckCircle2 className="h-3 w-3" /> Mark Ready
                        </button>
                      )}
                      {s.status === 'ready' && (
                        <button onClick={() => updateStatus(s.id, 'filming')}
                          className="flex items-center gap-1 rounded-md border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 text-[10px] text-blue-400 hover:bg-blue-500/20 transition">
                          <Film className="h-3 w-3" /> Filming
                        </button>
                      )}
                      {(s.status === 'filming' || s.status === 'ready') && (
                        <button onClick={() => updateStatus(s.id, 'posted')}
                          className="flex items-center gap-1 rounded-md border border-purple-400/30 bg-purple-500/10 px-2.5 py-1 text-[10px] text-purple-400 hover:bg-purple-500/20 transition">
                          <Send className="h-3 w-3" /> Mark Posted
                        </button>
                      )}
                      {s.status !== 'archived' && (
                        <button onClick={() => updateStatus(s.id, 'archived')}
                          className="flex items-center gap-1 rounded-md border border-white/5 bg-white/5 px-2.5 py-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition">
                          <Archive className="h-3 w-3" /> Archive
                        </button>
                      )}

                      <button onClick={() => deleteScript(s.id)}
                        className="flex items-center gap-1 rounded-md border border-red-400/20 bg-red-500/5 px-2.5 py-1 text-[10px] text-red-400/60 hover:text-red-300 hover:bg-red-500/15 transition ml-auto">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
